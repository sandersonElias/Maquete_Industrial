import { useRef, ReactNode } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { PALETA, VITRINE } from './modulos';

/* ============================================================
   Wrapper interativo: destaca a zona no hover e na seleção
   ============================================================ */

interface ZonaProps {
  id: string;
  cor: string;
  selecionado: boolean;
  destacado: boolean;
  onSelecionar: (id: string) => void;
  onDestacar: (id: string | null) => void;
  position: [number, number, number];
  /** Tamanho da plataforma da zona [largura, profundidade] */
  tamanho: [number, number];
  children: ReactNode;
}

export function Zona({
  id,
  cor,
  selecionado,
  destacado,
  onSelecionar,
  onDestacar,
  position,
  tamanho,
  children,
}: ZonaProps) {
  const grupo = useRef<THREE.Group>(null);
  const borda = useRef<THREE.Mesh>(null);
  const ativo = selecionado || destacado;
  const [larg, prof] = tamanho;

  useFrame((_, delta) => {
    const k = Math.min(delta * 8, 1);
    if (grupo.current) {
      const alvoY = ativo ? 0.4 : 0;
      grupo.current.position.y += (alvoY - grupo.current.position.y) * k;
    }
    if (borda.current) {
      const mat = borda.current.material as THREE.MeshBasicMaterial;
      const alvo = selecionado ? 0.9 : destacado ? 0.45 : 0.16;
      mat.opacity += (alvo - mat.opacity) * k;
    }
  });

  return (
    <group position={position}>
      {/* Piso de concreto do lote, elevado sobre a grama */}
      <mesh
        position={[0, 0.06, 0]}
        receiveShadow
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
        <boxGeometry args={[larg, 0.12, prof]} />
        <meshStandardMaterial color="#575d66" roughness={0.92} metalness={0.05} />
      </mesh>

      {/* Fita de LED contornando o lote — acende ao passar o mouse ou selecionar */}
      <mesh ref={borda} position={[0, 0.13, 0]} rotation={[-Math.PI / 2, 0, 0]} raycast={() => null}>
        <ringGeometry args={[Math.min(larg, prof) / 2 - 0.18, Math.min(larg, prof) / 2 - 0.02, 4, 1]} />
        <meshBasicMaterial color={cor} transparent opacity={0.16} side={THREE.DoubleSide} />
      </mesh>

      {/* Moldura luminosa nas bordas do lote */}
      <lineSegments position={[0, 0.13, 0]} raycast={() => null}>
        <edgesGeometry args={[new THREE.BoxGeometry(larg, 0.001, prof)]} />
        <lineBasicMaterial color={cor} transparent opacity={0.55} />
      </lineSegments>

      <group ref={grupo}>{children}</group>
    </group>
  );
}

/* ============================================================
   Prédios — blocos brancos com grade de janelas acesas
   ============================================================ */

export function Predio({
  position,
  tamanho,
  cor = '#E8EAED',
  andares = 4,
}: {
  position: [number, number, number];
  tamanho: [number, number, number];
  cor?: string;
  andares?: number;
}) {
  const [l, a, p] = tamanho;

  return (
    <group position={position}>
      <mesh castShadow receiveShadow position={[0, a / 2, 0]}>
        <boxGeometry args={[l, a, p]} />
        <meshStandardMaterial color={cor} roughness={0.62} metalness={0.08} />
      </mesh>

      {/* Faixas de janelas nas quatro fachadas */}
      {Array.from({ length: andares }, (_, i) => {
        const y = (a / (andares + 1)) * (i + 1);
        return (
          <group key={i}>
            {([[0, p / 2 + 0.011, 0], [0, -p / 2 - 0.011, Math.PI]] as const).map(
              ([, z, rot], k) => (
                <mesh key={k} position={[0, y, z as number]} rotation={[0, rot as number, 0]}>
                  <planeGeometry args={[l * 0.82, a / (andares + 1) * 0.34]} />
                  <meshStandardMaterial
                    color="#9fd8f5"
                    emissive="#7cc4e8"
                    emissiveIntensity={0.85}
                    roughness={0.25}
                  />
                </mesh>
              )
            )}
            {([[l / 2 + 0.011, Math.PI / 2], [-l / 2 - 0.011, -Math.PI / 2]] as const).map(
              ([x, rot], k) => (
                <mesh key={`s${k}`} position={[x, y, 0]} rotation={[0, rot, 0]}>
                  <planeGeometry args={[p * 0.82, a / (andares + 1) * 0.34]} />
                  <meshStandardMaterial
                    color="#9fd8f5"
                    emissive="#7cc4e8"
                    emissiveIntensity={0.85}
                    roughness={0.25}
                  />
                </mesh>
              )
            )}
          </group>
        );
      })}

      {/* Laje com casa de máquinas */}
      <mesh castShadow position={[0, a + 0.09, 0]}>
        <boxGeometry args={[l * 0.42, 0.18, p * 0.42]} />
        <meshStandardMaterial color="#98a0aa" roughness={0.7} />
      </mesh>
    </group>
  );
}

