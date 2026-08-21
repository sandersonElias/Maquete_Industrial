import { useRef, useMemo, useLayoutEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { PALETA } from './modulos';
import {
  TRECHOS,
  NOS,
  MEIA_BITOLA,
  REVERSOR_T,
  EstadoDesvio,
  proximoTrecho,
  pontosTrilho,
} from './tracado';

interface FerroviaProps {
  rodando: boolean;
  velocidade: number;
  desvios: Record<string, EstadoDesvio>;
  sentido: number;
  /** Trechos que o trem vai percorrer com os desvios atuais */
  rotaAtiva: string[];
}

/** Quantos metros (unidades de cena) cada vagão fica atrás da locomotiva. */
const ATRASO_VAGOES = [0.95, 1.75, 2.55];
const TRILHA_MAX = 420;

/* ---------- Trilhos de um trecho ---------- */

function TrilhosDoTrecho({ id, ativo }: { id: string; ativo: boolean }) {
  const trecho = TRECHOS[id];

  const { esq, dir, dormentes } = useMemo(() => {
    const fazerTubo = (desloc: number) =>
      new THREE.CatmullRomCurve3(pontosTrilho(trecho, desloc), false, 'catmullrom', 0.5);

    // Um dormente a cada ~0.34 unidades de trilho
    const qtd = Math.max(4, Math.round(trecho.comprimento / 0.34));
    const ms: THREE.Matrix4[] = [];
    const tg = new THREE.Vector3();
    for (let i = 0; i <= qtd; i++) {
      const t = i / qtd;
      const p = trecho.curva.getPointAt(t);
      trecho.curva.getTangentAt(t, tg);
      const m = new THREE.Matrix4();
      m.compose(
        new THREE.Vector3(p.x, -0.015, p.z),
        new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), Math.atan2(tg.x, tg.z)),
        new THREE.Vector3(1, 1, 1)
      );
      ms.push(m);
    }
    return { esq: fazerTubo(MEIA_BITOLA), dir: fazerTubo(-MEIA_BITOLA), dormentes: ms };
  }, [trecho]);

  const refDorm = useRef<THREE.InstancedMesh>(null);

  useLayoutEffect(() => {
    if (!refDorm.current) return;
    dormentes.forEach((m, i) => refDorm.current!.setMatrixAt(i, m));
    refDorm.current.instanceMatrix.needsUpdate = true;
  }, [dormentes]);

  return (
    <group>
      {/* Leito de brita */}
      <mesh position={[0, -0.02, 0]}>
        <tubeGeometry args={[trecho.curva, 90, 0.6, 4, false]} />
        <meshStandardMaterial color={ativo ? '#4a4238' : '#332f2a'} roughness={1} />
      </mesh>

      <instancedMesh ref={refDorm} args={[undefined, undefined, dormentes.length]}>
        <boxGeometry args={[0.9, 0.05, 0.13]} />
        <meshStandardMaterial color="#4a3b2a" roughness={0.95} />
      </instancedMesh>

      {[esq, dir].map((c, i) => (
        <mesh key={i} position={[0, 0.05, 0]}>
          <tubeGeometry args={[c, 110, 0.04, 6, false]} />
          <meshStandardMaterial
            color={ativo ? '#cfd8e3' : '#6c757d'}
            roughness={0.3}
            metalness={0.9}
            emissive={ativo ? PALETA.accent : '#000000'}
            emissiveIntensity={ativo ? 0.22 : 0}
          />
        </mesh>
      ))}
    </group>
  );
}

/* ---------- Marcador de desvio ---------- */

