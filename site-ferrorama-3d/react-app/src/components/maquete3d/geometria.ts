import * as THREE from 'three';

/** Bitola visual das fotos: dois ferros prateados sobre dormente preto. */
export const BITOLA = 0.2;

const RX = 6.15;
const RZ = 3.75;
const R_CANTO = 1.85;

function yPonte(z: number) {
  const u = 1 - Math.min(1, Math.abs(z) / 1.7);
  return u > 0 ? u * u * 0.42 : 0;
}

function arco(
  cx: number,
  cz: number,
  r: number,
  a0: number,
  a1: number,
  n: number,
  yDe?: (x: number, z: number) => number
): THREE.Vector3[] {
  const pts: THREE.Vector3[] = [];
  for (let i = 0; i <= n; i++) {
    const a = a0 + ((a1 - a0) * i) / n;
    const x = cx + Math.cos(a) * r;
    const z = cz + Math.sin(a) * r;
    pts.push(new THREE.Vector3(x, yDe ? yDe(x, z) : 0, z));
  }
  return pts;
}

function reta(a: THREE.Vector3, b: THREE.Vector3, n: number): THREE.Vector3[] {
  const pts: THREE.Vector3[] = [];
  for (let i = 1; i <= n; i++) {
    pts.push(new THREE.Vector3().lerpVectors(a, b, i / n));
  }
  return pts;
}

/**
 * Circuito das fotos de montagem: estádio HO (retas + cantos em arco),
 * ponte elevada no leste, diagonal interna em S.
 */
export function criarTracado(): THREE.CatmullRomCurve3 {
  const cxE = RX - R_CANTO;
  const czN = RZ - R_CANTO;
  const cxW = -(RX - R_CANTO);
  const czS = -(RZ - R_CANTO);

  const pts: THREE.Vector3[] = [];
  // Leste (ponte) — de sul para norte
  const lesteSul = new THREE.Vector3(RX, yPonte(czS), czS);
  const lesteNorte = new THREE.Vector3(RX, yPonte(czN), czN);
  pts.push(lesteSul);
  for (let i = 1; i < 18; i++) {
    const z = czS + ((czN - czS) * i) / 18;
    pts.push(new THREE.Vector3(RX, yPonte(z), z));
  }
  pts.push(lesteNorte);
  // Canto NE
  pts.push(...arco(cxE, czN, R_CANTO, 0, Math.PI / 2, 12).slice(1));
  // Norte
  pts.push(
    ...reta(
      new THREE.Vector3(cxE, 0, RZ),
      new THREE.Vector3(cxW, 0, RZ),
      14
    )
  );
  // Canto NW
  pts.push(...arco(cxW, czN, R_CANTO, Math.PI / 2, Math.PI, 12).slice(1));
  // Oeste
  pts.push(
    ...reta(
      new THREE.Vector3(-RX, 0, czN),
      new THREE.Vector3(-RX, 0, czS),
      14
    )
  );
  // Canto SW
  pts.push(...arco(cxW, czS, R_CANTO, Math.PI, (3 * Math.PI) / 2, 12).slice(1));
  // Sul
  pts.push(
    ...reta(
      new THREE.Vector3(cxW, 0, -RZ),
      new THREE.Vector3(cxE, 0, -RZ),
      14
    )
  );
  // Canto SE
  pts.push(...arco(cxE, czS, R_CANTO, (3 * Math.PI) / 2, Math.PI * 2, 12).slice(1, -1));

  return new THREE.CatmullRomCurve3(pts, true, 'centripetal', 0.2);
}

/** Atalho em S — só visual, cabe dentro do estádio. */
export function criarDiagonal(): THREE.CatmullRomCurve3 {
  return new THREE.CatmullRomCurve3(
    [
      new THREE.Vector3(-3.6, 0, 2.15),
      new THREE.Vector3(-1.5, 0, 1.05),
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(1.5, 0, -1.05),
      new THREE.Vector3(3.6, 0, -2.15),
    ],
    false,
    'centripetal',
    0.25
  );
}

export function curvaParalela(
  base: THREE.CatmullRomCurve3,
  deslocamento: number,
  amostras = 260
): THREE.CatmullRomCurve3 {
  const pontos: THREE.Vector3[] = [];
  const tangente = new THREE.Vector3();
  const n = base.closed ? amostras : amostras + 1;

  for (let i = 0; i < n; i++) {
    const t = Math.min(i / amostras, 0.999999);
    const p = base.getPointAt(t);
    base.getTangentAt(t, tangente);
    const perpX = -tangente.z;
    const perpZ = tangente.x;
    const len = Math.hypot(perpX, perpZ) || 1;
    pontos.push(
      new THREE.Vector3(
        p.x + (perpX / len) * deslocamento,
        p.y,
        p.z + (perpZ / len) * deslocamento
      )
    );
  }

  return new THREE.CatmullRomCurve3(pontos, base.closed, 'catmullrom', 0.15);
}

