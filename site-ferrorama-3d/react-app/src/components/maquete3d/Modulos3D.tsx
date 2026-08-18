import { useRef, useMemo, useLayoutEffect, ReactNode, type RefObject } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { PALETA } from './modulos';
import { criarTracado, criarDiagonal, curvaParalela, matrizesDormentes, posicionarNaCurva, tracadoComDesvio, criarRamoVisual, ramoAtivo, geometriaFita, geometriaPrisma, DESTINO_PORTO, DESTINO_AEROPORTO, ESTACAO_MINA, criarPercursoCaminhao, BITOLA, PILARES_PONTE } from './geometria';
import { LocoMRS, VagaoMinerio, EscavadeiraVolvo, CaminhaoCAT, PortaConteineres, AviaoC5, MesaControle } from './veiculos';

/* ============================================================
   Wrapper interativo: destaca o módulo no hover e na seleção
   ============================================================ */

interface GrupoInterativoProps {
  id: string;
  cor: string;
  selecionado: boolean;
  destacado: boolean;
  onSelecionar: (id: string) => void;
  onDestacar: (id: string | null) => void;
  position?: [number, number, number];
  elevar?: boolean;
  children: ReactNode;
}

export function GrupoInterativo({
  id,
  cor,
  selecionado,
  destacado,
  onSelecionar,
  onDestacar,
  position = [0, 0, 0],
  elevar = true,
  children,
}: GrupoInterativoProps) {
  const grupo = useRef<THREE.Group>(null);
  const anel = useRef<THREE.Mesh>(null);
  const ativo = selecionado || destacado;

  useFrame((_, delta) => {
    if (!grupo.current) return;
    // Módulo ativo sobe um pouco — leitura imediata de "isto está selecionado"
    const alvoY = elevar && ativo ? 0.35 : 0;
    grupo.current.position.y += (alvoY - grupo.current.position.y) * Math.min(delta * 8, 1);

    if (anel.current) {
      const mat = anel.current.material as THREE.MeshBasicMaterial;
      const alvoOp = selecionado ? 0.85 : destacado ? 0.4 : 0;
      mat.opacity += (alvoOp - mat.opacity) * Math.min(delta * 8, 1);
      anel.current.rotation.z += delta * 0.6;
    }
  });

  return (
    <group position={position}>
      {/* Anel de destaque no chão */}
      <mesh ref={anel} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]}>
        <ringGeometry args={[2.1, 2.45, 48]} />
        <meshBasicMaterial color={cor} transparent opacity={0} side={THREE.DoubleSide} />
      </mesh>

      <group
        ref={grupo}
        onClick={(e) => {
          e.stopPropagation();
          onSelecionar(id);
        }}
        onPointerOver={(e) => {
          e.stopPropagation();
          onDestacar(id);
          document.body.style.cursor = 'pointer';
        }}
        onPointerOut={() => {
          onDestacar(null);
          document.body.style.cursor = '';
        }}
      >
        {children}
      </group>
    </group>
  );
}

/* ============================================================
   Base — a placa de MDF da maquete
   ============================================================ */

export function Base() {
  return (
    <group>
      <mesh receiveShadow position={[0, -0.15, 0]}>
        <boxGeometry args={[30, 0.3, 22]} />
        <meshStandardMaterial color="#6b5340" roughness={0.9} metalness={0} />
      </mesh>
      {/* Superfície: feltro verde de maquete, legível de dia */}
      <mesh receiveShadow rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.005, 0]}>
        <planeGeometry args={[29.4, 21.4]} />
        <meshStandardMaterial color="#4a6b42" roughness={1} />
      </mesh>
      {/* Borda da placa */}
      <lineSegments position={[0, 0.01, 0]}>
        <edgesGeometry args={[new THREE.BoxGeometry(29.4, 0.02, 21.4)]} />
        <lineBasicMaterial color={PALETA.border} />
      </lineSegments>
    </group>
  );
}

/* ============================================================
   Ferrovia — trilhos, dormentes, trem e desvios
   ============================================================ */

interface FerroviaProps {
  rodando: boolean;
  velocidade: number;
  desvios: number[];
}

