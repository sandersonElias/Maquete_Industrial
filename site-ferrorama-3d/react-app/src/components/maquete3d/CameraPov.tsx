import { useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';

export type PovId = 'overview' | 'sala' | 'volvo' | 'cat' | 'mrs' | 'navio' | 'c5';

/** Offsets locais a partir do grupo da cabine (olho + para onde olha). */
const CABINE: Record<Exclude<PovId, 'overview'>, { pos: [number, number, number]; look: [number, number, number]; fov: number }> = {
  sala: { pos: [0, 0.08, 0], look: [0, -0.06, -2.4], fov: 50 },
  volvo: { pos: [0, 0.04, 0], look: [1.8, -0.35, 0.05], fov: 58 },
  cat: { pos: [0, 0.04, 0], look: [0.05, -0.18, 2.6], fov: 56 },
  mrs: { pos: [0, 0.02, -0.06], look: [0, -0.22, 4.2], fov: 52 },
  navio: { pos: [0, 0.04, 0], look: [0, -0.28, 5.5], fov: 60 },
  c5: { pos: [0, 0.02, 0], look: [0, -0.18, 4.5], fov: 55 },
};

export function CameraPov({
  modo,
}: {
  modo: PovId;
}) {
  const { camera } = useThree();
  const mundo = useRef(new THREE.Vector3());
  const olhar = useRef(new THREE.Vector3());
  const quat = useRef(new THREE.Quaternion());
  const m4 = useRef(new THREE.Matrix4());
  const up = useRef(new THREE.Vector3(0, 1, 0));

  useFrame((state, delta) => {
    const persp = camera as THREE.PerspectiveCamera;
    if (modo === 'overview') {
      persp.fov += (42 - persp.fov) * Math.min(delta * 3, 1);
      persp.near += (0.1 - persp.near) * Math.min(delta * 4, 1);
      persp.updateProjectionMatrix();
      return;
    }

    const obj = state.scene.getObjectByName(`cabine-${modo}`) ?? state.scene.getObjectByName(`pov-${modo}`);
    if (!obj) return;
    obj.updateWorldMatrix(true, false);
    const cfg = CABINE[modo];
    mundo.current.set(...cfg.pos);
    obj.localToWorld(mundo.current);
    olhar.current.set(...cfg.look);
    obj.localToWorld(olhar.current);

    const k = 1 - Math.exp(-delta * 6.4);
    camera.position.lerp(mundo.current, k);
    m4.current.lookAt(camera.position, olhar.current, up.current);
    quat.current.setFromRotationMatrix(m4.current);
    camera.quaternion.slerp(quat.current, k);

    persp.near += (0.035 - persp.near) * k;
    persp.fov += (cfg.fov - persp.fov) * k;
    persp.updateProjectionMatrix();
  });

  return null;
}