/* ============================================================
   Planta industrial — chaminés e torres de destilação
   ============================================================ */

export function PlantaIndustrial({ position }: { position: [number, number, number] }) {
  const fumaca = useRef<THREE.Group>(null);

  useFrame((state) => {
    if (!fumaca.current) return;
    // Sopro leve saindo das chaminés
    fumaca.current.children.forEach((n, i) => {
      const m = n as THREE.Mesh;
      const t = (state.clock.elapsedTime * 0.35 + i * 0.4) % 1;
      m.position.y = 2.4 + t * 1.5;
      m.scale.setScalar(0.3 + t * 0.9);
      (m.material as THREE.MeshBasicMaterial).opacity = 0.22 * (1 - t);
    });
  });

  return (
    <group position={position}>
      {/* Chaminés listradas */}
      {[-0.55, 0.2, 0.95].map((x, i) => (
        <group key={x} position={[x, 0, 0]}>
          <mesh castShadow position={[0, 1.2 + i * 0.16, 0]}>
            <cylinderGeometry args={[0.12, 0.16, 2.4 + i * 0.32, 10]} />
            <meshStandardMaterial color="#e4e7eb" roughness={0.6} />
          </mesh>
          {/* Luz de obstáculo no topo */}
          <mesh position={[0, 2.42 + i * 0.32, 0]}>
            <sphereGeometry args={[0.06, 8, 8]} />
            <meshStandardMaterial
              color={VITRINE.vermelho}
              emissive={VITRINE.vermelho}
              emissiveIntensity={2.6}
              toneMapped={false}
            />
          </mesh>
        </group>
      ))}

      {/* Vapor */}
      <group ref={fumaca} position={[0.2, 0, 0]}>
        {[0, 1, 2].map((i) => (
          <mesh key={i} position={[0, 2.4, 0]} raycast={() => null}>
            <sphereGeometry args={[0.3, 8, 8]} />
            <meshBasicMaterial color="#cfe0ee" transparent opacity={0.2} depthWrite={false} />
          </mesh>
        ))}
      </group>

      {/* Torres de destilação */}
      {[[-1.5, 0.6], [1.9, -0.5]].map(([x, z], i) => (
        <mesh key={i} castShadow position={[x, 0.9, z]}>
          <cylinderGeometry args={[0.26, 0.3, 1.8, 12]} />
          <meshStandardMaterial color="#c4cad2" roughness={0.45} metalness={0.55} />
        </mesh>
      ))}

      {/* Pipe rack ligando as torres */}
      <mesh position={[0.2, 0.75, 0.05]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.05, 0.05, 3.4, 6]} />
        <meshStandardMaterial color="#8d959e" metalness={0.7} roughness={0.35} />
      </mesh>
      <mesh position={[0.2, 0.52, 0.05]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.04, 0.04, 3.4, 6]} />
        <meshStandardMaterial color="#7d858f" metalness={0.7} roughness={0.35} />
      </mesh>
    </group>
  );
}

/* ============================================================
   Central de Química — tanques, reatores e painel de processo
   ============================================================ */

