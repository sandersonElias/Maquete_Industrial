import { useRef, useMemo, useLayoutEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { VITRINE } from './modulos';

/**
 * A "casca" do diorama: vitrine de acrílico, pedestal, terreno com grama,
 * ruas asfaltadas, árvores, veículos e vegetação iluminada.
 *
 * Referência: maquetes de estande de feira, onde o modelo fica sob uma caixa
 * transparente sobre um pedestal escuro iluminado.
 */

export const PLACA = { largura: 40, profundidade: 26 };
const ALTURA_VITRINE = 11;

/* ============================================================
   Pedestal — o móvel escuro embaixo da vitrine
   ============================================================ */

export function Pedestal() {
  const { largura, profundidade } = PLACA;

  return (
    <group>
      {/* Corpo do móvel */}
      <mesh position={[0, -5.4, 0]} receiveShadow>
        <boxGeometry args={[largura + 1.4, 10, profundidade + 1.4]} />
        <meshStandardMaterial color="#0d0f13" roughness={0.85} metalness={0.15} />
      </mesh>

      {/* Tampo com moldura metálica clara, como na referência */}
      <mesh position={[0, -0.32, 0]} receiveShadow>
        <boxGeometry args={[largura + 1.8, 0.5, profundidade + 1.8]} />
        <meshStandardMaterial color="#3b4048" roughness={0.4} metalness={0.8} />
      </mesh>

      {/* Faixa de luz sob o tampo — o brilho que contorna a base */}
      <mesh position={[0, -0.66, 0]}>
        <boxGeometry args={[largura + 1.5, 0.12, profundidade + 1.5]} />
        <meshStandardMaterial
          color={VITRINE.ciano}
          emissive={VITRINE.ciano}
          emissiveIntensity={2.2}
          toneMapped={false}
        />
      </mesh>

      {/* Letreiro iluminado na frente do pedestal */}
      <group position={[0, -3.2, profundidade / 2 + 1.05]}>
        <mesh>
          <planeGeometry args={[13, 2.6]} />
          <meshStandardMaterial
            color="#0a0c10"
            emissive={VITRINE.azul}
            emissiveIntensity={0.35}
            roughness={0.5}
          />
        </mesh>
        <mesh position={[0, 0, 0.03]}>
          <planeGeometry args={[12.4, 2]} />
          <meshBasicMaterial map={useTexturaLetreiro()} transparent toneMapped={false} />
        </mesh>
      </group>

      {/* Placa preta com o subtítulo */}
      <mesh position={[0, -6.1, profundidade / 2 + 1.05]}>
        <planeGeometry args={[15, 1.5]} />
        <meshBasicMaterial map={useTexturaPlaca()} transparent toneMapped={false} />
      </mesh>
    </group>
  );
}

/** Letreiro "FERRORAMA" desenhado em canvas — sem baixar fonte nem imagem. */
function useTexturaLetreiro() {
  return useMemo(() => {
    const c = document.createElement('canvas');
    c.width = 1024;
    c.height = 168;
    const ctx = c.getContext('2d')!;
    ctx.clearRect(0, 0, c.width, c.height);

    ctx.font = 'bold 112px Archivo, Inter, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    // Halo azul em volta das letras, como letreiro de acrílico iluminado
    ctx.shadowColor = VITRINE.azul;
    ctx.shadowBlur = 34;
    ctx.fillStyle = '#eaf4ff';
    ctx.fillText('FERRORAMA', c.width / 2, c.height / 2);
    ctx.shadowBlur = 0;
    ctx.fillText('FERRORAMA', c.width / 2, c.height / 2);

    const t = new THREE.CanvasTexture(c);
    t.anisotropy = 4;
    return t;
  }, []);
}

function useTexturaPlaca() {
  return useMemo(() => {
    const c = document.createElement('canvas');
    c.width = 1024;
    c.height = 104;
    const ctx = c.getContext('2d')!;
    ctx.fillStyle = '#08090c';
    ctx.fillRect(0, 0, c.width, c.height);
    ctx.strokeStyle = '#2b3038';
    ctx.lineWidth = 3;
    ctx.strokeRect(2, 2, c.width - 4, c.height - 4);

    ctx.font = '600 42px Inter, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#c3ccd8';
    ctx.letterSpacing = '6px';
    ctx.fillText('MINA · FERROVIA · PORTO · AEROPORTO', c.width / 2, c.height / 2);

    const t = new THREE.CanvasTexture(c);
    t.anisotropy = 4;
    return t;
  }, []);
}

/* ============================================================
   Vitrine — a caixa de acrílico
   ============================================================ */

export function Vitrine() {
  const { largura, profundidade } = PLACA;
  const l = largura + 1.2;
  const p = profundidade + 1.2;
  const h = ALTURA_VITRINE;

  /* Transmissão de verdade (transmission/MeshTransmissionMaterial) obriga um
     passe extra de render da cena inteira. Em notebook com vídeo integrado isso
     derruba o FPS, então o acrílico aqui é vidro "falso": transparente, liso e
     com reflexo especular. O que vende a ilusão são as quinas destacadas. */
  const material = (
    <meshPhysicalMaterial
      color="#cfe4f5"
      transparent
      opacity={0.07}
      roughness={0.03}
      metalness={0}
      clearcoat={1}
      clearcoatRoughness={0.03}
      side={THREE.DoubleSide}
      depthWrite={false}
    />
  );

  const faces: Array<{ pos: [number, number, number]; rot: [number, number, number]; tam: [number, number] }> = [
    { pos: [0, h, 0], rot: [-Math.PI / 2, 0, 0], tam: [l, p] },
    { pos: [0, h / 2, p / 2], rot: [0, 0, 0], tam: [l, h] },
    { pos: [0, h / 2, -p / 2], rot: [0, Math.PI, 0], tam: [l, h] },
    { pos: [l / 2, h / 2, 0], rot: [0, Math.PI / 2, 0], tam: [p, h] },
    { pos: [-l / 2, h / 2, 0], rot: [0, -Math.PI / 2, 0], tam: [p, h] },
  ];

  return (
    /* raycast desligado: a vitrine não pode roubar os cliques dos módulos */
    <group raycast={() => null}>
      {faces.map((f, i) => (
        <mesh key={i} position={f.pos} rotation={f.rot} raycast={() => null}>
          <planeGeometry args={f.tam} />
          {material}
        </mesh>
      ))}

      {/* Quinas — é o que faz o olho ler "caixa de vidro" */}
      <lineSegments position={[0, h / 2, 0]} raycast={() => null}>
        <edgesGeometry args={[new THREE.BoxGeometry(l, h, p)]} />
        <lineBasicMaterial color="#8fb8d8" transparent opacity={0.5} />
      </lineSegments>

      {/* Perfil metálico na base da vitrine */}
      <mesh position={[0, 0.06, 0]} raycast={() => null}>
        <boxGeometry args={[l + 0.15, 0.14, p + 0.15]} />
        <meshStandardMaterial color="#59616d" roughness={0.35} metalness={0.85} />
      </mesh>
    </group>
  );
}

/* ============================================================
   Terreno — grama, ruas e vegetação iluminada
   ============================================================ */

/** Caminho fechado das ruas: um anel que contorna o campus. */
export const ROTA_RUAS = new THREE.CatmullRomCurve3(
  (
    [
      [-15.2, 11.4], [-7.6, 11.4], [0, 11.4], [7.6, 11.4], [15.2, 11.4],
      [16.42, 11.16], [17.46, 10.46], [18.16, 9.42], [18.4, 8.2],
      [18.4, 4.1], [18.4, 0], [18.4, -4.1], [18.4, -8.2],
      [18.16, -9.42], [17.46, -10.46], [16.42, -11.16], [15.2, -11.4],
      [7.6, -11.4], [0, -11.4], [-7.6, -11.4], [-15.2, -11.4],
      [-16.42, -11.16], [-17.46, -10.46], [-18.16, -9.42], [-18.4, -8.2],
      [-18.4, -4.1], [-18.4, 0], [-18.4, 4.1], [-18.4, 8.2],
      [-18.16, 9.42], [-17.46, 10.46], [-16.42, 11.16],
    ] as Array<[number, number]>
  ).map(([x, z]) => new THREE.Vector3(x, 0, z)),
  true,
  'catmullrom',
  0.5
);

export function Terreno() {
  const { largura, profundidade } = PLACA;

  return (
    <group>
      {/* Grama */}
      <mesh receiveShadow rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]}>
        <planeGeometry args={[largura, profundidade]} />
        <meshStandardMaterial color="#33633a" roughness={1} />
      </mesh>

      {/* Manchas de tom mais claro, para a grama não ficar chapada */}
      {[
        [0, 9.2, 11, 4], [0, -9.2, 11, 4], [-8.4, 7.5, 3.4, 4], [8.4, -7.2, 3.4, 4],
      ].map(([x, z, w, d], i) => (
        <mesh key={i} rotation={[-Math.PI / 2, 0, 0]} position={[x, 0.015, z]} receiveShadow>
          <planeGeometry args={[w, d]} />
          <meshStandardMaterial color="#3d7444" roughness={1} transparent opacity={0.75} />
        </mesh>
      ))}

      {/* Vegetação com LED verde por baixo — o brilho do chão na referência */}
      {[
        [0, 9.2, 6.5, 2.6], [0, -9.2, 6.5, 2.6], [-8.35, 7.5, 3, 2.2], [8.35, -7.2, 3, 2.2],
      ].map(([x, z, w, d], i) => (
        <mesh key={i} rotation={[-Math.PI / 2, 0, 0]} position={[x, 0.02, z]}>
          <planeGeometry args={[w, d]} />
          <meshStandardMaterial
            color={VITRINE.verde}
            emissive={VITRINE.verde}
            emissiveIntensity={1.5}
            transparent
            opacity={0.55}
            toneMapped={false}
          />
        </mesh>
      ))}

      <Ruas />
    </group>
  );
}

