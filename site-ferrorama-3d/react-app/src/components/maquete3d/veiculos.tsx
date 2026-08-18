import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import type { Group, Mesh } from 'three';
import { PALETA } from './modulos';

type CicloRef = { current: number };

/** Locomotiva MRS ES44ACi — azul marinho e amarelo, estilizada. */
export function LocoMRS() {
  return (
    <group name="pov-mrs">
      <mesh castShadow position={[0, 0.2, 0.22]}>
        <boxGeometry args={[0.42, 0.28, 0.72]} />
        <meshStandardMaterial color="#0c1f4a" roughness={0.45} metalness={0.25} />
      </mesh>
      <mesh castShadow position={[0, 0.18, 0.72]}>
        <boxGeometry args={[0.4, 0.24, 0.38]} />
        <meshStandardMaterial color="#f5c400" roughness={0.4} />
      </mesh>
      <mesh castShadow position={[0, 0.42, 0.05]}>
        <boxGeometry args={[0.4, 0.28, 0.4]} />
        <meshStandardMaterial color="#0a1a3d" roughness={0.4} />
      </mesh>
      <mesh position={[0, 0.48, 0.22]}>
        <boxGeometry args={[0.32, 0.12, 0.02]} />
        <meshStandardMaterial color="#7ec8ff" roughness={0.2} metalness={0.4} />
      </mesh>
      <mesh position={[0, 0.22, 0.94]}>
        <sphereGeometry args={[0.06, 8, 8]} />
        <meshStandardMaterial color="#fff3c4" emissive="#ffd700" emissiveIntensity={2.4} toneMapped={false} />
      </mesh>
      {[-0.22, 0.22].map((x) =>
        [-0.28, 0.12, 0.55].map((z) => (
          <mesh key={`${x}-${z}`} position={[x, 0.08, z]} rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.08, 0.08, 0.05, 8]} />
            <meshStandardMaterial color="#15181d" roughness={0.7} />
          </mesh>
        ))
      )}
    </group>
  );
}

export function VagaoMinerio() {
  return (
    <group>
      <mesh castShadow position={[0, 0.15, 0]}>
        <boxGeometry args={[0.46, 0.26, 0.8]} />
        <meshStandardMaterial color="#6a3a22" roughness={0.7} />
      </mesh>
      <mesh position={[0, 0.3, 0]}>
        <boxGeometry args={[0.36, 0.1, 0.62]} />
        <meshStandardMaterial color="#4a2f22" roughness={1} />
      </mesh>
    </group>
  );
}