export function CentralQuimica({ rodando }: { rodando: boolean }) {
  const liquidos = useRef<THREE.Group>(null);
  const tempo = useRef(0);

  useFrame((_, delta) => {
    if (!rodando || !liquidos.current) return;
    tempo.current += delta;
    // Nível dos tanques oscila, como um processo em andamento
    liquidos.current.children.forEach((filho, i) => {
      const m = filho as THREE.Mesh;
      const nivel = 0.55 + Math.sin(tempo.current * 0.7 + i * 1.3) * 0.22;
      m.scale.y = nivel;
      m.position.y = 0.42 * nivel;
    });
  });

  const tanques: Array<[number, number]> = [
    [-1.5, -1.1],
    [0, -1.1],
    [1.5, -1.1],
  ];

  return (
    <group>
      {/* Tanques de tratamento */}
      {tanques.map(([x, z], i) => (
        <group key={i} position={[x, 0, z]}>
          <mesh castShadow position={[0, 0.42, 0]}>
            <cylinderGeometry args={[0.5, 0.5, 0.84, 16, 1, true]} />
            <meshStandardMaterial
              color="#8f9aa8"
              roughness={0.35}
              metalness={0.7}
              side={THREE.DoubleSide}
              transparent
              opacity={0.55}
            />
          </mesh>
          <mesh position={[0, 0.86, 0]}>
            <cylinderGeometry args={[0.54, 0.54, 0.08, 16]} />
            <meshStandardMaterial color={PALETA.surface} roughness={0.5} metalness={0.5} />
          </mesh>
        </group>
      ))}

      {/* Líquido dentro dos tanques */}
      <group ref={liquidos}>
        {tanques.map(([x, z], i) => (
          <mesh key={i} position={[x, 0.23, z]}>
            <cylinderGeometry args={[0.44, 0.44, 0.84, 16]} />
            <meshStandardMaterial
              color={[PALETA.glow, PALETA.accent, PALETA.warning][i]}
              emissive={[PALETA.glow, PALETA.accent, PALETA.warning][i]}
              emissiveIntensity={0.5}
              roughness={0.2}
              transparent
              opacity={0.85}
            />
          </mesh>
        ))}
      </group>

      {/* Tubulação ligando os tanques */}
      <mesh position={[0, 0.94, -1.1]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.06, 0.06, 3.1, 8]} />
        <meshStandardMaterial color="#6c757d" metalness={0.7} roughness={0.35} />
      </mesh>

      {/* Painel de controle do processo */}
      <mesh castShadow position={[0, 0.35, 1.3]}>
        <boxGeometry args={[2.6, 0.7, 0.5]} />
        <meshStandardMaterial color={PALETA.card} roughness={0.75} />
      </mesh>
      <mesh position={[0, 0.55, 1.56]} rotation={[-0.25, 0, 0]}>
        <boxGeometry args={[1.1, 0.42, 0.04]} />
        <meshStandardMaterial
          color="#0a3d2e"
          emissive={PALETA.glow}
          emissiveIntensity={0.6}
          roughness={0.3}
        />
      </mesh>
      {[-0.9, 0.9].map((x) => (
        <mesh key={x} position={[x, 0.62, 1.4]}>
          <sphereGeometry args={[0.07, 8, 8]} />
          <meshStandardMaterial
            color={PALETA.glow}
            emissive={PALETA.glow}
            emissiveIntensity={2.2}
            toneMapped={false}
          />
        </mesh>
      ))}
    </group>
  );
}

/* ============================================================
   Mina — poços, esteira e caminhão basculante
   ============================================================ */

