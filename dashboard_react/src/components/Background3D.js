import React, { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';

function FloatingParticles() {
  const ref = useRef();
  const count = 80;

  const [positions, colors] = useMemo(() => {
    const pos = new Float32Array(count * 3);
    const col = new Float32Array(count * 3);
    const palette = [
      new THREE.Color('#00FFB2'),
      new THREE.Color('#3D9EFF'),
      new THREE.Color('#A855F7'),
      new THREE.Color('#FFB800'),
    ];

    for (let i = 0; i < count; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 30;
      pos[i * 3 + 1] = (Math.random() - 0.5) * 20;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 10 - 5;
      const c = palette[Math.floor(Math.random() * palette.length)];
      col[i * 3] = c.r;
      col[i * 3 + 1] = c.g;
      col[i * 3 + 2] = c.b;
    }
    return [pos, col];
  }, []);

  useFrame((state) => {
    if (ref.current) {
      const posArr = ref.current.geometry.attributes.position.array;
      for (let i = 0; i < count; i++) {
        posArr[i * 3 + 1] += Math.sin(state.clock.elapsedTime * 0.3 + i * 0.7) * 0.003;
        posArr[i * 3] += Math.cos(state.clock.elapsedTime * 0.2 + i * 0.5) * 0.002;
      }
      ref.current.geometry.attributes.position.needsUpdate = true;
    }
  });

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" count={count} array={positions} itemSize={3} />
        <bufferAttribute attach="attributes-color" count={count} array={colors} itemSize={3} />
      </bufferGeometry>
      <pointsMaterial size={0.06} vertexColors transparent opacity={0.5} sizeAttenuation />
    </points>
  );
}

function FloatingGeo() {
  const group = useRef();

  useFrame((state) => {
    if (group.current) {
      group.current.rotation.y = state.clock.elapsedTime * 0.05;
    }
  });

  const shapes = useMemo(() => {
    return Array.from({ length: 6 }, (_, i) => ({
      position: [
        (Math.random() - 0.5) * 12,
        (Math.random() - 0.5) * 8,
        -5 - Math.random() * 5,
      ],
      rotation: [Math.random() * Math.PI, Math.random() * Math.PI, 0],
      scale: 0.2 + Math.random() * 0.3,
      color: ['#00FFB2', '#3D9EFF', '#A855F7', '#FFB800', '#FF4560', '#4A5568'][i],
      speed: 0.3 + Math.random() * 0.5,
    }));
  }, []);

  return (
    <group ref={group}>
      {shapes.map((s, i) => (
        <FloatingMesh key={i} {...s} index={i} />
      ))}
    </group>
  );
}

function FloatingMesh({ position, rotation, scale, color, speed, index }) {
  const ref = useRef();

  useFrame((state) => {
    if (ref.current) {
      ref.current.rotation.x = state.clock.elapsedTime * speed * 0.3;
      ref.current.rotation.z = state.clock.elapsedTime * speed * 0.2;
      ref.current.position.y = position[1] + Math.sin(state.clock.elapsedTime * speed + index) * 0.5;
    }
  });

  return (
    <mesh ref={ref} position={position} rotation={rotation} scale={scale}>
      <icosahedronGeometry args={[1, 0]} />
      <meshStandardMaterial
        color={color}
        emissive={color}
        emissiveIntensity={0.3}
        metalness={0.8}
        roughness={0.2}
        transparent
        opacity={0.15}
        wireframe
      />
    </mesh>
  );
}

export default function Background3D() {
  return (
    <div className="fixed inset-0 pointer-events-none z-0" style={{ opacity: 0.6 }}>
      <Canvas camera={{ position: [0, 0, 8], fov: 60 }} gl={{ antialias: true, alpha: true }}>
        <ambientLight intensity={0.2} />
        <FloatingParticles />
        <FloatingGeo />
      </Canvas>
    </div>
  );
}
