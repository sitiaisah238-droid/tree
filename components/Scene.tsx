
import React, { Suspense, useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Environment, ContactShadows, Stars, Float } from '@react-three/drei';
import { Bloom, EffectComposer, Vignette } from '@react-three/postprocessing';
import * as THREE from 'three';
import ParticleTree from './ParticleTree';
import Ribbon from './Ribbon';
import FloatingPhotos from './FloatingPhotos';
import { AppState, GestureData, InteractionState } from '../types';
import { COLORS, TREE_HEIGHT, TREE_RADIUS, PHOTOS } from '../constants';

interface SceneProps {
  appState: AppState;
  gesture: GestureData;
  activePhotoIndex: number;
  interactionState: InteractionState;
}

const StarTop = () => {
  return (
    <Float speed={2} rotationIntensity={1} floatIntensity={1}>
      <mesh position={[0, TREE_HEIGHT / 2 + 0.4, 0]}>
        <octahedronGeometry args={[0.25, 0]} />
        <meshStandardMaterial 
          color="#FFF" 
          emissive="#FFF" 
          emissiveIntensity={3.2} 
        />
        <pointLight intensity={6.5} distance={6} color="#FFD700" />
      </mesh>
    </Float>
  );
};

const CinematicCamera = ({ activeIndex, state }: { activeIndex: number, state: InteractionState }) => {
  const controlsRef = useRef<any>(null);
  const targetPos = useMemo(() => new THREE.Vector3(0, 0, 0), []);
  const cameraTargetPos = useMemo(() => new THREE.Vector3(0, 1, 11), []);

  const photoConfig = useMemo(() => {
    const total = PHOTOS.length;
    const h = (activeIndex + 1) / (total + 1); 
    const radiusAtHeight = (1 - h) * (TREE_RADIUS * 0.65);
    const angle = (activeIndex / total) * Math.PI * 6;
    
    const pos = new THREE.Vector3(
      Math.cos(angle) * radiusAtHeight,
      h * TREE_HEIGHT - TREE_HEIGHT / 2,
      Math.sin(angle) * radiusAtHeight
    );

    const directionFromCenter = pos.clone().setY(0).normalize();
    const dollyPos = pos.clone().add(directionFromCenter.multiplyScalar(1.2)); 
    
    return { pos, dollyPos };
  }, [activeIndex]);

  useFrame((sceneState) => {
    if (!controlsRef.current) return;

    if (state === InteractionState.APPROACHING) {
      targetPos.lerp(new THREE.Vector3(0, 0, 6), 0.1);
      cameraTargetPos.lerp(new THREE.Vector3(0, 0, 11), 0.1);
    } else if (state === InteractionState.CHANGE_PHOTO) {
      targetPos.lerp(photoConfig.pos, 0.15); 
      cameraTargetPos.lerp(photoConfig.dollyPos, 0.12); 
    } else {
      targetPos.lerp(new THREE.Vector3(0, 0, 0), 0.05);
      cameraTargetPos.lerp(new THREE.Vector3(0, 1, 11), 0.05);
    }

    sceneState.camera.position.lerp(cameraTargetPos, 0.1);
    controlsRef.current.target.lerp(targetPos, 0.15);
    controlsRef.current.update();
  });

  return (
    <OrbitControls 
      ref={controlsRef}
      enablePan={false} 
      minDistance={0.5} 
      maxDistance={35} 
      makeDefault 
      rotateSpeed={0.5}
    />
  );
};

const Scene: React.FC<SceneProps> = ({ appState, gesture, activePhotoIndex, interactionState }) => {
  return (
    <Canvas
      shadows
      camera={{ position: [0, 1, 11], fov: 45 }}
      style={{ background: COLORS.background }}
      gl={{ antialias: true, powerPreference: "high-performance" }}
    >
      <Suspense fallback={null}>
        <fog attach="fog" args={[COLORS.background, 10, 45]} />
        <Environment preset="city" />
        
        <ambientLight intensity={0.25} />
        <spotLight 
          position={[12, 18, 12]} 
          angle={0.25} 
          penumbra={1} 
          intensity={2.2}
          color={COLORS.primary} 
          castShadow 
        />
        <pointLight position={[0, -6, 6]} intensity={4.5} color={COLORS.secondary} />

        <group>
          <ParticleTree appState={appState} gesture={gesture} interactionState={interactionState} />
          <Ribbon appState={appState} />
          <StarTop />
          <FloatingPhotos 
            appState={appState} 
            gesture={gesture} 
            activePhotoIndex={activePhotoIndex}
            interactionState={interactionState}
          />
        </group>

        <Stars radius={150} depth={60} count={6000} factor={4} saturation={0} fade speed={1.5} />
        
        <ContactShadows 
          opacity={0.4} 
          scale={25} 
          blur={2.5} 
          far={12} 
          color="#000" 
          position={[0, -TREE_HEIGHT/2 - 0.5, 0]}
        />

        <CinematicCamera activeIndex={activePhotoIndex} state={interactionState} />

        <EffectComposer enableNormalPass={false}>
          <Bloom 
            luminanceThreshold={1.0} // 稍微降低阈值，允许更多光点产生辉光
            intensity={1.4} // 稍微提高总强度
            levels={8} 
            mipmapBlur 
          />
          <Vignette eskil={false} offset={0.15} darkness={1.1} />
        </EffectComposer>
      </Suspense>
    </Canvas>
  );
};

export default Scene;
