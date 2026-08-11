/**
 * Zonas da maquete, seguindo a planta feita no Figma:
 *
 *   ┌─────────────┐  ┌───────────────┐  ┌─────────────┐
 *   │ Central de  │  │               │  │  Aeroporto  │
 *   │  Química    │  │   FERRORAMA   │  │  Logístico  │
 *   ├─────────────┤  │  SW1 SW2 SW3  │  ├─────────────┤
 *   │    Mina     │  │   REVERSOR    │  │    Porto    │
 *   └─────────────┘  └───────────────┘  └─────────────┘
 */

export interface Modulo {
  id: string;
  nome: string;
  cor: string;
  resumo: string;
  detalhes: string[];
}

/**
 * Paleta de dentro da vitrine.
 *
 * O site é laranja/ferrugem, mas o diorama segue o visual de estande de feira
 * da referência: azul, ciano e verde. Os dois convivem porque o laranja fica
 * no cromo HTML em volta (botões, títulos) e o azul fica dentro do vidro —
 * como uma peça de exposição iluminada sobre um móvel escuro.
 */
export const VITRINE = {
  ciano: '#4DD8FF',
  azul: '#2B5CFF',
  violeta: '#7B4DFF',
  verde: '#39FF6A',
  ambar: '#FFB800',
  vermelho: '#FF4560',
  predio: '#E8EAED',
  predioEscuro: '#B9BEC6',
  fundo: '#05070B',
} as const;

/** Paleta compartilhada com o dashboard e o app (ver README). */
export const PALETA = {
  glow: '#00FFB2',
  dark: '#0D0F14',
  surface: '#161B26',
  card: '#1C2333',
  border: '#252D40',
  accent: '#3D9EFF',
  warning: '#FFB800',
  danger: '#FF4560',
  purple: '#A855F7',
} as const;

/** Posição de cada zona sobre a placa (x, y, z). */
export const POSICOES: Record<string, [number, number, number]> = {
  quimica: [-12.5, 0, -5.2],
  mina: [-12.5, 0, 4.4],
  ferrorama: [0, 0, 0],
  aeroporto: [12.5, 0, -5.2],
  porto: [12.5, 0, 4.4],
};

export const MODULOS: Modulo[] = [
  {
    id: 'quimica',
    nome: 'Central de Química',
    cor: PALETA.glow,
    resumo:
      'Onde o minério bruto é tratado antes de seguir para exportação: tanques, reatores e controle de processo.',
    detalhes: [
      'Tanques de tratamento e decantação do minério',
      'Sensores de nível monitorados pelo Arduino',
      'Dados de processo enviados ao backend por WebSocket',
      'Histórico registrado em PostgreSQL para os relatórios',
    ],
  },
  {
    id: 'mina',
    nome: 'Mina',
    cor: PALETA.warning,
    resumo:
      'Dois poços de extração alimentam a esteira que carrega os caminhões basculantes rumo à ferrovia.',
    detalhes: [
      'Caminhão com 3 servos: direção (D5), caçamba (D6) e motor (D7)',
      'Faróis e setas em LED nos pinos D2, D3, D8 e D9',
      'Comandos por Bluetooth HC-05 a 9600 baud',
      'Compostos: FL, FR, BL, BR e SC para parada total',
    ],
  },
  {
    id: 'ferrorama',
    nome: 'Ferrorama',
    cor: PALETA.accent,
    resumo:
      'O circuito em escala HO com 3 desvios e o reversor — o coração da maquete, que liga todos os módulos.',
    detalhes: [
      'SW1, SW2 e SW3: servos SG90 nos pinos D3, D5 e D6',
      'Protocolo: CMD|SWITCH|<id>|SET|LEFT / RIGHT / CENTER',
      'Reversor inverte o sentido de marcha da composição',
      'Heartbeat STATUS|SWITCH|<id>|<ângulo>|<estado>',
    ],
  },
  {
    id: 'aeroporto',
    nome: 'Aeroporto Logístico',
    cor: PALETA.purple,
    resumo:
      'Pista de carga para o ramal alternativo, usada para cargas de maior valor agregado.',
    detalhes: [
      'Recebe a carga quando SW3 manda o trem pela diagonal',
      'Aeronaves listadas em GET /api/airport/airplanes',
      'Balizamento de pista em LED',
      'Terminal de carga com esteira própria',
    ],
  },
  {
    id: 'porto',
    nome: 'Porto Logístico',
    cor: PALETA.danger,
    resumo:
      'Cais com guindaste e navio: o destino final do minério que sai da mina.',
    detalhes: [
      'Guindaste com lança móvel sobre o cais',
      'Navios monitorados via GET /api/port/ships',
      'LED vermelho sinaliza navio atracado',
      'Esteira do cais movida por motor linear',
    ],
  },
];
