export default function MenuToggle({ open, onToggle }) {
  return (
    <button
      className={`menu-toggle${open ? ' open' : ''}`}
      type="button"
      aria-label={open ? 'Fechar menu' : 'Abrir menu'}
      onClick={onToggle}
    >
      <span />
      <span />
      <span />
    </button>
  );
}
