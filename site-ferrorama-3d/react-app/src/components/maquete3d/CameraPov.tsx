import { useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';

export type PovId = 'overview' | 'sala' | 'volvo' | 'cat' | 'mrs' | 'navio';

/** De cima, 42° enquadra o tabuleiro inteiro. */
export const BASE_FOV_VISTA = 42;
/** No nível do solo a mesma lente distorce tudo que está perto — foto de
 *  maquete usa lente mais fechada. */
export const BASE_FOV_SOLO = 34;
const ASPECTO_BASE = 16 / 10;

/**
 * Mantém o campo de visão HORIZONTAL constante.
 *
 * A maquete é larga (47 x 35) e o `fov` do three é vertical: numa tela de
 * celular em pé o quadro fica estreito e a mina e o porto saem pelas laterais.
 * Em vez de empurrar a câmera para trás — o que brigaria com o dedo do usuário
 * no OrbitControls — abrimos o fov vertical na medida exata em que o aspecto
 * encolheu. O enquadramento horizontal fica igual em qualquer tela.
 */
function fovResponsivo(baseGraus: number, largura: number, altura: number): number {
  const aspecto = largura / Math.max(1, altura);
  if (aspecto >= ASPECTO_BASE) return baseGraus;
  const fov = THREE.MathUtils.radToDeg(
    2 * Math.atan(Math.tan(THREE.MathUtils.degToRad(baseGraus) / 2) * (ASPECTO_BASE / aspecto))
  );
  return Math.min(fov, 78);
}

/** Offsets locais a partir do grupo da cabine (olho + para onde olha). */
const CABINE: Record<Exclude<PovId, 'overview'>, { pos: [number, number, number]; look: [number, number, number]; fov: number }> = {
  sala: { pos: [0, 0.08, 0], look: [0, -0.06, -2.4], fov: 50 },
  volvo: { pos: [0, 0.04, 0], look: [1.8, -0.35, 0.05], fov: 58 },
  cat: { pos: [0, 0.04, 0], look: [0.05, -0.18, 2.6], fov: 56 },
  mrs: { pos: [0, 0.02, -0.06], look: [0, -0.22, 4.2], fov: 52 },
  navio: { pos: [0, 0.04, 0], look: [0, -0.28, 5.5], fov: 60 },
};

export function CameraPov({
  modo,
}: {
  modo: PovId;
}) {
  const { camera } = useThree();
  const largura = useThree((s) => s.size.width);
  const altura = useThree((s) => s.size.height);
  const mundo = useRef(new THREE.Vector3());
  const olhar = useRef(new THREE.Vector3());
  const quat = useRef(new THREE.Quaternion());
  const m4 = useRef(new THREE.Matrix4());
  const up = useRef(new THREE.Vector3(0, 1, 0));

  useFrame((state, delta) => {
    const persp = camera as THREE.PerspectiveCamera;
    if (modo === 'overview') {
      // Dono único do `fov` nesta cena (o EnquadramentoResponsivo só existe na
      // cena do Blender): a meta acompanha a altura da câmera e o aspecto da tela.
      const t = THREE.MathUtils.clamp((camera.position.y - 0.4) / 2.6, 0, 1);
      const base = THREE.MathUtils.lerp(BASE_FOV_SOLO, BASE_FOV_VISTA, t);
      const alvo = fovResponsivo(base, largura, altura);
      persp.fov += (alvo - persp.fov) * Math.min(delta * 3, 1);
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