export function Ferrovia({ rodando, velocidade, desvios }: FerroviaProps) {
  const trem = useRef<THREE.Group>(null);
  const vagoes = useRef<(THREE.Group | null)[]>([]);
  const progresso = useRef(0);
  const espera = useRef(0);
  const jaParou = useRef(false);

  const principal = useMemo(() => criarTracado(), []);
  const curva = useMemo(() => tracadoComDesvio(principal, desvios), [principal, desvios]);
  const ramo = ramoAtivo(desvios);
  const ramoPorto = useMemo(() => criarRamoVisual(principal, 'porto'), [principal]);
  const ramoAero = useMemo(() => criarRamoVisual(principal, 'aeroporto'), [principal]);
  const diagonal = useMemo(() => criarDiagonal(), []);

  useLayoutEffect(() => {
    if (trem.current) posicionarNaCurva(trem.current, curva, 0, 0.08);
  }, [curva]);

  useFrame((_, delta) => {
    const frac = ((progresso.current % 1) + 1) % 1;
    const p = curva.getPointAt(frac);
    const destinos: THREE.Vector3[] = [ESTACAO_MINA];
    if (ramo === 'porto') destinos.push(DESTINO_PORTO);
    if (ramo === 'aeroporto') destinos.push(DESTINO_AEROPORTO);
    const naEstacao = destinos.some((d) => p.distanceTo(d) < 0.75);

    if (naEstacao) {
      if (!jaParou.current) {
        espera.current += delta;
        if (espera.current < 2.4) {
          if (trem.current) posicionarNaCurva(trem.current, curva, progresso.current, 0.08);
          vagoes.current.forEach((v, i) => {
            if (v) posicionarNaCurva(v, curva, progresso.current - 0.018 * (i + 1), 0.07);
          });
          return;
        }
        jaParou.current = true;
      }
    } else {
      jaParou.current = false;
      espera.current = 0;
    }

    if (rodando) progresso.current += delta * 0.04 * velocidade;

    if (trem.current) posicionarNaCurva(trem.current, curva, progresso.current, 0.08);
    vagoes.current.forEach((v, i) => {
      if (v) posicionarNaCurva(v, curva, progresso.current - 0.018 * (i + 1), 0.07);
    });
  });

  return (
    <group>
      <TrilhoHO curva={principal} fechada />
      <TrilhoHO curva={diagonal} fechada={false} opacidade={ramo === 'diagonal' ? 1 : 0.7} />
      <TrilhoHO curva={ramoPorto} fechada={false} corTrilho={ramo === 'porto' ? PALETA.glow : '#c5ced6'} opacidade={ramo === 'porto' ? 1 : 0.55} />
      <TrilhoHO curva={ramoAero} fechada={false} corTrilho={ramo === 'aeroporto' ? PALETA.purple : '#c5ced6'} opacidade={ramo === 'aeroporto' ? 1 : 0.55} />

      {PILARES_PONTE.map((p, i) => (
        <group key={i} position={p}>
          <mesh castShadow position={[0, 0.22, 0]}>
            <boxGeometry args={[0.42, 0.44, 0.42]} />
            <meshStandardMaterial color="#6a5340" roughness={0.95} />
          </mesh>
          <mesh castShadow position={[0, 0.48, 0]}>
            <boxGeometry args={[0.5, 0.1, 0.5]} />
            <meshStandardMaterial color="#5a4636" roughness={0.95} />
          </mesh>
        </group>
      ))}

      {desvios.map((estado, i) => {
        const t = 0.08 + i * 0.25;
        const pt = principal.getPointAt(t);
        const cor = estado === 0 ? PALETA.accent : estado === 1 ? PALETA.purple : PALETA.warning;
        return (
          <group key={i} position={[pt.x, 0.08, pt.z]}>
            <mesh castShadow>
              <boxGeometry args={[0.28, 0.14, 0.28]} />
              <meshStandardMaterial color={PALETA.surface} roughness={0.6} />
            </mesh>
            <mesh position={[0, 0.16, 0]}>
              <sphereGeometry args={[0.08, 10, 10]} />
              <meshStandardMaterial color={cor} emissive={cor} emissiveIntensity={2.2} toneMapped={false} />
            </mesh>
          </group>
        );
      })}

      <EstacaoTrem position={[ESTACAO_MINA.x, 0, ESTACAO_MINA.z]} rotacao={0.12} cor={PALETA.warning} />
      <EstacaoTrem position={[DESTINO_PORTO.x, 0, DESTINO_PORTO.z]} rotacao={-1.05} cor={PALETA.glow} />
      <EstacaoTrem position={[DESTINO_AEROPORTO.x, 0, DESTINO_AEROPORTO.z]} rotacao={1.05} cor={PALETA.purple} />

      <group position={[2.8, 0, -3.6]}>
        <mesh castShadow position={[0, 0.35, 0]}>
          <cylinderGeometry args={[0.05, 0.06, 0.7, 6]} />
          <meshStandardMaterial color="#333" roughness={0.6} metalness={0.5} />
        </mesh>
        <mesh position={[0, 0.72, 0]}>
          <boxGeometry args={[0.14, 0.38, 0.1]} />
          <meshStandardMaterial color="#1a1a1a" roughness={0.8} />
        </mesh>
        {[0.82, 0.68, 0.54].map((y, i) => (
          <mesh key={y} position={[0, y, 0.06]}>
            <sphereGeometry args={[0.04, 8, 8]} />
            <meshStandardMaterial
              color={[PALETA.danger, PALETA.warning, PALETA.glow][i]}
              emissive={[PALETA.danger, PALETA.warning, PALETA.glow][i]}
              emissiveIntensity={i === 2 ? 2.5 : 1.2}
              toneMapped={false}
            />
          </mesh>
        ))}
      </group>

      <group ref={trem}>
        <LocoMRS />
      </group>

      {[0, 1, 2].map((i) => (
        <group key={i} ref={(el) => { vagoes.current[i] = el; }}>
          <VagaoMinerio />
        </group>
      ))}
    </group>
  );
}

