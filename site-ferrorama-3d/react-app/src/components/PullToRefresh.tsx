import usePullToRefresh from '../hooks/usePullToRefresh';

/** Indicador visual do “puxar para atualizar” no topo (só celular). */
export default function PullToRefresh() {
  const { puxando, recarregando } = usePullToRefresh(true);
  const visivel = puxando > 10 || recarregando;
  const progresso = Math.min(1, puxando / 72);

  return (
    <div
      className={`ptr${visivel ? ' is-on' : ''}${recarregando ? ' is-loading' : ''}`}
      style={{ ['--ptr' as string]: String(progresso) }}
      aria-hidden={!visivel}
    >
      <span className="ptr__spin" />
      <span className="ptr__label">{recarregando ? 'Atualizando…' : 'Solte para atualizar'}</span>
    </div>
  );
}
