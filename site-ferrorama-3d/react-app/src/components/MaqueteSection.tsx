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

const objectives = [
  {
    label: 'Objetivo',
    text: 'Demonstrar como materiais brutos percorrem diferentes modos de transporte até o mercado internacional.',
  },
  {
    label: 'Aprendizado',
    text: 'Combinar física (motores, sensores), modelismo e lógica de programação num único projeto.',
  },
  {
    label: 'Contexto',
    text: 'Relacionar a maquete com a economia brasileira — o minério de ferro como exportação-chave.',
  },
];

const pipeline = [
  'Arduino',
  'Gateway',
  'Backend',
  'Dashboard',
  'App mobile',
];

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

        {/* `maquete3d-palco-wrap` fura o container de 1240px — a maquete é o
            destaque do site. Fica no wrapper, e não no componente, para que o
            placeholder de carregamento já ocupe a mesma largura e a página não
            salte quando a cena 3D entra. */}
        <div className="maquete3d-palco-wrap" ref={ref}>
          {proximo ? (
            <Suspense fallback={<Placeholder />}>
              <Maquete3D />
            </Suspense>
          ) : (
            <Placeholder />
          )}
        </div>

        <div className="shell-block">
          <h3 className="shell-block__title">Sobre o projeto</h3>
          <p className="shell-block__lead">
            O Ferrorama simula a cadeia do minério de ferro e carvão — da mina ao porto ou
            aeroporto — com modelismo ferroviário, impressão 3D e Arduino.
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
          <h3 className="shell-block__title">Como os módulos conversam</h3>
          <p className="shell-block__lead">
            Do Arduino ao painel: o mesmo caminho para cada comando.
          </p>
          <ol className="shell-pipeline" aria-label="Fluxo do sistema">
            {pipeline.map((step, i) => (
              <li key={step} className="shell-pipeline__step">
                {i > 0 && <span className="shell-pipeline__rail" aria-hidden="true" />}
                <span className="shell-pipeline__node">{step}</span>
              </li>
            ))}
          </ol>
          <p className="shell-pipeline__note">Persistência: PostgreSQL + Redis</p>
        </div>

        <div className="shell-block shell-block--faq">
          <h3 className="shell-block__title">Perguntas frequentes</h3>
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