function TrilhoHO({
  curva,
  fechada,
  corTrilho = '#c8d0d8',
  opacidade = 1,
  dormentesRef,
  matrizes,
}: {
  curva: THREE.CatmullRomCurve3;
  fechada: boolean;
  corTrilho?: string;
  opacidade?: number;
  dormentesRef?: RefObject<THREE.InstancedMesh | null>;
  matrizes?: THREE.Matrix4[];
}) {
  const localRef = useRef<THREE.InstancedMesh>(null);
  const ref = dormentesRef ?? localRef;
  const nDorm = fechada ? 320 : 48;
  const dorm = useMemo(() => matrizes ?? matrizesDormentes(curva, nDorm), [curva, matrizes, nDorm]);
  const e = useMemo(() => geometriaPrisma(curvaParalela(curva, BITOLA), 0.028, 0.04, fechada ? 240 : 80, fechada), [curva, fechada]);
  const d = useMemo(() => geometriaPrisma(curvaParalela(curva, -BITOLA), 0.028, 0.04, fechada ? 240 : 80, fechada), [curva, fechada]);

  useLayoutEffect(() => {
    if (!ref.current || matrizes) return;
    dorm.forEach((m, i) => ref.current!.setMatrixAt(i, m));
    ref.current.instanceMatrix.needsUpdate = true;
  }, [dorm, matrizes, ref]);

  return (
    <group>
      <instancedMesh ref={ref} args={[undefined, undefined, dorm.length]} receiveShadow>
        <boxGeometry args={[0.58, 0.035, 0.085]} />
        <meshStandardMaterial color="#1c1c1c" roughness={0.95} transparent={opacidade < 1} opacity={opacidade} />
      </instancedMesh>
      <mesh geometry={e}>
        <meshStandardMaterial color={corTrilho} roughness={0.28} metalness={0.82} transparent={opacidade < 1} opacity={opacidade} />
      </mesh>
      <mesh geometry={d}>
        <meshStandardMaterial color={corTrilho} roughness={0.28} metalness={0.82} transparent={opacidade < 1} opacity={opacidade} />
      </mesh>
    </group>
  );
}

