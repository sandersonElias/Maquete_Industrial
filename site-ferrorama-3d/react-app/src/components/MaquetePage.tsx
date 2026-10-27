import { lazy, Suspense, useCallback, useEffect, useState } from 'react';

const Maquete3D = lazy(() => import('./maquete3d/Maquete3D'));

// A chave mantem o prefixo antigo de proposito: trocar por 'maquete-...' faria
// o aviso de virar o celular reaparecer para quem ja o dispensou.
const DISMISS_KEY = 'ferrorama-maquete-vire-ok';

function podeTravarPaisagem() {
  return typeof screen !== 'undefined' && 'orientation' in screen && 'lock' in (screen.orientation ?? {});
}

export default function MaquetePage() {
  const [retrato, setRetrato] = useState(
    () => typeof window !== 'undefined' && window.matchMedia('(orientation: portrait) and (max-width: 900px)').matches
  );
  const [avisoOk, setAvisoOk] = useState(
    () => typeof sessionStorage !== 'undefined' && sessionStorage.getItem(DISMISS_KEY) === '1'
  );

  useEffect(() => {
    const mq = window.matchMedia('(orientation: portrait) and (max-width: 900px)');
    const sync = () => setRetrato(mq.matches);
    mq.addEventListener('change', sync);
    return () => mq.removeEventListener('change', sync);
  }, []);

  const dispensar = useCallback(() => {
    sessionStorage.setItem(DISMISS_KEY, '1');
    setAvisoOk(true);
  }, []);

  const abrirPaisagem = useCallback(async () => {
    dispensar();
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
      /* Safari: usuário vira o celular na mão */
    }
  }, [dispensar]);

  const mostrarAviso = retrato && !avisoOk;

  return (
    <div className="maquete-page">
      <header className="maquete-page__bar">
        <a className="maquete-page__voltar" href="/">
          Voltar ao site
        </a>
        <span className="maquete-page__titulo">Maquete Industrial · 3D</span>
      </header>

      {mostrarAviso && (
        <div className="maquete-vire" role="dialog" aria-label="Dica de orientação">
          <p>De lado (paisagem) a maquete fica maior, mas dá para usar em pé.</p>
          <div className="maquete-vire__acoes">
            <button type="button" className="maquete3d-btn maquete3d-btn-tour" onClick={abrirPaisagem}>
              Tentar tela cheia
            </button>
            <button type="button" className="maquete3d-btn" onClick={dispensar}>
              Continuar assim
            </button>
          </div>
        </div>
      )}

      {retrato && avisoOk && (
        <p className="maquete-vire-faixa" role="status">
          Dica: vire o celular de lado para ver melhor.
        </p>
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
