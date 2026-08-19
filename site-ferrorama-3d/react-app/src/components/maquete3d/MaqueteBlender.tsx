import { useEffect, useLayoutEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { useGLTF, useAnimations } from '@react-three/drei';
import { LoopRepeat } from 'three';
import type { Object3D } from 'three';

const URL = '/models/maquete-blender.glb?v=fix14';

function prepararSombras(obj: Object3D) {
  obj.traverse((child) => {
    if (/^(pista|faixa|terminal|hangar|torre|c5|estradaaero|termvidro|torrecab|plat2|casa2|telhado2|janela2)/i.test(child.name)) {
      child.visible = false;
      return;
    }
    const mesh = child as Object3D & {
      isMesh?: boolean;
      castShadow?: boolean;
      receiveShadow?: boolean;
      material?: unknown;
    };
    if (mesh.isMesh) {
      const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
      mats.forEach((raw) => {
        const m = raw as {
          name?: string;
          envMapIntensity?: number;
          metalness?: number;
          roughness?: number;
          color?: { multiply?: (c: unknown) => void; setHex?: (n: number) => void };
        } | null;
        if (!m) return;
        const names = `${child.name} ${m.name || ''}`.toLowerCase();
        if ('envMapIntensity' in m) m.envMapIntensity = 0;
        if (names.includes('grama') || names.includes('copa') || names.includes('grass')) {
          if ('metalness' in m) m.metalness = 0;
          if ('roughness' in m) m.roughness = 1;
          if (m.color && 'setRGB' in m.color) {
            (m.color as { setRGB: (r: number, g: number, b: number) => void }).setRGB(0.28, 0.48, 0.18);
          }
        }
        if (names.includes('terra') || names.includes('rocha') || names.includes('lastro')) {
          if ('metalness' in m) m.metalness = 0;
          if ('roughness' in m) m.roughness = 0.98;
        }
      });
    }
  });
}

export function MaqueteBlender({
  rodando,
  velocidade = 1,
}: {
  rodando: boolean;
  velocidade?: number;
}) {
  const { scene, animations } = useGLTF(URL);
  const { actions, mixer } = useAnimations(animations, scene);

  useLayoutEffect(() => {
    prepararSombras(scene);
  }, [scene]);

  useEffect(() => {
    const list = Object.values(actions).filter(Boolean);
    list.forEach((a) => {
      a!.reset();
      a!.enabled = true;
      a!.setLoop(LoopRepeat, Infinity);
      a!.play();
    });
    return () => list.forEach((a) => a?.stop());
  }, [actions]);

  useFrame(() => {
    mixer.timeScale = rodando ? velocidade : 0;
  });

  return <primitive object={scene} />;
}

useGLTF.preload(URL);
