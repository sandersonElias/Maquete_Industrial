/**
 * Quanto cada peça do `.glb` custa — em vértice, triângulo e byte.
 *
 * Existe porque o orçamento do modelo estourou sem ninguém perceber. O `.glb`
 * é servido a celulares no 4G da feira, mas o custo de uma peça não aparece em
 * lugar nenhum enquanto se escreve o script que a gera: uma canaleta de
 * drenagem inocente emitia uma grelha a cada 80 cm e chegou a 8.574 vértices,
 * mais que a locomotiva inteira, sem que nada avisasse. Aqui o número aparece.
 *
 * Um `.glb` é um cabeçalho de 12 bytes, um bloco JSON e um bloco binário — dá
 * para ler os acessores sem descomprimir o Draco, porque a contagem de
 * vértices fica no acessor e o tamanho comprimido fica no `bufferView` da
 * extensão. Nenhuma dependência, portanto: só `node`.
 *
 * Uso (a partir de `site-ferrorama-3d/react-app`):
 *
 *     node scripts/pesar_glb.mjs                              # as 25 peças mais caras
 *     node scripts/pesar_glb.mjs --top 60                     # mais linhas
 *     node scripts/pesar_glb.mjs --contra <outro.glb>         # o que entrou e o que saiu
 *
 * Para comparar com o modelo já commitado, extraia o de referência primeiro:
 *
 *     git show HEAD:site-ferrorama-3d/react-app/public/models/maquete-blender.glb > /tmp/antes.glb
 *     node scripts/pesar_glb.mjs --contra /tmp/antes.glb
 */

import fs from "node:fs";
import path from "node:path";

const PADRAO = "public/models/maquete-blender.glb";

function argumentos() {
  const a = process.argv.slice(2);
  const op = { arquivo: PADRAO, top: 25, contra: null };
  for (let i = 0; i < a.length; i++) {
    if (a[i] === "--top") op.top = Number(a[++i]);
    else if (a[i] === "--contra") op.contra = a[++i];
    else op.arquivo = a[i];
  }
  return op;
}

/** Lê o bloco JSON do `.glb`. O binário fica logo depois e não precisamos dele. */
function lerGltf(caminho) {
  const b = fs.readFileSync(caminho);
  if (b.readUInt32LE(0) !== 0x46546c67) throw new Error(`${caminho} não é um .glb`);
  return { json: JSON.parse(b.slice(20, 20 + b.readUInt32LE(12)).toString("utf8")), bytes: b.length };
}

/**
 * Custo por nó com malha. Quando a primitiva está comprimida, o tamanho real é
 * o do `bufferView` do Draco — somar os acessores daria o tamanho *cru*, que é
 * cinco vezes maior e não é o que trafega.
 */
function pesar(caminho) {
  const { json, bytes } = lerGltf(caminho);
  const tam = json.bufferViews.map((v) => v.byteLength);
  const pecas = new Map();
  for (const no of json.nodes) {
    if (no.mesh == null) continue;
    let v = 0;
    let t = 0;
    let b = 0;
    for (const p of json.meshes[no.mesh].primitives) {
      v += json.accessors[p.attributes.POSITION].count;
      if (p.indices != null) t += json.accessors[p.indices].count / 3;
      const draco = p.extensions?.KHR_draco_mesh_compression;
      if (draco) {
        b += tam[draco.bufferView];
        continue;
      }
      if (p.indices != null) b += tam[json.accessors[p.indices].bufferView] ?? 0;
      for (const chave of Object.keys(p.attributes)) b += tam[json.accessors[p.attributes[chave]].bufferView] ?? 0;
    }
    const ant = pecas.get(no.name);
    if (ant) {
      ant.v += v;
      ant.t += t;
      ant.b += b;
    } else {
      pecas.set(no.name, { v, t, b });
    }
  }
  const imagens = (json.images ?? []).reduce((s, i) => s + (i.bufferView != null ? tam[i.bufferView] : 0), 0);
  const animacoes = (json.animations ?? []).reduce(
    (s, a) =>
      s +
      a.samplers.reduce(
        (u, sm) => u + tam[json.accessors[sm.input].bufferView] + tam[json.accessors[sm.output].bufferView],
        0,
      ),
    0,
  );
  return { pecas, bytes, imagens, animacoes, malhas: json.meshes.length, nos: json.nodes.length };
}

const mib = (n) => (n / 1048576).toFixed(2);
const kb = (n) => Math.round(n / 1024);

function linha(nome, p) {
  return `${String(p.v).padStart(7)} ${String(p.t).padStart(7)} ${String(kb(p.b)).padStart(6)}  ${nome}`;
}

function main() {
  const op = argumentos();
  if (!fs.existsSync(op.arquivo)) {
    console.error(`não encontrei ${path.resolve(op.arquivo)} — rode o build do Blender antes`);
    process.exit(1);
  }
  const r = pesar(op.arquivo);
  const geometria = [...r.pecas.values()].reduce((s, p) => s + p.b, 0);
  const vertices = [...r.pecas.values()].reduce((s, p) => s + p.v, 0);
  // O que sobra é o bloco JSON: com quinhentos nós e mil acessores ele passa de
  // meio mega, e é o único pedaço que não encolhe mexendo em geometria.
  const json = r.bytes - geometria - r.imagens - r.animacoes;

  console.log(`${op.arquivo}  ${r.bytes} bytes (${mib(r.bytes)} MiB)`);
  console.log(`  geometria ${mib(geometria)} MiB · texturas ${mib(r.imagens)} MiB · animações ${kb(r.animacoes)} KB · JSON ${mib(json)} MiB`);
  console.log(`  ${vertices} vértices · ${r.malhas} malhas · ${r.nos} nós`);
  console.log();

  const ordenado = [...r.pecas.entries()].sort((a, b) => b[1].v - a[1].v);
  console.log(`  vért    tri      KB  peça (${Math.min(op.top, ordenado.length)} maiores por vértice)`);
  for (const [nome, p] of ordenado.slice(0, op.top)) console.log(linha(nome, p));

  if (!op.contra) return;
  const base = pesar(op.contra);
  const novos = [];
  const sumidos = [];
  let entrou = 0;
  let saiu = 0;
  for (const [nome, p] of r.pecas) {
    if (!base.pecas.has(nome)) {
      novos.push([nome, p]);
      entrou += p.b;
    }
  }
  for (const [nome, p] of base.pecas) {
    if (!r.pecas.has(nome)) {
      sumidos.push(nome);
      saiu += p.b;
    }
  }
  const baseGeo = [...base.pecas.values()].reduce((s, p) => s + p.b, 0);
  const baseVert = [...base.pecas.values()].reduce((s, p) => s + p.v, 0);
  console.log();
  console.log(`contra ${op.contra}: ${base.bytes} bytes → ${r.bytes} (${r.bytes - base.bytes >= 0 ? "+" : ""}${kb(r.bytes - base.bytes)} KB)`);
  console.log(`  vértices ${baseVert} → ${vertices} · geometria ${mib(baseGeo)} → ${mib(geometria)} MiB`);
  console.log(`  ${novos.length} peça(s) nova(s), ${kb(entrou)} KB · ${sumidos.length} removida(s), ${kb(saiu)} KB`);
  novos.sort((a, b) => b[1].b - a[1].b);
  for (const [nome, p] of novos.slice(0, op.top)) console.log(`  + ${linha(nome, p)}`);
  if (sumidos.length) console.log(`  - ${sumidos.join(", ")}`);
}

main();
