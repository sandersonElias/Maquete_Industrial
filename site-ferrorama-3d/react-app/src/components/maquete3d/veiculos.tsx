import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import type { Group, Mesh } from 'three';
import { PALETA } from './modulos';

type CicloRef = { current: number };

const MRS_AZUL = '#123a8a';
const MRS_AMARELO = '#ffd000';
const VOLVO_AMARELO = '#ffcc00';
const CAT_AMARELO = '#ffb000';

/** MRS ES44ACi — azul + nariz amarelo grande, lê da vista geral. */
export function LocoMRS() {
  return (
    <group name="pov-mrs">
      <mesh castShadow position={[0, 0.28, -0.05]}>
        <boxGeometry args={[0.56, 0.4, 1.22]} />
        <meshStandardMaterial color={MRS_AZUL} roughness={0.38} metalness={0.22} />
      </mesh>
      {[-0.285, 0.285].map((x) => (
        <mesh key={x} position={[x, 0.28, -0.02]}>
          <boxGeometry args={[0.04, 0.18, 1.12]} />
          <meshStandardMaterial color={MRS_AMARELO} roughness={0.4} />
        </mesh>
      ))}
      <mesh castShadow position={[0, 0.28, 0.68]}>
        <boxGeometry args={[0.56, 0.4, 0.28]} />
        <meshStandardMaterial color={MRS_AMARELO} roughness={0.35} />
      </mesh>
      <mesh castShadow position={[0, 0.58, -0.28]}>
        <boxGeometry args={[0.52, 0.32, 0.5]} />
        <meshStandardMaterial color={MRS_AZUL} roughness={0.35} />
      </mesh>
      <mesh position={[0, 0.6, 0]}>
        <boxGeometry args={[0.42, 0.16, 0.04]} />
        <meshStandardMaterial color="#9ad8ff" roughness={0.15} metalness={0.35} />
      </mesh>
      <mesh position={[0, 0.3, 0.84]}>
        <sphereGeometry args={[0.08, 10, 10]} />
        <meshStandardMaterial color="#fff3c4" emissive="#ffd700" emissiveIntensity={3} toneMapped={false} />
      </mesh>
      <mesh position={[0, 0.5, 0.68]}>
        <boxGeometry args={[0.22, 0.08, 0.02]} />
        <meshStandardMaterial color="#1a1a1a" roughness={0.5} />
      </mesh>
      {[-0.3, 0.3].map((x) =>
        [-0.42, 0.05, 0.48].map((z) => (
          <mesh key={`${x}-${z}`} position={[x, 0.1, z]} rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.1, 0.1, 0.06, 10]} />
            <meshStandardMaterial color="#1a1a1a" roughness={0.7} />
          </mesh>
        ))
      )}
    </group>
  );
}

export function VagaoMinerio() {
  return (
    <group>
      <mesh castShadow position={[0, 0.18, 0]}>
        <boxGeometry args={[0.52, 0.3, 0.92]} />
        <meshStandardMaterial color="#8a4a24" roughness={0.7} />
      </mesh>
      <mesh position={[0, 0.36, 0]}>
        <boxGeometry args={[0.4, 0.14, 0.72]} />
        <meshStandardMaterial color="#5a3018" roughness={1} />
      </mesh>
      {[-0.24, 0.24].map((z) =>
        [-0.26, 0.26].map((x) => (
          <mesh key={`${x}-${z}`} position={[x, 0.08, z]} rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.09, 0.09, 0.05, 8]} />
            <meshStandardMaterial color="#1a1a1a" roughness={0.7} />
          </mesh>
        ))
      )}
    </group>
  );
}

