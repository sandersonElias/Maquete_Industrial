import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import type { Group, Mesh } from 'three';
import { PALETA } from './modulos';

type CicloRef = { current: number };

const MRS_AZUL = '#0c2f78';
const MRS_AMARELO = '#ffd000';
const VOLVO_AMARELO = '#ffcc00';
const CAT_AMARELO = '#ffb000';

function MolduraCabine({
  largura = 0.55,
  cor = '#16181e',
  compacto = false,
}: {
  largura?: number;
  cor?: string;
  compacto?: boolean;
}) {
  const z = compacto ? 0.4 : 0.22;
  return (
    <group>
      {[-1, 1].map((s) => (
        <mesh key={s} position={[(largura / 2) * s, 0.02, z]}>
          <boxGeometry args={[0.028, compacto ? 0.26 : 0.36, 0.03]} />
          <meshStandardMaterial color={cor} roughness={0.55} />
        </mesh>
      ))}
      <mesh position={[0, compacto ? 0.16 : 0.2, z - 0.02]}>
        <boxGeometry args={[largura + 0.04, 0.028, 0.06]} />
        <meshStandardMaterial color={cor} roughness={0.55} />
      </mesh>
      <mesh position={[0, compacto ? -0.14 : -0.18, z + 0.04]} rotation={[-0.4, 0, 0]}>
        <boxGeometry args={[largura, compacto ? 0.045 : 0.07, compacto ? 0.14 : 0.22]} />
        <meshStandardMaterial color="#1c1e26" roughness={0.4} />
      </mesh>
      {[-0.1, 0.1].map((x) => (
        <mesh key={x} position={[x, compacto ? -0.12 : -0.155, z + 0.08]} rotation={[-Math.PI / 2, 0, 0]}>
          <circleGeometry args={[0.022, 10]} />
          <meshStandardMaterial color="#163528" emissive="#2ec27e" emissiveIntensity={1.1} />
        </mesh>
      ))}
    </group>
  );
}

function Vidro({ args, position, rotation }: { args: [number, number, number]; position: [number, number, number]; rotation?: [number, number, number] }) {
  return (
    <mesh position={position} rotation={rotation}>
      <boxGeometry args={args} />
      <meshPhysicalMaterial
        color="#9ad8ff"
        roughness={0.05}
        metalness={0.15}
        transmission={0.55}
        thickness={0.08}
        transparent
        opacity={0.85}
      />
    </mesh>
  );
}

/** MRS ES44ACi — cabine atrás do nariz amarelo, POV olha a linha. */
export function LocoMRS() {
  return (
    <group>
      <mesh castShadow position={[0, 0.3, -0.12]}>
        <boxGeometry args={[0.58, 0.42, 1.28]} />
        <meshStandardMaterial color={MRS_AZUL} roughness={0.32} metalness={0.28} />
      </mesh>
      {[-0.3, 0.3].map((x) => (
        <mesh key={x} position={[x, 0.3, -0.08]}>
          <boxGeometry args={[0.035, 0.16, 1.18]} />
          <meshStandardMaterial color={MRS_AMARELO} roughness={0.38} />
        </mesh>
      ))}
      <mesh castShadow position={[0, 0.3, 0.72]}>
        <boxGeometry args={[0.58, 0.42, 0.32]} />
        <meshStandardMaterial color={MRS_AMARELO} roughness={0.32} />
      </mesh>
      <mesh castShadow position={[0, 0.62, 0.22]}>
        <boxGeometry args={[0.54, 0.34, 0.52]} />
        <meshStandardMaterial color={MRS_AZUL} roughness={0.32} metalness={0.2} />
      </mesh>
      <Vidro args={[0.46, 0.18, 0.03]} position={[0, 0.66, 0.49]} />
      {[-0.28, 0.28].map((x) => (
        <Vidro key={x} args={[0.03, 0.16, 0.28]} position={[x, 0.64, 0.22]} />
      ))}
      <group name="cabine-mrs" position={[0, 0.76, 0.62]}>
        <MolduraCabine largura={0.5} />
      </group>
      <group name="pov-mrs" />
      <mesh position={[0, 0.32, 0.9]}>
        <sphereGeometry args={[0.07, 12, 12]} />
        <meshStandardMaterial color="#fff3c4" emissive="#ffd700" emissiveIntensity={3.2} toneMapped={false} />
      </mesh>
      {[-0.22, 0.22].map((x) =>
        [-0.48, 0.02, 0.52].map((z) => (
          <mesh key={`${x}-${z}`} position={[x, 0.1, z]} rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.1, 0.1, 0.07, 12]} />
            <meshStandardMaterial color="#1a1a1a" roughness={0.55} metalness={0.4} />
          </mesh>
        ))
      )}
    </group>
  );
}

