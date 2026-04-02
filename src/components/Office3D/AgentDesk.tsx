'use client';

import { useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { Text, Box, Html } from '@react-three/drei';
import type { Mesh } from 'three';
import type { AgentConfig, AgentState } from './agentsConfig';
import VoxelAvatar from './VoxelAvatar';
import VoxelChair from './VoxelChair';
import VoxelKeyboard from './VoxelKeyboard';
import VoxelMacMini from './VoxelMacMini';

interface AgentDeskProps {
  agent: AgentConfig;
  state: AgentState;
  onClick: () => void;
  isSelected: boolean;
}

export default function AgentDesk({ agent, state, onClick, isSelected }: AgentDeskProps) {
  const deskRef = useRef<Mesh>(null);
  const monitorRef = useRef<Mesh>(null);
  const [hovered, setHovered] = useState(false);

  // Animación de pulsación para estado "thinking"
  useFrame((frameState) => {
    if (monitorRef.current && state.status === 'thinking') {
      monitorRef.current.scale.setScalar(1 + Math.sin(frameState.clock.elapsedTime * 2) * 0.05);
    }
  });

  const getStatusColor = () => {
    switch (state.status) {
      case 'working':
        return '#22c55e'; // green-500
      case 'thinking':
        return '#3b82f6'; // blue-500
      case 'error':
        return '#ef4444'; // red-500
      case 'idle':
      default:
        return '#6b7280'; // gray-500
    }
  };

  const getMonitorEmissive = () => {
    switch (state.status) {
      case 'working':
        return '#15803d'; // darker green
      case 'thinking':
        return '#1e40af'; // darker blue
      case 'error':
        return '#991b1b'; // darker red
      case 'idle':
      default:
        return '#374151'; // darker gray
    }
  };

  return (
    <group position={agent.position}>
      {/* Desk surface */}
      <Box
        ref={deskRef}
        args={[2, 0.1, 1.5]}
        position={[0, 0.75, 0]}
        castShadow
        receiveShadow
        onClick={onClick}
        onPointerOver={() => setHovered(true)}
        onPointerOut={() => setHovered(false)}
      >
        <meshStandardMaterial
          color={hovered || isSelected ? agent.color : '#8B4513'}
          emissive={hovered || isSelected ? agent.color : '#000000'}
          emissiveIntensity={hovered || isSelected ? 0.2 : 0}
        />
      </Box>

      {/* Monitor */}
      <Box
        ref={monitorRef}
        args={[1.2, 0.8, 0.05]}
        position={[0, 1.5, -0.5]}
        castShadow
        onClick={onClick}
      >
        <meshStandardMaterial
          color={getStatusColor()}
          emissive={getMonitorEmissive()}
          emissiveIntensity={state.status === 'idle' ? 0.1 : 0.5}
        />
      </Box>

      {/* Monitor stand */}
      <Box
        args={[0.1, 0.4, 0.1]}
        position={[0, 1, -0.5]}
        castShadow
      >
        <meshStandardMaterial color="#2d2d2d" />
      </Box>

      {/* Keyboard */}
      <VoxelKeyboard
        position={[0, 0.81, 0.2]}
        rotation={[0, 0, 0]}
      />

      {/* Mac mini - al lado del monitor, sobre la mesa */}
      <VoxelMacMini
        position={[0.5, 0.825, -0.5]}
      />

      {/* Avatar now rendered separately as MovingAvatar */}

      {/* Office Chair - 2x size, rotated 180°, moved back and right */}
      <group scale={2}>
        <VoxelChair
          position={[0, 0, 0.9]}
          rotation={[0, Math.PI, 0]}
          color="#1f2937"
        />
      </group>

      {/* Nameplate — emoji via Html (Troika Text breaks on surrogate pairs) */}
      <Html
        position={[0, 2.5, 0]}
        center
        distanceFactor={10}
        style={{ pointerEvents: 'none', userSelect: 'none', whiteSpace: 'nowrap' }}
      >
        <span
          style={{
            color: '#fff',
            fontWeight: 700,
            fontSize: 14,
            textShadow: '0 0 4px #000, 0 1px 2px #000',
          }}
        >
          <span style={{ marginRight: 6 }}>{agent.emoji}</span>
          {agent.name}
        </span>
      </Html>

      {/* Status indicator text */}
      <Text
        position={[0, 2.2, 0]}
        fontSize={0.1}
        color={getStatusColor()}
        anchorX="center"
        anchorY="middle"
      >
        {state.status.toUpperCase()}
        {state.model && ` • ${state.model}`}
      </Text>

      {/* Desk legs */}
      {[-0.8, 0.8].map((x, i) =>
        [-0.6, 0.6].map((z, j) => (
          <Box
            key={`leg-${i}-${j}`}
            args={[0.05, 0.7, 0.05]}
            position={[x, 0.35, z]}
            castShadow
          >
            <meshStandardMaterial color="#5d4037" />
          </Box>
        ))
      )}

      {/* Subtle floor glow when selected */}
      {isSelected && (
        <mesh position={[0, 0.01, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <circleGeometry args={[1.5, 32]} />
          <meshBasicMaterial color={agent.color} transparent opacity={0.3} />
        </mesh>
      )}
    </group>
  );
}
