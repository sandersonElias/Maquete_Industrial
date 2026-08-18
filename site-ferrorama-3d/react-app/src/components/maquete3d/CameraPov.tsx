import { useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';

export type PovId = 'overview' | 'sala' | 'volvo' | 'cat' | 'mrs' | 'navio' | 'c5';

const OFFSET: Record<Exclude<PovId, 'overview'>, { pos: [number, number, number]; look: [number, number, number] }> = {
  sala: { pos: [0, 0.55, 1.35], look: [0, 0.45, -0.6] },
  volvo: { pos: [-0.05, 0.62, 0.35], look: [1.4, 0.15, 0] },
  cat: { pos: [-0.05, 0.62, 0.85], look: [0, 0.2, -1.4] },
  mrs: { pos: [0, 0.62, -1.55], look: [0, 0.25, 2.2] },
  navio: { pos: [0, 0.85, 0.4], look: [-2.4, 0.9, 1.2] },
  c5: { pos: [0, 0.16, 0.45], look: [0, -0.05, -1.9] },
};

export function CameraPov({
  modo,
}: {
  modo: PovId;
}) {
  const { camera, scene } = useThree();
  const mundo = useRef(new THREE.Vector3());
  const olhar = useRef(new THREE.Vector3());

  useFrame((_, delta) => {
    if (modo === 'overview') return;
    const obj = scene.getObjectByName(`pov-${modo}`);
    if (!obj) return;
    obj.updateWorldMatrix(true, false);
    const cfg = OFFSET[modo];
    mundo.current.set(...cfg.pos);
    obj.localToWorld(mundo.current);
    olhar.current.set(...cfg.look);
    obj.localToWorld(olhar.current);
    const k = Math.min(delta * 3.2, 1);
    camera.position.lerp(mundo.current, k);
    camera.lookAt(olhar.current);
  });

  return null;
}