export function VagaoMinerio() {
  return (
    <group>
      <mesh castShadow position={[0, 0.16, 0]}>
        <boxGeometry args={[0.54, 0.22, 0.95]} />
        <meshStandardMaterial color="#4a2c1c" roughness={0.65} metalness={0.15} />
      </mesh>
      <mesh position={[0, 0.32, 0]}>
        <boxGeometry args={[0.46, 0.18, 0.82]} />
        <meshStandardMaterial color="#6a3a20" roughness={1} />
      </mesh>
      {[-0.24, 0.24].map((z) =>
        [-0.26, 0.26].map((x) => (
          <mesh key={`${x}-${z}`} position={[x, 0.08, z]} rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.09, 0.09, 0.05, 10]} />
            <meshStandardMaterial color="#1a1a1a" roughness={0.55} metalness={0.35} />
          </mesh>
        ))
      )}
    </group>
  );
}

export function EscavadeiraVolvo({
  rodando = true,
  cicloRef,
}: {
  rodando?: boolean;
  cicloRef?: CicloRef;
}) {
  const lanca = useRef<Group>(null);
  const cacamba = useRef<Group>(null);
  const jorro = useRef<Group>(null);

  useFrame((_, delta) => {
    if (!lanca.current) return;
    const c = cicloRef?.current ?? 0;
    const despeja = rodando && c < 0.18;
    const mergulho = 0.28 + Math.sin(c * Math.PI * 5.5) * 0.24;
    const alvoLanca = !rodando ? -0.12 : despeja ? -0.62 : mergulho;
    lanca.current.rotation.z += (alvoLanca - lanca.current.rotation.z) * Math.min(delta * 6, 1);
    if (cacamba.current) {
      const curl = !rodando ? 0.25 : despeja ? 1.05 : mergulho > 0.38 ? 0.55 : 0.22;
      cacamba.current.rotation.z += (curl - cacamba.current.rotation.z) * Math.min(delta * 7, 1);
    }
    if (jorro.current) jorro.current.visible = Boolean(rodando && !despeja && mergulho > 0.4);
  });

  return (
    <group name="pov-volvo">
      <mesh castShadow position={[0, 0.14, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.2, 0.2, 0.95, 14]} />
        <meshStandardMaterial color="#2a2a2a" roughness={0.7} metalness={0.25} />
      </mesh>
      <mesh castShadow position={[0, 0.4, 0]}>
        <boxGeometry args={[0.7, 0.36, 0.9]} />
        <meshStandardMaterial color={VOLVO_AMARELO} roughness={0.4} metalness={0.12} />
      </mesh>
      <mesh castShadow position={[-0.06, 0.68, 0.12]}>
        <boxGeometry args={[0.42, 0.28, 0.4]} />
        <meshStandardMaterial color="#ffe14a" roughness={0.35} />
      </mesh>
      <Vidro args={[0.32, 0.14, 0.03]} position={[-0.06, 0.72, 0.33]} />
      <group name="cabine-volvo" position={[0.22, 0.78, 0.12]} />
      <group ref={lanca} position={[0.3, 0.54, 0]}>
        <mesh castShadow position={[0.5, 0, 0]}>
          <boxGeometry args={[1.0, 0.1, 0.13]} />
          <meshStandardMaterial color="#1f1f1f" roughness={0.45} metalness={0.35} />
        </mesh>
        <mesh castShadow position={[1.02, -0.26, 0]} rotation={[0, 0, 0.72]}>
          <boxGeometry args={[0.58, 0.08, 0.1]} />
          <meshStandardMaterial color="#1f1f1f" roughness={0.45} metalness={0.35} />
        </mesh>
        <group ref={cacamba} position={[1.26, -0.5, 0]}>
          <mesh castShadow position={[0, 0.04, 0]}>
            <boxGeometry args={[0.07, 0.2, 0.34]} />
            <meshStandardMaterial color="#2c2c2c" roughness={0.45} metalness={0.4} />
          </mesh>
          <mesh castShadow position={[0.13, -0.07, 0]} rotation={[0, 0, 0.18]}>
            <boxGeometry args={[0.26, 0.04, 0.34]} />
            <meshStandardMaterial color="#3a3a3a" roughness={0.5} metalness={0.35} />
          </mesh>
          {[-0.155, 0.155].map((z) => (
            <mesh key={z} castShadow position={[0.12, 0.02, z]} rotation={[0, 0, 0.12]}>
              <boxGeometry args={[0.24, 0.18, 0.035]} />
              <meshStandardMaterial color="#2a2a2a" roughness={0.5} metalness={0.3} />
            </mesh>
          ))}
          {[-0.12, -0.04, 0.04, 0.12].map((z) => (
            <mesh key={z} castShadow position={[0.26, -0.08, z]} rotation={[0, 0, -Math.PI / 2]}>
              <coneGeometry args={[0.028, 0.09, 5]} />
              <meshStandardMaterial color="#1a1a1a" roughness={0.4} metalness={0.55} />
            </mesh>
          ))}
          <group ref={jorro} position={[0.16, -0.16, 0]} visible={false}>
            {[0, 0.09, 0.18].map((y) => (
              <mesh key={y} position={[0.04, -y, 0]}>
                <sphereGeometry args={[0.05, 8, 8]} />
                <meshStandardMaterial color="#6a3a20" roughness={1} />
              </mesh>
            ))}
          </group>
        </group>
      </group>
    </group>
  );
}

