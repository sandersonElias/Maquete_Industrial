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
    papel: 'Controle de qualidade',
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
      'A ferrovia é a espinha dorsal da operação. Um trem carrega numa viagem o que levaria dezenas de caminhões, com um custo por tonelada muito menor e sem depender de rodovia. Os três desvios são o que dá flexibilidade ao negócio: são eles que decidem, em tempo real, se aquela composição segue para o porto ou para o aeroporto. Mudar uma chave aqui muda para onde vai a carga — e, na prática, para qual cliente ela foi vendida.',
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
    papel: 'Rota rápida',
    resumo:
      'É a saída alternativa, para quando o navio é lento demais. O frete aéreo custa muito mais caro por tonelada, então só compensa em dois casos: carga de alto valor agregado, como minério já beneficiado, e urgência — um cliente que precisa do material agora e aceita pagar pela pressa. O trem chega até aqui pelo ramal da diagonal, acionado pelo desvio SW3.',
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
    papel: 'Exportação',
    resumo:
      'É aqui que o minério deixa de ser estoque e vira receita. O guindaste transfere a carga dos vagões para o navio e, no momento em que o embarque é concluído, aquela produção passa a ser venda faturada no exterior. O porto é o gargalo mais caro da cadeia: navio parado no cais cobra por dia de espera, então toda a operação a montante — mina, química e ferrovia — é planejada para que a carga chegue no momento certo.',
    detalhes: [
      'Guindaste com lança móvel sobre o cais',
      'Navios monitorados via GET /api/port/ships',
      'LED vermelho sinaliza navio atracado',
      'Esteira do cais movida por motor linear',
    ],
  },
];
