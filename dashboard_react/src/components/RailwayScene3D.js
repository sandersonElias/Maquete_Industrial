import React, { useRef, useMemo, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Text, Environment, Float, MeshTransmissionMaterial } from '@react-three/drei';
import * as THREE from 'three';

const TRACK_LENGTH = 12;
const SWITCH_POSITIONS = [-4, -1.3, 1.3, 4];
const RAIL_HEIGHT = 0.05;
const RAIL_WIDTH = 0.08;

function Rail({ start, end, color = '#4A5568' }) {
  const ref = useRef();
  const points = useMemo(() => [
    new THREE.Vector3(...start),
    new THREE.Vector3(...end)
  ], [start, end]);
  const geometry = useMemo(() => new THREE.BufferGeometry().setFromPoints(points), [points]);

  return (
    <group>
      <line geometry={geometry}>
        <lineBasicMaterial color={color} linewidth={2} />
      </line>
    </group>
  );
}

function TrackTies({ startX, endX }) {
  const ties = useMemo(() => {
    const arr = [];
    for (let x = startX; x <= endX; x += 0.3) {
      arr.push(x);
    }
    return arr;
  }, [startX, endX]);

  return (
    <>
      {ties.map((x, i) => (
        <mesh key={i} position={[x, -0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[0.04, 0.4]} />
          <meshStandardMaterial color="#2D3748" />
        </mesh>
      ))}
    </>
  );
}

function AnimatedTrackTies({ startX, endX }) {
  const ref = useRef();
  useFrame((state) => {
    if (ref.current) {
      ref.current.children.forEach((child, i) => {
        child.material.opacity = 0.3 + Math.sin(state.clock.elapsedTime * 2 + i * 0.5) * 0.15;
      });
    }
  });

  const ties = useMemo(() => {
    const arr = [];
    for (let x = startX; x <= endX; x += 0.3) {
      arr.push(x);
    }
    return arr;
  }, [startX, endX]);

  return (
    <group ref={ref}>
      {ties.map((x, i) => (
        <mesh key={i} position={[x, -0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[0.04, 0.4]} />
          <meshStandardMaterial color="#2D3748" transparent opacity={0.4} />
        </mesh>
      ))}
    </group>
  );
}

function Switch3D({ position, state, id, onClick, isMoving }) {
  const groupRef = useRef();
  const glowRef = useRef();
  const [hovered, setHovered] = useState(false);

  const getColor = () => {
    if (isMoving) return '#FFB800';
    switch (state) {
      case 'LEFT': return '#3D9EFF';
      case 'RIGHT': return '#A855F7';
      case 'CENTER': return '#00FFB2';
      default: return '#4A5568';
    }
  };

  const color = getColor();

  useFrame((state) => {
    if (groupRef.current) {
      const targetRotation = state === 'LEFT' ? 0.3 : state === 'RIGHT' ? -0.3 : 0;
      groupRef.current.rotation.y += (targetRotation - groupRef.current.rotation.y) * 0.05;
    }
    if (glowRef.current) {
      glowRef.current.scale.setScalar(1 + Math.sin(state.clock.elapsedTime * 3) * 0.1);
      glowRef.current.material.opacity = 0.15 + Math.sin(state.clock.elapsedTime * 3) * 0.1;
    }
  });

  return (
    <group position={position} ref={groupRef}>
      {/* Glow ring */}
      <mesh ref={glowRef} position={[0, 0.01, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.15, 0.25, 32]} />
        <meshBasicMaterial color={color} transparent opacity={0.2} side={THREE.DoubleSide} />
      </mesh>

      {/* Switch mechanism base */}
      <mesh position={[0, 0, 0]}>
        <cylinderGeometry args={[0.12, 0.12, 0.06, 16]} />
        <meshStandardMaterial color="#1C2333" metalness={0.8} roughness={0.3} />
      </mesh>

      {/* Switch lever */}
      <mesh position={[0, 0.08, 0]}>
        <cylinderGeometry args={[0.04, 0.04, 0.1, 8]} />
        <meshStandardMaterial color={color} metalness={0.6} roughness={0.4} emissive={color} emissiveIntensity={0.3} />
      </mesh>

      {/* Switch top indicator */}
      <mesh position={[0, 0.14, 0]}>
        <sphereGeometry args={[0.06, 16, 16]} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={hovered ? 0.8 : 0.4}
          metalness={0.5}
          roughness={0.2}
        />
      </mesh>

      {/* Label */}
      <Text
        position={[0, 0.28, 0]}
        fontSize={0.12}
        color="#9CA3AF"
        anchorX="center"
        anchorY="middle"
        font={undefined}
      >
        SW{id}
      </Text>

      {/* Click area */}
      <mesh
        position={[0, 0.1, 0]}
        onClick={(e) => { e.stopPropagation(); onClick(id); }}
        onPointerOver={() => { setHovered(true); document.body.style.cursor = 'pointer'; }}
        onPointerOut={() => { setHovered(false); document.body.style.cursor = 'default'; }}
      >
        <sphereGeometry args={[0.2, 8, 8]} />
        <meshBasicMaterial transparent opacity={0} />
      </mesh>
    </group>
  );
}

function Locomotive({ position }) {
  const ref = useRef();
  const smokeRef = useRef();

  useFrame((state) => {
    if (ref.current) {
      ref.current.position.x = Math.sin(state.clock.elapsedTime * 0.5) * 5;
      ref.current.rotation.y = Math.PI / 2;
    }
  });

  return (
    <group ref={ref} position={position}>
      {/* Body */}
      <mesh position={[0, 0.08, 0]}>
        <boxGeometry args={[0.5, 0.16, 0.2]} />
        <meshStandardMaterial color="#FFB800" metalness={0.7} roughness={0.3} />
      </mesh>

      {/* Cabin */}
      <mesh position={[-0.1, 0.18, 0]}>
        <boxGeometry args={[0.2, 0.1, 0.18]} />
        <meshStandardMaterial color="#E0A000" metalness={0.6} roughness={0.4} />
      </mesh>

      {/* Window */}
      <mesh position={[-0.1, 0.2, 0.091]}>
        <planeGeometry args={[0.14, 0.06]} />
        <meshStandardMaterial color="#3D9EFF" emissive="#3D9EFF" emissiveIntensity={0.3} />
      </mesh>

      {/* Chimney */}
      <mesh position={[0.15, 0.2, 0]}>
        <cylinderGeometry args={[0.03, 0.04, 0.1, 8]} />
        <meshStandardMaterial color="#2D3748" metalness={0.8} roughness={0.2} />
      </mesh>

      {/* Wheels */}
      {[-0.15, 0.05, 0.15].map((x, i) => (
        <group key={i}>
          <mesh position={[x, 0, 0.11]} rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.04, 0.04, 0.02, 12]} />
            <meshStandardMaterial color="#1C2333" metalness={0.9} roughness={0.1} />
          </mesh>
          <mesh position={[x, 0, -0.11]} rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.04, 0.04, 0.02, 12]} />
            <meshStandardMaterial color="#1C2333" metalness={0.9} roughness={0.1} />
          </mesh>
        </group>
      ))}

      {/* Headlight */}
      <pointLight position={[0.3, 0.1, 0]} color="#FFB800" intensity={0.5} distance={2} />
    </group>
  );
}

