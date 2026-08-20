import { lazy, Suspense, useCallback, useEffect, useState } from 'react';

const Maquete3D = lazy(() => import('./maquete3d/Maquete3D'));

function podeTravarPaisagem() {
  return typeof screen !== 'undefined' && 'orientation' in screen && 'lock' in (screen.orientation ?? {});
}

export default function MaquetePage() {
  const [retrato, setRetrato] = useState(
    () => typeof window !== 'undefined' && window.matchMedia('(orientation: portrait) and (max-width: 900px)').matches
  );

  useEffect(() => {
    const mq = window.matchMedia('(orientation: portrait) and (max-width: 900px)');
    const sync = () => setRetrato(mq.matches);
    mq.addEventListener('change', sync);
    return () => mq.removeEventListener('change', sync);
  }, []);

  const abrir = useCallback(async () => {
    try {
      await document.documentElement.requestFullscreen();
    } catch {
      /* iOS muitas vezes bloqueia */
    }
    try {
      if (podeTravarPaisagem()) {
        await (screen.orientation as ScreenOrientation & { lock: (o: string) => Promise<void> }).lock('landscape');
      }
    } catch {
      /* Safari: o aviso “Vire o celular” permanece */
    }
  }, []);

  return (
    <div className="maquete-page">
      <header className="maquete-page__bar">
        <a className="maquete-page__voltar" href="/">
          Voltar ao site
        </a>
        <span className="maquete-page__titulo">Ferrorama · Maquete 3D</span>
      </header>

      {retrato && (
        <div className="maquete-vire" role="dialog" aria-label="Vire o celular">
          <p>Vire o celular de lado para ver melhor a maquete.</p>
          <button type="button" className="maquete3d-btn maquete3d-btn-tour" onClick={abrir}>
            Abrir maquete
          </button>
        </div>
      )}

      <div className="maquete-page__palco">
        <Suspense
          fallback={
            <div className="maquete3d-carregando" role="status">
              <span className="maquete3d-spinner" aria-hidden="true" />
              <p>Montando a maquete 3D…</p>
            </div>
          }
        >
          <Maquete3D telaCheia />
        </Suspense>
      </div>
    </div>
  );
}
