/**
 * Confere a pegada declarada no catálogo contra a caixa real do `.glb`.
 *
 * O campo `larg/prof/alt` de `catalogo.py` é o que o pré-voo de layout usa para
 * reservar espaço no tabuleiro. Se ele mentir, o asset invade o vizinho e o
 * erro só aparece quando alguém olha. Aqui a conferência é automática: o
 * exportador glTF grava `min`/`max` de POSITION em todo acessador, inclusive
 * com Draco ligado, então dá para medir sem decodificar nada.
 *
 * Duas armadilhas que a primeira versão caiu e que valem estar escritas:
 *
 * 1. **O nó carrega transformação.** `join()` faz o objeto herdar a matriz da
 *    primeira peça, e `primitives.cyl` não aplica rotação — então boa parte dos
 *    assets tem quaternion no nó. Medir `accessor.min/max` cru dá a caixa no
 *    espaço local, que não é a do mundo. Aqui os oito vértices da caixa local
 *    passam pela TRS do nó antes de virarem caixa de mundo.
 * 2. **A folha planta em `yaw = 0`.** Com a peça girada, a caixa alinhada aos
 *    eixos mistura largura com profundidade e todo veículo comprido dispara
 *    alerta falso.
 *
 *   node scripts/auditar_assets.mjs public/models/assets-catalogo.glb
 */
import fs from 'node:fs';

const caminho = process.argv[2] ?? 'public/models/assets-catalogo.glb';
const bin = fs.readFileSync(caminho);
const json = JSON.parse(bin.subarray(20, 20 + bin.readUInt32LE(12)).toString('utf8'));
const indice = JSON.parse(fs.readFileSync(caminho.replace(/\.glb$/, '.json'), 'utf8'));

/** Aplica um quaternion [x,y,z,w] a um ponto. */
const girar = ([x, y, z], [qx, qy, qz, qw]) => {
  const ix = qw * x + qy * z - qz * y;
  const iy = qw * y + qz * x - qx * z;
  const iz = qw * z + qx * y - qy * x;
  const iw = -qx * x - qy * y - qz * z;
  return [
    ix * qw + iw * -qx + iy * -qz - iz * -qy,
    iy * qw + iw * -qy + iz * -qx - ix * -qz,
    iz * qw + iw * -qz + ix * -qy - iy * -qx,
  ];
};

function caixaDoNo(no) {
  if (no.mesh === undefined) return null;
  const lo = [Infinity, Infinity, Infinity];
  const hi = [-Infinity, -Infinity, -Infinity];
  for (const p of json.meshes[no.mesh].primitives) {
    const acc = json.accessors[p.attributes.POSITION];
    if (!acc?.min || !acc?.max) return null;
    for (let i = 0; i < 3; i++) {
      lo[i] = Math.min(lo[i], acc.min[i]);
      hi[i] = Math.max(hi[i], acc.max[i]);
    }
  }
  const s = no.scale ?? [1, 1, 1];
  const q = no.rotation ?? [0, 0, 0, 1];
  const t = no.translation ?? [0, 0, 0];
  const min = [Infinity, Infinity, Infinity];
  const max = [-Infinity, -Infinity, -Infinity];
  for (let c = 0; c < 8; c++) {
    const v = [
      (c & 1 ? hi[0] : lo[0]) * s[0],
      (c & 2 ? hi[1] : lo[1]) * s[1],
      (c & 4 ? hi[2] : lo[2]) * s[2],
    ];
    const g = girar(v, q);
    for (let i = 0; i < 3; i++) {
      min[i] = Math.min(min[i], g[i] + t[i]);
      max[i] = Math.max(max[i], g[i] + t[i]);
    }
  }
  return { min, max };
}

const porSlug = new Map();
for (const no of json.nodes) {
  if (!no.name?.startsWith('AS_')) continue;
  const slug = no.name.slice(3).replace(/\.\d+$/, '');
  const c = caixaDoNo(no);
  if (!c) continue;
  const antes = porSlug.get(slug);
  if (!antes) porSlug.set(slug, c);
  else for (let i = 0; i < 3; i++) {
    antes.min[i] = Math.min(antes.min[i], c.min[i]);
    antes.max[i] = Math.max(antes.max[i], c.max[i]);
  }
}

// glTF: X lateral, Y altura, Z longitudinal (espelhado em relação ao Blender).
const TOL = 1.6;      // fator aceitável entre declarado e real
const alertas = [];
let medidos = 0;
for (const a of indice.assets) {
  const c = porSlug.get(a.slug);
  if (!c) { alertas.push(`${a.slug.padEnd(24)} SEM MALHA no .glb`); continue; }
  medidos++;
  const real = [c.max[0] - c.min[0], c.max[2] - c.min[2], c.max[1] - c.min[1]];
  const eixos = ['larg', 'prof', 'alt '];
  // `alt` no catálogo é a altura ACIMA do piso; o vão total de uma peça que
  // afunda de propósito é `alt + afunda`, e é esse o número comparável.
  const decl = [a.pegada[0], a.pegada[1], a.pegada[2] + (a.afunda ?? 0)];
  for (let i = 0; i < 3; i++) {
    const r = real[i];
    const d = decl[i];
    if (d <= 0.03) continue;             // peça rente ao chão: medida sem sentido
    const razao = r / d;
    if (razao > TOL || razao < 1 / TOL) {
      alertas.push(`${a.slug.padEnd(24)} ${eixos[i]} declarado ${d.toFixed(2)} · real ${r.toFixed(2)} (${razao.toFixed(2)}x)`);
    }
  }
  const afunda = -c.min[1];
  if (afunda > (a.afunda ?? 0) + 0.06) {
    alertas.push(`${a.slug.padEnd(24)} afunda ${afunda.toFixed(2)} abaixo do piso (previsto ${(a.afunda ?? 0).toFixed(2)})`);
  }
}

console.log(`AUDITORIA ${medidos}/${indice.assets.length} assets medidos, ${alertas.length} alertas`);
for (const l of alertas) console.log('  ·', l);
process.exit(0);
