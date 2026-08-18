import { useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';

export type PovId = 'overview' | 'sala' | 'volvo' | 'cat' | 'mrs' | 'navio' | 'c5';

const OFFSET: Record<Exclude<PovId, 'overview'>, { pos: [number, number, number]; look: [number, number, number] }> = {
  sala: { pos: [0, 0.5, 1.45], look: [0, 0.42, -0.7] },
  volvo: { pos: [-0.08, 0.72, 0.28], look: [1.6, 0.1, 0] },
  cat: { pos: [-0.08, 0.72, 0.95], look: [0, 0.15, -1.5] },
  mrs: { pos: [0, 0.72, -0.95], look: [0, 0.28, 1.4] },
  navio: { pos: [0, 0.95, 0.2], look: [-2.6, 0.7, 1.1] },
  c5: { pos: [0, 0.18, 0.55], look: [0, 0, -1.8] },
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
