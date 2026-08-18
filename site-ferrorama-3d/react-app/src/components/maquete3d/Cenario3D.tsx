import { useRef, useMemo, useLayoutEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { PALETA } from './modulos';

/** Pontos do fluxo logístico: mina → trem → porto (narrativa principal). */
const FLUXO_PONTOS = [
  new THREE.Vector3(-10, 0.08, -4),
  new THREE.Vector3(-6, 0.08, -2),
  new THREE.Vector3(-2, 0.08, 0),
  new THREE.Vector3(3, 0.08, 2),
  new THREE.Vector3(8, 0.08, 3.5),
  new THREE.Vector3(10, 0.08, 4),
];

const ARVORES: [number, number][] = [
  [-13, -8], [-12, 3], [-8, 8], [-4, -9], [4, -8], [5, 9], [13, -2], [14, 6],
  [-11, -2], [7, -3], [12, -7], [-6, 6], [2, 7], [-14, 5], [0, -10], [9, 8],
];

function Arvores() {
  const troncos = useRef<THREE.InstancedMesh>(null);
  const copas = useRef<THREE.InstancedMesh>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);

  useLayoutEffect(() => {
    ARVORES.forEach(([x, z], i) => {
      const escala = 0.7 + (i % 5) * 0.12;
      dummy.position.set(x, 0.22 * escala, z);
      dummy.scale.set(escala, escala, escala);
      dummy.updateMatrix();
      troncos.current?.setMatrixAt(i, dummy.matrix);
      dummy.position.y = 0.55 * escala;
      dummy.updateMatrix();
      copas.current?.setMatrixAt(i, dummy.matrix);
    });
    if (troncos.current) troncos.current.instanceMatrix.needsUpdate = true;
    if (copas.current) copas.current.instanceMatrix.needsUpdate = true;
  }, [dummy]);

  return (
    <group>
      <instancedMesh ref={troncos} args={[undefined, undefined, ARVORES.length]} castShadow>
        <cylinderGeometry args={[0.08, 0.1, 0.45, 6]} />
        <meshStandardMaterial color="#3a2a18" roughness={1} />
      </instancedMesh>
      <instancedMesh ref={copas} args={[undefined, undefined, ARVORES.length]} castShadow>
        <coneGeometry args={[0.38, 0.7, 7]} />
        <meshStandardMaterial color="#1a3320" roughness={0.95} flatShading />
      </instancedMesh>
    </group>
  );
}

/** Estradas de terra ligando os módulos. */
function Estradas() {
  const trechos: { pos: [number, number, number]; size: [number, number, number]; rot: number }[] = [
    { pos: [-7, 0.04, -3], size: [5.5, 0.02, 1.1], rot: 0.35 },
    { pos: [-3, 0.04, 0.5], size: [4, 0.02, 1], rot: 0.1 },
    { pos: [4, 0.04, 2.5], size: [6, 0.02, 1.1], rot: -0.15 },
    { pos: [8, 0.04, -1], size: [1.1, 0.02, 5], rot: 0 },
  ];

  return (
    <group>
      {trechos.map((t, i) => (
        <mesh key={i} position={t.pos} rotation={[0, t.rot, 0]} receiveShadow>
          <boxGeometry args={t.size} />
          <meshStandardMaterial color="#2a2418" roughness={1} />
        </mesh>
      ))}
    </group>
  );
}

/** Partículas animadas ao longo do fluxo mina → porto. */
export function FluxoMinério({ rodando }: { rodando: boolean }) {
  const curva = useMemo(() => new THREE.CatmullRomCurve3(FLUXO_PONTOS, false, 'catmullrom', 0.4), []);
  const bolas = useRef<THREE.InstancedMesh>(null);
  const COUNT = 14;
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const tempo = useRef(0);

  useFrame((_, delta) => {
    if (!bolas.current) return;
    if (rodando) tempo.current += delta * 0.22;

    for (let i = 0; i < COUNT; i++) {
      const t = (tempo.current + i / COUNT) % 1;
      const p = curva.getPointAt(t);
      dummy.position.set(p.x, p.y + Math.sin(t * Math.PI * 4) * 0.04, p.z);
      dummy.scale.setScalar(0.06 + (i % 3) * 0.02);
      dummy.updateMatrix();
      bolas.current.setMatrixAt(i, dummy.matrix);
    }
    bolas.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <group>
      <mesh position={[0, 0.06, 0]}>
        <tubeGeometry args={[curva, 64, 0.06, 6, false]} />
        <meshStandardMaterial color={PALETA.warning} transparent opacity={0.08} roughness={1} />
      </mesh>
      <instancedMesh ref={bolas} args={[undefined, undefined, COUNT]}>
        <sphereGeometry args={[1, 6, 6]} />
        <meshStandardMaterial
          color="#8b4513"
          emissive={PALETA.warning}
          emissiveIntensity={0.6}
          roughness={1}
          toneMapped={false}
        />
      </instancedMesh>
    </group>
  );
}

/** Placa central do projeto + legendas de zona. */
export function Sinalizacao({ noite }: { noite: boolean }) {
  return (
    <group>
      <mesh castShadow position={[0, 0.35, 10.2]}>
        <boxGeometry args={[0.12, 0.7, 1.8]} />
        <meshStandardMaterial color="#3a3a3a" roughness={0.8} metalness={0.4} />
      </mesh>
      <mesh castShadow position={[0, 0.78, 10.2]} rotation={[0, 0, 0]}>
        <boxGeometry args={[0.08, 0.55, 1.6]} />
        <meshStandardMaterial
          color={PALETA.dark}
          emissive={PALETA.glow}
          emissiveIntensity={noite ? 0.5 : 0.15}
          roughness={0.5}
        />
      </mesh>
    </group>
  );
}

/** Postes de energia e cabos entre módulos. */
function Infraestrutura() {
  const postes: [number, number][] = [
    [-5, -4], [2, -5], [6, 2], [-3, 5],
  ];

  return (
    <group>
      {postes.map(([x, z], i) => (
        <group key={i} position={[x, 0, z]}>
          <mesh castShadow position={[0, 0.55, 0]}>
            <cylinderGeometry args={[0.04, 0.06, 1.1, 6]} />
            <meshStandardMaterial color="#4a4a4a" roughness={0.7} metalness={0.5} />
          </mesh>
          <mesh position={[0, 1.05, 0]}>
            <boxGeometry args={[0.6, 0.04, 0.04]} />
            <meshStandardMaterial color="#333" roughness={0.6} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

export function Cenario3D({ rodando, noite }: { rodando: boolean; noite: boolean }) {
  return (
    <group>
      <Arvores />
      <Estradas />
      <FluxoMinério rodando={rodando} />
      <Sinalizacao noite={noite} />
      <Infraestrutura />
    </group>
  );
}
