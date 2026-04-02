'use client';

import { useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { Box, Cylinder, Text } from '@react-three/drei';
import type { Mesh } from 'three';

interface CoffeeMachineProps {
  position: [number, number, number];
  onClick?: () => void;
}

export default function CoffeeMachine({ position, onClick }: CoffeeMachineProps) {
  const [hovered, setHovered] = useState(false);
  const steamRef = useRef<Mesh>(null);

  // Animate steam
  useFrame((state) => {
    if (steamRef.current) {
      steamRef.current.position.y = 1.3 + Math.sin(state.clock.elapsedTime * 2) * 0.05;
      steamRef.current.scale.x = 1 + Math.sin(state.clock.elapsedTime * 3) * 0.1;
      steamRef.current.scale.z = 1 + Math.cos(state.clock.elapsedTime * 3) * 0.1;
    }
  });

  return (
    <group position={position}>
      {/* Main body */}
      <Box
        args={[0.5, 0.8, 0.4]}
        position={[0, 0.4, 0]}
        castShadow
        receiveShadow
        onClick={onClick}
        onPointerOver={() => setHovered(true)}
        onPointerOut={() => setHovered(false)}
      >
        <meshStandardMaterial
          color={hovered ? '#dc2626' : '#991b1b'}
          metalness={0.6}
          roughness={0.3}
        />
      </Box>

      {/* Water tank (back) */}
      <Box
        args={[0.35, 0.5, 0.1]}
        position={[0, 0.55, -0.15]}
        castShadow
      >
        <meshStandardMaterial
          color="#93c5fd"
          transparent
          opacity={0.4}
          metalness={0.1}
          roughness={0.1}
        />
      </Box>

      {/* Spout */}
      <Box
        args={[0.08, 0.15, 0.08]}
        position={[0, 0.7, 0.2]}
        castShadow
      >
        <meshStandardMaterial color="#1f2937" metalness={0.8} roughness={0.2} />
      </Box>

      {/* Drip tray */}
      <Box
        args={[0.45, 0.05, 0.35]}
        position={[0, 0.05, 0.05]}
        castShadow
        receiveShadow
      >
        <meshStandardMaterial color="#374151" metalness={0.5} roughness={0.5} />
      </Box>

      {/* Coffee cup */}
      <Cylinder
        args={[0.08, 0.1, 0.15, 16]}
        position={[0, 0.15, 0.05]}
        castShadow
      >
        <meshStandardMaterial color="#f5f5dc" />
      </Cylinder>

      {/* Coffee inside cup */}
      <Cylinder
        args={[0.075, 0.095, 0.12, 16]}
        position={[0, 0.16, 0.05]}
      >
        <meshStandardMaterial color="#6b4423" />
      </Cylinder>

      {/* Steam effect (subtle) */}
      <mesh
        ref={steamRef}
        position={[0, 1.3, 0.05]}
      >
        <cylinderGeometry args={[0.05, 0.02, 0.3, 8]} />
        <meshBasicMaterial
          color="#ffffff"
          transparent
          opacity={0.3}
        />
      </mesh>

      {/* Power button */}
      <Cylinder
        args={[0.03, 0.03, 0.02, 16]}
        position={[0.15, 0.6, 0.21]}
        rotation={[Math.PI / 2, 0, 0]}
        castShadow
      >
        <meshStandardMaterial
          color="#22c55e"
          emissive="#15803d"
          emissiveIntensity={0.5}
        />
      </Cylinder>

      {/* Hover label */}
      {hovered && (
        <Text
          position={[0, 1.0, 0]}
          fontSize={0.12}
          color="#fbbf24"
          anchorX="center"
          anchorY="middle"
        >
          Agent Energy
        </Text>
      )}
    </group>
  );
}