/** Asfalto seguindo a rota, com as faixas centrais instanciadas. */
function Ruas() {
  const faixas = useRef<THREE.InstancedMesh>(null);
  const QTD = 96;

  const matrizes = useMemo(() => {
    const ms: THREE.Matrix4[] = [];
    const tg = new THREE.Vector3();
    for (let i = 0; i < QTD; i++) {
      const t = i / QTD;
      const p = ROTA_RUAS.getPointAt(t);
      ROTA_RUAS.getTangentAt(t, tg);
      const m = new THREE.Matrix4();
      m.compose(
        new THREE.Vector3(p.x, 0.045, p.z),
        new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), Math.atan2(tg.x, tg.z)),
        new THREE.Vector3(1, 1, 1)
      );
      ms.push(m);
    }
    return ms;
  }, []);

  useLayoutEffect(() => {
    if (!faixas.current) return;
    matrizes.forEach((m, i) => faixas.current!.setMatrixAt(i, m));
    faixas.current.instanceMatrix.needsUpdate = true;
  }, [matrizes]);

  return (
    <group>
      {/* Leito asfaltado */}
      <mesh position={[0, 0.03, 0]} receiveShadow>
        <tubeGeometry args={[ROTA_RUAS, 220, 1.0, 3, true]} />
        <meshStandardMaterial color="#24272d" roughness={0.95} />
      </mesh>

      {/* Faixa central tracejada */}
      <instancedMesh ref={faixas} args={[undefined, undefined, QTD]}>
        <boxGeometry args={[0.09, 0.01, 0.7]} />
        <meshStandardMaterial color="#d3d8de" roughness={0.7} />
      </instancedMesh>
    </group>
  );
}

