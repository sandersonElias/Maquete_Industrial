import { lazy, Suspense, useCallback, useEffect, useMemo, useState } from 'react';
import ErroDeCarga from './ErroDeCarga';

// A chave mantem o prefixo antigo de proposito: trocar por 'maquete-...' faria
// o aviso de virar o celular reaparecer para quem ja o dispensou.
const DISMISS_KEY = 'ferrorama-maquete-vire-ok';

type OrientacaoComLock = ScreenOrientation & { lock?: (orientacao: string) => Promise<void> };

function orientacaoTravavel(): OrientacaoComLock | null {
  if (typeof screen === 'undefined') return null;
  const orientacao = screen.orientation as OrientacaoComLock | undefined;
  // O type cast acima não prova que `lock` existe: Safari e Firefox não o têm.
  return orientacao && typeof orientacao.lock === 'function' ? orientacao : null;
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
      await orientacaoTravavel()?.lock('landscape');
    } catch {
      /* Safari: usuário vira o celular na mão */
    }
  }, [dispensar]);

  const mostrarAviso = retrato && !avisoOk;
  const [tentativa, setTentativa] = useState(0);
  const Maquete3D = useMemo(() => lazy(() => import('./maquete3d/Maquete3D')), [tentativa]);

  return (
    <div className="maquete-page">
      <header className="maquete-page__bar">
        <a className="maquete-page__voltar" href="/">
          Voltar ao site
        </a>
        <h1 className="maquete-page__titulo">Maquete Industrial · 3D</h1>
      </header>

      {mostrarAviso && (
        <aside className="maquete-vire" aria-label="Dica de orientação">
          <p>De lado (paisagem) a maquete fica maior, mas dá para usar em pé.</p>
          <div className="maquete-vire__acoes">
            <button type="button" className="maquete3d-btn maquete3d-btn-tour" onClick={abrirPaisagem}>
              Tentar tela cheia
            </button>
            <button type="button" className="maquete3d-btn" onClick={dispensar}>
              Continuar assim
            </button>
          </div>
        </aside>
      )}

      {retrato && avisoOk && (
        <p className="maquete-vire-faixa" role="status">
          Dica: vire o celular de lado para ver melhor.
        </p>
      )}

      <main className="maquete-page__palco">
        <ErroDeCarga
          key={tentativa}
          mensagem="Não foi possível carregar a maquete 3D."
          aoTentar={() => setTentativa((t) => t + 1)}
        >
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
        </ErroDeCarga>
      </main>
    </div>
  );
}
