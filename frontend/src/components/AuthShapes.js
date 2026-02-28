import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { MeshTransmissionMaterial } from '@react-three/drei';
import * as THREE from 'three';

// Circle Shape - For Login
export const CircleParticles = ({ color = '#00a884', count = 600 }) => {
  const pointsRef = useRef();
  const timeRef = useRef(0);
  
  const { positions, originalPositions } = useMemo(() => {
    const positions = new Float32Array(count * 3);
    const originalPositions = new Float32Array(count * 3);
    
    for (let i = 0; i < count; i++) {
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
      const breath = (Math.sin(time * 0.8) + 1) / 2;
      const expand = 1 + breath * 1.5;
      const scatter = breath * 3;
      const posArray = pointsRef.current.geometry.attributes.position.array;
      
      for (let i = 0; i < count; i++) {
        const i3 = i * 3;
        const origX = originalPositions[i3];
        const origY = originalPositions[i3 + 1];
        const origZ = originalPositions[i3 + 2];
        
        const noise = Math.sin(time + i * 0.1) * 0.5 + 0.5;
        const scatterAmount = scatter * noise;
        
        const direction = {
          x: origX !== 0 ? origX / Math.abs(origX) : 0,
          y: origY !== 0 ? origY / Math.abs(origY) : 0,
          z: origZ !== 0 ? origZ / Math.abs(origZ) : 0
        };
        
        posArray[i3] = origX * expand + direction.x * scatterAmount;
        posArray[i3 + 1] = origY * expand + direction.y * scatterAmount;
        posArray[i3 + 2] = origZ * expand + direction.z * scatterAmount;
      }
      
      pointsRef.current.rotation.y += 0.002;
      pointsRef.current.rotation.x += 0.001;
      pointsRef.current.geometry.attributes.position.needsUpdate = true;
    }
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" count={count} array={positions} itemSize={3} />
      </bufferGeometry>
      <pointsMaterial size={0.04} color={color} transparent opacity={0.9} sizeAttenuation blending={THREE.AdditiveBlending} />
    </points>
  );
};

// Circle Mesh - Glass sphere
export const CircleMesh = ({ color = '#00a884' }) => (
  <mesh position={[0, 0, -2]}>
    <sphereGeometry args={[4, 64, 64]} />
    <MeshTransmissionMaterial backside backsideThickness={0.5} thickness={0.5} chromaticAberration={0.5} distortion={0.3} color={color} transmission={0.95} />
  </mesh>
);

// Square Shape - For Register
export const SquareParticles = ({ color = '#8b5cf6', count = 600 }) => {
  const pointsRef = useRef();
  const timeRef = useRef(0);
  
  const { positions, originalPositions } = useMemo(() => {
    const positions = new Float32Array(count * 3);
    const originalPositions = new Float32Array(count * 3);
    
    for (let i = 0; i < count; i++) {
      // Create a cube/square shape
      const face = Math.floor(Math.random() * 6);
      const u = (Math.random() - 0.5) * 6;
      const v = (Math.random() - 0.5) * 6;
      let x, y, z;
      
      switch(face) {
        case 0: x = 3; y = u; z = v; break;
        case 1: x = -3; y = u; z = v; break;
        case 2: y = 3; x = u; z = v; break;
        case 3: y = -3; x = u; z = v; break;
        case 4: z = 3; x = u; y = v; break;
        case 5: z = -3; x = u; y = v; break;
        default: x = u; y = v; z = 3;
      }
      
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
      const breath = (Math.sin(time * 0.8) + 1) / 2;
      const expand = 1 + breath * 2;
      const scatter = breath * 4;
      const posArray = pointsRef.current.geometry.attributes.position.array;
      
      for (let i = 0; i < count; i++) {
        const i3 = i * 3;
        const origX = originalPositions[i3];
        const origY = originalPositions[i3 + 1];
        const origZ = originalPositions[i3 + 2];
        
        const noise = Math.sin(time + i * 0.1) * 0.5 + 0.5;
        const scatterAmount = scatter * noise;
        
        const direction = {
          x: origX !== 0 ? origX / Math.abs(origX) : 0,
          y: origY !== 0 ? origY / Math.abs(origY) : 0,
          z: origZ !== 0 ? origZ / Math.abs(origZ) : 0
        };
        
        posArray[i3] = origX * expand + direction.x * scatterAmount;
        posArray[i3 + 1] = origY * expand + direction.y * scatterAmount;
        posArray[i3 + 2] = origZ * expand + direction.z * scatterAmount;
      }
      
      pointsRef.current.rotation.y += 0.002;
      pointsRef.current.rotation.x += 0.001;
      pointsRef.current.geometry.attributes.position.needsUpdate = true;
    }
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" count={count} array={positions} itemSize={3} />
      </bufferGeometry>
      <pointsMaterial size={0.05} color={color} transparent opacity={0.9} sizeAttenuation blending={THREE.AdditiveBlending} />
    </points>
  );
};

// Square Mesh - Glass sphere (same as circle)
export const SquareMesh = ({ color = '#8b5cf6' }) => (
  <mesh position={[0, 0, -2]}>
    <sphereGeometry args={[4, 64, 64]} />
    <MeshTransmissionMaterial backside backsideThickness={0.5} thickness={0.5} chromaticAberration={0.5} distortion={0.3} color={color} transmission={0.95} />
  </mesh>
);

// Hexagon Shape - For Forgot Password
export const HexagonParticles = ({ color = '#f59e0b', count = 600 }) => {
  const pointsRef = useRef();
  const timeRef = useRef(0);
  
  const { positions, originalPositions } = useMemo(() => {
    const positions = new Float32Array(count * 3);
    const originalPositions = new Float32Array(count * 3);
    
    for (let i = 0; i < count; i++) {
      // Create hexagonal prism shape
      const face = Math.floor(Math.random() * 8);
      const angle = Math.random() * Math.PI * 2;
      const radius = 3;
      const hexRadius = 3;
      let x, y, z;
      
      if (face < 2) {
        // Top or bottom face (hexagon)
        const hexAngle = (Math.floor(Math.random() * 6) + Math.random()) * Math.PI / 3;
        x = hexRadius * Math.cos(hexAngle);
        y = hexRadius * Math.sin(hexAngle);
        z = (face === 0 ? 1 : -1) * 2.5;
      } else {
        // Side faces
        x = radius * Math.cos(angle);
        y = radius * Math.sin(angle);
        z = (Math.random() - 0.5) * 5;
      }
      
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
      const breath = (Math.sin(time * 0.8) + 1) / 2;
      const expand = 1 + breath * 2;
      const scatter = breath * 4;
      const posArray = pointsRef.current.geometry.attributes.position.array;
      
      for (let i = 0; i < count; i++) {
        const i3 = i * 3;
        const origX = originalPositions[i3];
        const origY = originalPositions[i3 + 1];
        const origZ = originalPositions[i3 + 2];
        
        const noise = Math.sin(time + i * 0.1) * 0.5 + 0.5;
        const scatterAmount = scatter * noise;
        
        const direction = {
          x: origX !== 0 ? origX / Math.abs(origX) : 0,
          y: origY !== 0 ? origY / Math.abs(origY) : 0,
          z: origZ !== 0 ? origZ / Math.abs(origZ) : 0
        };
        
        posArray[i3] = origX * expand + direction.x * scatterAmount;
        posArray[i3 + 1] = origY * expand + direction.y * scatterAmount;
        posArray[i3 + 2] = origZ * expand + direction.z * scatterAmount;
      }
      
      pointsRef.current.rotation.y += 0.002;
      pointsRef.current.rotation.x += 0.001;
      pointsRef.current.geometry.attributes.position.needsUpdate = true;
    }
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" count={count} array={positions} itemSize={3} />
      </bufferGeometry>
      <pointsMaterial size={0.05} color={color} transparent opacity={0.9} sizeAttenuation blending={THREE.AdditiveBlending} />
    </points>
  );
};

// Hexagon Mesh - Glass sphere (same as circle)
export const HexagonMesh = ({ color = '#f59e0b' }) => (
  <mesh position={[0, 0, -2]}>
    <sphereGeometry args={[4, 64, 64]} />
    <MeshTransmissionMaterial backside backsideThickness={0.5} thickness={0.5} chromaticAberration={0.5} distortion={0.3} color={color} transmission={0.95} />
  </mesh>
);