/* ============================================================
   Árvores — duas malhas instanciadas (tronco e copa)
   ============================================================ */

/* Posições geradas por amostragem com rejeição e conferidas fora do navegador:
   nenhuma árvore cai no asfalto, sobre um lote ou fora da placa. Lista fixa em
   vez de sorteio em tempo de execução, para o bosque ficar igual toda vez. */
const POSICOES_ARVORES: Array<[number, number, number]> = [[-1.17, 8.39, 0.82], [2.12, 9.03, 0.81], [1.7, 7.39, 0.59], [1.19, 9.18, 0.65], [0.63, 9.17, 0.74], [0.69, 9.33, 0.89], [2.08, 8.13, 0.92], [1.88, 10, 0.8], [0.26, 9.54, 0.91], [-0.17, 6.79, 0.96], [1.15, 7.28, 0.57], [-0.87, 7.85, 0.7], [-8.14, 6.69, 0.99], [-7.73, 6.52, 0.73], [-8.58, 6.37, 0.75], [-7.36, 8.09, 0.81], [-8.26, 6.83, 0.61], [-7.66, 6.56, 0.86], [-7.67, 7.19, 0.79], [7.41, 8.24, 0.89], [8.43, 8.15, 0.86], [8.57, 6.21, 0.77], [7.63, 8.29, 0.68], [7.99, 8.83, 0.69], [8.05, 7.3, 0.99], [7.96, 6.57, 0.64], [0.31, -7.47, 0.94], [-0.06, -9.14, 0.76], [2.01, -7.57, 0.69], [1.3, -9.41, 0.66], [-1.63, -9.15, 0.94], [-2.52, -9.3, 0.94], [-2.49, -9.26, 0.74], [-1.47, -8.85, 0.92], [0.55, -8.03, 0.72], [0.91, -8.91, 0.88], [-1.31, -9.65, 0.64], [0.07, -7.06, 0.61], [-7.99, -7.93, 0.71], [-8.51, -7.64, 0.97], [-7.39, -6.72, 0.88], [-8.24, -8.27, 0.58], [-7.59, -7.79, 0.77], [-7.79, -8.28, 0.63], [8.46, -8.26, 0.56], [7.3, -6.5, 0.77], [8.62, -6.6, 0.63], [7.48, -7.82, 0.71], [8.08, -7.61, 0.98], [7.28, -6.76, 0.57], [-8.33, 0.01, 0.61], [-8.6, 0.01, 1.04], [-8.5, 0.36, 0.66], [-8.65, 0.61, 0.81], [-8.68, -0.23, 0.69], [8.58, -0.83, 0.8], [8.34, -0.24, 0.61], [8.15, 0.43, 0.68], [8.8, -0.58, 0.98], [9.13, -0.07, 0.89], [-16.68, -0.39, 1.01], [-16.17, -0.25, 0.98], [-16.99, -0.03, 0.97], [-16.99, -0.18, 0.77], [16.74, -0.03, 0.84], [16.8, -0.05, 0.69], [16.87, 0.5, 0.82], [16.26, -0.46, 1.02]];

