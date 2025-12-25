
import React, { useRef, useEffect, useState } from 'react';
import { initHandLandmarker, detectHands } from '../services/handTracker';
import { GestureData } from '../types';

interface CameraFeedProps {
  onGestureUpdate: (data: GestureData) => void;
}

const CameraFeed: React.FC<CameraFeedProps> = ({ onGestureUpdate }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  
  // Use a ref for the callback to prevent the tracking loop from restarting 
  // when state changes in the parent component.
  const onGestureUpdateRef = useRef(onGestureUpdate);
  
  useEffect(() => {
    onGestureUpdateRef.current = onGestureUpdate;
  }, [onGestureUpdate]);

  useEffect(() => {
    let animationId: number;
    let stream: MediaStream | null = null;

    const startTracking = async () => {
      // Initialize hand landmarker (only if not already done)
      const handLandmarker = await initHandLandmarker();
      
      try {
        stream = await navigator.mediaDevices.getUserMedia({ 
          video: { 
            width: { ideal: 640 },
            height: { ideal: 480 },
            facingMode: 'user' 
          } 
        });
        
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.onloadedmetadata = () => {
            videoRef.current?.play().catch(console.error);
            setIsLoaded(true);
            track();
          };
        }
      } catch (err) {
        console.error("Camera access denied or failed", err);
      }

      const track = () => {
        if (videoRef.current && videoRef.current.readyState >= 2) {
          const results = detectHands(videoRef.current, performance.now());
          if (results && results.landmarks.length > 0) {
            const landmarks = results.landmarks[0];
            
            // Finger detection logic
            const isIndexExtended = landmarks[8].y < landmarks[6].y - 0.05;
            const isMiddleFolded = landmarks[12].y > landmarks[10].y;
            const isRingFolded = landmarks[16].y > landmarks[14].y;
            const isPinkyFolded = landmarks[20].y > landmarks[18].y;

            // ☝️ Pointing: ONLY Index is extended
            const isPointing = isIndexExtended && isMiddleFolded && isRingFolded && isPinkyFolded;

            // ✊ Fist: All fingers folded
            const isFist = !isIndexExtended && isMiddleFolded && isRingFolded && isPinkyFolded;

            // 🖐️ Open Palm: All extended
            const isOpenPalm = isIndexExtended && !isMiddleFolded && !isRingFolded && !isPinkyFolded;

            // OK Gesture
            const thumbTip = landmarks[4];
            const indexTip = landmarks[8];
            const okPinchDist = Math.sqrt(Math.pow(thumbTip.x - indexTip.x, 2) + Math.pow(thumbTip.y - indexTip.y, 2));
            const isOkGesture = okPinchDist < 0.04 && !isMiddleFolded && !isRingFolded;

            const wrist = landmarks[0];

            onGestureUpdateRef.current({
              isFist,
              isOkGesture,
              isPointing,
              isOpenPalm,
              handX: wrist.x,
              handY: wrist.y,
              pointerX: (0.5 - indexTip.x) * 2,
              pointerY: (0.5 - indexTip.y) * 2,
              isActive: true
            });
          } else {
            onGestureUpdateRef.current({
              isFist: false,
              isOkGesture: false,
              isPointing: false,
              isOpenPalm: false,
              handX: 0.5,
              handY: 0.5,
              pointerX: 0,
              pointerY: 0,
              isActive: false
            });
          }
        }
        animationId = requestAnimationFrame(track);
      };
    };

    startTracking();

    return () => {
      cancelAnimationFrame(animationId);
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, []); // Empty dependency array ensures this only runs once

  return (
    <div className="fixed bottom-4 right-4 w-48 h-36 rounded-xl overflow-hidden border-2 border-pink-500 shadow-lg shadow-pink-500/20 bg-black/50 z-50">
      {!isLoaded && (
        <div className="absolute inset-0 flex items-center justify-center text-[10px] text-pink-300 animate-pulse tracking-widest uppercase font-bold text-center p-4">
          Initialising Camera...
        </div>
      )}
      <video 
        ref={videoRef} 
        className={`w-full h-full object-cover scale-x-[-1] transition-opacity duration-500 ${isLoaded ? 'opacity-100' : 'opacity-0'}`} 
        muted 
        autoPlay
        playsInline 
      />
      <div className="absolute top-2 left-2 px-2 py-0.5 bg-pink-600/80 backdrop-blur-sm text-[8px] text-white rounded font-bold uppercase tracking-tighter">
        Vision System
      </div>
    </div>
  );
};

export default CameraFeed;