/** Escavadeira Volvo — amarela, lança visível, despeja na fase 0–0.28. */
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
    const alvo = dumping ? -0.72 : -0.28;
    lanca.current.rotation.z += (alvo - lanca.current.rotation.z) * 0.1;
    if (jorro.current) jorro.current.visible = dumping && c > 0.06 && c < 0.24;
  });

  return (
    <group name="pov-volvo">
      <mesh castShadow position={[0, 0.14, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.2, 0.2, 0.95, 8]} />
        <meshStandardMaterial color="#2a2a2a" roughness={0.8} />
      </mesh>
      <mesh castShadow position={[0, 0.4, 0]}>
        <boxGeometry args={[0.7, 0.36, 0.9]} />
        <meshStandardMaterial color={VOLVO_AMARELO} roughness={0.45} />
      </mesh>
      <mesh castShadow position={[-0.06, 0.66, 0.12]}>
        <boxGeometry args={[0.42, 0.28, 0.4]} />
        <meshStandardMaterial color="#ffe14a" roughness={0.4} />
      </mesh>
      <mesh position={[-0.06, 0.68, 0.33]}>
        <boxGeometry args={[0.32, 0.14, 0.03]} />
        <meshStandardMaterial color="#9ad8ff" roughness={0.15} />
      </mesh>
      <group ref={lanca} position={[0.28, 0.52, 0]}>
        <mesh castShadow position={[0.48, 0, 0]}>
          <boxGeometry args={[0.96, 0.12, 0.14]} />
          <meshStandardMaterial color="#1f1f1f" roughness={0.5} />
        </mesh>
        <mesh castShadow position={[0.98, -0.22, 0]} rotation={[0, 0, 0.65]}>
          <boxGeometry args={[0.5, 0.1, 0.12]} />
          <meshStandardMaterial color="#1f1f1f" roughness={0.5} />
        </mesh>
        <mesh castShadow position={[1.18, -0.46, 0]}>
          <boxGeometry args={[0.28, 0.2, 0.28]} />
          <meshStandardMaterial color="#3a3a3a" roughness={0.7} />
        </mesh>
        <group ref={jorro} position={[1.18, -0.68, 0]} visible={false}>
          {[0, 0.1, 0.2].map((y) => (
            <mesh key={y} position={[0.02, -y, 0]}>
              <sphereGeometry args={[0.055, 5, 5]} />
              <meshStandardMaterial color="#6a3a20" roughness={1} />
            </mesh>
          ))}
        </group>
      </group>
    </group>
  );
}

/** CAT 793 — caçamba grande, amarelo CAT. */
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
      cacamba.current.rotation.x += ((dump ? -0.5 : 0) - cacamba.current.rotation.x) * 0.12;
    }
  });

  return (
    <group name="pov-cat">
      <mesh castShadow position={[0, 0.36, 0.52]}>
        <boxGeometry args={[0.7, 0.42, 0.62]} />
        <meshStandardMaterial color={CAT_AMARELO} roughness={0.45} metalness={0.12} />
      </mesh>
      <mesh position={[-0.12, 0.6, 0.52]}>
        <boxGeometry args={[0.28, 0.2, 0.34]} />
        <meshStandardMaterial color="#9ad8ff" roughness={0.15} />
      </mesh>
      <group ref={cacamba} position={[0, 0.32, -0.08]}>
        <mesh castShadow position={[0, 0.22, -0.32]}>
          <boxGeometry args={[0.82, 0.48, 1.05]} />
          <meshStandardMaterial color="#e89a00" roughness={0.5} />
        </mesh>
        <mesh ref={minerio} position={[0, 0.5, -0.32]}>
          <boxGeometry args={[0.68, 0.2, 0.88]} />
          <meshStandardMaterial color="#6a3a20" roughness={1} />
        </mesh>
      </group>
      {[-0.36, 0.36].map((x) =>
        [-0.52, 0.12, 0.58].map((z) => (
          <mesh key={`${x}-${z}`} position={[x, 0.18, z]} rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.18, 0.18, 0.14, 10]} />
            <meshStandardMaterial color="#1a1a1a" roughness={0.8} />
          </mesh>
        ))
      )}
      {[-0.2, 0.2].map((x) => (
        <mesh key={`f-${x}`} position={[x, 0.34, 0.84]}>
          <sphereGeometry args={[0.055, 8, 8]} />
          <meshStandardMaterial color="#fff8dc" emissive="#ffe9a0" emissiveIntensity={2.8} toneMapped={false} />
        </mesh>
      ))}
    </group>
  );
}

