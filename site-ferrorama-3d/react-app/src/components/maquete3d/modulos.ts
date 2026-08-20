/**
 * Zonas da maquete, seguindo a planta feita no Figma:
 *
 *   ┌─────────────┐  ┌───────────────┐  ┌─────────────┐
 *   │ Central de  │  │               │  │    Porto    │
 *   │  Química    │  │   FERRORAMA   │  │  Logístico  │
 *   ├─────────────┤  │  SW1 SW2 SW3  │  └─────────────┤
 *   │    Mina     │  │   REVERSOR    │
 *   └─────────────┘  └───────────────┘
 */

export interface Modulo {
  id: string;
  nome: string;
  cor: string;
  /** Etiqueta curta da função na cadeia produtiva (ex.: "Extração"). */
  papel: string;
  /** Por que esta área importa para a empresa — é o texto que o público lê. */
  resumo: string;
  /** Detalhe técnico, mostrado abaixo do resumo. */
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

/** Passos do tour cinematográfico automático. */
export const PASSOS_TOUR = [
  {
    moduloId: 'mineradora' as const,
    legenda: 'Volvo enche o CAT 793 — o caminhão leva o minério à logística',
    duracao: 5,
  },
  {
    moduloId: 'ferrovia' as const,
    legenda: 'MRS ES44ACi nos trilhos — ramal automático para o porto',
    duracao: 5,
  },
  {
    moduloId: 'porto' as const,
    legenda: 'Guindaste embarca o contêiner no porta-contêineres',
    duracao: 5,
  },
  {
    moduloId: 'controle' as const,
    legenda: 'Sala SCADA — clique nos monitores para entrar na visão',
    duracao: 5,
  },
  {
    moduloId: null,
    legenda: 'Visão geral da operação integrada',
    duracao: 4,
  },
];

export const CAMERAS_POV = [
  { id: 'volvo' as const, label: 'Escavadeira Volvo', modulo: 'mineradora' },
  { id: 'cat' as const, label: 'Caminhão CAT', modulo: 'mineradora' },
  { id: 'mrs' as const, label: 'Trem MRS', modulo: 'ferrovia' },
  { id: 'navio' as const, label: 'Porta-contêineres', modulo: 'porto' },
];
export const TELEMETRIA: Record<string, string> = {
  mineradora: 'Volvo + CAT 793 · ciclo da mina',
  ferrovia: 'MRS ES44ACi · ramal automático',
  porto: 'Porta-contêineres · guindaste no cais',
  controle: '4 monitores · sala SCADA',
};

export const MODULOS: Modulo[] = [
  {
    id: 'mineradora',
    nome: 'Mineradora',
    cor: PALETA.warning,
    alvo: [-15.2, 0.5, -7.4],
    resumo:
      'É o laboratório que decide se a carga pode ou não ser embarcada. Aqui se mede o teor de ferro, a umidade e os contaminantes de cada lote — e o minério é tratado até chegar na especificação que o cliente comprou. Sem esse controle a carga chega ao porto de destino e é rejeitada: a empresa perde o embarque inteiro, paga o frete de volta e ainda arranha a reputação com o comprador. Por isso nenhum vagão sai da mina sem passar por aqui.',
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
    papel: 'Extração',
    resumo:
      'É onde tudo começa e é ela quem dita o ritmo da empresa inteira. Os dois poços tiram o minério bruto do solo, a esteira desce a carga até os caminhões basculantes e eles alimentam o trem. Se a mina para, para todo o resto: o trem fica ocioso, o navio espera no cais e o contrato de exportação atrasa. Por isso a produção da mina é medida hora a hora — cada tonelada que sai daqui já está vendida lá na frente.',
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
    papel: 'Transporte',
    resumo:
      'A ferrovia é a espinha dorsal da operação. Um trem carrega numa viagem o que levaria dezenas de caminhões, com um custo por tonelada muito menor e sem depender de rodovia. Os três desvios são o que dá flexibilidade ao negócio: são eles que decidem, em tempo real, o trajeto de cada composição até o porto. Mudar uma chave aqui muda o fluxo da carga — e, na prática, para qual cliente ela foi vendida.',
    detalhes: [
      'SW1, SW2 e SW3: servos SG90 nos pinos D3, D5 e D6',
      'Protocolo: CMD|SWITCH|<id>|SET|LEFT / RIGHT / CENTER',
      'Reversor inverte o sentido de marcha da composição',
      'Heartbeat STATUS|SWITCH|<id>|<ângulo>|<estado>',
    ],
  },
  {
    id: 'porto',
    nome: 'Porto Logístico',
    cor: PALETA.glow,
    alvo: [16.2, 0.5, 8.2],
    resumo:
      'Cais com correia até o navio: o minério que chega pelo trem é embarcado para exportação.',
    detalhes: [
      'Guindaste com lança móvel sobre o cais',
      'Navios monitorados via GET /api/port/ships',
      'LED vermelho sinaliza navio atracado',
      'Esteira do cais movida por motor linear',
    ],
  },
  {
    id: 'controle',
    nome: 'Central de Controle',
    cor: PALETA.danger,
    alvo: [-5.8, 0.5, 13.2],
    resumo:
      'Arduino Mega, gateway e dashboard: o cérebro que coordena os módulos.',
    detalhes: [
      'Arduino ↔ Gateway Node.js por Serial/Bluetooth',
      'Gateway ↔ Backend Express por WebSocket',
      'Dashboard React recebe switch:update e truck:telemetry',
      'PostgreSQL para histórico e Redis para estado em tempo real',
    ],
  },
];