function EstacaoTrem({
  position,
  rotacao,
  cor,
}: {
  position: [number, number, number];
  rotacao: number;
  cor: string;
}) {
  return (
    <group position={position} rotation={[0, rotacao, 0]}>
      <mesh castShadow receiveShadow position={[0, 0.16, 0.55]}>
        <boxGeometry args={[2.4, 0.12, 0.7]} />
        <meshStandardMaterial color="#8a8580" roughness={0.9} />
      </mesh>
      <mesh castShadow position={[0, 0.55, 0.72]}>
        <boxGeometry args={[1.6, 0.7, 0.55]} />
        <meshStandardMaterial color="#3a4558" roughness={0.75} />
      </mesh>
      <mesh castShadow position={[0, 0.95, 0.72]}>
        <boxGeometry args={[1.75, 0.08, 0.7]} />
        <meshStandardMaterial color="#2a3344" roughness={0.7} />
      </mesh>
      <mesh position={[0, 0.72, 1.02]}>
        <boxGeometry args={[0.9, 0.28, 0.04]} />
        <meshStandardMaterial color={cor} emissive={cor} emissiveIntensity={0.35} roughness={0.4} />
      </mesh>
      {[-0.7, 0.7].map((x) => (
        <mesh key={x} castShadow position={[x, 0.42, 0.48]}>
          <boxGeometry args={[0.08, 0.55, 0.08]} />
          <meshStandardMaterial color="#4a4038" roughness={0.8} />
        </mesh>
      ))}
    </group>
  );
}

/* ============================================================
   Mineradora — poços, esteira e caminhão basculante
   ============================================================ */

export function Mineradora({ rodando, noite = false }: { rodando: boolean; noite?: boolean }) {
  const caminhao = useRef<THREE.Group>(null);
  const particulas = useRef<THREE.InstancedMesh>(null);
  const tempo = useRef(0);
  const cicloRef = useRef(0);
  const cargaRef = useRef(0.2);
  const COUNT = 18;
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const percurso = useMemo(() => criarPercursoCaminhao(), []);
  const pistaGeo = useMemo(() => geometriaFita(percurso, 0.95, 0.01, 72), [percurso]);

  useLayoutEffect(() => {
    if (caminhao.current) posicionarNaCurva(caminhao.current, percurso, 0, 0);
  }, [percurso]);

  useFrame((_, delta) => {
    if (!rodando) return;
    tempo.current += delta;
    const c = (tempo.current * 0.055) % 1;
    cicloRef.current = c;

    if (c < 0.16) cargaRef.current = Math.min(1, c / 0.16);
    else if (c < 0.38) cargaRef.current = 1;
    else if (c < 0.5) cargaRef.current = Math.max(0.04, 1 - (c - 0.38) / 0.12);
    else cargaRef.current = 0.05;

    if (caminhao.current) posicionarNaCurva(caminhao.current, percurso, c, 0);

    if (particulas.current) {
      for (let i = 0; i < COUNT; i++) {
        const fase = (tempo.current * 0.9 + i * 0.17) % 1;
        dummy.position.set(1.2 + fase * 2.8, 0.55 + Math.sin(fase * Math.PI) * 0.35, (i % 3 - 1) * 0.12);
        dummy.scale.setScalar(0.04 + (i % 4) * 0.015);
        dummy.updateMatrix();
        particulas.current.setMatrixAt(i, dummy.matrix);
      }
      particulas.current.instanceMatrix.needsUpdate = true;
    }
  });

  return (
    <group>
      <mesh geometry={pistaGeo} receiveShadow>
        <meshStandardMaterial color="#5c4c3a" roughness={1} side={THREE.DoubleSide} />
      </mesh>

      {/* Montanha em degraus, como uma mina a céu aberto */}
      {[
        { r: 2.6, h: 0.5, y: 0.25 },
        { r: 1.9, h: 0.5, y: 0.75 },
        { r: 1.2, h: 0.5, y: 1.25 },
      ].map((n, i) => (
        <mesh key={i} castShadow receiveShadow position={[0, n.y, 0]}>
          <cylinderGeometry args={[n.r - 0.35, n.r, n.h, 10]} />
          <meshStandardMaterial color={i === 2 ? '#5a4632' : '#4a3a2a'} roughness={1} flatShading />
        </mesh>
      ))}

      {/* Dois poços de extração */}
      {[[-0.5, 1.52, 0.3], [0.55, 1.52, -0.35]].map((p, i) => (
        <mesh key={i} position={p as [number, number, number]} rotation={[-Math.PI / 2, 0, 0]}>
          <circleGeometry args={[0.3, 16]} />
          <meshStandardMaterial color="#15100a" roughness={1} />
        </mesh>
      ))}

      {/* Esteira transportadora descendo da mina */}
      <mesh castShadow position={[1.7, 0.85, 0]} rotation={[0, 0, -0.5]}>
        <boxGeometry args={[3, 0.09, 0.5]} />
        <meshStandardMaterial color={PALETA.surface} roughness={0.6} metalness={0.3} />
      </mesh>

      {/* Grãos de minério descendo a esteira */}
      <instancedMesh ref={particulas} args={[undefined, undefined, COUNT]}>
        <sphereGeometry args={[1, 5, 5]} />
        <meshStandardMaterial color="#5a3520" roughness={1} emissive="#3a2010" emissiveIntensity={noite ? 0.8 : 0.2} />
      </instancedMesh>

      {/* Escavadeira Volvo — cava e despeja na caçamba */}
      <group position={[-1.55, 0, 1.2]} rotation={[0, -Math.PI / 2, 0]}>
        <EscavadeiraVolvo rodando={rodando} cicloRef={cicloRef} />
      </group>

      {/* Barracão de operação */}
      <mesh castShadow position={[-2.2, 0.28, 1.5]}>
        <boxGeometry args={[1.2, 0.56, 0.9]} />
        <meshStandardMaterial color={PALETA.card} roughness={0.85} />
      </mesh>
      <mesh castShadow position={[-2.2, 0.62, 1.5]}>
        <boxGeometry args={[1.25, 0.12, 0.95]} />
        <meshStandardMaterial color="#3a3028" roughness={0.9} />
      </mesh>

      {/* CAT 793 — loop: Volvo carrega, curva até a logística, volta sem meia-volta */}
      <group ref={caminhao}>
        <CaminhaoCAT cargaRef={cargaRef} cicloRef={cicloRef} />
      </group>
    </group>
  );
}

