import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

const MovingParticles = ({ color = '#00a884', count = 500 }) => {
  const pointsRef = useRef();
  const timeRef = useRef(0);
  
  // Generate initial sphere positions
  const { positions, originalPositions } = useMemo(() => {
    const positions = new Float32Array(count * 3);
    const originalPositions = new Float32Array(count * 3);
    
    for (let i = 0; i < count; i++) {
      // Random point on sphere surface (radius = 2)
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      const radius = 2;
      
      const x = radius * Math.sin(phi) * Math.cos(theta);
      const y = radius * Math.sin(phi) * Math.sin(theta);
      const z = radius * Math.cos(phi);
      
      positions[i * 3] = x;
      positions[i * 3 + 1] = y;
      positions[i * 3 + 2] = z;
      
      originalPositions[i * 3] = x;
      originalPositions[i * 3 + 1] = y;
      originalPositions[i * 3 + 2] = z;
    }
    
    return { positions, originalPositions };
  }, [count]);

  useFrame((state, delta) => {
    if (pointsRef.current) {
      timeRef.current += delta * 0.5;
      
      const time = timeRef.current;
      const posArray = pointsRef.current.geometry.attributes.position.array;
      
      // Breathing effect: sphere expands and contracts + particles scatter and form
      // Use sine wave for smooth oscillation between 0 and 1
      const breath = (Math.sin(time * 0.8) + 1) / 2; // 0 to 1 oscillating
      const expand = 1 + breath * 1.5; // Expands from 1x to 2.5x
      const scatter = breath * 3; // How much particles scatter
      
      for (let i = 0; i < count; i++) {
        const i3 = i * 3;
        const origX = originalPositions[i3];
        const origY = originalPositions[i3 + 1];
        const origZ = originalPositions[i3 + 2];
        
        // Each particle has unique noise based on its index
        const noise = Math.sin(time + i * 0.1) * 0.5 + 0.5;
        const scatterAmount = scatter * noise;
        
        // Calculate new position
        const direction = {
          x: origX !== 0 ? origX / Math.abs(origX) : 0,
          y: origY !== 0 ? origY / Math.abs(origY) : 0,
          z: origZ !== 0 ? origZ / Math.abs(origZ) : 0
        };
        
        posArray[i3] = origX * expand + direction.x * scatterAmount;
        posArray[i3 + 1] = origY * expand + direction.y * scatterAmount;
        posArray[i3 + 2] = origZ * expand + direction.z * scatterAmount;
      }
      
      // Also rotate the entire system
      pointsRef.current.rotation.y += 0.001;
      pointsRef.current.rotation.x += 0.0005;
      
      pointsRef.current.geometry.attributes.position.needsUpdate = true;
    }
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={count}
          array={positions}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.04}
        color={color}
        transparent
        opacity={0.9}
        sizeAttenuation
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
};

export default MovingParticles;