export function matrizesDormentes(curva: THREE.CatmullRomCurve3, quantidade = 280): THREE.Matrix4[] {
  const matrizes: THREE.Matrix4[] = [];
  const tangente = new THREE.Vector3();
  const up = new THREE.Vector3(0, 1, 0);
  const n = curva.closed ? quantidade : quantidade;

  for (let i = 0; i < n; i++) {
    const t = curva.closed ? i / n : i / (n - 1 || 1);
    const tt = Math.min(t, 0.999999);
    const p = curva.getPointAt(tt);
    curva.getTangentAt(tt, tangente);
    const angulo = Math.atan2(tangente.x, tangente.z);
    const m = new THREE.Matrix4();
    m.compose(
      new THREE.Vector3(p.x, p.y + 0.022, p.z),
      new THREE.Quaternion().setFromAxisAngle(up, angulo),
      new THREE.Vector3(1, 1, 1)
    );
    matrizes.push(m);
  }

  return matrizes;
}

/** Trilho de perfil (prisma) deslocado da bitola, amostrado na curva-mãe — evita spline paralela torta. */
export function geometriaTrilho(
  curva: THREE.CatmullRomCurve3,
  offset: number,
  largura: number,
  altura: number,
  amostras = 220,
  fechada = curva.closed,
  yLift = 0.038
): THREE.BufferGeometry {
  const count = fechada ? amostras : amostras + 1;
  const pos: number[] = [];
  const idx: number[] = [];
  const tan = new THREE.Vector3();
  const hw = largura / 2;

  for (let i = 0; i < count; i++) {
    const t = i / amostras;
    const tt = Math.min(Math.max(t, 0), 0.999999);
    const p = curva.getPointAt(tt);
    curva.getTangentAt(tt, tan);
    const px = -tan.z;
    const pz = tan.x;
    const len = Math.hypot(px, pz) || 1;
    const ox = (px / len) * offset;
    const oz = (pz / len) * offset;
    const lx = (px / len) * hw;
    const lz = (pz / len) * hw;
    const cx = p.x + ox;
    const cz = p.z + oz;
    const y0 = p.y + yLift;
    pos.push(cx - lx, y0, cz - lz);
    pos.push(cx + lx, y0, cz + lz);
    pos.push(cx + lx, y0 + altura, cz + lz);
    pos.push(cx - lx, y0 + altura, cz - lz);
  }

  const wrap = fechada ? amostras : amostras + 1;
  const aneis = fechada ? amostras : amostras;
  for (let i = 0; i < aneis; i++) {
    const a = i * 4;
    const b = ((i + 1) % wrap) * 4;
    for (let k = 0; k < 4; k++) {
      const k2 = (k + 1) % 4;
      idx.push(a + k, a + k2, b + k, a + k2, b + k2, b + k);
    }
  }

  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setIndex(idx);
  g.computeVertexNormals();
  return g;
}

export function tMaisProximo(curva: THREE.CatmullRomCurve3, alvo: THREE.Vector3, amostras = 220): number {
  let bestT = 0;
  let bestD = Infinity;
  for (let i = 0; i < amostras; i++) {
    const t = i / amostras;
    const d = curva.getPointAt(t).distanceToSquared(alvo);
    if (d < bestD) {
      bestD = d;
      bestT = t;
    }
  }
  return bestT;
}

export function geometriaFita(
  curva: THREE.CatmullRomCurve3,
  largura: number,
  y = 0,
  amostras = 200,
  fechada = curva.closed
): THREE.BufferGeometry {
  const count = fechada ? amostras : amostras + 1;
  const pos: number[] = [];
  const nrm: number[] = [];
  const idx: number[] = [];
  const tangente = new THREE.Vector3();

  for (let i = 0; i < count; i++) {
    const t = i / amostras;
    const tt = Math.min(Math.max(t, 0), 0.999999);
    const p = curva.getPointAt(tt);
    curva.getTangentAt(tt, tangente);
    const px = -tangente.z;
    const pz = tangente.x;
    const len = Math.hypot(px, pz) || 1;
    const hx = (px / len) * (largura / 2);
    const hz = (pz / len) * (largura / 2);
    pos.push(p.x - hx, p.y + y, p.z - hz, p.x + hx, p.y + y, p.z + hz);
    nrm.push(0, 1, 0, 0, 1, 0);
  }

  const segs = fechada ? amostras : amostras;
  const wrap = fechada ? amostras : amostras + 1;
  for (let i = 0; i < segs; i++) {
    const a = i * 2;
    const b = a + 1;
    const n = ((i + 1) % wrap) * 2;
    const d = n + 1;
    idx.push(a, b, n, b, d, n);
  }

  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('normal', new THREE.Float32BufferAttribute(nrm, 3));
  g.setIndex(idx);
  return g;
}

export function posicionarNaCurva(
  objeto: THREE.Object3D,
  curva: THREE.CatmullRomCurve3,
  t: number,
  alturaY = 0
) {
  const frac = ((t % 1) + 1) % 1;
  const p = curva.getPointAt(frac);
  const tangente = curva.getTangentAt(frac);
  const horiz = Math.hypot(tangente.x, tangente.z) || 1;

  objeto.position.set(p.x, p.y + alturaY, p.z);
  objeto.rotation.set(
    -Math.atan2(tangente.y, horiz),
    Math.atan2(tangente.x, tangente.z),
    0
  );
}