/* ============================================================
   Porto — água, cais, guindaste e navio
   ============================================================ */

export function Porto({ rodando, noite = false }: { rodando: boolean; noite?: boolean }) {
  const lanca = useRef<THREE.Group>(null);
  const gancho = useRef<THREE.Group>(null);
  const cabo = useRef<THREE.Mesh>(null);
  const caixa = useRef<THREE.Mesh>(null);
  const navio = useRef<THREE.Group>(null);
  const agua = useRef<THREE.Mesh>(null);
  const esteira = useRef<THREE.Group>(null);
  const tempo = useRef(0);

  useFrame((_, delta) => {
    if (!rodando) return;
    tempo.current += delta;
    const c = (tempo.current * 0.14) % 1;

    if (lanca.current) {
      const sobreNavio = c > 0.38 && c < 0.78;
      const alvo = sobreNavio ? 0.18 : -0.08;
      lanca.current.rotation.y += (alvo - lanca.current.rotation.y) * 0.08;
    }

    let queda = 0.55;
    if (c < 0.22) queda = 0.45 + (c / 0.22) * 1.05;
    else if (c < 0.4) queda = 1.5 - ((c - 0.22) / 0.18) * 1.0;
    else if (c < 0.55) queda = 0.5;
    else if (c < 0.72) queda = 0.5 + ((c - 0.55) / 0.17) * 1.05;
    else queda = 1.55 - ((c - 0.72) / 0.28) * 1.05;

    if (gancho.current) gancho.current.position.y = -queda;
    if (cabo.current) {
      cabo.current.scale.y = Math.max(0.2, queda / 0.8);
      cabo.current.position.y = queda / 2;
    }
    if (caixa.current) caixa.current.visible = c < 0.7 || c > 0.94;

    if (navio.current) {
      navio.current.position.y = 0.08 + Math.sin(tempo.current * 1.1) * 0.02;
    }
    if (agua.current) {
      const mat = agua.current.material as THREE.MeshStandardMaterial;
      mat.opacity = 0.75 + Math.sin(tempo.current * 0.8) * 0.05;
    }
    if (esteira.current) {
      esteira.current.position.x = Math.sin(tempo.current * 1.4) * 0.08;
    }
  });

  return (
    <group>
      {/* Lâmina d'água — começa na face do cais */}
      <mesh ref={agua} rotation={[-Math.PI / 2, 0, 0]} position={[1.35, 0.03, 0]}>
        <planeGeometry args={[4.4, 6.6]} />
        <meshStandardMaterial color="#1a6a82" roughness={0.18} metalness={0.55} transparent opacity={0.82} />
      </mesh>

      {/* Cais de concreto */}
      <mesh castShadow receiveShadow position={[-1.9, 0.18, 0]}>
        <boxGeometry args={[2.4, 0.36, 6.4]} />
        <meshStandardMaterial color="#4b5058" roughness={0.9} />
      </mesh>

      {/* Esteira do cais — fica no píer, não no vão da água */}
      <group ref={esteira} position={[-1.55, 0.4, -1.6]}>
        {Array.from({ length: 6 }, (_, i) => (
          <mesh key={i} castShadow position={[i * 0.45, 0, 0]}>
            <boxGeometry args={[0.4, 0.06, 0.55]} />
            <meshStandardMaterial color="#3a4048" roughness={0.7} metalness={0.3} />
          </mesh>
        ))}
        <mesh position={[2.5, 0.12, 0]}>
          <boxGeometry args={[0.5, 0.04, 0.5]} />
          <meshStandardMaterial color="#4a2f22" roughness={1} />
        </mesh>
      </group>

      {/* Tanques de armazenamento */}
      {[[-2.8, -2], [-2.8, 1.5]].map(([x, z], i) => (
        <group key={i} position={[x, 0, z]}>
          <mesh castShadow position={[0, 0.35, 0]}>
            <cylinderGeometry args={[0.35, 0.4, 0.7, 10]} />
            <meshStandardMaterial color="#6a7078" roughness={0.5} metalness={0.6} />
          </mesh>
          <mesh position={[0, 0.72, 0]}>
            <sphereGeometry args={[0.08, 8, 8]} />
            <meshStandardMaterial color={PALETA.glow} emissive={PALETA.glow} emissiveIntensity={1.5} toneMapped={false} />
          </mesh>
        </group>
      ))}

      {/* Farol */}
      <group position={[3.2, 0, 2.8]}>
        <mesh castShadow position={[0, 0.5, 0]}>
          <cylinderGeometry args={[0.12, 0.16, 1, 8]} />
          <meshStandardMaterial color="#e8e4dd" roughness={0.8} />
        </mesh>
        <mesh position={[0, 1.05, 0]}>
          <sphereGeometry args={[0.14, 10, 10]} />
          <meshStandardMaterial
            color="#fff8dc"
            emissive="#ffe080"
            emissiveIntensity={noite ? 4 : 1.5}
            toneMapped={false}
          />
        </mesh>
        {noite && <pointLight position={[0, 1.05, 0]} color="#ffe080" intensity={1.2} distance={8} decay={2} />}
      </group>

      {/* Guindaste no bordo do cais, lança sobre o convés */}
      <group position={[-1.35, 0.36, 0.2]}>
        <mesh castShadow>
          <boxGeometry args={[0.7, 0.18, 0.7]} />
          <meshStandardMaterial color={PALETA.surface} roughness={0.6} />
        </mesh>
        <mesh castShadow position={[0, 1.1, 0]}>
          <cylinderGeometry args={[0.11, 0.13, 2.1, 8]} />
          <meshStandardMaterial color={PALETA.glow} roughness={0.45} metalness={0.5} />
        </mesh>
        {noite && (
          <pointLight position={[0, 2.2, 0.5]} color={PALETA.glow} intensity={2.2} distance={6} decay={2} />
        )}
        <group ref={lanca} position={[0, 2.1, 0]}>
          <mesh castShadow position={[0.95, 0, 0]}>
            <boxGeometry args={[1.9, 0.12, 0.16]} />
            <meshStandardMaterial color={PALETA.glow} roughness={0.45} metalness={0.5} />
          </mesh>
          <group ref={gancho} position={[1.72, 0, 0]}>
            <mesh ref={cabo} position={[0, -0.4, 0]}>
              <cylinderGeometry args={[0.015, 0.015, 0.8, 4]} />
              <meshStandardMaterial color="#8a8f98" />
            </mesh>
            <mesh castShadow position={[0, 0, 0]}>
              <boxGeometry args={[0.22, 0.16, 0.22]} />
              <meshStandardMaterial color={PALETA.warning} roughness={0.5} />
            </mesh>
            <mesh ref={caixa} castShadow position={[0, -0.22, 0]}>
              <boxGeometry args={[0.42, 0.26, 0.38]} />
              <meshStandardMaterial color="#e85d04" roughness={0.65} />
            </mesh>
          </group>
        </group>
      </group>

      {/* Navio colado no cais — casco encosta na face leste do píer */}
      <group ref={navio} position={[0.22, 0.08, 0.2]}>
        <PortaConteineres />
      </group>
    </group>
  );
}

