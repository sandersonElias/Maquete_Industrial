/**
 * Lista única das seções da home.
 *
 * Antes cada um dos três lugares (nav, saltos do hero, rodapé) mantinha a sua
 * cópia dos mesmos ids: acrescentar uma seção exigia lembrar de editar os três,
 * além de `App.tsx` — que ainda é manual, porque o número de cada seção está
 * no próprio componente.
 */
export type Secao = {
  id: string;
  label: string;
  /** Rótulo curto da barra de rolagem da nav no celular. */
  curto?: string;
  /** Sai da nav em telas estreitas (hero e rodapé mantêm o link). */
  esconderNoMobile?: boolean;
};

export const SECOES: readonly Secao[] = [
  { id: 'inicio', label: 'Início', esconderNoMobile: true },
  { id: 'maquete', label: 'Maquete' },
  { id: 'preparacao', label: 'Preparação', curto: 'Prep' },
  { id: 'montagem', label: 'Montagem' },
  { id: 'codigo', label: 'Automação', curto: 'Auto' },
  { id: 'mina', label: 'Mina' },
  { id: 'porto', label: 'Porto' },
  { id: 'controle', label: 'Controle' },
];