/** Porta-contêineres — casco azul, ponte branca, boxes coloridos. */
export function PortaConteineres() {
  const cores = ['#e85d04', '#2d6a4f', '#c9a227', '#1d3557', '#f4f1ea', '#9b2226', '#457b9d', '#6d4c41'];
  return (
    <group name="pov-navio">
      <mesh castShadow position={[0, 0.16, 0]}>
        <boxGeometry args={[1.7, 0.42, 4.8]} />
        <meshStandardMaterial color="#3d9ad1" roughness={0.4} />
      </mesh>
      <mesh castShadow position={[0, 0.06, 2.25]} rotation={[0.4, 0, 0]}>
        <boxGeometry args={[1.62, 0.24, 0.55]} />
        <meshStandardMaterial color="#2f87bc" roughness={0.45} />
      </mesh>
      <mesh castShadow position={[0, 0.78, -1.7]}>
        <boxGeometry args={[1.2, 0.82, 1.05]} />
        <meshStandardMaterial color="#f7f4ee" roughness={0.65} />
      </mesh>
      <mesh position={[0, 1.28, -1.7]}>
        <boxGeometry args={[0.14, 0.32, 0.14]} />
        <meshStandardMaterial color="#ddd" roughness={0.5} />
      </mesh>
      {[-0.38, 0.38].map((x, xi) =>
        [-0.55, 0.1, 0.75, 1.4].map((z, zi) => (
          <mesh key={`${x}-${z}`} castShadow position={[x, 0.52, z]}>
            <boxGeometry args={[0.62, 0.32, 0.55]} />
            <meshStandardMaterial color={cores[(xi * 4 + zi) % cores.length]} roughness={0.6} />
          </mesh>
        ))
      )}
      <mesh position={[0, 1.28, -1.7]}>
        <sphereGeometry args={[0.07, 8, 8]} />
        <meshStandardMaterial color={PALETA.danger} emissive={PALETA.danger} emissiveIntensity={2.4} toneMapped={false} />
      </mesh>
    </group>
  );
}

/** C-5 Galaxy — cinza, asa alta, 4 motores, T-tail, rampa. Fica na pista. */
export function AviaoC5({ cicloRef }: { cicloRef?: CicloRef }) {
  const rampa = useRef<Group>(null);

  useFrame(() => {
    if (!rampa.current) return;
    const c = cicloRef?.current ?? 0;
    const aberta = c > 0.38 && c < 0.58;
    rampa.current.rotation.x += ((aberta ? 0.85 : 0.08) - rampa.current.rotation.x) * 0.1;
  });

  return (
    <group name="pov-c5">
      <mesh castShadow rotation={[-Math.PI / 2, 0, 0]}>
        <capsuleGeometry args={[0.26, 2.15, 4, 10]} />
        <meshStandardMaterial color="#9aa3ab" roughness={0.5} metalness={0.22} />
      </mesh>
      <mesh castShadow position={[0, 0.22, 1.05]}>
        <boxGeometry args={[0.34, 0.22, 0.48]} />
        <meshStandardMaterial color="#7e868e" roughness={0.45} />
      </mesh>
      <mesh position={[0, 0.24, 1.28]}>
        <boxGeometry args={[0.28, 0.12, 0.04]} />
        <meshStandardMaterial color="#9ad8ff" roughness={0.15} />
      </mesh>
      <mesh castShadow position={[0, 0.16, 0.1]} rotation={[0, 0, Math.PI / 2]}>
        <boxGeometry args={[0.07, 3.15, 0.55]} />
        <meshStandardMaterial color="#a8b0b8" roughness={0.48} />
      </mesh>
      {[-0.85, 0.85, -1.25, 1.25].map((x) => (
        <mesh key={x} castShadow position={[x, -0.02, 0.22]}>
          <cylinderGeometry args={[0.09, 0.1, 0.32, 8]} />
          <meshStandardMaterial color="#5c6168" roughness={0.4} metalness={0.35} />
        </mesh>
      ))}
      <mesh castShadow position={[0, 0.52, -1.05]}>
        <boxGeometry args={[0.1, 0.7, 0.32]} />
        <meshStandardMaterial color="#9aa3ab" roughness={0.5} />
      </mesh>
      <mesh castShadow position={[0, 0.86, -1.05]}>
        <boxGeometry args={[0.95, 0.08, 0.28]} />
        <meshStandardMaterial color="#9aa3ab" roughness={0.5} />
      </mesh>
      <group ref={rampa} position={[0, -0.12, -1.2]}>
        <mesh castShadow position={[0, 0, -0.32]}>
          <boxGeometry args={[0.38, 0.04, 0.62]} />
          <meshStandardMaterial color="#4e545c" roughness={0.7} />
        </mesh>
      </group>
    </group>
  );
}

