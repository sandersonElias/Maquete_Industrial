export const SECTIONS = [
  { id: 'inicio', num: '—', label: 'Início', title: 'Ferrorama — Documentação' },
  { id: 'montagem', num: '00', label: 'Montagem', title: 'Montagem — Ferrorama' },
  { id: 'maquete', num: '01', label: 'Maquete', title: 'A Maquete — Ferrorama' },
  { id: 'codigo', num: '02', label: 'Código e automação', title: 'Código e automação — Ferrorama' },
  { id: 'porto-aeroporto', num: '03', label: 'Porto e aeroporto', title: 'Porto e aeroporto — Ferrorama' },
  { id: 'mina', num: '04', label: 'Mina de ferro', title: 'Mina de ferro — Ferrorama' },
  { id: 'controle', num: '05', label: 'Central de controle', title: 'Central de controle — Ferrorama' },
];

export const SECTION_IDS = SECTIONS.map((s) => s.id);

export function getSectionTitle(id) {
  return SECTIONS.find((s) => s.id === id)?.title || SECTIONS[0].title;
}
