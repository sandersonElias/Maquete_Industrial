import { useRef, useMemo, useLayoutEffect, useState, useEffect, ReactNode } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';
import { PALETA } from './modulos';
import { criarTracado, curvaParalela, matrizesDormentes, posicionarNaCurva, tracadoComDesvio, criarRamoVisual, ramoAtivo } from './geometria';
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
        <meshStandardMaterial color="#2a2118" roughness={0.9} metalness={0} />
      </mesh>
      {/* Superfície: verde de paisagismo bem dessaturado */}
      <mesh receiveShadow rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.005, 0]}>
        <planeGeometry args={[29.4, 21.4]} />
        <meshStandardMaterial color="#1d2a20" roughness={1} />
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
  const dormentesRef = useRef<THREE.InstancedMesh>(null);

  const principal = useMemo(() => criarTracado(), []);
  const curva = useMemo(() => tracadoComDesvio(principal, desvios), [principal, desvios]);
  const ramo = ramoAtivo(desvios);
  const ramoPorto = useMemo(() => criarRamoVisual(principal, 'porto'), [principal]);
  const ramoAero = useMemo(() => criarRamoVisual(principal, 'aeroporto'), [principal]);
  const trilhoEsq = useMemo(() => curvaParalela(curva, 0.42), [curva]);
  const trilhoDir = useMemo(() => curvaParalela(curva, -0.42), [curva]);
  const matrizes = useMemo(() => matrizesDormentes(curva, 96), [curva]);

  useLayoutEffect(() => {
    if (!dormentesRef.current) return;
    matrizes.forEach((m, i) => dormentesRef.current!.setMatrixAt(i, m));
    dormentesRef.current.instanceMatrix.needsUpdate = true;
  }, [matrizes]);

  useLayoutEffect(() => {
    if (trem.current) posicionarNaCurva(trem.current, curva, 0, 0.16);
  }, [curva]);

  useFrame((_, delta) => {
    if (rodando) progresso.current += delta * 0.035 * velocidade;

    if (trem.current) posicionarNaCurva(trem.current, curva, progresso.current, 0.16);
    vagoes.current.forEach((v, i) => {
      if (v) posicionarNaCurva(v, curva, progresso.current - 0.016 * (i + 1), 0.15);
    });
  });

  const desenharRamo = (ramoCurva: THREE.CatmullRomCurve3, ativo: boolean, cor: string) => (
    <group>
      <mesh position={[0, 0.008, 0]}>
        <tubeGeometry args={[ramoCurva, 48, 0.55, 4, false]} />
        <meshStandardMaterial color="#2a2824" roughness={1} transparent opacity={ativo ? 1 : 0.35} />
      </mesh>
      {[curvaParalela(ramoCurva, 0.38), curvaParalela(ramoCurva, -0.38)].map((trilho, i) => (
        <mesh key={i} position={[0, 0.05, 0]}>
          <tubeGeometry args={[trilho, 64, 0.04, 6, false]} />
          <meshStandardMaterial
            color={ativo ? cor : '#6a7078'}
            roughness={0.35}
            metalness={0.85}
            transparent
            opacity={ativo ? 1 : 0.4}
          />
        </mesh>
      ))}
    </group>
  );

  return (
    <group>
      {/* Leito de brita */}
      <mesh position={[0, 0.01, 0]}>
        <tubeGeometry args={[curva, 160, 0.75, 4, true]} />
        <meshStandardMaterial color="#3a3630" roughness={1} />
      </mesh>

      {/* Ramos secundários sempre visíveis — brilham quando ativos */}
      {desenharRamo(ramoPorto, ramo === 'porto', PALETA.glow)}
      {desenharRamo(ramoAero, ramo === 'aeroporto', PALETA.purple)}

      {/* Dormentes instanciados — 96 peças, uma chamada de desenho */}
      <instancedMesh ref={dormentesRef} args={[undefined, undefined, matrizes.length]} castShadow>
        <boxGeometry args={[1.1, 0.06, 0.16]} />
        <meshStandardMaterial color="#4a3b2a" roughness={0.95} />
      </instancedMesh>

      {/* Os dois trilhos */}
      {[trilhoEsq, trilhoDir].map((trilho, i) => (
        <mesh key={i} position={[0, 0.06, 0]}>
          <tubeGeometry args={[trilho, 200, 0.045, 6, true]} />
          <meshStandardMaterial color="#9aa5b1" roughness={0.35} metalness={0.85} />
        </mesh>
      ))}

      {/* 4 desvios (servos SG90) — a cor indica o estado atual */}
      {desvios.map((estado, i) => {
        const t = 0.08 + i * 0.25;
        const p = curva.getPointAt(t);
        const cor = estado === 0 ? PALETA.accent : estado === 1 ? PALETA.purple : PALETA.warning;
        return (
          <group key={i} position={[p.x, 0.1, p.z]}>
            <mesh castShadow>
              <boxGeometry args={[0.34, 0.2, 0.34]} />
              <meshStandardMaterial color={PALETA.surface} roughness={0.6} />
            </mesh>
            <mesh position={[0, 0.22, 0]}>
              <sphereGeometry args={[0.11, 12, 12]} />
              <meshStandardMaterial color={cor} emissive={cor} emissiveIntensity={2.2} toneMapped={false} />
            </mesh>
          </group>
        );
      })}

      {/* Estação de carga / silo junto aos trilhos */}
      <group position={[-3.2, 0, -1.8]}>
        <mesh castShadow position={[0, 0.45, 0]}>
          <cylinderGeometry args={[0.55, 0.65, 0.9, 8]} />
          <meshStandardMaterial color="#5a5048" roughness={0.85} />
        </mesh>
        <mesh castShadow position={[0, 1.05, 0]}>
          <coneGeometry args={[0.7, 0.5, 8]} />
          <meshStandardMaterial color={PALETA.surface} roughness={0.7} />
        </mesh>
        <mesh position={[0.55, 0.25, 0]} rotation={[0, 0, -0.4]}>
          <boxGeometry args={[0.8, 0.06, 0.25]} />
          <meshStandardMaterial color="#6a6058" roughness={0.9} />
        </mesh>
      </group>

      {/* Semáforo ferroviário */}
      <group position={[2.8, 0, -3.2]}>
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

      {/* Locomotiva MRS */}
      <group ref={trem}>
        <LocoMRS />
      </group>

      {/* Vagões basculantes carregados de minério */}
      {[0, 1, 2].map((i) => (
        <group key={i} ref={(el) => { vagoes.current[i] = el; }}>
          <VagaoMinerio />
        </group>
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

  useFrame((_, delta) => {
    if (!rodando) return;
    tempo.current += delta;
    const c = (tempo.current * 0.1) % 1;
    cicloRef.current = c;

    if (c < 0.28) cargaRef.current = Math.min(1, c / 0.28);
    else if (c < 0.48) cargaRef.current = 1;
    else if (c < 0.62) cargaRef.current = Math.max(0.04, 1 - (c - 0.48) / 0.14);
    else cargaRef.current = 0.05;

    if (caminhao.current) {
      const pit = { x: -1.35, z: -0.48 };
      const logistica = { x: 2.35, z: 2.05 };
      let t = 0;
      if (c < 0.28) t = 0;
      else if (c < 0.48) t = (c - 0.28) / 0.2;
      else if (c < 0.62) t = 1;
      else t = 1 - (c - 0.62) / 0.38;

      caminhao.current.position.x = pit.x + (logistica.x - pit.x) * t;
      caminhao.current.position.z = pit.z + (logistica.z - pit.z) * t;

      const indo = c >= 0.28 && c < 0.62;
      const dx = logistica.x - pit.x;
      const dz = logistica.z - pit.z;
      caminhao.current.rotation.y = indo ? Math.atan2(dx, dz) : Math.atan2(-dx, -dz);
    }

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
      <group position={[-1.85, 0, -1.15]} rotation={[0, 0.85, 0]}>
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

      {/* CAT 793 — poço → área logística (em direção aos trilhos) */}
      <group ref={caminhao} position={[-1.35, 0, -0.48]}>
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
      const alvo = sobreNavio ? 0.72 : 0.08;
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
      navio.current.position.y = Math.sin(tempo.current * 1.1) * 0.04;
      navio.current.rotation.z = Math.sin(tempo.current * 0.9) * 0.02;
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
      {/* Lâmina d'água */}
      <mesh ref={agua} rotation={[-Math.PI / 2, 0, 0]} position={[1.6, 0.03, 0]}>
        <planeGeometry args={[6.5, 7]} />
        <meshStandardMaterial color="#0d3b4a" roughness={0.15} metalness={0.6} transparent opacity={0.8} />
      </mesh>

      {/* Cais de concreto */}
      <mesh castShadow receiveShadow position={[-1.9, 0.18, 0]}>
        <boxGeometry args={[2.4, 0.36, 6.4]} />
        <meshStandardMaterial color="#4b5058" roughness={0.9} />
      </mesh>

      {/* Esteira do cais — minério do trem ao navio */}
      <group ref={esteira} position={[-0.4, 0.22, -0.5]}>
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

      {/* Guindaste */}
      <group position={[-1.6, 0.36, 1.2]}>
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
          <mesh castShadow position={[1.1, 0, 0]}>
            <boxGeometry args={[2.4, 0.12, 0.16]} />
            <meshStandardMaterial color={PALETA.glow} roughness={0.45} metalness={0.5} />
          </mesh>
          <group ref={gancho} position={[2, 0, 0]}>
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

      {/* Navio atracado */}
      <group ref={navio} position={[1.9, 0.12, -0.35]} rotation={[0, 0, 0]}>
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

    if (c < 0.18) {
      const t = c / 0.18;
      a.position.set(0, 0.28, -3.2 + t * 4.6);
      a.rotation.set(0, 0, 0);
    } else if (c < 0.36) {
      a.position.set(0, 0.28, 1.4);
      a.rotation.set(0, 0, 0);
    } else if (c < 0.48) {
      const t = (c - 0.36) / 0.12;
      a.position.set(0, 0.28, 1.4 - t * 2.2);
      a.rotation.set(0, 0, 0);
    } else if (c < 0.78) {
      const t = (c - 0.48) / 0.3;
      a.position.set(0, 0.28 + t * t * 6.5, -0.8 + t * 8);
      a.rotation.set(-0.28 * t, 0, 0);
    } else {
      const t = (c - 0.78) / 0.22;
      a.position.set(0, 5.5 * (1 - t), -6 + t * 2.8);
      a.rotation.set(-0.18 * (1 - t), 0, 0);
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

      {/* Aeronave estacionada no hangar */}
      <group position={[-1.8, 0.18, -2.5]} rotation={[0, Math.PI / 2, 0]}>
        <mesh castShadow>
          <capsuleGeometry args={[0.12, 0.9, 4, 8]} />
          <meshStandardMaterial color="#c8ccd2" roughness={0.5} metalness={0.3} />
        </mesh>
        <mesh castShadow position={[0, -0.02, 0]} rotation={[0, 0, Math.PI / 2]}>
          <boxGeometry args={[0.06, 1.6, 0.35]} />
          <meshStandardMaterial color="#b0b4ba" roughness={0.5} />
        </mesh>
      </group>

      {/* C-5 — taxi, rampa, decolagem e aproximação */}
      <group ref={aviao} position={[0, 0.28, -3.2]}>
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
  const [lcdLinha, setLcdLinha] = useState('SW1:CENTER TRK:OK');

  useFrame((_, delta) => {
    if (!rodando || !leds.current) return;
    tempo.current += delta;
    leds.current.children.forEach((led, i) => {
      const mesh = led as THREE.Mesh;
      const mat = mesh.material as THREE.MeshStandardMaterial;
      mat.emissiveIntensity = 0.6 + Math.max(0, Math.sin(tempo.current * 3 - i * 0.9)) * 3;
    });
  });

  useEffect(() => {
    if (!rodando) return;
    const msgs = [
      'SW1:CENTER TRK:OK',
      'GW:ONLINE BT:9600',
      'TRK:3 WGN LD:78%',
      'API:WS CONNECTED',
    ];
    let i = 0;
    const id = window.setInterval(() => {
      i = (i + 1) % msgs.length;
      setLcdLinha(msgs[i]);
    }, 2200);
    return () => window.clearInterval(id);
  }, [rodando]);

  return (
    <group>
      {/* Bancada */}
      <mesh castShadow receiveShadow position={[0, 0.3, 0]}>
        <boxGeometry args={[4.4, 0.6, 2.4]} />
        <meshStandardMaterial color={PALETA.card} roughness={0.8} />
      </mesh>

      <MesaControle onEscolher={onPov} />

      {/* Placa Arduino Mega */}
      <mesh castShadow position={[-1.2, 0.64, 0.2]}>
        <boxGeometry args={[1.1, 0.08, 0.75]} />
        <meshStandardMaterial color="#0f6b5c" roughness={0.6} />
      </mesh>

      {/* LEDs de status do gateway */}
      <group ref={leds} position={[-1.2, 0.72, 0.2]}>
        {[-0.32, -0.1, 0.12, 0.34].map((x, i) => (
          <mesh key={x} position={[x, 0, 0.2]}>
            <sphereGeometry args={[0.055, 8, 8]} />
            <meshStandardMaterial
              color={[PALETA.glow, PALETA.accent, PALETA.warning, PALETA.danger][i]}
              emissive={[PALETA.glow, PALETA.accent, PALETA.warning, PALETA.danger][i]}
              emissiveIntensity={1}
              toneMapped={false}
            />
          </mesh>
        ))}
      </group>

      {/* Display LCD 16x2 */}
      <mesh castShadow position={[0.3, 0.75, 0]} rotation={[-0.35, 0, 0]}>
        <boxGeometry args={[1, 0.5, 0.06]} />
        <meshStandardMaterial
          color="#0a3d2e"
          emissive={PALETA.glow}
          emissiveIntensity={0.55}
          roughness={0.4}
        />
      </mesh>
      <Html position={[0.3, 0.88, 0.08]} transform distanceFactor={8} zIndexRange={[8, 0]}>
        <span className="maquete3d-lcd">{lcdLinha}</span>
      </Html>

      {/* Gateway Node.js (Raspberry) */}
      <mesh castShadow position={[-0.5, 0.64, -0.35]}>
        <boxGeometry args={[0.55, 0.12, 0.85]} />
        <meshStandardMaterial color="#2a2a2a" roughness={0.7} />
      </mesh>
      <mesh position={[-0.5, 0.72, -0.05]}>
        <sphereGeometry args={[0.04, 6, 6]} />
        <meshStandardMaterial color={PALETA.glow} emissive={PALETA.glow} emissiveIntensity={2} toneMapped={false} />
      </mesh>

      {/* Módulo HC-05 Bluetooth */}
      <mesh castShadow position={[0.85, 0.64, 0.35]}>
        <boxGeometry args={[0.35, 0.06, 0.5]} />
        <meshStandardMaterial color="#1565c0" roughness={0.5} />
      </mesh>
      <Html position={[0.85, 0.78, 0.35]} transform distanceFactor={10}>
        <span className="maquete3d-hc05">HC-05</span>
      </Html>

      {/* Smartphone do app */}
      <group position={[1.1, 0.62, 0.55]} rotation={[-0.5, -0.3, 0]}>
        <mesh castShadow>
          <boxGeometry args={[0.22, 0.42, 0.04]} />
          <meshStandardMaterial color="#111" roughness={0.4} metalness={0.3} />
        </mesh>
        <mesh position={[0, 0, 0.025]}>
          <boxGeometry args={[0.18, 0.36, 0.01]} />
          <meshStandardMaterial
            color={PALETA.dark}
            emissive={PALETA.glow}
            emissiveIntensity={noite ? 1 : 0.5}
            roughness={0.3}
          />
        </mesh>
      </group>

      {/* Monitor do dashboard */}
      <mesh castShadow position={[1.6, 0.95, -0.3]} rotation={[-0.18, -0.4, 0]}>
        <boxGeometry args={[1.3, 0.85, 0.06]} />
        <meshStandardMaterial
          color={PALETA.dark}
          emissive={PALETA.accent}
          emissiveIntensity={noite ? 1.2 : 0.4}
          roughness={0.3}
        />
      </mesh>

      {noite && (
        <pointLight position={[0, 1.2, 0]} color={PALETA.accent} intensity={1.5} distance={5} decay={2} />
      )}

      {/* Botões físicos do painel */}
      {[-0.5, -0.2, 0.1].map((x, i) => (
        <mesh key={x} castShadow position={[x, 0.63, -0.75]}>
          <cylinderGeometry args={[0.1, 0.1, 0.08, 12]} />
          <meshStandardMaterial color={[PALETA.glow, PALETA.warning, PALETA.danger][i]} roughness={0.5} />
        </mesh>
      ))}
    </group>
  );
}