/** Escavadeira Volvo amarela/preta. Despeja na caçamba na fase 0–0.28 do ciclo. */
export function EscavadeiraVolvo({
  rodando = true,
  cicloRef,
}: {
  rodando?: boolean;
  cicloRef?: CicloRef;
}) {
  const lanca = useRef<Group>(null);
  const jorro = useRef<Group>(null);

  useFrame(() => {
    if (!lanca.current) return;
    const c = cicloRef?.current ?? 0;
    const dumping = rodando && c < 0.28;
    const alvo = dumping ? -0.82 : -0.22;
    lanca.current.rotation.z += (alvo - lanca.current.rotation.z) * 0.12;
    if (dumping) lanca.current.rotation.z = -0.78 + Math.sin(c * 42) * 0.07;
    if (jorro.current) jorro.current.visible = dumping && c > 0.05 && c < 0.26;
  });

  return (
    <group name="pov-volvo">
      <mesh castShadow position={[0, 0.12, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.16, 0.16, 0.72, 8]} />
        <meshStandardMaterial color="#2a2a2a" roughness={0.8} />
      </mesh>
      <mesh castShadow position={[0, 0.32, 0]}>
        <boxGeometry args={[0.52, 0.28, 0.7]} />
        <meshStandardMaterial color="#f0c400" roughness={0.5} />
      </mesh>
      <mesh castShadow position={[-0.05, 0.52, 0.08]}>
        <boxGeometry args={[0.32, 0.22, 0.32]} />
        <meshStandardMaterial color="#f5d34a" roughness={0.4} />
      </mesh>
      <mesh position={[-0.05, 0.54, 0.25]}>
        <boxGeometry args={[0.26, 0.12, 0.02]} />
        <meshStandardMaterial color="#7ec8ff" roughness={0.2} />
      </mesh>
      <group ref={lanca} position={[0.22, 0.42, 0]}>
        <mesh castShadow position={[0.38, 0, 0]}>
          <boxGeometry args={[0.76, 0.1, 0.12]} />
          <meshStandardMaterial color="#1a1a1a" roughness={0.5} />
        </mesh>
        <mesh castShadow position={[0.78, -0.18, 0]} rotation={[0, 0, 0.7]}>
          <boxGeometry args={[0.42, 0.08, 0.1]} />
          <meshStandardMaterial color="#1a1a1a" roughness={0.5} />
        </mesh>
        <mesh castShadow position={[0.95, -0.38, 0]}>
          <boxGeometry args={[0.22, 0.16, 0.22]} />
          <meshStandardMaterial color="#3a3a3a" roughness={0.7} />
        </mesh>
        <group ref={jorro} position={[0.95, -0.55, 0]} visible={false}>
          {[0, 0.08, 0.16, 0.24].map((y) => (
            <mesh key={y} position={[0.04, -y, (y % 0.1) - 0.04]}>
              <sphereGeometry args={[0.045, 5, 5]} />
              <meshStandardMaterial color="#5a3520" roughness={1} />
            </mesh>
          ))}
        </group>
      </group>
    </group>
  );
}

/** Fora-de-estrada CAT 793 — caçamba enorme. */
export function CaminhaoCAT({
  cargaRef,
  cicloRef,
}: {
  cargaRef?: CicloRef;
  cicloRef?: CicloRef;
}) {
  const minerio = useRef<Mesh>(null);
  const cacamba = useRef<Group>(null);

  useFrame(() => {
    const carga = cargaRef?.current ?? 0.85;
    if (minerio.current) {
      minerio.current.scale.y = Math.max(0.04, carga);
      minerio.current.visible = carga > 0.08;
    }
    if (cacamba.current) {
      const c = cicloRef?.current ?? 0;
      const dump = c > 0.48 && c < 0.62;
      cacamba.current.rotation.x += ((dump ? -0.55 : 0) - cacamba.current.rotation.x) * 0.14;
    }
  });

  return (
    <group name="pov-cat">
      <mesh castShadow position={[0, 0.28, 0.42]}>
        <boxGeometry args={[0.55, 0.34, 0.5]} />
        <meshStandardMaterial color="#f0c400" roughness={0.5} metalness={0.15} />
      </mesh>
      <mesh position={[-0.12, 0.48, 0.42]}>
        <boxGeometry args={[0.22, 0.18, 0.28]} />
        <meshStandardMaterial color="#7ec8ff" roughness={0.2} />
      </mesh>
      <group ref={cacamba} position={[0, 0.28, -0.05]}>
        <mesh castShadow position={[0, 0.14, -0.23]}>
          <boxGeometry args={[0.62, 0.38, 0.85]} />
          <meshStandardMaterial color="#e8b000" roughness={0.55} />
        </mesh>
        <mesh ref={minerio} position={[0, 0.36, -0.23]}>
          <boxGeometry args={[0.5, 0.16, 0.7]} />
          <meshStandardMaterial color="#5a3520" roughness={1} />
        </mesh>
      </group>
      {[-0.28, 0.28].map((x) =>
        [-0.42, 0.12, 0.48].map((z) => (
          <mesh key={`${x}-${z}`} position={[x, 0.14, z]} rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.14, 0.14, 0.1, 8]} />
            <meshStandardMaterial color="#1a1a1a" roughness={0.8} />
          </mesh>
        ))
      )}
      {[-0.16, 0.16].map((x) => (
        <mesh key={`f-${x}`} position={[x, 0.28, 0.7]}>
          <sphereGeometry args={[0.045, 8, 8]} />
          <meshStandardMaterial color="#fff8dc" emissive="#ffe9a0" emissiveIntensity={2.5} toneMapped={false} />
        </mesh>
      ))}
    </group>
  );
}

