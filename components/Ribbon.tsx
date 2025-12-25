
import React, { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { RIBBON_COUNT, TREE_HEIGHT, TREE_RADIUS, COLORS } from '../constants';
import { AppState } from '../types';

interface RibbonProps {
  appState: AppState;
}

const Ribbon: React.FC<RibbonProps> = ({ appState }) => {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);

  const particles = useMemo(() => {
    const data = [];
    for (let i = 0; i < RIBBON_COUNT; i++) {
      const t = i / RIBBON_COUNT;
      const angle = t * Math.PI * 6;
      const y = (t - 0.5) * TREE_HEIGHT;
      const r = (1 - t) * (TREE_RADIUS + 0.2);
      
      const tx = Math.cos(angle) * r;
      const tz = Math.sin(angle) * r;

      data.push({
        treePos: new THREE.Vector3(tx, y, tz),
        phase: Math.random() * Math.PI * 2
      });
    }
    return data;
  }, []);

  useFrame((state) => {
    if (!meshRef.current) return;
    const time = state.clock.getElapsedTime();
    
    // 爆炸状态下丝带不可见
    meshRef.current.visible = appState === AppState.TREE;
    if (!meshRef.current.visible) return;
    
    for (let i = 0; i < RIBBON_COUNT; i++) {
      const orbitOffset = time * 0.3; 
      const angle = (i / RIBBON_COUNT) * Math.PI * 6 + orbitOffset;
      const r = (1 - (i / RIBBON_COUNT)) * (TREE_RADIUS + 0.1);
      
      dummy.position.set(
        Math.cos(angle) * r,
        (i / RIBBON_COUNT - 0.5) * TREE_HEIGHT,
        Math.sin(angle) * r
      );
      
      dummy.scale.setScalar(0.012);
      dummy.updateMatrix();
      meshRef.current.setMatrixAt(i, dummy.matrix);
    }
    meshRef.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, RIBBON_COUNT]}>
      <sphereGeometry args={[1, 4, 4]} />
      <meshStandardMaterial 
        color={COLORS.accent} 
        emissive={COLORS.accent} 
        emissiveIntensity={0.8} // 稍微调高丝带亮度
      />
    </instancedMesh>
  );
};

export default Ribbon;
