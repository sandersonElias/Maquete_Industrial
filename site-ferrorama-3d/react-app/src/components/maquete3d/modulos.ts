/**
 * Os 4 módulos da maquete + a central de controle.
 *
 * As cores seguem a paleta do sistema (README): cada módulo usa a mesma cor
 * que representa ele no dashboard, para quem vê a feira reconhecer a ligação
 * entre a maquete física, o site e o painel de controle.
 */

export interface Modulo {
  id: string;
  nome: string;
  cor: string;
  /** Posição do foco da câmera ao selecionar o módulo */
  alvo: [number, number, number];
  resumo: string;
  detalhes: string[];
}

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

/** Passos do tour cinematográfico automático. */
export const PASSOS_TOUR = [
  {
    moduloId: 'mineradora' as const,
    legenda: 'Extração a céu aberto — caminhões basculantes carregam o minério',
    duracao: 5,
  },
  {
    moduloId: 'ferrovia' as const,
    legenda: 'Circuito HO — desvios SG90 definem se a carga vai ao porto ou ao aeroporto',
    duracao: 5,
  },
  {
    moduloId: 'porto' as const,
    legenda: 'Terminal marítimo — guindaste embarca o minério para exportação',
    duracao: 5,
  },
  {
    moduloId: 'aeroporto' as const,
    legenda: 'Ramal aéreo — cargas de alto valor agregado decolam da pista',
    duracao: 5,
  },
  {
    moduloId: 'controle' as const,
    legenda: 'Central SCADA — Arduino, gateway e dashboard em tempo real',
    duracao: 5,
  },
  {
    moduloId: null,
    legenda: 'Visão geral da operação integrada',
    duracao: 4,
  },
];

/** Telemetria simulada exibida nas etiquetas 3D. */
export const TELEMETRIA: Record<string, string> = {
  mineradora: 'Caminhão · ciclo ativo',
  ferrovia: '3 vagões · loop contínuo',
  porto: 'Navio atracado · embarque',
  aeroporto: 'Pista livre · decolagem',
  controle: 'Gateway · 4 módulos online',
};

export const MODULOS: Modulo[] = [
  {
    id: 'mineradora',
    nome: 'Mineradora',
    cor: PALETA.warning,
    alvo: [-8, 0.5, -4],
    resumo:
      'Dois poços de extração alimentam a esteira que carrega os caminhões basculantes.',
    detalhes: [
      'Caminhão com 3 servos: direção (D5), caçamba (D6) e motor (D7)',
      'Faróis e setas em LED nos pinos D2, D3, D8 e D9',
      'Controle por Bluetooth HC-05 a 9600 baud',
      'Comandos compostos: FL, FR, BL, BR e SC para parada total',
    ],
  },
  {
    id: 'ferrovia',
    nome: 'Ferrovia',
    cor: PALETA.accent,
    alvo: [0, 0.5, 0],
    resumo:
      'Circuito em escala HO com 4 desvios motorizados que definem o destino da carga.',
    detalhes: [
      '4 servos SG90 nos pinos D3, D5, D6 e D9',
      'Estados por desvio: LEFT, RIGHT e CENTER',
      'Protocolo serial: CMD|SWITCH|<id>|SET|<estado>',
      'Heartbeat de status com ângulo e timestamp',
    ],
  },
  {
    id: 'porto',
    nome: 'Porto Logístico',
    cor: PALETA.glow,
    alvo: [9, 0.5, 3],
    resumo:
      'Cais com guindaste e navio: o minério que chega pelo trem é embarcado para exportação.',
    detalhes: [
      'Guindaste com movimento de lança sobre o cais',
      'Navios monitorados via GET /api/port/ships',
      'LED vermelho sinaliza navio atracado',
      'Esteira do cais movida por motor linear',
    ],
  },
  {
    id: 'aeroporto',
    nome: 'Aeroporto Logístico',
    cor: PALETA.purple,
    alvo: [8, 0.5, -6],
    resumo:
      'Pista de carga para o ramal alternativo, com aeronaves em escala 1:500.',
    detalhes: [
      'Ramal secundário acionado pelos desvios 3 e 4',
      'Aeronaves listadas em GET /api/airport/airplanes',
      'Balizamento de pista em LED',
      'Usado para cargas de maior valor agregado',
    ],
  },
  {
    id: 'controle',
    nome: 'Central de Controle',
    cor: PALETA.danger,
    alvo: [0, 0.5, 7],
    resumo:
      'Arduino Mega, gateway e dashboard: o cérebro que coordena os quatro módulos.',
    detalhes: [
      'Arduino ↔ Gateway Node.js por Serial/Bluetooth',
      'Gateway ↔ Backend Express por WebSocket',
      'Dashboard React recebe switch:update e truck:telemetry',
      'PostgreSQL para histórico e Redis para estado em tempo real',
    ],
  },
];
