export default function Inicio({ onNavigate }) {
  const cards = [
    { id: 'montagem', num: '00', title: 'Montagem', text: 'Trem, mina, caminhões 3D e construção da maquete.' },
    { id: 'maquete', num: '01', title: 'Maquete', text: 'Fotos reais da construção do ferrorama na sala de aula.' },
    { id: 'codigo', num: '02', title: 'Código & Automação', text: 'Como os caminhões se movem e como o trem funciona.' },
    { id: 'porto-aeroporto', num: '03', title: 'Porto & Aeroporto', text: 'Transporte e exportação dos materiais.' },
    { id: 'mina', num: '04', title: 'Mina de Ferro', text: 'O que é uma mina e como reproduzimos na maquete.' },
    { id: 'controle', num: '05', title: 'Área de Controle', text: 'Central que coordena todo o sistema.' },
  ];

  return (
    <section id="inicio" className="section active">
      <header className="hero">
        <div className="hero-media">
          <img src="/images/maquete-montagem-2.png" alt="Visão geral da maquete ferroviária" loading="eager" decoding="async" width={1200} height={500} />
        </div>
        <div className="hero-content">
          <p className="page-label">Projeto escolar · Escala HO</p>
          <h2>Maquete ferroviária com automação</h2>
          <p className="page-lead">Documentação da construção, programação e operação do ferrorama — da extração na mina até a exportação pelo porto.</p>
        </div>
      </header>

      <dl className="spec-bar">
        <div className="spec-item"><dt>Base</dt><dd>120 × 80 cm</dd></div>
        <div className="spec-item"><dt>Módulos</dt><dd>5 áreas</dd></div>
        <div className="spec-item"><dt>Caminhões</dt><dd>3 un. · PLA</dd></div>
        <div className="spec-item"><dt>Controle</dt><dd>Arduino Mega</dd></div>
      </dl>

      <div className="home-grid">
        {cards.map((c) => (
          <a
            key={c.id}
            href={`#${c.id}`}
            className="home-card"
            onClick={(e) => { e.preventDefault(); onNavigate(c.id); }}
          >
            <span className="home-card-num">{c.num}</span>
            <h3>{c.title}</h3>
            <p>{c.text}</p>
          </a>
        ))}
      </div>

      <div className="content-block">
        <h3 className="block-title">Sobre o Projeto</h3>
        <p className="block-intro">O Ferrorama simula toda a cadeia produtiva do minério de ferro e carvão — da extração na mina até a exportação pelo porto ou aeroporto — integrando modelismo ferroviário, impressão 3D e programação em Arduino.</p>
        <div className="objectives-grid">
          <div className="objective-item">
            <strong>Objetivo principal</strong>
            <p>Demonstrar como materiais brutos percorrem diferentes modos de transporte até chegar ao mercado internacional.</p>
          </div>
          <div className="objective-item">
            <strong>Aprendizado técnico</strong>
            <p>Combinar física (motores, sensores), modelismo e lógica de programação em um único projeto integrado.</p>
          </div>
          <div className="objective-item">
            <strong>Contexto real</strong>
            <p>Relacionar a maquete com a economia brasileira, onde o minério de ferro é um dos principais produtos de exportação.</p>
          </div>
        </div>
      </div>

      <div className="content-block">
        <h3 className="block-title">Mapa da Maquete</h3>
        <p className="block-intro">Visão esquemática de como os módulos se conectam na base de MDF.</p>
        <div className="maquete-map">
          <div className="map-zone map-mina">Mina</div>
          <div className="map-arrow" aria-hidden="true" />
          <div className="map-zone map-caminhoes">Caminhões</div>
          <div className="map-arrow" aria-hidden="true" />
          <div className="map-zone map-trem">Trem</div>
          <div className="map-split">
            <div className="map-branch">
              <div className="map-arrow map-arrow-down" aria-hidden="true" />
              <div className="map-zone map-porto">Porto</div>
            </div>
            <div className="map-branch">
              <div className="map-arrow map-arrow-down" aria-hidden="true" />
              <div className="map-zone map-aeroporto">Aeroporto</div>
            </div>
          </div>
          <div className="map-control">Central de controle</div>
        </div>
      </div>

      <div className="content-block">
        <h3 className="block-title">Perguntas Frequentes</h3>
        <div className="accordion">
          <details className="accordion-item">
            <summary>Qual escala foi usada na maquete?</summary>
            <p>Utilizamos escala HO (1:87) para trilhos, locomotiva e vagões. Os caminhões foram impressos em escala compatível (~1:87) e o aeroporto usa aviões em escala 1:500.</p>
          </details>
          <details className="accordion-item">
            <summary>Quanto tempo levou para montar tudo?</summary>
            <p>A construção física levou cerca de 6 semanas: 2 semanas para a base e paisagismo, 2 para trilhos e eletrônica, e 2 para impressão 3D, testes e acabamento final.</p>
          </details>
          <details className="accordion-item">
            <summary>É possível controlar cada parte separadamente?</summary>
            <p>Sim. A central possui modo manual (cada subsistema independente) e modo automático (sequência completa mina → caminhões → trem → porto/aeroporto).</p>
          </details>
          <details className="accordion-item">
            <summary>Precisa de computador para funcionar?</summary>
            <p>Não. Após carregar o código no Arduino, a maquete funciona de forma autônoma. O computador é usado apenas para programar, ajustar parâmetros e monitorar via porta serial.</p>
          </details>
        </div>
      </div>

      <footer className="site-footer">
        <p>Ferrorama — documentação do projeto escolar</p>
        <p className="footer-note">Fotos reais: coloque JPG ou WebP em <code>images/</code> (mesmos nomes dos SVG).</p>
      </footer>
    </section>
  );
}