export function Arvores() {
  const troncos = useRef<THREE.InstancedMesh>(null);
  const copas = useRef<THREE.InstancedMesh>(null);
  const qtd = POSICOES_ARVORES.length;

  useLayoutEffect(() => {
    const m = new THREE.Matrix4();
    POSICOES_ARVORES.forEach(([x, z, esc], i) => {
      m.compose(
        new THREE.Vector3(x, 0.18 * esc, z),
        new THREE.Quaternion(),
        new THREE.Vector3(esc, esc, esc)
      );
      troncos.current?.setMatrixAt(i, m);
      m.compose(
        new THREE.Vector3(x, 0.62 * esc, z),
        new THREE.Quaternion(),
        new THREE.Vector3(esc, esc, esc)
      );
      copas.current?.setMatrixAt(i, m);
    });
    if (troncos.current) troncos.current.instanceMatrix.needsUpdate = true;
    if (copas.current) copas.current.instanceMatrix.needsUpdate = true;
  }, []);

  return (
    <group>
      <instancedMesh ref={troncos} args={[undefined, undefined, qtd]} castShadow>
        <cylinderGeometry args={[0.055, 0.075, 0.36, 5]} />
        <meshStandardMaterial color="#4a3728" roughness={1} />
      </instancedMesh>
      <instancedMesh ref={copas} args={[undefined, undefined, qtd]} castShadow>
        <coneGeometry args={[0.34, 0.9, 7]} />
        <meshStandardMaterial color="#2f6b39" roughness={1} flatShading />
      </instancedMesh>
    </group>
  );
}

/* ============================================================
   Veículos circulando pelas ruas
   ============================================================ */

const VEICULOS = [
  { cor: '#e8eaed', comp: 0.62, alt: 0.24, vel: 0.026, off: 0.0, faixa: 0.46 },
  { cor: '#4a5560', comp: 0.58, alt: 0.22, vel: 0.021, off: 0.17, faixa: 0.46 },
  { cor: '#c8ccd2', comp: 1.15, alt: 0.36, vel: 0.016, off: 0.33, faixa: 0.46 },
  { cor: '#FFB800', comp: 1.3, alt: 0.4, vel: 0.014, off: 0.52, faixa: 0.46 },
  { cor: '#8f98a4', comp: 0.6, alt: 0.24, vel: 0.024, off: 0.68, faixa: -0.46 },
  { cor: '#e8eaed', comp: 1.4, alt: 0.38, vel: 0.018, off: 0.84, faixa: -0.46 },
  { cor: '#3D9EFF', comp: 0.62, alt: 0.24, vel: 0.028, off: 0.42, faixa: -0.46 },
];