/** Porta-contêineres azul claro, ponte branca, duas filas de boxes. */
export function PortaConteineres() {
  const cores = ['#e85d04', '#2d6a4f', '#c9a227', '#1d3557', '#fff', '#9b2226', '#457b9d', '#6d4c41'];
  return (
    <group name="pov-navio">
      <mesh castShadow position={[0, 0.18, 0]}>
        <boxGeometry args={[1.55, 0.38, 4.4]} />
        <meshStandardMaterial color="#5dade2" roughness={0.45} />
      </mesh>
      <mesh castShadow position={[0, 0.08, 2.05]} rotation={[0.35, 0, 0]}>
        <boxGeometry args={[1.5, 0.22, 0.5]} />
        <meshStandardMaterial color="#4aa3d4" roughness={0.5} />
      </mesh>
      <mesh castShadow position={[0, 0.72, -1.55]}>
        <boxGeometry args={[1.15, 0.7, 0.95]} />
        <meshStandardMaterial color="#f4f1ea" roughness={0.7} />
      </mesh>
      <mesh position={[0, 1.12, -1.55]}>
        <boxGeometry args={[0.12, 0.28, 0.12]} />
        <meshStandardMaterial color="#ddd" roughness={0.5} />
      </mesh>
      {[-0.32, 0.32].map((x, xi) =>
        [-0.55, 0.05, 0.65, 1.2].map((z, zi) => (
          <mesh key={`${x}-${z}`} castShadow position={[x, 0.48, z]}>
            <boxGeometry args={[0.52, 0.28, 0.48]} />
            <meshStandardMaterial color={cores[(xi * 4 + zi) % cores.length]} roughness={0.65} />
          </mesh>
        ))
      )}
      <mesh position={[0, 1.12, -1.55]}>
        <sphereGeometry args={[0.06, 8, 8]} />
        <meshStandardMaterial color={PALETA.danger} emissive={PALETA.danger} emissiveIntensity={2.5} toneMapped={false} />
      </mesh>
    </group>
  );
}

/** Cargueiro tipo C-5 Galaxy — cinza, asa alta, T-tail, rampa traseira. */
export function AviaoC5({ cicloRef }: { cicloRef?: CicloRef }) {
  const rampa = useRef<Group>(null);

  useFrame(() => {
    if (!rampa.current) return;
    const c = cicloRef?.current ?? 0;
    const aberta = c > 0.18 && c < 0.36;
    rampa.current.rotation.x += ((aberta ? 0.9 : 0.08) - rampa.current.rotation.x) * 0.12;
  });

  return (
    <group name="pov-c5">
      <mesh castShadow rotation={[-Math.PI / 2, 0, 0]}>
        <capsuleGeometry args={[0.22, 1.85, 4, 10]} />
        <meshStandardMaterial color="#8d9399" roughness={0.55} metalness={0.25} />
      </mesh>
      <mesh castShadow position={[0, 0.18, 0.95]}>
        <boxGeometry args={[0.28, 0.18, 0.4]} />
        <meshStandardMaterial color="#7a8086" roughness={0.5} />
      </mesh>
      <mesh castShadow position={[0, 0.12, 0]} rotation={[0, 0, Math.PI / 2]}>
        <boxGeometry args={[0.06, 2.6, 0.48]} />
        <meshStandardMaterial color="#9aa0a6" roughness={0.5} />
      </mesh>
      {[-0.7, 0.7, -1.05, 1.05].map((x) => (
        <mesh key={x} castShadow position={[x, -0.02, 0.2]}>
          <cylinderGeometry args={[0.07, 0.08, 0.26, 8]} />
          <meshStandardMaterial color="#5a5e64" roughness={0.4} metalness={0.4} />
        </mesh>
      ))}
      <mesh castShadow position={[0, 0.42, -0.95]}>
        <boxGeometry args={[0.08, 0.55, 0.28]} />
        <meshStandardMaterial color="#8d9399" roughness={0.5} />
      </mesh>
      <mesh castShadow position={[0, 0.68, -0.95]}>
        <boxGeometry args={[0.7, 0.06, 0.22]} />
        <meshStandardMaterial color="#8d9399" roughness={0.5} />
      </mesh>
      <group ref={rampa} position={[0, -0.12, -1.05]}>
        <mesh castShadow position={[0, 0, -0.28]}>
          <boxGeometry args={[0.32, 0.03, 0.55]} />
          <meshStandardMaterial color="#4a4e54" roughness={0.7} />
        </mesh>
      </group>
    </group>
  );
}

