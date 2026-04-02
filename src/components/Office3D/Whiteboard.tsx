'use client';

import { useState } from 'react';
import { Box, Text } from '@react-three/drei';

interface WhiteboardProps {
  position: [number, number, number];
  rotation?: [number, number, number];
  onClick?: () => void;
}

export default function Whiteboard({ position, rotation = [0, 0, 0], onClick }: WhiteboardProps) {
  const [hovered, setHovered] = useState(false);

  return (
    <group position={position} rotation={rotation}>
      {/* Board surface */}
      <Box
        args={[2.5, 1.5, 0.1]}
        position={[0, 1.5, 0]}
        castShadow
        receiveShadow
        onClick={onClick}
        onPointerOver={() => setHovered(true)}
        onPointerOut={() => setHovered(false)}
      >
        <meshStandardMaterial
          color={hovered ? '#f0f0f0' : '#ffffff'}
          emissive={hovered ? '#fbbf24' : '#000000'}
          emissiveIntensity={hovered ? 0.1 : 0}
        />
      </Box>

      {/* Frame */}
      <Box args={[2.6, 1.6, 0.08]} position={[0, 1.5, -0.05]}>
        <meshStandardMaterial color="#1f2937" metalness={0.3} roughness={0.6} />
      </Box>

      {/* Marker tray */}
      <Box args={[2.3, 0.1, 0.15]} position={[0, 0.7, 0.05]} castShadow>
        <meshStandardMaterial color="#6b7280" />
      </Box>

      {/* Markers */}
      {[-0.6, -0.2, 0.2, 0.6].map((x, i) => (
        <group key={i} position={[x, 0.75, 0.1]}>
          <Box args={[0.08, 0.3, 0.08]} castShadow>
            <meshStandardMaterial
              color={['#ef4444', '#3b82f6', '#22c55e', '#eab308'][i]}
            />
          </Box>
          {/* Cap */}
          <Box args={[0.09, 0.08, 0.09]} position={[0, 0.17, 0]} castShadow>
            <meshStandardMaterial color="#1f2937" />
          </Box>
        </group>
      ))}

      {/* "ROADMAP" text on board */}
      <Text
        position={[0, 2.0, 0.06]}
        fontSize={0.2}
        color="#1f2937"
        anchorX="center"
        anchorY="middle"
      >
        ROADMAP
      </Text>

      {/* Hover label */}
      {hovered && (
        <Text
          position={[0, 2.5, 0.1]}
          fontSize={0.12}
          color="#fbbf24"
          anchorX="center"
          anchorY="middle"
        >
          Click to view
        </Text>
      )}
    </group>
  );
}
