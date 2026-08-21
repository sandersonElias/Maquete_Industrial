import { lazy, Suspense, useEffect, useRef, useState, Component, type ReactNode } from 'react';

/**
 * A maquete 3D carrega em um chunk separado: three.js + drei só descem
 * quando esta seção se aproxima da tela (ou o usuário pede no celular).
 */
const Maquete3D = lazy(() => import('./maquete3d/Maquete3D'));

class MaqueteErro extends Component<{ children: ReactNode }, { erro: Error | null }> {
  state = { erro: null as Error | null };

  static getDerivedStateFromError(erro: Error) {
    return { erro };
  }

  render() {
    if (this.state.erro) {
      return (
        <div className="maquete3d-carregando" role="alert">
          <p>Não foi possível carregar a maquete 3D.</p>
          <p style={{ fontSize: '0.8rem', opacity: 0.7 }}>{this.state.erro.message}</p>
        </div>
      );
    }
    return this.props.children;
  }
}

function isMobileViewport() {
  return typeof window !== 'undefined' && window.matchMedia('(max-width: 768px)').matches;
}

/** Só monta a cena 3D quando o usuário chega perto — no celular, só sob pedido. */
function useProximoDaTela<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const [proximo, setProximo] = useState(
    () => typeof window !== 'undefined' && window.location.hash.includes('maquete') && !isMobileViewport()
  );
  const [pedido, setPedido] = useState(false);

  const carregar = () => {
    setPedido(true);
    setProximo(true);
  };

  useEffect(() => {
    if (proximo) {
      import('./maquete3d/Maquete3D');
    }
  }, [proximo]);

  useEffect(() => {
    const el = ref.current;
    if (!el || pedido) return;

    // No celular a home não puxa Three sozinha — evita travar o scroll da feira.
    if (isMobileViewport()) return;

    if (typeof IntersectionObserver === 'undefined') {
      setProximo(true);
      return;
    }
    const obs = new IntersectionObserver(
      ([entrada]) => {
        if (entrada.isIntersecting) {
          setProximo(true);
          obs.disconnect();
        }
      },
      { rootMargin: '200px' }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [pedido]);

  return { ref, proximo, carregar, precisaToque: isMobileViewport() && !proximo };
}

function Placeholder({
  precisaToque,
  onCarregar,
}: {
  precisaToque?: boolean;
  onCarregar?: () => void;
}) {
  return (
    <div className="maquete3d-carregando" role="status">
      {precisaToque ? (
        <>
          <p>Na feira, a maquete leve fica em tela cheia.</p>
          <div className="maquete-abrir maquete-abrir--stack">
            <a className="hero-cta" href="/maquete">
              Abrir maquete em tela cheia
            </a>
            <button type="button" className="hero-cta-secondary" onClick={onCarregar}>
              Carregar preview aqui
            </button>
          </div>
        </>
      ) : (
        <>
          <span className="maquete3d-spinner" aria-hidden="true" />
          <p>Montando a maquete 3D…</p>
        </>
      )}
    </div>
  );
}

const objectives = [
  {
    label: 'Objetivo',
    text: 'Mostrar a cadeia mina → caminhão → trem → porto, do poço ao navio.',
  },
  {
    label: 'Aprendizado',
    text: 'Juntar modelismo HO, impressão 3D, Arduino e protocolo serial num só projeto.',
  },
  {
    label: 'Contexto',
    text: 'Minério de ferro e carvão como narrativa da exportação brasileira — sem aeroporto na placa.',
  },
];

const chain = ['Mina', 'Caminhões', 'Trem', 'Porto'];

export default function MaqueteSection() {
  const { ref, proximo, carregar, precisaToque } = useProximoDaTela<HTMLDivElement>();

  return (
    <section id="maquete" className="section">
      <div className="section-container">
        <div className="section-header">
          <span className="section-number">01</span>
          <h2 className="section-title">Maquete 3D Interativa</h2>
          <p className="section-subtitle">
            Gire, aproxime e abra em tela cheia — o QR da feira aponta direto para a experiência
          </p>
        </div>

        <div ref={ref}>
          {proximo ? (
            <MaqueteErro>
              <Suspense fallback={<Placeholder />}>
                <Maquete3D />
              </Suspense>
            </MaqueteErro>
          ) : (
            <Placeholder precisaToque={precisaToque} onCarregar={carregar} />
          )}
        </div>

        <p className="maquete-abrir">
          <a className="hero-cta" href="/maquete">
            Abrir maquete em tela cheia
          </a>
        </p>

        <div className="shell-block">
          <h3 className="shell-block__title">Sobre o projeto</h3>
          <p className="shell-block__lead">
            O Ferrorama simula a cadeia do minério de ferro e carvão — da mina ao porto —
            com modelismo ferroviário, impressão 3D e Arduino.
          </p>
          <ul className="shell-facts">
            {objectives.map((item) => (
              <li key={item.label} className="shell-fact">
                <span className="shell-fact__label">{item.label}</span>
                <p className="shell-fact__text">{item.text}</p>
              </li>
            ))}
          </ul>
        </div>

        <div className="shell-block">
          <h3 className="shell-block__title">A cadeia na maquete</h3>
          <p className="shell-block__lead">
            Extração, transporte e exportação — o mesmo caminho do minério no Brasil, em escala HO.
          </p>
          <ol className="shell-pipeline" aria-label="Cadeia logística">
            {chain.map((step, i) => (
              <li key={step} className="shell-pipeline__step">
                <span className="shell-pipeline__node">{step}</span>
                {i < chain.length - 1 && (
                  <span className="shell-pipeline__rail" aria-hidden="true" />
                )}
              </li>
            ))}
          </ol>
          <p className="shell-pipeline__note">
            Desvios SW3 (porto) e SW4 (mina) escolhem o ramal; o destino padrão é o loop principal.
          </p>
        </div>

        <div className="shell-block shell-block--faq">
          <h3 className="shell-block__title">Perguntas frequentes</h3>
          <div className="maquete-accordion">
            <details className="maquete-accordion-item">
              <summary>Qual escala foi usada na maquete?</summary>
              <p>
                Utilizamos escala HO (1:87) para trilhos, locomotiva e vagões. Os caminhões foram
                impressos em escala compatível (~1:87).
              </p>
            </details>
            <details className="maquete-accordion-item">
              <summary>Quanto tempo levou para montar tudo?</summary>
              <p>
                A construção física levou cerca de 6 semanas: 2 semanas para a base e paisagismo, 2
                para trilhos e eletrônica, e 2 para impressão 3D, testes e acabamento final.
              </p>
            </details>
            <details className="maquete-accordion-item">
              <summary>É possível controlar cada parte separadamente?</summary>
              <p>
                Sim. A central possui modo manual (cada subsistema independente) e modo automático
                (sequência completa mina → caminhões → trem → porto).
              </p>
            </details>
            <details className="maquete-accordion-item">
              <summary>Precisa de computador para funcionar?</summary>
              <p>
                Não. Após carregar o código no Arduino, a maquete funciona de forma autônoma. O
                computador é usado apenas para programar, ajustar parâmetros e monitorar via porta
                serial.
              </p>
            </details>
          </div>
        </div>
      </div>
    </section>
  );
}