export function CaminhaoCAT({
  cargaRef,
  cicloRef,
}: {
  cargaRef?: CicloRef;
  cicloRef?: CicloRef;
}) {
  const minerio = useRef<Mesh>(null);
  const cacamba = useRef<Group>(null);

  useFrame((_, delta) => {
    const carga = cargaRef?.current ?? 0.85;
    if (minerio.current) {
      minerio.current.scale.y = Math.max(0.04, carga);
      minerio.current.visible = carga > 0.08;
    }
    if (cacamba.current) {
      const c = cicloRef?.current ?? 0;
      const dump = c > 0.38 && c < 0.52;
      cacamba.current.rotation.x += ((dump ? -0.48 : 0) - cacamba.current.rotation.x) * Math.min(delta * 5, 1);
    }
  });

  return (
    <group name="pov-cat">
      <mesh castShadow position={[0, 0.36, 0.52]}>
        <boxGeometry args={[0.7, 0.42, 0.62]} />
        <meshStandardMaterial color={CAT_AMARELO} roughness={0.4} metalness={0.14} />
      </mesh>
      <mesh position={[-0.12, 0.62, 0.52]}>
        <boxGeometry args={[0.3, 0.22, 0.36]} />
        <meshStandardMaterial color="#1a1c20" roughness={0.5} />
      </mesh>
      <Vidro args={[0.26, 0.14, 0.03]} position={[-0.12, 0.66, 0.71]} />
      <group name="cabine-cat" position={[-0.1, 0.74, 0.76]} />
      <group ref={cacamba} position={[0, 0.32, -0.08]}>
        <mesh castShadow position={[0, 0.22, -0.32]}>
          <boxGeometry args={[0.82, 0.48, 1.05]} />
          <meshStandardMaterial color="#e89a00" roughness={0.48} metalness={0.1} />
        </mesh>
        <mesh ref={minerio} position={[0, 0.5, -0.32]}>
          <boxGeometry args={[0.68, 0.2, 0.88]} />
          <meshStandardMaterial color="#6a3a20" roughness={1} />
        </mesh>
      </group>
      {[-0.36, 0.36].map((x) =>
        [-0.52, 0.12, 0.58].map((z) => (
          <mesh key={`${x}-${z}`} position={[x, 0.18, z]} rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.18, 0.18, 0.14, 12]} />
            <meshStandardMaterial color="#1a1a1a" roughness={0.55} metalness={0.3} />
          </mesh>
        ))
      )}
      {[-0.2, 0.2].map((x) => (
        <mesh key={`f-${x}`} position={[x, 0.34, 0.84]}>
          <sphereGeometry args={[0.055, 10, 10]} />
          <meshStandardMaterial color="#fff8dc" emissive="#ffe9a0" emissiveIntensity={2.8} toneMapped={false} />
        </mesh>
      ))}
    </group>
  );
}

