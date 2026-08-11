import * as THREE from 'three';

/**
 * Rede de trilhos do Ferrorama, seguindo a planta do Figma.
 *
 * O circuito NÃO é um oval simples: são 6 trechos ligando 3 nós de desvio
 * (SW1, SW2 e SW3), com duas diagonais que se cruzam no miolo. Cada desvio
 * escolhe de verdade por onde o trem sai do nó — virar a chave muda o
 * caminho na tela, que é o ponto da demonstração.
 *
 * Cada nó tem exatamente 2 saídas e 2 entradas, então o reversor funciona
 * de forma simétrica: indo para trás, o desvio escolhe entre as entradas.
 */

export type EstadoDesvio = 0 | 1; // 0 = RETO, 1 = DESVIO

export interface Trecho {
  id: string;
  /** Nó onde o trecho começa e termina */
  de: string;
  para: string;
  curva: THREE.CatmullRomCurve3;
  comprimento: number;
}

export interface No {
  id: string;
  rotulo: string;
  posicao: THREE.Vector3;
  /** [trecho quando RETO, trecho quando DESVIO] */
  saidas: [string, string];
  entradas: [string, string];
}

/** Meia-bitola: distância de cada trilho até o eixo do traçado. */
export const MEIA_BITOLA = 0.34;

function curva(pontos: [number, number][]): THREE.CatmullRomCurve3 {
  return new THREE.CatmullRomCurve3(
    pontos.map(([x, z]) => new THREE.Vector3(x, 0, z)),
    false,
    'catmullrom',
    0.5
  );
}

// Posições dos nós — batem com a planta: SW1 na reta de cima (à esquerda),
// SW2 e SW3 na reta de baixo, próximos um do outro.
const P_SW1: [number, number] = [-3.0, -3.4];
const P_SW2: [number, number] = [-0.8, 3.4];
const P_SW3: [number, number] = [1.6, 3.4];

/** Fração do trecho "topo" onde fica o reversor (bloco na reta de cima). */
export const REVERSOR_T = 0.42;

const DEFINICOES: Array<{ id: string; de: string; para: string; pontos: [number, number][] }> = [
  {
    // Reta de cima (passa pelo REVERSOR) + curva da direita
    id: 'topo',
    de: 'SW1',
    para: 'SW3',
    pontos: [P_SW1, [-1, -3.4], [1.5, -3.4], [3.6, -3.35], [5.3, -2.5], [6.2, -0.6], [6.1, 1.1], [5.2, 2.6], [3.6, 3.35], P_SW3],
  },
  {
    // Reta de baixo entre SW3 e SW2
    id: 'fundo',
    de: 'SW3',
    para: 'SW2',
    pontos: [P_SW3, [0.7, 3.4], P_SW2],
  },
  {
    // Curva da esquerda, de SW2 de volta a SW1
    id: 'esq',
    de: 'SW2',
    para: 'SW1',
    pontos: [P_SW2, [-3.4, 3.4], [-5.2, 2.6], [-6.2, 0.6], [-6.1, -1.1], [-5.2, -2.6], [-4.3, -3.35], P_SW1],
  },
  {
    // Diagonal de SW1 descendo até SW2 (a primeira do desenho)
    id: 'diagA',
    de: 'SW1',
    para: 'SW2',
    pontos: [P_SW1, [-2.6, -1.6], [-1.9, 0.4], [-1.2, 2.2], P_SW2],
  },
  {
    // Diagonal de SW3 subindo até SW1 — cruza a diagA no meio
    id: 'diagB',
    de: 'SW3',
    para: 'SW1',
    pontos: [P_SW3, [0.6, 1.6], [-0.8, -0.4], [-2.1, -2.2], P_SW1],
  },
  {
    // Desvio de manobra: sai de SW2, faz uma barriga para fora e volta em SW3
    id: 'manobra',
    de: 'SW2',
    para: 'SW3',
    pontos: [P_SW2, [-0.4, 4.7], [0.6, 5.0], [1.5, 4.6], P_SW3],
  },
];

export const TRECHOS: Record<string, Trecho> = Object.fromEntries(
  DEFINICOES.map((d) => {
    const c = curva(d.pontos);
    return [d.id, { id: d.id, de: d.de, para: d.para, curva: c, comprimento: c.getLength() }];
  })
);

export const NOS: Record<string, No> = {
  SW1: {
    id: 'SW1',
    rotulo: 'SW1',
    posicao: new THREE.Vector3(P_SW1[0], 0, P_SW1[1]),
    saidas: ['topo', 'diagA'],
    entradas: ['esq', 'diagB'],
  },
  SW2: {
    id: 'SW2',
    rotulo: 'SW2',
    posicao: new THREE.Vector3(P_SW2[0], 0, P_SW2[1]),
    saidas: ['esq', 'manobra'],
    entradas: ['fundo', 'diagA'],
  },
  SW3: {
    id: 'SW3',
    rotulo: 'SW3',
    posicao: new THREE.Vector3(P_SW3[0], 0, P_SW3[1]),
    saidas: ['fundo', 'diagB'],
    entradas: ['topo', 'manobra'],
  },
};

export const ORDEM_DESVIOS = ['SW1', 'SW2', 'SW3'] as const;

/** Descrição do que cada estado do desvio faz — usada nos controles. */
export const DESCRICAO_DESVIOS: Record<string, [string, string]> = {
  SW1: ['Segue pela reta principal', 'Corta pela diagonal até SW2'],
  SW2: ['Segue pela curva da esquerda', 'Entra no desvio de manobra'],
  SW3: ['Segue pela reta de baixo', 'Corta pela diagonal até SW1'],
};

/**
 * Decide o próximo trecho ao chegar em um nó.
 * `sentido` +1 usa as saídas do nó; -1 usa as entradas (trem de ré).
 */
export function proximoTrecho(
  noId: string,
  sentido: number,
  desvios: Record<string, EstadoDesvio>
): string {
  const no = NOS[noId];
  const opcoes = sentido > 0 ? no.saidas : no.entradas;
  return opcoes[desvios[noId] ?? 0];
}

/**
 * Gera os pontos de um trilho paralelo ao eixo do trecho.
 * Amostragem densa porque as diagonais têm curvatura acentuada.
 */
export function pontosTrilho(trecho: Trecho, deslocamento: number, amostras = 90): THREE.Vector3[] {
  const pontos: THREE.Vector3[] = [];
  const tg = new THREE.Vector3();

  for (let i = 0; i <= amostras; i++) {
    const t = i / amostras;
    const p = trecho.curva.getPointAt(t);
    trecho.curva.getTangentAt(t, tg);
    const px = -tg.z;
    const pz = tg.x;
    const len = Math.hypot(px, pz) || 1;
    pontos.push(new THREE.Vector3(p.x + (px / len) * deslocamento, 0, p.z + (pz / len) * deslocamento));
  }

  return pontos;
}