function MarcadorDesvio({
  noId,
  estado,
  selecionado,
}: {
  noId: string;
  estado: EstadoDesvio;
  selecionado: boolean;
}) {
  const luz = useRef<THREE.Mesh>(null);
  const no = NOS[noId];
  const cor = estado === 0 ? PALETA.glow : PALETA.warning;

  useFrame((state) => {
    if (!luz.current) return;
    const mat = luz.current.material as THREE.MeshStandardMaterial;
    // Pisca quando o desvio está selecionado no painel
    mat.emissiveIntensity = selecionado
      ? 2 + Math.sin(state.clock.elapsedTime * 6) * 1.6
      : 2.4;
  });

  return (
    <group position={[no.posicao.x, 0, no.posicao.z]}>
      {/* Caixa do servo SG90 */}
      <mesh castShadow position={[0, 0.12, 0]}>
        <boxGeometry args={[0.3, 0.22, 0.3]} />
        <meshStandardMaterial color={PALETA.surface} roughness={0.55} metalness={0.3} />
      </mesh>
      {/* Haste que aponta o estado */}
      <mesh
        castShadow
        position={[0, 0.26, 0]}
        rotation={[0, estado === 0 ? 0 : Math.PI / 4, 0]}
      >
        <boxGeometry args={[0.05, 0.05, 0.42]} />
        <meshStandardMaterial color={cor} roughness={0.4} />
      </mesh>
      {/* Sinaleiro */}
      <mesh ref={luz} position={[0, 0.52, 0]}>
        <sphereGeometry args={[0.11, 12, 12]} />
        <meshStandardMaterial color={cor} emissive={cor} emissiveIntensity={2.4} toneMapped={false} />
      </mesh>
      <mesh position={[0, 0.34, 0]}>
        <cylinderGeometry args={[0.022, 0.022, 0.34, 6]} />
        <meshStandardMaterial color="#6c757d" metalness={0.6} roughness={0.4} />
      </mesh>
    </group>
  );
}

/* ---------- Bloco do reversor ---------- */

function Reversor({ ativo }: { ativo: boolean }) {
  const luz = useRef<THREE.Mesh>(null);
  const pos = useMemo(() => TRECHOS.topo.curva.getPointAt(REVERSOR_T), []);
  const ang = useMemo(() => {
    const tg = TRECHOS.topo.curva.getTangentAt(REVERSOR_T);
    return Math.atan2(tg.x, tg.z);
  }, []);

  useFrame((state) => {
    if (!luz.current) return;
    const mat = luz.current.material as THREE.MeshStandardMaterial;
    mat.emissiveIntensity = ativo ? 2 + Math.sin(state.clock.elapsedTime * 5) * 1.5 : 0.7;
  });

  const cor = ativo ? PALETA.danger : PALETA.glow;

  return (
    <group position={[pos.x, 0, pos.z]} rotation={[0, ang, 0]}>
      {/* Trecho isolado do reversor, mais largo que o trilho comum */}
      <mesh position={[0, 0.03, 0]}>
        <boxGeometry args={[1.05, 0.07, 1.5]} />
        <meshStandardMaterial color={cor} emissive={cor} emissiveIntensity={0.5} roughness={0.4} />
      </mesh>
      {/* Caixa de comando ao lado da via */}
      <mesh castShadow position={[0.85, 0.18, 0]}>
        <boxGeometry args={[0.42, 0.34, 0.5]} />
        <meshStandardMaterial color={PALETA.card} roughness={0.6} />
      </mesh>
      <mesh ref={luz} position={[0.85, 0.44, 0]}>
        <sphereGeometry args={[0.1, 12, 12]} />
        <meshStandardMaterial color={cor} emissive={cor} emissiveIntensity={0.7} toneMapped={false} />
      </mesh>
    </group>
  );
}

/* ---------- Composição ---------- */

