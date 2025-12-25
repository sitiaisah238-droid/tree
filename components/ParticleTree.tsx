
import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { PARTICLE_COUNT, TREE_HEIGHT, TREE_RADIUS, COLORS } from '../constants';
import { AppState, GestureData, InteractionState } from '../types';

interface ParticleTreeProps {
  appState: AppState;
  gesture: GestureData;
  interactionState: InteractionState;
}

const ParticleTree: React.FC<ParticleTreeProps> = ({ appState, gesture, interactionState }) => {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);
  
  const particles = useMemo(() => {
    const data = [];
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const h = Math.random();
      const radiusAtHeight = (1 - h) * TREE_RADIUS;
      const angle = Math.random() * Math.PI * 2;
      const jitter = (Math.random() - 0.5) * 0.2;
      
      const tx = Math.cos(angle) * (radiusAtHeight + jitter);
      const ty = h * TREE_HEIGHT - TREE_HEIGHT / 2;
      const tz = Math.sin(angle) * (radiusAtHeight + jitter);

      const r = 8 + Math.random() * 5;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      const ex = r * Math.sin(phi) * Math.cos(theta);
      const ey = r * Math.sin(phi) * Math.sin(theta);
      const ez = r * Math.cos(phi);

      data.push({
        treePos: new THREE.Vector3(tx, ty, tz),
        explodePos: new THREE.Vector3(ex, ey, ez),
        size: 0.01 + Math.random() * 0.03,
        phase: Math.random() * Math.PI * 2
      });
    }
    return data;
  }, []);

  const currentPositions = useMemo(() => particles.map(p => p.treePos.clone()), [particles]);

  useFrame((state) => {
    if (!meshRef.current) return;

    const time = state.clock.getElapsedTime();
    const targetState = appState === AppState.TREE ? 'treePos' : 'explodePos';
    const lerpFactor = 0.05;

    // Rotation Logic
    if (gesture.isActive && gesture.isFist) {
      const steer = (0.5 - gesture.handX) * 0.15;
      meshRef.current.rotation.y += steer;
    } else {
      // Cinematic spin during photo change
      let autoRotateSpeed = appState === AppState.TREE ? 0.003 : 0.001;
      if (interactionState === InteractionState.CHANGE_PHOTO) autoRotateSpeed *= 4;
      
      meshRef.current.rotation.y += autoRotateSpeed;
    }

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const p = particles[i];
      const target = p[targetState];
      currentPositions[i].lerp(target, lerpFactor);
      
      const hover = Math.sin(time * 0.4 + p.phase) * 0.012;
      dummy.position.copy(currentPositions[i]);
      dummy.position.y += hover;
      dummy.scale.setScalar(p.size);
      dummy.updateMatrix();
      meshRef.current.setMatrixAt(i, dummy.matrix);
    }
    meshRef.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, PARTICLE_COUNT]}>
      <octahedronGeometry args={[1, 0]} />
      <meshStandardMaterial 
        color={COLORS.primary}
        emissive={COLORS.secondary}
        emissiveIntensity={1.1} // 稍微调高，增加光感
        transparent
        opacity={0.65} 
        blending={THREE.AdditiveBlending}
      />
    </instancedMesh>
  );
};

export default ParticleTree;