/** Porta-contêineres — POV na ponte, olhando o convés. */
export function PortaConteineres() {
  const cores = ['#e85d04', '#2d6a4f', '#c9a227', '#1d3557', '#f4f1ea', '#9b2226', '#457b9d', '#6d4c41'];
  return (
    <group name="pov-navio">
      <mesh castShadow position={[0, 0.16, 0]}>
        <boxGeometry args={[1.7, 0.42, 4.8]} />
        <meshStandardMaterial color="#2f87bc" roughness={0.28} metalness={0.35} />
      </mesh>
      <mesh receiveShadow position={[0, 0.38, 0.35]}>
        <boxGeometry args={[1.55, 0.04, 3.2]} />
        <meshStandardMaterial color="#1e4a62" roughness={0.7} />
      </mesh>
      <mesh castShadow position={[0, 0.06, 2.25]} rotation={[0.4, 0, 0]}>
        <boxGeometry args={[1.62, 0.24, 0.55]} />
        <meshStandardMaterial color="#2478a8" roughness={0.32} metalness={0.3} />
      </mesh>
      <mesh castShadow position={[0, 0.82, -1.72]}>
        <boxGeometry args={[1.22, 0.88, 1.08]} />
        <meshStandardMaterial color="#f4f1ea" roughness={0.55} />
      </mesh>
      <Vidro args={[1.05, 0.22, 0.04]} position={[0, 1.05, -1.16]} />
      {[-0.62, 0.62].map((x) => (
        <Vidro key={x} args={[0.04, 0.2, 0.7]} position={[x, 1.02, -1.7]} />
      ))}
      <group name="cabine-navio" position={[0, 1.18, -1.05]}>
        <MolduraCabine largura={0.85} />
        <mesh position={[0, -0.12, 0.32]} rotation={[Math.PI / 2.4, 0, 0]}>
          <torusGeometry args={[0.08, 0.014, 8, 16]} />
          <meshStandardMaterial color="#c9a227" roughness={0.35} metalness={0.5} />
        </mesh>
      </group>
      {[-0.38, 0.38].map((x, xi) =>
        [-0.55, 0.1, 0.75, 1.4].map((z, zi) => (
          <mesh key={`${x}-${z}`} castShadow position={[x, 0.54, z]}>
            <boxGeometry args={[0.62, 0.32, 0.55]} />
            <meshStandardMaterial color={cores[(xi * 4 + zi) % cores.length]} roughness={0.55} metalness={0.08} />
          </mesh>
        ))
      )}
      <mesh position={[0, 1.32, -1.7]}>
        <cylinderGeometry args={[0.05, 0.05, 0.28, 8]} />
        <meshStandardMaterial color="#ddd" roughness={0.4} />
      </mesh>
      <mesh position={[0, 1.48, -1.7]}>
        <sphereGeometry args={[0.07, 10, 10]} />
        <meshStandardMaterial color={PALETA.danger} emissive={PALETA.danger} emissiveIntensity={2.4} toneMapped={false} />
      </mesh>
    </group>
  );
}

const MONITORS: { id: string; label: string; cor: string }[] = [
  { id: 'volvo', label: 'VOLVO', cor: VOLVO_AMARELO },
  { id: 'cat', label: 'CAT', cor: CAT_AMARELO },
  { id: 'mrs', label: 'MRS', cor: '#3d9eff' },
  { id: 'navio', label: 'NAVIO', cor: '#5dade2' },
];

export function MesaControle({
  onEscolher,
}: {
  onEscolher?: (id: string) => void;
}) {
  return (
    <group name="pov-sala" position={[0, 0.62, 0.1]}>
      <group name="cabine-sala" position={[0, 0.42, 0.55]} />
      {MONITORS.map((m, i) => {
        const x = (i - 1.5) * 0.9;
        return (
          <group key={m.id} position={[x, 0.38, -0.55]} rotation={[-0.28, 0, 0]}>
            <mesh castShadow>
              <boxGeometry args={[0.7, 0.48, 0.07]} />
              <meshStandardMaterial color="#15181f" roughness={0.35} metalness={0.2} />
            </mesh>
            <mesh
              position={[0, 0.02, 0.045]}
              onClick={(e) => {
                e.stopPropagation();
                onEscolher?.(m.id);
              }}
            >
              <planeGeometry args={[0.58, 0.36]} />
              <meshStandardMaterial color={m.cor} emissive={m.cor} emissiveIntensity={0.85} roughness={0.22} />
            </mesh>
            <mesh position={[0, -0.28, 0.04]}>
              <boxGeometry args={[0.42, 0.06, 0.02]} />
              <meshStandardMaterial color={m.cor} emissive={m.cor} emissiveIntensity={0.4} />
            </mesh>
          </group>
        );
      })}
      <group position={[-1.65, 0.08, 0.28]}>
        {[0, 0.04, 0.08].map((y) => (
          <mesh key={y} castShadow position={[0, y, 0]} rotation={[0, 0.18, 0]}>
            <boxGeometry args={[0.32, 0.035, 0.4]} />
            <meshStandardMaterial color={y === 0.08 ? '#c45c2a' : '#e2d4b8'} roughness={0.75} />
          </mesh>
        ))}
      </group>
      <group position={[1.55, 0.1, 0.38]}>
        <mesh castShadow>
          <cylinderGeometry args={[0.09, 0.08, 0.16, 12]} />
          <meshStandardMaterial color="#f4efe8" roughness={0.45} />
        </mesh>
        <mesh position={[0.1, 0.02, 0]}>
          <torusGeometry args={[0.045, 0.014, 6, 12, Math.PI]} />
          <meshStandardMaterial color="#f4efe8" roughness={0.45} />
        </mesh>
        <mesh position={[0, 0.06, 0]}>
          <cylinderGeometry args={[0.07, 0.07, 0.02, 12]} />
          <meshStandardMaterial color="#3a2418" roughness={0.75} />
        </mesh>
      </group>
    </group>
  );
}