const MONITORS: { id: string; label: string; cor: string }[] = [
  { id: 'volvo', label: 'VOLVO', cor: '#f0c400' },
  { id: 'cat', label: 'CAT 793', cor: '#e8b000' },
  { id: 'mrs', label: 'MRS', cor: '#3d9eff' },
  { id: 'navio', label: 'NAVIO', cor: '#5dade2' },
  { id: 'c5', label: 'C-5', cor: '#8d9399' },
];

/** Mesa da sala: 5 telas, pastas da escola, caneca. */
export function MesaControle({
  onEscolher,
}: {
  onEscolher?: (id: string) => void;
}) {
  return (
    <group name="pov-sala" position={[0, 0.62, 0.15]}>
      {MONITORS.map((m, i) => {
        const x = (i - 2) * 0.72;
        return (
          <group key={m.id} position={[x, 0.42, -0.35]}>
            <mesh castShadow>
              <boxGeometry args={[0.62, 0.42, 0.06]} />
              <meshStandardMaterial color="#1a1d24" roughness={0.4} />
            </mesh>
            <mesh
              position={[0, 0, 0.04]}
              onClick={(e) => {
                e.stopPropagation();
                onEscolher?.(m.id);
              }}
            >
              <planeGeometry args={[0.52, 0.32]} />
              <meshStandardMaterial
                color={m.cor}
                emissive={m.cor}
                emissiveIntensity={0.45}
                roughness={0.3}
              />
            </mesh>
            <Html position={[0, -0.28, 0.06]} center distanceFactor={10} zIndexRange={[6, 0]}>
              <span className="maquete3d-monitor-label">{m.label}</span>
            </Html>
          </group>
        );
      })}
      <group position={[-1.55, 0.08, 0.25]}>
        {[0, 0.035, 0.07].map((y) => (
          <mesh key={y} castShadow position={[0, y, 0]} rotation={[0, 0.15, 0]}>
            <boxGeometry args={[0.28, 0.03, 0.36]} />
            <meshStandardMaterial color={y === 0.07 ? '#c45c2a' : '#d4c4a8'} roughness={0.8} />
          </mesh>
        ))}
        <mesh position={[0, 0.1, 0.01]} rotation={[-0.4, 0.15, 0]}>
          <planeGeometry args={[0.18, 0.14]} />
          <meshStandardMaterial color="#ff8844" roughness={0.5} />
        </mesh>
      </group>
      <group position={[1.45, 0.1, 0.35]}>
        <mesh castShadow>
          <cylinderGeometry args={[0.08, 0.07, 0.14, 10]} />
          <meshStandardMaterial color="#f0ebe4" roughness={0.5} />
        </mesh>
        <mesh position={[0.09, 0.02, 0]}>
          <torusGeometry args={[0.04, 0.012, 6, 10, Math.PI]} />
          <meshStandardMaterial color="#f0ebe4" roughness={0.5} />
        </mesh>
        <mesh position={[0, 0.05, 0]}>
          <cylinderGeometry args={[0.06, 0.06, 0.02, 10]} />
          <meshStandardMaterial color="#3a2418" roughness={0.8} />
        </mesh>
      </group>
    </group>
  );
}
