import { useRef, useMemo, useLayoutEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { PALETA } from './modulos';
import { texTerra, texMadeira, texAsfalto } from './texturas';
import { criarEstradasLogistica, geometriaFita, LAYOUT } from './geometria';

const FLUXO_PONTOS = [
  new THREE.Vector3(LAYOUT.mineradora[0] + 2, 0.1, LAYOUT.mineradora[2] + 2),
  new THREE.Vector3(-8.5, 0.1, -2),
  new THREE.Vector3(0, 0.1, 0.4),
  new THREE.Vector3(8.2, 0.1, 3.2),
  new THREE.Vector3(LAYOUT.porto[0] - 2, 0.1, LAYOUT.porto[2] - 1),
];

const ARVORES: [number, number, number][] = [
  [-20, -12, 1.1], [-18, 4, 0.85], [-14, 11, 1], [-8, -13, 0.9], [6, -12, 1.05],
  [8, 13, 0.8], [19, -4, 1.15], [20, 10, 0.95], [-16, 0, 0.75], [11, -5, 0.88],
  [18, -14, 1.2], [-10, 9, 0.82], [3, 12, 0.7], [-21, 8, 1], [1, -14, 0.92],
  [14, 12, 0.86], [-6, -11, 0.78], [22, 2, 1.05], [-19, -6, 0.9], [9, 8, 0.72],
];

function Arvores() {
  const troncos = useRef<THREE.InstancedMesh>(null);
  const copasA = useRef<THREE.InstancedMesh>(null);
  const copasB = useRef<THREE.InstancedMesh>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);

  useLayoutEffect(() => {
    ARVORES.forEach(([x, z, escala], i) => {
      dummy.position.set(x, 0.28 * escala, z);
      dummy.scale.set(escala, escala, escala);
      dummy.updateMatrix();
      troncos.current?.setMatrixAt(i, dummy.matrix);
      dummy.position.y = 0.85 * escala;
      dummy.updateMatrix();
      copasA.current?.setMatrixAt(i, dummy.matrix);
      dummy.position.y = 1.12 * escala;
      dummy.scale.set(escala * 0.72, escala * 0.72, escala * 0.72);
      dummy.updateMatrix();
      copasB.current?.setMatrixAt(i, dummy.matrix);
    });
    if (troncos.current) troncos.current.instanceMatrix.needsUpdate = true;
    if (copasA.current) copasA.current.instanceMatrix.needsUpdate = true;
    if (copasB.current) copasB.current.instanceMatrix.needsUpdate = true;
  }, [dummy]);

  return (
    <group>
      <instancedMesh ref={troncos} args={[undefined, undefined, ARVORES.length]} castShadow>
        <cylinderGeometry args={[0.07, 0.11, 0.58, 10]} />
        <meshStandardMaterial map={texMadeira()} color="#6a4a30" roughness={0.95} />
      </instancedMesh>
      <instancedMesh ref={copasA} args={[undefined, undefined, ARVORES.length]} castShadow>
        <sphereGeometry args={[0.42, 14, 12]} />
        <meshStandardMaterial color="#2f5c36" roughness={0.88} />
      </instancedMesh>
      <instancedMesh ref={copasB} args={[undefined, undefined, ARVORES.length]} castShadow>
        <sphereGeometry args={[0.32, 12, 10]} />
        <meshStandardMaterial color="#3a6e40" roughness={0.86} />
      </instancedMesh>
    </group>
  );
}

function Estradas() {
  const curvas = useMemo(() => criarEstradasLogistica(), []);
  const geos = useMemo(() => curvas.map((c) => geometriaFita(c, 1.15, 0.02, 48, false)), [curvas]);
  const asfalto = useMemo(() => texAsfalto(), []);
  const terra = useMemo(() => texTerra(), []);

  return (
    <group>
      {geos.map((g, i) => (
        <mesh key={i} geometry={g} receiveShadow>
          <meshStandardMaterial
            map={i === 0 ? terra : asfalto}
            color={i === 0 ? '#8a6e50' : '#9aa0a8'}
            roughness={0.92}
            side={THREE.DoubleSide}
          />
        </mesh>
      ))}
    </group>
  );
}

export function FluxoMinério({ rodando }: { rodando: boolean }) {
  const curva = useMemo(() => new THREE.CatmullRomCurve3(FLUXO_PONTOS, false, 'catmullrom', 0.4), []);
  const bolas = useRef<THREE.InstancedMesh>(null);
  const COUNT = 16;
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const tempo = useRef(0);

  useFrame((_, delta) => {
    if (!bolas.current) return;
    if (rodando) tempo.current += delta * 0.22;

    for (let i = 0; i < COUNT; i++) {
      const t = (tempo.current + i / COUNT) % 1;
      const p = curva.getPointAt(t);
      dummy.position.set(p.x, p.y + Math.sin(t * Math.PI * 4) * 0.04, p.z);
      dummy.scale.setScalar(0.07 + (i % 3) * 0.02);
      dummy.updateMatrix();
      bolas.current.setMatrixAt(i, dummy.matrix);
    }
    bolas.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <group>
      <instancedMesh ref={bolas} args={[undefined, undefined, COUNT]}>
        <sphereGeometry args={[1, 8, 8]} />
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

export function Sinalizacao({ noite }: { noite: boolean }) {
  return (
    <group>
      <mesh castShadow position={[0, 0.4, 15.4]}>
        <cylinderGeometry args={[0.07, 0.09, 0.8, 10]} />
        <meshStandardMaterial color="#3a3a3a" roughness={0.8} metalness={0.4} />
      </mesh>
      <mesh castShadow position={[0, 0.92, 15.4]}>
        <boxGeometry args={[0.08, 0.55, 1.7]} />
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

function Infraestrutura() {
  const postes: [number, number][] = [
    [-8, -6], [3, -7], [10, 3], [-5, 8], [12, -10],
  ];

  return (
    <group>
      {postes.map(([x, z], i) => (
        <group key={i} position={[x, 0, z]}>
          <mesh castShadow position={[0, 0.7, 0]}>
            <cylinderGeometry args={[0.04, 0.06, 1.4, 10]} />
            <meshStandardMaterial color="#4a4a4a" roughness={0.7} metalness={0.5} />
          </mesh>
          <mesh position={[0, 1.38, 0]}>
            <boxGeometry args={[0.7, 0.04, 0.04]} />
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