export type RamoFerroviario = 'nenhum' | 'porto' | 'aeroporto' | 'diagonal';

/** Plataformas por dentro do oval — o trem não atravessa o prédio. */
export const ESTACAO_MINA = new THREE.Vector3(-5.15, 0, -1.15);
export const DESTINO_PORTO = new THREE.Vector3(4.55, 0, 2.65);
export const DESTINO_AEROPORTO = new THREE.Vector3(4.55, 0, -2.65);
/** Pontos no trilho onde o trem para (ao lado da estação). */
export const PARADA_MINA = new THREE.Vector3(-6.15, 0, -1.15);
export const PARADA_PORTO = new THREE.Vector3(6.15, 0, 2.45);
export const PARADA_AERO = new THREE.Vector3(6.15, 0, -2.45);

const RAMO = {
  porto: { tEntrada: 0.08, tSaida: 0.22 },
  aeroporto: { tEntrada: 0.78, tSaida: 0.92 },
} as const;

function pontosDoRamo(
  principal: THREE.CatmullRomCurve3,
  tipo: 'porto' | 'aeroporto'
): THREE.Vector3[] {
  const destino = tipo === 'porto' ? DESTINO_PORTO : DESTINO_AEROPORTO;
  const { tEntrada, tSaida } = RAMO[tipo];
  const entrada = principal.getPointAt(tEntrada);
  const saida = principal.getPointAt(tSaida);
  const tanE = principal.getTangentAt(tEntrada);
  const tanS = principal.getTangentAt(tSaida);
  const lado = tipo === 'porto' ? 1 : -1;

  return [
    entrada.clone(),
    entrada.clone().addScaledVector(tanE, 1.1),
    new THREE.Vector3(destino.x - 0.9, 0, destino.z - lado * 0.7),
    destino.clone(),
    new THREE.Vector3(destino.x - 0.9, 0, destino.z + lado * 0.7),
    saida.clone().addScaledVector(tanS, -1.1),
    saida.clone(),
  ];
}

export function criarRamoVisual(
  principal: THREE.CatmullRomCurve3,
  tipo: 'porto' | 'aeroporto'
): THREE.CatmullRomCurve3 {
  return new THREE.CatmullRomCurve3(pontosDoRamo(principal, tipo), false, 'catmullrom', 0.32);
}

export function tracadoComDesvio(
  principal: THREE.CatmullRomCurve3,
  desvios: number[]
): THREE.CatmullRomCurve3 {
  const tipo = ramoAtivo(desvios);
  if (tipo === 'nenhum') return principal;

  if (tipo === 'diagonal') {
    const diag = criarDiagonal();
    const tEnt = 0.18;
    const tSai = 0.68;
    const pontos: THREE.Vector3[] = [];
    const n = 40;
    for (let i = 0; i <= n; i++) pontos.push(principal.getPointAt((i / n) * tEnt));
    for (let i = 1; i < 24; i++) pontos.push(diag.getPointAt(i / 24));
    for (let i = 0; i <= n; i++) pontos.push(principal.getPointAt(tSai + (i / n) * (1 - tSai)));
    return new THREE.CatmullRomCurve3(pontos, true, 'catmullrom', 0.25);
  }

  const { tEntrada, tSaida } = RAMO[tipo];
  const pontos: THREE.Vector3[] = [];
  const amostras = 48;
  for (let i = 0; i <= amostras; i++) {
    pontos.push(principal.getPointAt((i / amostras) * tEntrada));
  }
  pontos.push(...pontosDoRamo(principal, tipo).slice(1, -1));
  for (let i = 0; i <= amostras; i++) {
    pontos.push(principal.getPointAt(tSaida + (i / amostras) * (1 - tSaida)));
  }
  return new THREE.CatmullRomCurve3(pontos, true, 'catmullrom', 0.28);
}

export function ramoAtivo(desvios: number[]): RamoFerroviario {
  if (desvios[2] === 1 || desvios[3] === 1) return 'porto';
  if (desvios[2] === 2 || desvios[3] === 2) return 'aeroporto';
  if (desvios[0] === 1 || desvios[1] === 1) return 'diagonal';
  return 'nenhum';
}

export function criarPercursoCaminhao(): THREE.CatmullRomCurve3 {
  const pts: THREE.Vector3[] = [];
  const n = 20;
  const a0 = Math.atan2(1.35, 3.15);
  for (let i = 0; i < n; i++) {
    const a = a0 + (i / n) * Math.PI * 2;
    pts.push(new THREE.Vector3(Math.cos(a) * 3.55, 0, Math.sin(a) * 3.35));
  }
  return new THREE.CatmullRomCurve3(pts, true, 'centripetal', 0.2);
}

/** Pilares da ponte no leste, como nas fotos. */
export const PILARES_PONTE: [number, number, number][] = [
  [6.15, 0, -1.15],
  [6.15, 0, -0.4],
  [6.15, 0, 0.4],
  [6.15, 0, 1.15],
];