export default function Ferrovia({
  rodando,
  velocidade,
  desvios,
  sentido,
  rotaAtiva,
}: FerroviaProps) {
  const loco = useRef<THREE.Group>(null);
  const vagoes = useRef<(THREE.Group | null)[]>([]);

  // Estado do trem na rede
  const trecho = useRef('topo');
  const t = useRef(0);
  const sentidoRef = useRef(sentido);
  const desviosRef = useRef(desvios);
  sentidoRef.current = sentido;
  desviosRef.current = desvios;

  /* Rastro de migalhas: guarda por onde a locomotiva passou, com distância
     acumulada. Os vagões são posicionados a uma distância fixa atrás no
     rastro — assim eles seguem a mesma rota, inclusive ao trocar de trecho
     ou inverter o sentido, sem precisar saber nada da topologia. */
  const trilha = useRef<Array<{ p: THREE.Vector3; ang: number; d: number }>>([]);

  /** Ângulo mostrado na tela — persegue o ângulo do trilho suavemente. */
  const anguloSuave = useRef<number | null>(null);

  const posicaoNoTrecho = (id: string, frac: number) => {
    const tr = TRECHOS[id];
    const f = Math.min(Math.max(frac, 0), 1);
    const p = tr.curva.getPointAt(f);
    const tg = tr.curva.getTangentAt(f);
    // De ré, a locomotiva aponta para o lado oposto ao da tangente
    const bruto = Math.atan2(tg.x, tg.z) + (sentidoRef.current < 0 ? Math.PI : 0);
    return { p, ang: bruto };
  };

  /**
   * As diagonais ligam a reta de cima à de baixo, que correm em sentidos
   * opostos — então quem entra numa delas chega girado quase 180° (é por isso
   * que a maquete real tem reversor). Sem suavizar, o trem daria um piparote
   * instantâneo no desvio. Aqui o ângulo persegue o alvo pelo caminho mais
   * curto, então a virada acontece ao longo de alguns quadros.
   */
  const suavizarAngulo = (alvo: number, passo: number) => {
    if (anguloSuave.current === null) {
      anguloSuave.current = alvo;
      return alvo;
    }
    let dif = alvo - anguloSuave.current;
    while (dif > Math.PI) dif -= Math.PI * 2;
    while (dif < -Math.PI) dif += Math.PI * 2;
    anguloSuave.current += dif * Math.min(passo * 7, 1);
    return anguloSuave.current;
  };

  const aplicar = (obj: THREE.Object3D | null, p: THREE.Vector3, ang: number) => {
    if (!obj) return;
    obj.position.set(p.x, 0.14, p.z);
    obj.rotation.set(0, ang, 0);
  };

  // Coloca o trem na posição inicial antes do primeiro quadro
  useLayoutEffect(() => {
    const { p, ang } = posicaoNoTrecho(trecho.current, t.current);
    aplicar(loco.current, p, ang);
    vagoes.current.forEach((v) => aplicar(v, p, ang));
  }, []);

  useFrame((_, delta) => {
    const passo = Math.min(delta, 0.05);

    if (rodando) {
      const tr = TRECHOS[trecho.current];
      const avanco = (velocidade * 1.6 * passo * sentidoRef.current) / tr.comprimento;
      t.current += avanco;

      // Chegou na ponta do trecho: o desvio daquele nó decide o próximo
      let guarda = 0;
      while ((t.current > 1 || t.current < 0) && guarda++ < 8) {
        if (t.current > 1) {
          const no = TRECHOS[trecho.current].para;
          trecho.current = proximoTrecho(no, 1, desviosRef.current);
          t.current -= 1;
        } else {
          const no = TRECHOS[trecho.current].de;
          trecho.current = proximoTrecho(no, -1, desviosRef.current);
          t.current += 1;
        }
      }
    }

    const { p, ang } = posicaoNoTrecho(trecho.current, t.current);
    const angExibido = suavizarAngulo(ang, passo);
    aplicar(loco.current, p, angExibido);

    // Alimenta o rastro (com o ângulo já suavizado, para os vagões herdarem)
    const lista = trilha.current;
    const ultimo = lista[0];
    const dist = ultimo ? p.distanceTo(ultimo.p) : 0;
    if (!ultimo || dist > 0.02) {
      lista.unshift({ p: p.clone(), ang: angExibido, d: (ultimo?.d ?? 0) + dist });
      if (lista.length > TRILHA_MAX) lista.length = TRILHA_MAX;
    }

    // Posiciona cada vagão a uma distância fixa atrás no rastro
    const base = lista[0]?.d ?? 0;
    ATRASO_VAGOES.forEach((atraso, i) => {
      const alvo = base - atraso;
      let escolhido = lista[lista.length - 1];
      for (let k = 0; k < lista.length; k++) {
        if (lista[k].d <= alvo) {
          escolhido = lista[k];
          break;
        }
      }
      if (escolhido) aplicar(vagoes.current[i], escolhido.p, escolhido.ang);
    });
  });

  const ativos = useMemo(() => new Set(rotaAtiva), [rotaAtiva]);

  return (
    <group>
      {Object.keys(TRECHOS).map((id) => (
        <TrilhosDoTrecho key={id} id={id} ativo={ativos.has(id)} />
      ))}

      <Reversor ativo={sentido < 0} />

      {Object.keys(NOS).map((id) => (
        <MarcadorDesvio key={id} noId={id} estado={desvios[id] ?? 0} selecionado={false} />
      ))}

      {/* Locomotiva */}
      <group ref={loco}>
        <mesh castShadow position={[0, 0.16, 0]}>
          <boxGeometry args={[0.42, 0.3, 0.95]} />
          <meshStandardMaterial color={PALETA.accent} roughness={0.4} metalness={0.35} />
        </mesh>
        <mesh castShadow position={[0, 0.4, -0.16]}>
          <boxGeometry args={[0.38, 0.24, 0.38]} />
          <meshStandardMaterial color="#2b6fb8" roughness={0.4} />
        </mesh>
        {/* Farol na frente e lanterna vermelha atrás.
            A locomotiva inteira gira quando o reversor é acionado, então o
            farol fica sempre apontando para onde ela está indo. */}
        <mesh position={[0, 0.2, 0.5]}>
          <sphereGeometry args={[0.07, 10, 10]} />
          <meshStandardMaterial
            color="#fff3c4"
            emissive="#ffd700"
            emissiveIntensity={3}
            toneMapped={false}
          />
        </mesh>
        <mesh position={[0, 0.2, -0.5]}>
          <sphereGeometry args={[0.05, 8, 8]} />
          <meshStandardMaterial
            color={PALETA.danger}
            emissive={PALETA.danger}
            emissiveIntensity={1.6}
            toneMapped={false}
          />
        </mesh>
        {[-0.28, 0.28].map((z) =>
          [-0.23, 0.23].map((x) => (
            <mesh key={`${x}-${z}`} position={[x, 0.06, z]} rotation={[0, 0, Math.PI / 2]}>
              <cylinderGeometry args={[0.085, 0.085, 0.05, 10]} />
              <meshStandardMaterial color="#15181d" roughness={0.7} />
            </mesh>
          ))
        )}
      </group>

      {/* Vagões basculantes carregados de minério */}
      {ATRASO_VAGOES.map((_, i) => (
        <group key={i} ref={(el) => { vagoes.current[i] = el; }}>
          <mesh castShadow position={[0, 0.15, 0]}>
            <boxGeometry args={[0.4, 0.24, 0.72]} />
            <meshStandardMaterial color="#7a4a2a" roughness={0.7} />
          </mesh>
          <mesh position={[0, 0.29, 0]}>
            <boxGeometry args={[0.31, 0.09, 0.56]} />
            <meshStandardMaterial color="#4a2f22" roughness={1} />
          </mesh>
          {[-0.2, 0.2].map((z) =>
            [-0.21, 0.21].map((x) => (
              <mesh key={`${x}-${z}`} position={[x, 0.06, z]} rotation={[0, 0, Math.PI / 2]}>
                <cylinderGeometry args={[0.075, 0.075, 0.04, 8]} />
                <meshStandardMaterial color="#15181d" roughness={0.7} />
              </mesh>
            ))
          )}
        </group>
      ))}
    </group>
  );
}
