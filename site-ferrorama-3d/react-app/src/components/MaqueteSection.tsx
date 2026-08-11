import { lazy, Suspense, useEffect, useRef, useState } from 'react';

/**
 * A maquete 3D carrega em um chunk separado: three.js + drei só descem
 * quando esta seção se aproxima da tela, em vez de entrar no bundle inicial.
 * Isso tirou ~240 KB gzip do carregamento inicial do site.
 */
const Maquete3D = lazy(() => import('./maquete3d/Maquete3D'));

/** Só monta a cena 3D quando o usuário chega perto dela. */
function useProximoDaTela<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const [proximo, setProximo] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    // Sem IntersectionObserver, carrega direto em vez de nunca carregar
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
      { rootMargin: '600px' }
    );
    obs.observe(el);

    // Rede de segurança: em aba de segundo plano o observer pode não disparar.
    // Sem isso o usuário ficaria preso no placeholder para sempre.
    const prazo = window.setTimeout(() => {
      setProximo(true);
      obs.disconnect();
    }, 3000);

    return () => {
      obs.disconnect();
      clearTimeout(prazo);
    };
  }, []);

  return { ref, proximo };
}

function Placeholder() {
  return (
    <div className="maquete3d-carregando" role="status">
      <span className="maquete3d-spinner" aria-hidden="true" />
      <p>Montando a maquete 3D…</p>
    </div>
  );
}

export default function MaqueteSection() {
  const { ref, proximo } = useProximoDaTela<HTMLDivElement>();

  return (
    <section id="maquete" className="section">
      <div className="section-container">
        <div className="section-header">
          <span className="section-number">01</span>
          <h2 className="section-title">Maquete 3D Interativa</h2>
          <p className="section-subtitle">
            Gire, aproxime e clique nos módulos para explorar a maquete por dentro
          </p>
        </div>

        <div ref={ref}>
          {proximo ? (
            <Suspense fallback={<Placeholder />}>
              <Maquete3D />
            </Suspense>
          ) : (
            <Placeholder />
          )}
        </div>

        {/* Sobre o Projeto */}
        <div className="maquete-about-section">
          <h3 className="maquete-section-title">Sobre o Projeto</h3>
          <p className="maquete-section-desc">
            O Ferrorama simula toda a cadeia produtiva do minério de ferro e carvão — da extração na
            mina até a exportação pelo porto ou aeroporto — integrando modelismo ferroviário,
            impressão 3D e programação em Arduino.
          </p>
          <div className="maquete-objectives-grid">
            <div className="maquete-objective-item">
              <strong>Objetivo principal</strong>
              <p>
                Demonstrar como materiais brutos percorrem diferentes modos de transporte até chegar
                ao mercado internacional.
              </p>
            </div>
            <div className="maquete-objective-item">
              <strong>Aprendizado técnico</strong>
              <p>
                Combinar física (motores, sensores), modelismo e lógica de programação em um único
                projeto integrado.
              </p>
            </div>
            <div className="maquete-objective-item">
              <strong>Contexto real</strong>
              <p>
                Relacionar a maquete com a economia brasileira, onde o minério de ferro é um dos
                principais produtos de exportação.
              </p>
            </div>
          </div>
        </div>

        {/* Arquitetura do sistema */}
        <div className="maquete-map-section">
          <h3 className="maquete-section-title">Como os módulos conversam</h3>
          <p className="maquete-section-desc">
            Do Arduino ao dashboard, cada comando percorre o mesmo caminho.
          </p>
          <div className="maquete-map">
            <div className="map-zone map-mina">Arduino</div>
            <div className="map-arrow" aria-hidden="true"></div>
            <div className="map-zone map-caminhoes">Gateway</div>
            <div className="map-arrow" aria-hidden="true"></div>
            <div className="map-zone map-trem">Backend</div>
            <div className="map-split">
              <div className="map-branch">
                <div className="map-arrow map-arrow-down" aria-hidden="true"></div>
                <div className="map-zone map-porto">Dashboard</div>
              </div>
              <div className="map-branch">
                <div className="map-arrow map-arrow-down" aria-hidden="true"></div>
                <div className="map-zone map-aeroporto">App mobile</div>
              </div>
            </div>
            <div className="map-control">PostgreSQL + Redis</div>
          </div>
        </div>

        {/* FAQ */}
        <div className="maquete-faq-section">
          <h3 className="maquete-section-title">Perguntas Frequentes</h3>
          <div className="maquete-accordion">
            <details className="maquete-accordion-item">
              <summary>Qual escala foi usada na maquete?</summary>
              <p>
                Utilizamos escala HO (1:87) para trilhos, locomotiva e vagões. Os caminhões foram
                impressos em escala compatível (~1:87) e o aeroporto usa aviões em escala 1:500.
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
                (sequência completa mina → caminhões → trem → porto/aeroporto).
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
