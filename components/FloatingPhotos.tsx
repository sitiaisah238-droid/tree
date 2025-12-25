
import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Image } from '@react-three/drei';
import * as THREE from 'three';
import { PHOTOS, TREE_RADIUS, TREE_HEIGHT } from '../constants';
import { AppState, GestureData, InteractionState } from '../types';

interface FloatingPhotosProps {
  appState: AppState;
  gesture: GestureData;
  activePhotoIndex: number;
  interactionState: InteractionState;
}

const PhotoItem: React.FC<{ 
  url: string; 
  index: number; 
  total: number; 
  gesture: GestureData; 
  appState: AppState;
  isActivePhoto: boolean;
  interactionState: InteractionState;
}> = ({ url, index, total, gesture, appState, isActivePhoto, interactionState }) => {
  const ref = useRef<THREE.Group>(null);
  const borderRef = useRef<THREE.Mesh>(null);
  
  const treeConfig = useMemo(() => {
    const h = (index + 1) / (total + 1); 
    const radiusAtHeight = (1 - h) * (TREE_RADIUS * 0.65);
    const angle = (index / total) * Math.PI * 6;
    return {
      x: Math.cos(angle) * radiusAtHeight,
      y: h * TREE_HEIGHT - TREE_HEIGHT / 2,
      z: Math.sin(angle) * radiusAtHeight,
      angle: angle
    };
  }, [index, total]);

  const explodeTarget = useMemo(() => {
    const r = 8 + Math.random() * 5;
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(2 * Math.random() - 1);
    return new THREE.Vector3(
      r * Math.sin(phi) * Math.cos(theta),
      r * Math.sin(phi) * Math.sin(theta),
      r * Math.cos(phi)
    );
  }, []);

  useFrame((state) => {
    if (!ref.current) return;
    
    const time = state.clock.getElapsedTime();
    const isFocused = interactionState === InteractionState.CHANGE_PHOTO && isActivePhoto;
    const isApproaching = interactionState === InteractionState.APPROACHING && isActivePhoto;
    
    const lerpSpeed = isFocused ? 0.18 : 0.1;

    let targetPos = new THREE.Vector3();
    let targetScale = new THREE.Vector3(0.2, 0.28, 1);

    if (appState === AppState.TREE && !isApproaching) {
      targetPos.set(treeConfig.x, treeConfig.y, treeConfig.z);
      
      if (!isFocused) {
        // Standard tree view: look at center
        const lookTarget = new THREE.Vector3(0, treeConfig.y, 0);
        const q = new THREE.Quaternion().setFromRotationMatrix(new THREE.Matrix4().lookAt(ref.current.position, lookTarget, ref.current.up));
        ref.current.quaternion.slerp(q, 0.1);
        targetScale.set(0.2, 0.28, 1);
      } else {
        // Focused view (👌 held): Centered, large, facing the camera exactly
        const targetRotY = treeConfig.angle + Math.PI;
        // Minor hand steering for high-end interaction
        const steerX = gesture.pointerY * 0.15;
        const steerY = gesture.pointerX * 0.3;
        
        const targetQuat = new THREE.Quaternion().setFromEuler(new THREE.Euler(steerX, targetRotY + steerY, 0));
        ref.current.quaternion.slerp(targetQuat, 0.2);
        
        // Scale to fill the frame for "Complete Picture"
        targetScale.set(0.85, 1.2, 1); 
      }
    } else if (isApproaching) {
        targetPos.set(0, 0, 6.5); 
        const targetRotY = gesture.pointerX * Math.PI * 0.3; 
        const targetRotX = -gesture.pointerY * Math.PI * 0.15; 
        const targetQuat = new THREE.Quaternion().setFromEuler(new THREE.Euler(targetRotX, targetRotY, 0));
        ref.current.quaternion.slerp(targetQuat, 0.1);
        targetScale.set(0.9, 1.25, 1);
    } else {
      targetScale.set(0.4, 0.55, 1);
      targetPos.copy(explodeTarget);
      ref.current.rotation.y += 0.015;
    }

    if (borderRef.current && borderRef.current.material) {
      const pulse = isActivePhoto ? 0.9 + Math.sin(time * 8) * 0.1 : 0.15;
      (borderRef.current.material as THREE.MeshBasicMaterial).opacity = pulse;
    }

    ref.current.position.lerp(targetPos, lerpSpeed);
    ref.current.scale.lerp(targetScale, 0.15);
  });

  return (
    <group ref={ref}>
      <Image 
        url={url} 
        transparent 
        opacity={isActivePhoto ? 1.0 : (interactionState === InteractionState.APPROACHING ? 0.05 : 0.4)} 
        scale={[1, 1]}
      />
      <mesh ref={borderRef} position={[0, 0, -0.01]}>
        <planeGeometry args={[1.04, 1.04]} />
        <meshBasicMaterial 
          color={isActivePhoto ? "#FF69B4" : "#FFFFFF"} 
          transparent 
          opacity={0.15} 
        />
      </mesh>
    </group>
  );
};

const FloatingPhotos: React.FC<FloatingPhotosProps> = ({ appState, gesture, activePhotoIndex, interactionState }) => {
  return (
    <group>
      {PHOTOS.map((photo, i) => (
        <PhotoItem 
          key={photo.id} 
          url={photo.url} 
          index={i} 
          total={PHOTOS.length} 
          gesture={gesture}
          appState={appState}
          isActivePhoto={i === activePhotoIndex}
          interactionState={interactionState}
        />
      ))}
    </group>
  );
};

export default FloatingPhotos;
