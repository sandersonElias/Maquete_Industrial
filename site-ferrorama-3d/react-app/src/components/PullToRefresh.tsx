import usePullToRefresh from '../hooks/usePullToRefresh';

/** Indicador visual do “puxar para atualizar” no topo (só celular). */
export default function PullToRefresh() {
  const { puxando, recarregando } = usePullToRefresh(true);
  const visivel = puxando > 10 || recarregando;
  const progresso = Math.min(1, puxando / 72);

  return (
    <>
      <div
        className={`ptr${visivel ? ' is-on' : ''}${recarregando ? ' is-loading' : ''}`}
        style={{ ['--ptr' as string]: String(progresso) } as React.CSSProperties}
        aria-hidden="true"
      >
        <span className="ptr__spin" />
        <span className="ptr__label">{recarregando ? 'Atualizando…' : 'Solte para atualizar'}</span>
      </div>

      {/* Região viva separada: o indicador acima fica oculto de leitores de tela
          enquanto não há puxada, e uma região escondida não anuncia nada. */}
      <span className="visually-hidden" role="status">
        {visivel ? (recarregando ? 'Atualizando a página…' : 'Solte para atualizar') : ''}
      </span>
    </>
  );
}