/* ============================================================
   Aeroporto — pista, balizamento e aeronave
   ============================================================ */

export function Aeroporto({ rodando, noite = false }: { rodando: boolean; noite?: boolean }) {
  const aviao = useRef<THREE.Group>(null);
  const radar = useRef<THREE.Mesh>(null);
  const tempo = useRef(0);
  const cicloRef = useRef(0);

  useFrame((_, delta) => {
    if (radar.current) radar.current.rotation.y += delta * 1.2;
    if (!rodando || !aviao.current) return;
    tempo.current += delta;
    const c = (tempo.current * 0.075) % 1;
    cicloRef.current = c;
    const a = aviao.current;

    if (c < 0.4) {
      const t = c / 0.4;
      a.position.set(0, 0.32, -3.1 + t * 5.4);
      a.rotation.set(0, 0, 0);
    } else if (c < 0.58) {
      a.position.set(0, 0.32, 2.3);
      a.rotation.set(0, 0, 0);
    } else {
      const t = (c - 0.58) / 0.42;
      a.position.set(0, 0.32, 2.3 - t * 5.4);
      a.rotation.set(0, Math.PI, 0);
    }
  });

  return (
    <group>
      {/* Pista */}
      <mesh receiveShadow rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]}>
        <planeGeometry args={[2.2, 8]} />
        <meshStandardMaterial color="#22262c" roughness={0.95} />
      </mesh>

      {/* Faixa central tracejada */}
      {Array.from({ length: 9 }, (_, i) => (
        <mesh key={i} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.03, -3.6 + i * 0.9]}>
          <planeGeometry args={[0.12, 0.5]} />
          <meshStandardMaterial color="#c8ccd2" roughness={0.8} />
        </mesh>
      ))}

      {/* Balizamento em LED nas bordas */}
      {Array.from({ length: 8 }, (_, i) =>
        [-1.25, 1.25].map((x) => (
          <mesh key={`${i}-${x}`} position={[x, 0.08, -3.4 + i * 1]}>
            <sphereGeometry args={[0.055, 6, 6]} />
            <meshStandardMaterial
              color={PALETA.purple}
              emissive={PALETA.purple}
              emissiveIntensity={noite ? 4.2 : 2.4}
              toneMapped={false}
            />
          </mesh>
        ))
      )}

      {noite && (
        <pointLight position={[0, 1.5, 0]} color={PALETA.purple} intensity={1.8} distance={8} decay={2} />
      )}

      {/* Terminal de carga */}
      <mesh castShadow position={[2.1, 0.4, 1.4]}>
        <boxGeometry args={[1.7, 0.8, 2.4]} />
        <meshStandardMaterial color={PALETA.card} roughness={0.75} />
      </mesh>
      <mesh castShadow position={[2.1, 0.95, 1.4]}>
        <boxGeometry args={[1.8, 0.3, 2.5]} />
        <meshStandardMaterial color={PALETA.surface} roughness={0.6} />
      </mesh>

      {/* Torre de controle */}
      <group position={[-2.2, 0, 2.2]}>
        <mesh castShadow position={[0, 0.55, 0]}>
          <boxGeometry args={[0.5, 1.1, 0.5]} />
          <meshStandardMaterial color={PALETA.card} roughness={0.75} />
        </mesh>
        <mesh castShadow position={[0, 1.25, 0]}>
          <boxGeometry args={[0.65, 0.35, 0.65]} />
          <meshStandardMaterial
            color={PALETA.dark}
            emissive={PALETA.purple}
            emissiveIntensity={noite ? 0.8 : 0.2}
            roughness={0.4}
          />
        </mesh>
        {/* Radar */}
        <mesh ref={radar} position={[0, 1.55, 0]} rotation={[0.3, 0, 0]}>
          <boxGeometry args={[0.5, 0.04, 0.08]} />
          <meshStandardMaterial color="#aaa" roughness={0.4} metalness={0.7} />
        </mesh>
      </group>

      {/* Hangar */}
      <mesh castShadow position={[-1.8, 0.35, -2.5]}>
        <boxGeometry args={[2.2, 0.7, 1.8]} />
        <meshStandardMaterial color={PALETA.surface} roughness={0.8} />
      </mesh>
      <mesh castShadow position={[-1.8, 0.78, -2.5]}>
        <boxGeometry args={[2.3, 0.08, 1.9]} />
        <meshStandardMaterial color="#3a4048" roughness={0.85} />
      </mesh>

      {/* C-5 — taxi, rampa e volta na pista */}
      <group ref={aviao} position={[0, 0.32, -3.1]}>
        <AviaoC5 cicloRef={cicloRef} />
      </group>
    </group>
  );
}