const MONITORS: { id: string; label: string; cor: string }[] = [
  { id: 'volvo', label: 'VOLVO', cor: VOLVO_AMARELO },
  { id: 'cat', label: 'CAT', cor: CAT_AMARELO },
  { id: 'mrs', label: 'MRS', cor: '#3d9eff' },
  { id: 'navio', label: 'NAVIO', cor: '#5dade2' },
  { id: 'c5', label: 'C-5', cor: '#9aa3ab' },
];

/** Mesa SCADA: 5 telas inclinadas, pastas, caneca — sem HTML flutuante. */
export function MesaControle({
  onEscolher,
}: {
  onEscolher?: (id: string) => void;
}) {
  return (
    <group name="pov-sala" position={[0, 0.62, 0.1]}>
      {MONITORS.map((m, i) => {
        const x = (i - 2) * 0.78;
        return (
          <group key={m.id} position={[x, 0.38, -0.55]} rotation={[-0.28, 0, 0]}>
            <mesh castShadow>
              <boxGeometry args={[0.7, 0.48, 0.07]} />
              <meshStandardMaterial color="#15181f" roughness={0.4} />
            </mesh>
            <mesh
              position={[0, 0.02, 0.045]}
              onClick={(e) => {
                e.stopPropagation();
                onEscolher?.(m.id);
              }}
            >
              <planeGeometry args={[0.58, 0.36]} />
              <meshStandardMaterial
                color={m.cor}
                emissive={m.cor}
                emissiveIntensity={0.7}
                roughness={0.25}
              />
            </mesh>
            <mesh position={[0, -0.28, 0.04]}>
              <boxGeometry args={[0.42, 0.06, 0.02]} />
              <meshStandardMaterial color={m.cor} emissive={m.cor} emissiveIntensity={0.35} />
            </mesh>
          </group>
        );
      })}
      <group position={[-1.65, 0.08, 0.28]}>
        {[0, 0.04, 0.08].map((y) => (
          <mesh key={y} castShadow position={[0, y, 0]} rotation={[0, 0.18, 0]}>
            <boxGeometry args={[0.32, 0.035, 0.4]} />
            <meshStandardMaterial color={y === 0.08 ? '#c45c2a' : '#e2d4b8'} roughness={0.8} />
          </mesh>
        ))}
      </group>
      <group position={[1.55, 0.1, 0.38]}>
        <mesh castShadow>
          <cylinderGeometry args={[0.09, 0.08, 0.16, 10]} />
          <meshStandardMaterial color="#f4efe8" roughness={0.5} />
        </mesh>
        <mesh position={[0.1, 0.02, 0]}>
          <torusGeometry args={[0.045, 0.014, 6, 10, Math.PI]} />
          <meshStandardMaterial color="#f4efe8" roughness={0.5} />
        </mesh>
        <mesh position={[0, 0.06, 0]}>
          <cylinderGeometry args={[0.07, 0.07, 0.02, 10]} />
          <meshStandardMaterial color="#3a2418" roughness={0.8} />
        </mesh>
      </group>
    </group>
  );
}
