import { useEffect, useLayoutEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { useGLTF, useAnimations } from '@react-three/drei';
import { LoopRepeat, Vector3, type Object3D } from 'three';
import {
  PONTOS_HAUL_MINA,
  criarTracado,
  curvaEspelhadaZ,
  faseHaulCat,
  posicionarNaCurva,
  tMaisProximo,
  tracadoComDesvio,
} from './geometria';

const URL = '/models/maquete-blender.glb?v=fase7';
/**
 * Decodificador Draco servido pelo próprio site (`public/draco/`), não por CDN:
 * na 4G da feira uma requisição a um domínio de terceiro é mais um handshake
 * TLS e mais um ponto de falha. São ~250 KB (wasm + wrapper) baixados uma vez,
 * contra os megabytes que a compressão tira do `.glb`.
 *
 * Funciona nos dois sentidos: se o `.glb` for exportado SEM Draco, o
 * GLTFLoader simplesmente não aciona o decodificador.
 */
const DRACO = '/draco/';

/**
 * Fase 5 — o modelo do Blender chegava sem sombra nenhuma: esta função tinha o
 * nome certo e não ligava `castShadow`/`receiveShadow` em coisa alguma, e ainda
 * zerava `envMapIntensity`, o que deixava todo o metal chapado. As sombras de
 * contato são o que assenta um equipamento no chão; a reflexão do ambiente é o
 * que separa aço de plástico.
 *
 * Só objetos com raio de bounding sphere acima do limiar projetam sombra: um
 * cone de trânsito de 5 cm custa a mesma passada de shadow map que um galpão e
 * não aparece. O `Canvas` já desliga sombra inteira no celular (`shadows={!leve}`).
 */
const RAIO_MIN_SOMBRA = 0.28;
const SEM_SOMBRA = /^(agua|grama|placa|capim)/i;
const OCULTOS = /^(pista|terminal|hangar|torre|c5|estradaaero|termvidro|torrecab|plat2|casa2|telhado2|janela2)/i;

const _haulDir = new Vector3();
const _haulPos = new Vector3();

/** Anda na polilinha reta (espaço GLB, Z já espelhado) sem Catmull. */
function posicionarNoHaul(
  objeto: Object3D,
  pts: Vector3[],
  u: number,
  frente: 'plusZ' | 'minusZ'
) {
  const t = Math.max(0, Math.min(1, u));
  let total = 0;
  const lens: number[] = [0];
  for (let i = 0; i < pts.length - 1; i++) {
    total += pts[i].distanceTo(pts[i + 1]);
    lens.push(total);
  }
  const alvo = t * total;
  let i = 0;
  while (i < pts.length - 2 && lens[i + 1] < alvo) i++;
  const span = Math.max(lens[i + 1] - lens[i], 1e-6);
  const local = (alvo - lens[i]) / span;
  _haulPos.lerpVectors(pts[i], pts[i + 1], local);
  _haulDir.subVectors(pts[i + 1], pts[i]).normalize();
  if (_haulDir.lengthSq() < 1e-8) _haulDir.set(0, 0, 1);
  const yaw = Math.atan2(_haulDir.x, _haulDir.z) + (frente === 'minusZ' ? Math.PI : 0);
  objeto.position.copy(_haulPos);
  objeto.rotation.set(0, yaw, 0);
}

function prepararSombras(obj: Object3D) {
  obj.traverse((child) => {
    if (OCULTOS.test(child.name)) {
      child.visible = false;
      return;
    }
    const mesh = child as Object3D & {
      isMesh?: boolean;
      material?: unknown;
      geometry?: {
        boundingSphere?: { radius: number } | null;
        computeBoundingSphere?: () => void;
      };
    };
    if (!mesh.isMesh) return;

    const g = mesh.geometry;
    if (g && !g.boundingSphere) g.computeBoundingSphere?.();
    const raio = g?.boundingSphere?.radius ?? 0;
    mesh.castShadow = raio >= RAIO_MIN_SOMBRA && !SEM_SOMBRA.test(child.name);
    mesh.receiveShadow = true;

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
      // Reflexão do ambiente ligada — o IBL vem dos Lightformers em Maquete3D.
      if ('envMapIntensity' in m) m.envMapIntensity = 0.55;
      if (names.includes('grama') || names.includes('copa') || names.includes('grass')) {
        if ('metalness' in m) m.metalness = 0;
        if ('roughness' in m) m.roughness = 1;
        if ('envMapIntensity' in m) m.envMapIntensity = 0.12;
        m.color?.setRGB?.(0.28, 0.48, 0.18);
      }
      if (names.includes('terra') || names.includes('rocha') || names.includes('lastro')) {
        if ('metalness' in m) m.metalness = 0;
        if ('roughness' in m) m.roughness = 0.98;
        if ('envMapIntensity' in m) m.envMapIntensity = 0.18;
      }
    });
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
  const { scene, animations } = useGLTF(URL, DRACO);
  const { actions, mixer } = useAnimations(animations, scene);
  const tremRef = useRef<Object3D | null>(null);
  const catRef = useRef<Object3D | null>(null);
  const cacambaRef = useRef<Object3D | null>(null);
  const progresso = useRef(0);
  const haulCiclo = useRef(0);
  // Traçado no espaço do GLB (Z espelhado pelo export Blender→glTF).
  const rota = useMemo(() => {
    const r = tracadoComDesvio(criarTracado(), desvios ?? [0, 0, 0, 0]);
    return curvaEspelhadaZ(r);
  }, [desvios]);
  const haulPts = useMemo(
    () => PONTOS_HAUL_MINA.map(([x, y, z]) => new Vector3(x, y, -z)),
    []
  );

  useLayoutEffect(() => {
    prepararSombras(scene);
    tremRef.current = null;
    catRef.current = null;
    cacambaRef.current = null;
    scene.traverse((obj) => {
      if (obj.name === 'Trem') tremRef.current = obj;
      if (obj.name === 'CAT') catRef.current = obj;
      if (obj.name === 'CATCacamba') cacambaRef.current = obj;
    });
  }, [scene]);

  useEffect(() => {
    if (!tremRef.current) return;
    progresso.current = tMaisProximo(rota, tremRef.current.position);
  }, [rota]);

  useEffect(() => {
    const list = Object.entries(actions).filter(([, a]) => a);
    list.forEach(([nome, a]) => {
      if (/trem|^cat$|cat\./i.test(nome)) {
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
    if (rodando) {
      progresso.current += delta * 0.046 * velocidade;
      haulCiclo.current += delta * 0.055 * velocidade;
    }
    if (tremRef.current) {
      // LocoNariz no GLB está em local −Z.
      posicionarNaCurva(tremRef.current, rota, progresso.current, 0.08, 'minusZ');
    }
    if (catRef.current) {
      const { u, dump } = faseHaulCat(haulCiclo.current);
      // CCab no GLB em −Z; segmentos retos = sem drift.
      posicionarNoHaul(catRef.current, haulPts, u, 'minusZ');
      if (cacambaRef.current) {
        cacambaRef.current.rotation.set(dump, 0, 0);
      }
    }
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

useGLTF.preload(URL, DRACO);