/* ============================================================
   Central de Controle — Arduino, gateway e telas
   ============================================================ */

export function Controle({
  rodando,
  noite = false,
  onPov,
}: {
  rodando: boolean;
  noite?: boolean;
  onPov?: (id: string) => void;
}) {
  const leds = useRef<THREE.Group>(null);
  const tempo = useRef(0);

  useFrame((_, delta) => {
    if (!rodando || !leds.current) return;
    tempo.current += delta;
    leds.current.children.forEach((led, i) => {
      const mesh = led as THREE.Mesh;
      const mat = mesh.material as THREE.MeshStandardMaterial;
      mat.emissiveIntensity = 0.6 + Math.max(0, Math.sin(tempo.current * 3 - i * 0.9)) * 3;
    });
  });

  return (
    <group>
      <mesh castShadow receiveShadow position={[0, 0.3, 0]}>
        <boxGeometry args={[4.6, 0.6, 2.5]} />
        <meshStandardMaterial color="#2a3344" roughness={0.75} />
      </mesh>
      <mesh receiveShadow position={[0, 0.62, 0.15]}>
        <boxGeometry args={[4.5, 0.04, 2.2]} />
        <meshStandardMaterial color="#3d4658" roughness={0.7} />
      </mesh>

      <MesaControle onEscolher={onPov} />

      <mesh castShadow position={[-1.55, 0.68, 0.7]}>
        <boxGeometry args={[0.95, 0.07, 0.55]} />
        <meshStandardMaterial color="#0f6b5c" roughness={0.6} />
      </mesh>
      <group ref={leds} position={[-1.55, 0.76, 0.7]}>
        {[-0.28, -0.1, 0.08, 0.26].map((x, i) => (
          <mesh key={x} position={[x, 0, 0.18]}>
            <sphereGeometry args={[0.05, 8, 8]} />
            <meshStandardMaterial
              color={[PALETA.glow, PALETA.accent, PALETA.warning, PALETA.danger][i]}
              emissive={[PALETA.glow, PALETA.accent, PALETA.warning, PALETA.danger][i]}
              emissiveIntensity={1}
              toneMapped={false}
            />
          </mesh>
        ))}
      </group>

      {noite && (
        <pointLight position={[0, 1.2, 0]} color={PALETA.accent} intensity={1.5} distance={5} decay={2} />
      )}

      {[-0.25, 0.05, 0.35].map((x, i) => (
        <mesh key={x} castShadow position={[x, 0.68, 0.85]}>
          <cylinderGeometry args={[0.09, 0.09, 0.07, 12]} />
          <meshStandardMaterial color={[PALETA.glow, PALETA.warning, PALETA.danger][i]} roughness={0.5} />
        </mesh>
      ))}
    </group>
  );
}

