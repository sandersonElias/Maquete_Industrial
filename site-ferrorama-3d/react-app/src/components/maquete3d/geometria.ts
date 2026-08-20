import * as THREE from 'three';

const _alvoLook = new THREE.Vector3();

/** Bitola visual das fotos: dois ferros prateados sobre dormente preto. */
export const BITOLA = 0.2;

export const RX = 8.55;
export const RZ = 5.2;
const R_CANTO = 2.25;

/** Trilho atravessa o morro no túnel, no nível da placa. */
export function yMorroLeste(_z: number) {
  return 0;
}

/** Piso do túnel no morro oeste — quase nivelado com o lastro. */
export function yTunelOeste(_z: number) {
  return 0.02;
}

export const LAYOUT = {
  mineradora: [-17.2, 0, -9.4] as [number, number, number],
  ferrovia: [0, 0, 0] as [number, number, number],
  porto: [17.6, 0, 8.6] as [number, number, number],
  controle: [-5.8, 0, 13.2] as [number, number, number],
};

export function geometriaMorro(raio: number, altura: number, segs = 36) {
  const pts = [
    new THREE.Vector2(0.04, 0),
    new THREE.Vector2(raio * 1.05, 0.03),
    new THREE.Vector2(raio * 0.9, altura * 0.28),
    new THREE.Vector2(raio * 0.58, altura * 0.6),
    new THREE.Vector2(raio * 0.24, altura * 0.9),
    new THREE.Vector2(0.05, altura),
  ];
  return new THREE.LatheGeometry(pts, segs);
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
 * Estádio HO maior: morro leste (subida/descida), túnel no oeste.
 */
export function criarTracado(): THREE.CatmullRomCurve3 {
  const cxE = RX - R_CANTO;
  const czN = RZ - R_CANTO;
  const cxW = -(RX - R_CANTO);
  const czS = -(RZ - R_CANTO);

  const pts: THREE.Vector3[] = [];
  const lesteSul = new THREE.Vector3(RX, yMorroLeste(czS), czS);
  const lesteNorte = new THREE.Vector3(RX, yMorroLeste(czN), czN);
  pts.push(lesteSul);
  for (let i = 1; i < 22; i++) {
    const z = czS + ((czN - czS) * i) / 22;
    pts.push(new THREE.Vector3(RX, yMorroLeste(z), z));
  }
  pts.push(lesteNorte);
  pts.push(...arco(cxE, czN, R_CANTO, 0, Math.PI / 2, 22).slice(1));
  pts.push(...reta(new THREE.Vector3(cxE, 0, RZ), new THREE.Vector3(cxW, 0, RZ), 20));
  pts.push(...arco(cxW, czN, R_CANTO, Math.PI / 2, Math.PI, 22).slice(1));
  for (let i = 1; i <= 24; i++) {
    const z = czN + ((czS - czN) * i) / 24;
    pts.push(new THREE.Vector3(-RX, yTunelOeste(z), z));
  }
  pts.push(...arco(cxW, czS, R_CANTO, Math.PI, (3 * Math.PI) / 2, 22).slice(1));
  pts.push(...reta(new THREE.Vector3(cxW, 0, -RZ), new THREE.Vector3(cxE, 0, -RZ), 20));
    pts.push(...arco(cxE, czS, R_CANTO, (3 * Math.PI) / 2, Math.PI * 2, 22).slice(1, -1));

  return new THREE.CatmullRomCurve3(densificar(pts, 0.28, true), true, 'catmullrom', 0.02);
}

function densificar(pts: THREE.Vector3[], step: number, closed: boolean) {
  const out: THREE.Vector3[] = [];
  const n = pts.length;
  const last = closed ? n : n - 1;
  for (let i = 0; i < last; i++) {
    const a = pts[i];
    const b = pts[(i + 1) % n];
    const d = a.distanceTo(b);
    const segs = Math.max(1, Math.ceil(d / Math.max(step, 1e-4)));
    if (i === 0) out.push(a.clone());
    for (let k = 1; k <= segs; k++) {
      if (closed && i === last - 1 && k === segs) continue;
      out.push(new THREE.Vector3().lerpVectors(a, b, k / segs));
    }
  }
  return out;
}

/** Atalho em S — só visual, cabe dentro do estádio. */
export function criarDiagonal(): THREE.CatmullRomCurve3 {
  return new THREE.CatmullRomCurve3(
    densificar(PONTOS_DIAGONAL.map((p) => new THREE.Vector3(...p)), 0.28, false),
    false,
    'catmullrom',
    0.02
  );
}

export function criarEstradasLogistica(): THREE.CatmullRomCurve3[] {
  const m = LAYOUT.mineradora;
  const p = LAYOUT.porto;
  return [
    new THREE.CatmullRomCurve3(
      [
        new THREE.Vector3(-12.55, 0.03, -6.75),
        new THREE.Vector3(-11.2, 0.03, -5.85),
        new THREE.Vector3(-9.7, 0.03, -4.95),
        new THREE.Vector3(-8.15, 0.03, -4.1),
      ],
      false,
      'centripetal',
      0.35
    ),
    new THREE.CatmullRomCurve3(
      [
        new THREE.Vector3(8.6, 0.03, 3.4),
        new THREE.Vector3(12.8, 0.03, 6.1),
        new THREE.Vector3(p[0] - 3.4, 0.03, p[2] - 1.2),
      ],
      false,
      'centripetal',
      0.35
    ),
  ];
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

  const uv: number[] = [];
  let comprimento = 0;
  const wrapUv = fechada ? amostras : amostras + 1;
  const lens: number[] = [0];
  for (let i = 1; i < wrapUv; i++) {
    const ax = pos[(i - 1) * 6];
    const az = pos[(i - 1) * 6 + 2];
    const bx = pos[i * 6];
    const bz = pos[i * 6 + 2];
    comprimento += Math.hypot(bx - ax, bz - az);
    lens.push(comprimento);
  }
  const uScale = Math.max(comprimento / largura, 1);
  for (let i = 0; i < wrapUv; i++) {
    const u = (lens[i] / (comprimento || 1)) * uScale;
    uv.push(0, u, 1, u);
  }

  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('normal', new THREE.Float32BufferAttribute(nrm, 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  g.setIndex(idx);
  return g;
}

export function posicionarNaCurva(
  objeto: THREE.Object3D,
  curva: THREE.CatmullRomCurve3,
  t: number,
  alturaY = 0,
  /** Código: nariz em +Z. GLB do Blender: nariz em −Z (eixo glTF). */
  frente: 'plusZ' | 'minusZ' = 'plusZ'
) {
  const frac = ((t % 1) + 1) % 1;
  const p = curva.getPointAt(frac);
  const tangente = curva.getTangentAt(frac);
  const horiz = Math.hypot(tangente.x, tangente.z) || 1;

  objeto.position.set(p.x, p.y + alturaY, p.z);
  if (frente === 'minusZ') {
    objeto.up.set(0, 1, 0);
    _alvoLook.set(p.x + tangente.x, p.y + alturaY + tangente.y, p.z + tangente.z);
    objeto.lookAt(_alvoLook);
    return;
  }
  objeto.rotation.set(
    -Math.atan2(tangente.y, horiz),
    Math.atan2(tangente.x, tangente.z),
    0
  );
}

export type RamoFerroviario = 'nenhum' | 'porto' | 'diagonal' | 'mina';

/** Plataformas por dentro do oval — longe o bastante pra não invadir a bitola. */
export const ESTACAO_MINA = new THREE.Vector3(-5.35, 0, -2.35);
export const DESTINO_PORTO = new THREE.Vector3(5.15, 0, 2.45);
/** Pontos no trilho onde o trem reduz (ao lado da estação). */
export const PARADA_MINA = new THREE.Vector3(-RX, 0.02, -1.45);
export const PARADA_PORTO = new THREE.Vector3(RX, 0, 2.55);

/** Atalho interno em S. */
export const PONTOS_DIAGONAL: [number, number, number][] = [
  [-5.1, 0, 3.05],
  [-2.1, 0, 1.4],
  [0, 0, 0],
  [2.1, 0, -1.4],
  [5.1, 0, -3.05],
];

/** Balão até o cais (sai no canto NE, volta na reta norte). */
export const PONTOS_RAMO_PORTO: [number, number, number][] = [
  [8.55, 0, 4.55],
  [10.6, 0, 5.85],
  [13.8, 0, 7.75],
  [16.9, 0, 9.55],
  [19.8, 0, 9.2],
  [20.2, 0, 7.05],
  [17.2, 0, 6.05],
  [12.4, 0, 5.45],
  [6.15, 0, 5.2],
];

/** Balão até a mina (sai no canto SW, volta na reta sul). */
export const PONTOS_RAMO_MINA: [number, number, number][] = [
  [-8.55, 0, -4.55],
  [-10.8, 0, -6.15],
  [-13.4, 0, -8.05],
  [-16.4, 0, -10.15],
  [-19.0, 0, -9.45],
  [-18.6, 0, -7.05],
  [-14.8, 0, -5.75],
  [-11.0, 0, -5.35],
  [-6.15, 0, -5.2],
];

export function criarRamoPorto(): THREE.CatmullRomCurve3 {
  return new THREE.CatmullRomCurve3(
    densificar(PONTOS_RAMO_PORTO.map((p) => new THREE.Vector3(...p)), 0.28, false),
    false,
    'catmullrom',
    0.02
  );
}

export function criarRamoMina(): THREE.CatmullRomCurve3 {
  return new THREE.CatmullRomCurve3(
    densificar(PONTOS_RAMO_MINA.map((p) => new THREE.Vector3(...p)), 0.28, false),
    false,
    'catmullrom',
    0.02
  );
}

function interpolarTrecho(curva: THREE.CatmullRomCurve3, t0: number, t1: number, n: number) {
  const pts: THREE.Vector3[] = [];
  for (let i = 0; i <= n; i++) pts.push(curva.getPointAt(t0 + ((t1 - t0) * i) / n));
  return pts;
}

function enxertarRamo(
  principal: THREE.CatmullRomCurve3,
  ramo: THREE.CatmullRomCurve3,
  tEntrada: number,
  tSaida: number
): THREE.CatmullRomCurve3 {
  const pontos: THREE.Vector3[] = [
    ...interpolarTrecho(principal, 0, tEntrada, 36),
    ...ramo.getSpacedPoints(28).slice(1, -1),
    ...interpolarTrecho(principal, tSaida, 1, 36),
  ];
  return new THREE.CatmullRomCurve3(pontos, true, 'centripetal', 0.28);
}

export function criarRamoVisual(
  principal: THREE.CatmullRomCurve3,
  tipo: 'porto' | 'mina'
): THREE.CatmullRomCurve3 {
  return tipo === 'porto' ? criarRamoPorto() : criarRamoMina();
}

export function tracadoComDesvio(
  principal: THREE.CatmullRomCurve3,
  desvios: number[]
): THREE.CatmullRomCurve3 {
  const tipo = ramoAtivo(desvios);
  if (tipo === 'nenhum') return principal;

  if (tipo === 'diagonal') {
    const diag = criarDiagonal();
    const tEnt = tMaisProximo(principal, diag.getPointAt(0));
    const tSai = tMaisProximo(principal, diag.getPointAt(1));
    const t0 = Math.min(tEnt, tSai);
    const t1 = Math.max(tEnt, tSai);
    return enxertarRamo(principal, diag, t0, t1);
  }

  if (tipo === 'mina') {
    const ramo = criarRamoMina();
    return enxertarRamo(
      principal,
      ramo,
      tMaisProximo(principal, ramo.getPointAt(0)),
      tMaisProximo(principal, ramo.getPointAt(1))
    );
  }

  const ramo = criarRamoPorto();
  return enxertarRamo(
    principal,
    ramo,
    tMaisProximo(principal, ramo.getPointAt(0)),
    tMaisProximo(principal, ramo.getPointAt(1))
  );
}

export function ramoAtivo(desvios: number[] | undefined): RamoFerroviario {
  const d = desvios ?? [0, 0, 0, 0];
  if (d[2] === 1 || d[2] === 2) return 'porto';
  if (d[3] === 1 || d[3] === 2) return 'mina';
  if (d[0] === 1 || d[0] === 2 || d[1] === 1 || d[1] === 2) return 'diagonal';
  return 'nenhum';
}

export function criarPercursoCaminhao(): THREE.CatmullRomCurve3 {
  return new THREE.CatmullRomCurve3(
    [
      new THREE.Vector3(4.65, 0, 2.65),
      new THREE.Vector3(6.0, 0, 3.55),
      new THREE.Vector3(7.5, 0, 4.45),
      new THREE.Vector3(9.05, 0, 5.3),
      new THREE.Vector3(7.5, 0, 4.45),
      new THREE.Vector3(6.0, 0, 3.55),
    ],
    true,
    'centripetal',
    0.35
  );
}

/** Centro do túnel no oeste e do morro leste. */
export const TUNEL_OESTE = { x: -RX, y: 0.48, z: 0, comprimento: 3.55, raio: 0.48 };
export const TUNEL_LESTE = { x: RX, y: 0.48, z: 0, comprimento: 3.55, raio: 0.48 };
export const MORRO_LESTE = { x: RX + 0.9, z: 0, raio: 2.05, altura: 1.62 };

/** @deprecated — o morro substituiu os pilares. */
export const PILARES_PONTE: [number, number, number][] = [];