export function Veiculos({ rodando }: { rodando: boolean }) {
  const refs = useRef<(THREE.Group | null)[]>([]);
  const tempo = useRef(0);

  const posicionar = (i: number, t: number) => {
    const v = VEICULOS[i];
    const g = refs.current[i];
    if (!g) return;
    const frac = ((t + v.off) % 1 + 1) % 1;
    const p = ROTA_RUAS.getPointAt(frac);
    const tg = ROTA_RUAS.getTangentAt(frac);
    // Desloca para a faixa da direita ou da esquerda
    const px = -tg.z;
    const pz = tg.x;
    const len = Math.hypot(px, pz) || 1;
    g.position.set(p.x + (px / len) * v.faixa, v.alt / 2 + 0.06, p.z + (pz / len) * v.faixa);
    // Quem anda na faixa oposta aponta para trás
    g.rotation.set(0, Math.atan2(tg.x, tg.z) + (v.faixa < 0 ? Math.PI : 0), 0);
  };

  useLayoutEffect(() => {
    VEICULOS.forEach((_, i) => posicionar(i, 0));
  }, []);

  useFrame((_, delta) => {
    if (rodando) tempo.current += Math.min(delta, 0.05);
    VEICULOS.forEach((v, i) => posicionar(i, tempo.current * v.vel * 40));
  });

  return (
    <group>
      {VEICULOS.map((v, i) => (
        <group key={i} ref={(el) => { refs.current[i] = el; }}>
          <mesh castShadow>
            <boxGeometry args={[0.3, v.alt, v.comp]} />
            <meshStandardMaterial color={v.cor} roughness={0.5} metalness={0.25} />
          </mesh>
          {/* Faróis */}
          <mesh position={[0, 0, v.comp / 2 + 0.01]}>
            <boxGeometry args={[0.2, 0.05, 0.02]} />
            <meshStandardMaterial
              color="#fff6d5"
              emissive="#ffe9a0"
              emissiveIntensity={2}
              toneMapped={false}
            />
          </mesh>
        </group>
      ))}
    </group>
  );
}

/* ============================================================
   Turbinas eólicas
   ============================================================ */

export function TurbinasEolicas({ rodando }: { rodando: boolean }) {
  const helices = useRef<(THREE.Group | null)[]>([]);
  const locais: Array<[number, number, number]> = [
    [-17.1, 2.6, 1], [-17.1, -2.6, 0.88], [17.1, 2.6, 0.82],
  ];

  useFrame((_, delta) => {
    if (!rodando) return;
    helices.current.forEach((h, i) => {
      if (h) h.rotation.z += delta * (0.7 + i * 0.12);
    });
  });

  return (
    <group>
      {locais.map(([x, z, esc], i) => (
        <group key={i} position={[x, 0, z]} scale={esc}>
          <mesh castShadow position={[0, 1.5, 0]}>
            <cylinderGeometry args={[0.06, 0.11, 3, 8]} />
            <meshStandardMaterial color="#eef1f4" roughness={0.4} metalness={0.3} />
          </mesh>
          <mesh position={[0, 3.02, 0.1]}>
            <boxGeometry args={[0.16, 0.16, 0.36]} />
            <meshStandardMaterial color="#e2e6ea" roughness={0.4} />
          </mesh>
          <group ref={(el) => { helices.current[i] = el; }} position={[0, 3.02, 0.3]}>
            {[0, 1, 2].map((b) => (
              <mesh key={b} rotation={[0, 0, (b * Math.PI * 2) / 3]} castShadow>
                <boxGeometry args={[0.07, 1.5, 0.03]} />
                <meshStandardMaterial color="#f4f7fa" roughness={0.35} />
              </mesh>
            ))}
          </group>
        </group>
      ))}
    </group>
  );
}

/* ============================================================
   Painéis solares
   ============================================================ */