export function Mina({ rodando }: { rodando: boolean }) {
  const cacamba = useRef<THREE.Group>(null);
  const caminhao = useRef<THREE.Group>(null);
  const tempo = useRef(0);

  useFrame((_, delta) => {
    if (!rodando) return;
    tempo.current += delta;

    if (caminhao.current) {
      const ciclo = (Math.sin(tempo.current * 0.4) + 1) / 2;
      caminhao.current.position.x = -1.8 + ciclo * 3.4;
      caminhao.current.rotation.y = Math.cos(tempo.current * 0.4) > 0 ? Math.PI / 2 : -Math.PI / 2;
    }
    if (cacamba.current) {
      cacamba.current.rotation.x = -Math.max(0, Math.sin(tempo.current * 0.4)) * 0.7;
    }
  });

  return (
    <group>
      {/* Montanha em degraus — mina a céu aberto */}
      {[
        { r: 2.3, h: 0.45, y: 0.22 },
        { r: 1.7, h: 0.45, y: 0.67 },
        { r: 1.1, h: 0.45, y: 1.12 },
      ].map((n, i) => (
        <mesh key={i} castShadow receiveShadow position={[0, n.y, -0.7]}>
          <cylinderGeometry args={[n.r - 0.3, n.r, n.h, 10]} />
          <meshStandardMaterial color={i === 2 ? '#5a4632' : '#4a3a2a'} roughness={1} flatShading />
        </mesh>
      ))}

      {[[-0.45, 1.36, -0.4], [0.5, 1.36, -1.05]].map((p, i) => (
        <mesh key={i} position={p as [number, number, number]} rotation={[-Math.PI / 2, 0, 0]}>
          <circleGeometry args={[0.27, 16]} />
          <meshStandardMaterial color="#15100a" roughness={1} />
        </mesh>
      ))}

      {/* Esteira transportadora */}
      <mesh castShadow position={[1.6, 0.75, -0.7]} rotation={[0, 0, -0.5]}>
        <boxGeometry args={[2.6, 0.09, 0.45]} />
        <meshStandardMaterial color={PALETA.surface} roughness={0.6} metalness={0.3} />
      </mesh>

      {/* Caminhão basculante */}
      <group ref={caminhao} position={[0, 0, 1.6]} rotation={[0, Math.PI / 2, 0]}>
        <mesh castShadow position={[0, 0.22, 0.26]}>
          <boxGeometry args={[0.42, 0.28, 0.4]} />
          <meshStandardMaterial color={PALETA.warning} roughness={0.5} metalness={0.2} />
        </mesh>
        <group ref={cacamba} position={[0, 0.24, -0.17]}>
          <mesh castShadow position={[0, 0.06, -0.15]}>
            <boxGeometry args={[0.46, 0.22, 0.56]} />
            <meshStandardMaterial color="#c98a1a" roughness={0.6} />
          </mesh>
        </group>
        {[-0.13, 0.13].map((x) => (
          <mesh key={x} position={[x, 0.22, 0.47]}>
            <sphereGeometry args={[0.05, 8, 8]} />
            <meshStandardMaterial
              color="#fff8dc"
              emissive="#ffe9a0"
              emissiveIntensity={2.5}
              toneMapped={false}
            />
          </mesh>
        ))}
        {[-0.24, 0.24].map((x) =>
          [-0.26, 0.24].map((z) => (
            <mesh key={`${x}-${z}`} position={[x, 0.1, z]} rotation={[0, 0, Math.PI / 2]}>
              <cylinderGeometry args={[0.095, 0.095, 0.07, 10]} />
              <meshStandardMaterial color="#15181d" roughness={0.8} />
            </mesh>
          ))
        )}
      </group>
    </group>
  );
}

/* ============================================================
   Porto Logístico
   ============================================================ */

export function Porto({ rodando }: { rodando: boolean }) {
  const lanca = useRef<THREE.Group>(null);
  const navio = useRef<THREE.Group>(null);
  const tempo = useRef(0);

  useFrame((_, delta) => {
    if (!rodando) return;
    tempo.current += delta;
    if (lanca.current) lanca.current.rotation.y = Math.sin(tempo.current * 0.5) * 0.55;
    if (navio.current) {
      navio.current.position.y = Math.sin(tempo.current * 1.1) * 0.04;
      navio.current.rotation.z = Math.sin(tempo.current * 0.9) * 0.02;
    }
  });

  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[1.2, 0.04, 0]}>
        <planeGeometry args={[4.4, 6.4]} />
        <meshStandardMaterial
          color="#0d3b4a"
          roughness={0.15}
          metalness={0.6}
          transparent
          opacity={0.85}
        />
      </mesh>

      <mesh castShadow receiveShadow position={[-1.7, 0.16, 0]}>
        <boxGeometry args={[1.9, 0.32, 5.8]} />
        <meshStandardMaterial color="#4b5058" roughness={0.9} />
      </mesh>

      {/* Guindaste */}
      <group position={[-1.5, 0.32, 1.1]}>
        <mesh castShadow>
          <boxGeometry args={[0.6, 0.16, 0.6]} />
          <meshStandardMaterial color={PALETA.surface} roughness={0.6} />
        </mesh>
        <mesh castShadow position={[0, 0.95, 0]}>
          <cylinderGeometry args={[0.1, 0.12, 1.8, 8]} />
          <meshStandardMaterial color={PALETA.danger} roughness={0.45} metalness={0.5} />
        </mesh>
        <group ref={lanca} position={[0, 1.8, 0]}>
          <mesh castShadow position={[0.95, 0, 0]}>
            <boxGeometry args={[2, 0.11, 0.14]} />
            <meshStandardMaterial color={PALETA.danger} roughness={0.45} metalness={0.5} />
          </mesh>
          <mesh position={[1.7, -0.38, 0]}>
            <cylinderGeometry args={[0.014, 0.014, 0.72, 4]} />
            <meshStandardMaterial color="#8a8f98" />
          </mesh>
          <mesh castShadow position={[1.7, -0.8, 0]}>
            <boxGeometry args={[0.24, 0.18, 0.24]} />
            <meshStandardMaterial color={PALETA.warning} roughness={0.5} />
          </mesh>
        </group>
      </group>

      {/* Navio */}
      <group ref={navio} position={[1.5, 0.22, -0.3]}>
        <mesh castShadow>
          <boxGeometry args={[1.3, 0.4, 3.8]} />
          <meshStandardMaterial color="#8c2f3a" roughness={0.6} />
        </mesh>
        <mesh castShadow position={[0, 0.32, -1.1]}>
          <boxGeometry args={[0.95, 0.46, 0.9]} />
          <meshStandardMaterial color="#e8e4dd" roughness={0.7} />
        </mesh>
        {[0.55, 0.05, -0.45].map((z, i) => (
          <mesh key={z} castShadow position={[0, 0.32, z]}>
            <boxGeometry args={[0.95, 0.26, 0.45]} />
            <meshStandardMaterial color={[PALETA.accent, PALETA.warning, PALETA.glow][i]} roughness={0.7} />
          </mesh>
        ))}
        <mesh position={[0, 0.62, -1.1]}>
          <sphereGeometry args={[0.07, 8, 8]} />
          <meshStandardMaterial
            color={PALETA.danger}
            emissive={PALETA.danger}
            emissiveIntensity={3}
            toneMapped={false}
          />
        </mesh>
      </group>
    </group>
  );
}

