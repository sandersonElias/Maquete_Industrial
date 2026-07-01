import React, { useRef, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';

function FloatingShape({ color, position, speed = 1 }) {
  const ref = useRef();

  useFrame((state) => {
    if (ref.current) {
      ref.current.rotation.x = state.clock.elapsedTime * 0.3 * speed;
      ref.current.rotation.y = state.clock.elapsedTime * 0.5 * speed;
      ref.current.position.y = position[1] + Math.sin(state.clock.elapsedTime * speed) * 0.2;
    }
  });

  return (
    <mesh ref={ref} position={position}>
      <octahedronGeometry args={[0.3, 0]} />
      <meshStandardMaterial
        color={color}
        emissive={color}
        emissiveIntensity={0.4}
        metalness={0.7}
        roughness={0.2}
        transparent
        opacity={0.8}
      />
    </mesh>
  );
}

function MiniScene({ color }) {
  return (
    <Canvas camera={{ position: [0, 0, 3], fov: 40 }} style={{ background: 'transparent' }}>
      <ambientLight intensity={0.5} />
      <pointLight position={[2, 2, 2]} intensity={0.8} color={color} />
      <FloatingShape color={color} position={[0, 0, 0]} speed={0.8} />
    </Canvas>
  );
}

export default function Card3D({ children, className = '', glowColor = '#3D9EFF', onClick }) {
  const cardRef = useRef();
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [isHovered, setIsHovered] = useState(false);

  const handleMouseMove = (e) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    setMousePos({ x, y });
  };

  const transform = isHovered
    ? `perspective(800px) rotateY(${mousePos.x * 8}deg) rotateX(${-mousePos.y * 8}deg) translateZ(8px)`
    : 'perspective(800px) rotateY(0deg) rotateX(0deg) translateZ(0px)';

  return (
    <div
      ref={cardRef}
      onClick={onClick}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => { setIsHovered(false); setMousePos({ x: 0, y: 0 }); }}
      className={`relative ${className}`}
      style={{
        transform,
        transition: 'transform 0.3s ease-out',
        transformStyle: 'preserve-3d',
      }}
    >
      {/* Glow effect */}
      <div
        className="absolute inset-0 rounded-xl opacity-0 transition-opacity duration-300 pointer-events-none"
        style={{
          opacity: isHovered ? 0.15 : 0,
          background: `radial-gradient(circle at ${(mousePos.x + 0.5) * 100}% ${(mousePos.y + 0.5) * 100}%, ${glowColor}, transparent 70%)`,
        }}
      />
      {children}
    </div>
  );
}

export { MiniScene, FloatingShape };
