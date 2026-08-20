import { useEffect, useLayoutEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { useGLTF, useAnimations } from '@react-three/drei';
import { LoopRepeat, type Object3D } from 'three';
import {
  criarTracado,
  posicionarNaCurva,
  tMaisProximo,
  tracadoComDesvio,
} from './geometria';

const URL = '/models/maquete-blender.glb?v=fix17';

function prepararSombras(obj: Object3D) {
  obj.traverse((child) => {
    if (/^(pista|terminal|hangar|torre|c5|estradaaero|termvidro|torrecab|plat2|casa2|telhado2|janela2)/i.test(child.name)) {
      child.visible = false;
      return;
    }
    const mesh = child as Object3D & {
      isMesh?: boolean;
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
          color?: { setRGB?: (r: number, g: number, b: number) => void };
        } | null;
        if (!m) return;
        const names = `${child.name} ${m.name || ''}`.toLowerCase();
        if ('envMapIntensity' in m) m.envMapIntensity = 0;
        if (names.includes('grama') || names.includes('copa') || names.includes('grass')) {
          if ('metalness' in m) m.metalness = 0;
          if ('roughness' in m) m.roughness = 1;
          m.color?.setRGB?.(0.28, 0.48, 0.18);
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
  desvios,
  onDesvio,
}: {
  rodando: boolean;
  velocidade?: number;
  desvios: number[];
  onDesvio?: (indice: number) => void;
}) {
  const { scene, animations } = useGLTF(URL);
  const { actions, mixer } = useAnimations(animations, scene);
  const tremRef = useRef<Object3D | null>(null);
  const progresso = useRef(0);
  const principal = useMemo(() => criarTracado(), []);
  const rota = useMemo(() => tracadoComDesvio(principal, desvios ?? [0, 0, 0, 0]), [principal, desvios]);

  useLayoutEffect(() => {
    prepararSombras(scene);
    tremRef.current = null;
    scene.traverse((obj) => {
      if (obj.name === 'Trem') tremRef.current = obj;
    });
  }, [scene]);

  useEffect(() => {
    if (!tremRef.current) return;
    progresso.current = tMaisProximo(rota, tremRef.current.position);
  }, [rota]);

  useEffect(() => {
    const list = Object.entries(actions).filter(([, a]) => a);
    list.forEach(([nome, a]) => {
      if (/trem/i.test(nome)) {
        a!.stop();
        return;
      }
      a!.reset();
      a!.enabled = true;
      a!.setLoop(LoopRepeat, Infinity);
      a!.play();
    });
    return () => list.forEach(([, a]) => a?.stop());
  }, [actions]);

  useFrame((_, delta) => {
    mixer.timeScale = rodando ? velocidade : 0;
    if (rodando) progresso.current += delta * 0.046 * velocidade;
    if (tremRef.current) posicionarNaCurva(tremRef.current, rota, progresso.current, 0.08, 'minusZ');
  });

  return (
    <primitive
      object={scene}
      onClick={(e: { stopPropagation: () => void; object: Object3D }) => {
        e.stopPropagation();
        let obj: Object3D | null = e.object;
        while (obj) {
          const m = obj.name.match(/^Desvio(\d)/);
          if (m && onDesvio) {
            onDesvio(Number(m[1]));
            return;
          }
          obj = obj.parent;
        }
      }}
    />
  );
}

useGLTF.preload(URL);