export function PainelSolar({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      {[0, 1, 2].map((i) => (
        <group key={i} position={[i * 1.05 - 1.05, 0, 0]}>
          <mesh castShadow position={[0, 0.28, 0]} rotation={[-0.55, 0, 0]}>
            <boxGeometry args={[0.92, 0.04, 0.66]} />
            <meshStandardMaterial color="#132a52" roughness={0.22} metalness={0.75} />
          </mesh>
          <mesh position={[0, 0.13, 0.06]}>
            <cylinderGeometry args={[0.03, 0.03, 0.28, 6]} />
            <meshStandardMaterial color="#7d858f" metalness={0.7} roughness={0.4} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

/* ============================================================
   Esferas de armazenamento — o elemento mais marcante da referência
   ============================================================ */

export function EsferasArmazenamento({ position }: { position: [number, number, number] }) {
  const locais: Array<[number, number, number]> = [
    [0, 0, 1], [1.5, 0.5, 0.78], [0.6, 1.9, 0.68], [2.5, 1.9, 0.6],
  ];

  return (
    <group position={position}>
      {locais.map(([x, z, esc], i) => (
        <group key={i} position={[x, 0, z]} scale={esc}>
          {/* Pernas */}
          {[0, 1, 2, 3].map((n) => {
            const a = (n / 4) * Math.PI * 2 + Math.PI / 4;
            return (
              <mesh key={n} castShadow position={[Math.cos(a) * 0.42, 0.3, Math.sin(a) * 0.42]}>
                <cylinderGeometry args={[0.045, 0.045, 0.6, 6]} />
                <meshStandardMaterial color="#8d959e" metalness={0.7} roughness={0.4} />
              </mesh>
            );
          })}
          <mesh castShadow position={[0, 1.1, 0]}>
            <sphereGeometry args={[0.66, 20, 16]} />
            <meshStandardMaterial color="#eef1f5" roughness={0.32} metalness={0.2} />
          </mesh>
          {/* Brilho azul por baixo da esfera */}
          <mesh position={[0, 0.14, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <circleGeometry args={[0.75, 20]} />
            <meshBasicMaterial
              color={VITRINE.azul}
              transparent
              opacity={0.5}
              blending={THREE.AdditiveBlending}
              depthWrite={false}
            />
          </mesh>
          <pointLight position={[0, 0.5, 0]} color={VITRINE.azul} intensity={1.6} distance={2.6} />
        </group>
      ))}
    </group>
  );
}

/* ============================================================
   Feixe de luz vertical
   ============================================================ */

export function FeixeLuz({
  position,
  cor = VITRINE.azul,
  altura = 5,
  raio = 0.65,
}: {
  position: [number, number, number];
  cor?: string;
  altura?: number;
  raio?: number;
}) {
  const malha = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (!malha.current) return;
    const mat = malha.current.material as THREE.MeshBasicMaterial;
    mat.opacity = 0.14 + Math.sin(state.clock.elapsedTime * 1.6) * 0.05;
  });

  return (
    <mesh ref={malha} position={[position[0], position[1] + altura / 2, position[2]]} raycast={() => null}>
      {/* Cone invertido: mais fechado embaixo, aberto em cima */}
      <cylinderGeometry args={[raio * 2.1, raio, altura, 18, 1, true]} />
      <meshBasicMaterial
        color={cor}
        transparent
        opacity={0.16}
        side={THREE.DoubleSide}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </mesh>
  );
}

/* ============================================================
   Tubulação neon ligando os módulos
   ============================================================ */

export function TubulacaoNeon({ pontos }: { pontos: Array<[number, number]> }) {
  const curva = useMemo(
    () =>
      new THREE.CatmullRomCurve3(
        pontos.map(([x, z]) => new THREE.Vector3(x, 0.16, z)),
        false,
        'catmullrom',
        0.4
      ),
    [pontos]
  );

  return (
    <group raycast={() => null}>
      <mesh raycast={() => null}>
        <tubeGeometry args={[curva, 60, 0.075, 6, false]} />
        <meshStandardMaterial
          color={VITRINE.ciano}
          emissive={VITRINE.ciano}
          emissiveIntensity={2.4}
          toneMapped={false}
        />
      </mesh>
      {/* Halo em volta do tubo, para dar a impressão de brilho sem bloom */}
      <mesh raycast={() => null}>
        <tubeGeometry args={[curva, 60, 0.2, 6, false]} />
        <meshBasicMaterial
          color={VITRINE.ciano}
          transparent
          opacity={0.14}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>
    </group>
  );
}