/* ============================================================
   Aeroporto Logístico
   ============================================================ */

export function Aeroporto({ rodando }: { rodando: boolean }) {
  const aviao = useRef<THREE.Group>(null);
  const tempo = useRef(0);

  useFrame((_, delta) => {
    if (!rodando || !aviao.current) return;
    tempo.current += delta;
    const ciclo = (tempo.current * 0.16) % 1;
    aviao.current.position.z = -2.6 + ciclo * 5.2;
    aviao.current.position.y = ciclo > 0.72 ? 0.18 + (ciclo - 0.72) * 5 : 0.18;
    aviao.current.rotation.x = ciclo > 0.72 ? -0.22 : 0;
  });

  return (
    <group>
      <mesh receiveShadow rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.03, 0]}>
        <planeGeometry args={[1.9, 6.6]} />
        <meshStandardMaterial color="#22262c" roughness={0.95} />
      </mesh>

      {Array.from({ length: 8 }, (_, i) => (
        <mesh key={i} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.04, -2.9 + i * 0.82]}>
          <planeGeometry args={[0.1, 0.45]} />
          <meshStandardMaterial color="#c8ccd2" roughness={0.8} />
        </mesh>
      ))}

      {Array.from({ length: 7 }, (_, i) =>
        [-1.05, 1.05].map((x) => (
          <mesh key={`${i}-${x}`} position={[x, 0.08, -2.7 + i * 0.9]}>
            <sphereGeometry args={[0.05, 6, 6]} />
            <meshStandardMaterial
              color={PALETA.purple}
              emissive={PALETA.purple}
              emissiveIntensity={2.4}
              toneMapped={false}
            />
          </mesh>
        ))
      )}

      {/* Terminal de carga */}
      <mesh castShadow position={[1.9, 0.36, 1.2]}>
        <boxGeometry args={[1.5, 0.72, 2]} />
        <meshStandardMaterial color={PALETA.card} roughness={0.75} />
      </mesh>

      <group ref={aviao} position={[0, 0.18, -2.6]}>
        <mesh castShadow>
          <capsuleGeometry args={[0.15, 1.1, 4, 10]} />
          <meshStandardMaterial color="#e6e9ee" roughness={0.45} metalness={0.3} />
        </mesh>
        <mesh castShadow rotation={[0, 0, Math.PI / 2]}>
          <boxGeometry args={[0.07, 1.9, 0.38]} />
          <meshStandardMaterial color="#d4d8de" roughness={0.5} metalness={0.3} />
        </mesh>
        <mesh castShadow position={[0, 0.22, -0.6]}>
          <boxGeometry args={[0.06, 0.4, 0.28]} />
          <meshStandardMaterial color={PALETA.purple} roughness={0.5} />
        </mesh>
      </group>
    </group>
  );
}
