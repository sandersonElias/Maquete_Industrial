import { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';

function FloatingParticles() {
  const meshRef = useRef<THREE.Points>(null);
  const count = 400;

  const positions = useMemo(() => {
    const pos = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 20;
      pos[i * 3 + 1] = (Math.random() - 0.5) * 12;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 10;
    }
    return pos;
  }, []);

  const colors = useMemo(() => {
    const col = new Float32Array(count * 3);
    const palette = [
      new THREE.Color('#ff8844'),
      new THREE.Color('#ffaa44'),
      new THREE.Color('#cc6600'),
      new THREE.Color('#ffffff'),
    ];
    for (let i = 0; i < count; i++) {
      const c = palette[Math.floor(Math.random() * palette.length)];
      col[i * 3] = c.r;
      col[i * 3 + 1] = c.g;
      col[i * 3 + 2] = c.b;
    }
    return col;
  }, []);

  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.y = state.clock.elapsedTime * 0.02;
      meshRef.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.01) * 0.1;
    }
  });

  return (
    <points ref={meshRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={count}
          array={positions}
          itemSize={3}
        />
        <bufferAttribute
          attach="attributes-color"
          count={count}
          array={colors}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.04}
        vertexColors
        transparent
        opacity={0.7}
        sizeAttenuation
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </points>
  );
}

function WireframeSphere() {
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.x = state.clock.elapsedTime * 0.08;
      meshRef.current.rotation.y = state.clock.elapsedTime * 0.12;
    }
  });

  return (
    <mesh ref={meshRef} position={[0, 0, 0]}>
      <icosahedronGeometry args={[2.5, 1]} />
      <meshStandardMaterial
        color="#ff8844"
        wireframe
        transparent
        opacity={0.08}
      />
    </mesh>
  );
}

function FloatingRing() {
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.x = Math.PI / 2 + Math.sin(state.clock.elapsedTime * 0.15) * 0.2;
      meshRef.current.rotation.z = state.clock.elapsedTime * 0.05;
    }
  });

  return (
    <mesh ref={meshRef} position={[0, 0, 0]}>
      <torusGeometry args={[3, 0.02, 16, 100]} />
      <meshStandardMaterial
        color="#ffaa44"
        transparent
        opacity={0.15}
        emissive="#ff8844"
        emissiveIntensity={0.3}
      />
    </mesh>
  );
}

function GlowOrb() {
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (meshRef.current) {
      const scale = 1 + Math.sin(state.clock.elapsedTime * 0.8) * 0.1;
      meshRef.current.scale.setScalar(scale);
    }
  });

  return (
    <mesh ref={meshRef} position={[3, 1, -2]}>
      <sphereGeometry args={[0.5, 16, 16]} />
      <meshStandardMaterial
        color="#ff8844"
        transparent
        opacity={0.06}
        emissive="#ff8844"
        emissiveIntensity={0.5}
      />
    </mesh>
  );
}

export default function HeroScene() {
  return (
    <div className="hero-3d-scene">
      <Canvas
        camera={{ position: [0, 0, 6], fov: 60 }}
        style={{ background: 'transparent' }}
        dpr={[1, 1.5]}
        gl={{ alpha: true, antialias: true }}
      >
        <ambientLight intensity={0.3} />
        <pointLight position={[5, 5, 5]} intensity={0.5} color="#ff8844" />
        <pointLight position={[-5, -3, 3]} intensity={0.3} color="#ffaa44" />
        <FloatingParticles />
        <WireframeSphere />
        <FloatingRing />
        <GlowOrb />
      </Canvas>
    </div>
  );
}