function Ground() {
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.05, 0]}>
      <planeGeometry args={[20, 6]} />
      <meshStandardMaterial color="#0D0F14" metalness={0.1} roughness={0.9} />
    </mesh>
  );
}

function GridFloor() {
  return (
    <gridHelper args={[20, 40, '#1C2333', '#161B26']} position={[0, -0.049, 0]} />
  );
}

function ParticleField() {
  const ref = useRef();
  const count = 50;

  const positions = useMemo(() => {
    const arr = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      arr[i * 3] = (Math.random() - 0.5) * 16;
      arr[i * 3 + 1] = Math.random() * 3;
      arr[i * 3 + 2] = (Math.random() - 0.5) * 4;
    }
    return arr;
  }, []);

  useFrame((state) => {
    if (ref.current) {
      ref.current.rotation.y = state.clock.elapsedTime * 0.02;
      const posArr = ref.current.geometry.attributes.position.array;
      for (let i = 0; i < count; i++) {
        posArr[i * 3 + 1] += Math.sin(state.clock.elapsedTime + i) * 0.001;
      }
      ref.current.geometry.attributes.position.needsUpdate = true;
    }
  });

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={count}
          array={positions}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial size={0.03} color="#00FFB2" transparent opacity={0.4} sizeAttenuation />
    </points>
  );
}

