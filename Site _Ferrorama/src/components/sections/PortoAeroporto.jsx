import { Fragment } from 'react';
import SectionHeader from '../SectionHeader';
import SectionNav from '../SectionNav';

export default function PortoAeroporto({ onNavigate }) {
  return (
    <section id="porto-aeroporto" className="section active">
      <SectionHeader number="03" title="Porto & Aeroporto" desc="Transporte e exportação dos materiais extraídos" />

      <div className="card-grid card-grid-2">
        <article className="card card-large">
          <div className="card-image card-image-tall">
            <img src="/images/porto.jpg" alt="Porto na maquete para exportação de minério" loading="lazy" decoding="async" width={800} height={500} />
          </div>
          <div className="card-body">
            <h3>Porto</h3>
            <p>Após o trem descarregar minério e carvão nos silos do porto, guindastes articulados (feitos com palitos e fio) simulam a carga em navios-carga. O porto representa a etapa de exportação marítima — principal via para ferro e carvão no comércio internacional.</p>
            <p>Na maquete, LEDs vermelhos indicam &quot;navio atracado&quot; e um motor linear move a esteira do cais, sugerindo o fluxo contínuo de mercadoria embarcada.</p>
          </div>
        </article>

        <article className="card card-large">
          <div className="card-image card-image-tall">
            <img src="/images/aeroporto.jpg" alt="Aeroporto de carga na maquete" loading="lazy" decoding="async" width={800} height={500} />
          </div>
          <div className="card-body">
            <h3>Aeroporto de carga</h3>
            <p>O aeroporto complementa o porto como rota alternativa de transporte. Aviões cargueiros em miniatura (escala 1:500) representam o envio rápido de materiais de alto valor ou peças urgentes.</p>
            <p>Na maquete, caminhões levam carga do trem até o terminal aéreo; um LED piscante simula pista ativa e decolagem programada via temporizador no Arduino.</p>
          </div>
        </article>
      </div>

      <div className="logistics-flow">
        <h3>Cadeia logística simulada</h3>
        <div className="logistics-steps">
          {['Mina', 'Caminhões', 'Trem', 'Porto', 'Aeroporto'].map((label, i, arr) => (
            <Fragment key={label}>
              <div className="logistics-item">
                <span className="logistics-label">{label}</span>
              </div>
              {i < arr.length - 1 && <div className="logistics-line" />}
            </Fragment>
          ))}
        </div>
      </div>

      <div className="content-block">
        <h3 className="block-title">Porto vs. Aeroporto — Quando usar cada um?</h3>
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr><th>Critério</th><th>Porto</th><th>Aeroporto</th></tr>
            </thead>
            <tbody>
              <tr><td>Volume transportado</td><td>Alto (milhões de toneladas)</td><td>Baixo (cargas especiais)</td></tr>
              <tr><td>Custo</td><td>Menor por tonelada</td><td>Muito maior</td></tr>
              <tr><td>Velocidade</td><td>Semanas (marítimo)</td><td>Horas (aéreo)</td></tr>
              <tr><td>Na maquete</td><td>Rota padrão do trem</td><td>Rota alternativa via desvio</td></tr>
              <tr><td>Material típico</td><td>Minério de ferro, carvão</td><td>Amostras, peças urgentes</td></tr>
            </tbody>
          </table>
        </div>
      </div>

      <div className="content-block">
        <h3 className="block-title">Exportação no Brasil</h3>
        <div className="objectives-grid">
          <div className="objective-item">
            <strong>2º maior exportador</strong>
            <p>O Brasil é um dos maiores exportadores mundiais de minério de ferro, principalmente para China, Japão e Europa.</p>
          </div>
          <div className="objective-item">
            <strong>Porto de Tubarão</strong>
            <p>Um dos maiores terminais de minério do mundo, em Vitória (ES) — referência para nossa maquete portuária.</p>
          </div>
          <div className="objective-item">
            <strong>Ferrovia Vitória–Minas</strong>
            <p>EFVM liga as minas de Minas Gerais ao litoral — inspirou o circuito ferroviário da maquete.</p>
          </div>
        </div>
      </div>

      <div className="callout">
        <strong>Referência</strong>
        <p>Um navio Valemax pode carregar até 400 mil toneladas de minério — equivalente a cerca de 4 mil vagões de trem. Na maquete, LEDs indicam carga contínua no cais.</p>
      </div>

      <SectionNav
        prev={{ id: 'codigo', label: 'Código & Automação' }}
        next={{ id: 'mina', label: 'Mina de Ferro' }}
        onNavigate={onNavigate}
      />
    </section>
  );
}
