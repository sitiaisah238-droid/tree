
import React, { useState, useCallback, useRef } from 'react';
import Scene from './components/Scene';
import CameraFeed from './components/CameraFeed';
import UIOverlay from './components/UIOverlay';
import { AppState, GestureData, InteractionState } from './types';
import { PHOTOS } from './constants';

const COOLDOWN_TIME = 600; 

const App: React.FC = () => {
  const [appState, setAppState] = useState<AppState>(AppState.TREE);
  const [activePhotoIndex, setActivePhotoIndex] = useState(0);
  const [interactionState, setInteractionState] = useState<InteractionState>(InteractionState.IDLE);
  const [gesture, setGesture] = useState<GestureData>({
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

  const lastGestureTimeRef = useRef<number>(0);
  const wasOkGestureRef = useRef<boolean>(false);
  const handPosHistory = useRef<{x: number, time: number}[]>([]);

  const handleGestureUpdate = useCallback((data: GestureData) => {
    setGesture(data);
    const now = Date.now();
    const isInCooldown = now - lastGestureTimeRef.current < COOLDOWN_TIME;

    if (!data.isActive) {
      handPosHistory.current = [];
      // Transition out of focus if hand is lost
      if (interactionState === InteractionState.CHANGE_PHOTO) {
        setInteractionState(InteractionState.IDLE);
      }
      return;
    }

    // --- 👌 OK Gesture Logic (Updated) ---
    // Rule: Hold OK to see "Complete Picture", Release to move to NEXT
    if (data.isOkGesture) {
      if (interactionState !== InteractionState.CHANGE_PHOTO) {
        setInteractionState(InteractionState.CHANGE_PHOTO);
      }
      wasOkGestureRef.current = true;
    } else {
      // If we were holding OK and just released it
      if (wasOkGestureRef.current && !isInCooldown) {
        setActivePhotoIndex((prev) => (prev + 1) % PHOTOS.length);
        setInteractionState(InteractionState.IDLE);
        lastGestureTimeRef.current = now;
      }
      wasOkGestureRef.current = false;
    }

    if (isInCooldown) return;

    // --- ☝️ Pointing Logic ---
    if (data.isPointing && !data.isFist && !data.isOkGesture) {
      setInteractionState(InteractionState.APPROACHING);
    } else if (interactionState === InteractionState.APPROACHING && !data.isPointing) {
      setInteractionState(InteractionState.IDLE);
    }
    
    // --- 👊 Fist Gesture ---
    if (data.isFist && !data.isPointing && !data.isOkGesture) {
      if (appState !== AppState.TREE) {
        setAppState(AppState.TREE);
        setInteractionState(InteractionState.CLUSTERING);
        setTimeout(() => setInteractionState(InteractionState.IDLE), 800);
      }
    }
    
    // --- 🖐️ Open Palm / Swipe ---
    else if (data.isOpenPalm && !data.isOkGesture) {
      if (appState !== AppState.EXPLODE) {
        setAppState(AppState.EXPLODE);
      }
      
      handPosHistory.current.push({ x: data.handX, time: now });
      if (handPosHistory.current.length > 10) handPosHistory.current.shift();

      if (handPosHistory.current.length > 5) {
        const first = handPosHistory.current[0];
        const last = handPosHistory.current[handPosHistory.current.length - 1];
        const dx = last.x - first.x;
        const dt = last.time - first.time;
        
        if (dt > 50 && Math.abs(dx) > 0.15) {
          if (dx > 0) { 
            setActivePhotoIndex((prev) => (prev - 1 + PHOTOS.length) % PHOTOS.length);
          } else { 
            setActivePhotoIndex((prev) => (prev + 1) % PHOTOS.length);
          }
          lastGestureTimeRef.current = now;
          handPosHistory.current = [];
        }
      }
    }
  }, [interactionState, appState]);

  return (
    <div className="relative w-full h-screen bg-[#050103] overflow-hidden">
      <div className="absolute inset-0">
        <Scene 
          appState={appState} 
          gesture={gesture} 
          activePhotoIndex={activePhotoIndex} 
          interactionState={interactionState}
        />
      </div>

      <UIOverlay 
        activePhotoIndex={activePhotoIndex} 
        interactionState={interactionState}
      />

      <CameraFeed onGestureUpdate={handleGestureUpdate} />
      
      {/* Visual Indicator for Focus State */}
      {interactionState === InteractionState.CHANGE_PHOTO && (
        <div className="fixed top-8 right-8 flex items-center gap-3 px-5 py-2.5 bg-pink-500/20 border border-pink-500/60 rounded-full backdrop-blur-2xl animate-in zoom-in duration-300 z-[60] shadow-[0_0_40px_rgba(236,72,153,0.4)]">
          <div className="w-3 h-3 bg-pink-500 rounded-full animate-pulse shadow-[0_0_15px_rgba(236,72,153,1)]"></div>
          <span className="text-[12px] text-pink-100 uppercase tracking-[0.25em] font-bold">
            Memory Focused
          </span>
        </div>
      )}

      <div className="absolute inset-0 pointer-events-none shadow-[inset_0_0_250px_rgba(0,0,0,1)]" />
    </div>
  );
};

export default App;