export default function RailwayScene3D({ switches = [], onSwitchClick }) {
  return (
    <div className="w-full h-full rounded-xl overflow-hidden">
      <Canvas
        camera={{ position: [6, 4, 6], fov: 50 }}
        style={{ background: 'transparent' }}
        gl={{ antialias: true, alpha: true }}
      >
        <color attach="background" args={['#0D0F14']} />

        {/* Lighting */}
        <ambientLight intensity={0.3} />
        <directionalLight position={[5, 8, 5]} intensity={0.8} color="#ffffff" />
        <pointLight position={[-4, 2, 2]} intensity={0.4} color="#3D9EFF" />
        <pointLight position={[4, 2, -2]} intensity={0.4} color="#A855F7" />
        <spotLight position={[0, 6, 0]} angle={0.3} penumbra={0.5} intensity={0.6} color="#00FFB2" />

        {/* Ground & Grid */}
        <Ground />
        <GridFloor />

        {/* Main Track */}
        <group>
          {/* Rails */}
          <Rail start={[-7, 0, 0.15]} end={[7, 0, 0.15]} color="#4A5568" />
          <Rail start={[-7, 0, -0.15]} end={[7, 0, -0.15]} color="#4A5568" />

          {/* Animated ties */}
          <AnimatedTrackTies startX={-7} endX={7} />

          {/* Branch tracks for each switch */}
          {SWITCH_POSITIONS.map((sx, i) => {
            const angle = 0.4;
            const len = 2;
            return (
              <group key={`branch-${i}`}>
                {/* Upper branch */}
                <Rail
                  start={[sx, 0, 0.15]}
                  end={[sx + len * Math.sin(angle), 0, 0.15 + len * Math.cos(angle)]}
                  color="#2D3748"
                />
                <Rail
                  start={[sx, 0, -0.15]}
                  end={[sx + len * Math.sin(angle), 0, -0.15 + len * Math.cos(angle)]}
                  color="#2D3748"
                />
                {/* Lower branch */}
                <Rail
                  start={[sx, 0, 0.15]}
                  end={[sx - len * Math.sin(angle), 0, 0.15 + len * Math.cos(angle)]}
                  color="#2D3748"
                />
                <Rail
                  start={[sx, 0, -0.15]}
                  end={[sx - len * Math.sin(angle), 0, -0.15 + len * Math.cos(angle)]}
                  color="#2D3748"
                />
              </group>
            );
          })}
        </group>

        {/* Switches */}
        {SWITCH_POSITIONS.map((x, i) => (
          <Switch3D
            key={i}
            position={[x, 0, 0]}
            state={switches[i]?.current_state}
            id={i + 1}
            onClick={onSwitchClick}
            isMoving={switches[i]?.is_moving}
          />
        ))}

        {/* Locomotive */}
        <Locomotive position={[0, 0.08, 0]} />

        {/* Particles */}
        <ParticleField />

        {/* Environment */}
        <Environment preset="night" />

        {/* Controls */}
        <OrbitControls
          enablePan={true}
          enableZoom={true}
          enableRotate={true}
          minDistance={3}
          maxDistance={15}
          minPolarAngle={0.2}
          maxPolarAngle={Math.PI / 2.2}
          autoRotate
          autoRotateSpeed={0.3}
        />
      </Canvas>
    </div>
  );
}
