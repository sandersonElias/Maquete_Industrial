import SectionHeader from '../SectionHeader';
import SectionNav from '../SectionNav';

export default function Montagem({ onNavigate }) {
  return (
    <section id="montagem" className="section active">
      <SectionHeader number="00" title="Montagem da Maquete" desc="Como foi construída a maquete, peça por peça" />

      <div className="card-grid">
        <article className="card card-featured">
          <div className="card-image">
            <img src="/images/montagem-geral.jpg" alt="Visão geral da maquete do ferrorama" loading="lazy" decoding="async" width={800} height={500} />
          </div>
          <div className="card-body">
            <h3>Visão Geral</h3>
            <p>A maquete foi montada sobre uma base de MDF de 1,20 × 0,80 m, com trilhos em escala HO. Cada elemento — mina, porto, aeroporto e vias — foi posicionado para simular uma cadeia logística real de extração até exportação.</p>
          </div>
        </article>

        <article className="card">
          <div className="card-image">
            <img src="/images/trem.jpg" alt="Trem da maquete nos trilhos" loading="lazy" decoding="async" width={800} height={500} />
          </div>
          <div className="card-body">
            <h3>O Trem</h3>
            <p>Locomotiva elétrica em escala HO com vagões basculantes para carvão e minério de ferro. Os trilhos formam um circuito fechado com desvios controlados por servomotores, permitindo rotas diferentes para carga e descarga.</p>
          </div>
        </article>

        <article className="card">
          <div className="card-image">
            <img src="/images/mina.jpg" alt="Mina de ferro e carvão na maquete" loading="lazy" decoding="async" width={800} height={500} />
          </div>
          <div className="card-body">
            <h3>Mina de Ferro e Carvão</h3>
            <p>A mina foi construída com espuma expandida esculpida, pintura acrílica e detalhes em palitos e areia. Dois poços representam a extração de ferro e carvão, com esteira simulada que &quot;alimenta&quot; os vagões do trem.</p>
          </div>
        </article>

        <article className="card">
          <div className="card-image">
            <img src="/images/caminhoes-3d.jpg" alt="Caminhões impressos em 3D" loading="lazy" decoding="async" width={800} height={500} />
          </div>
          <div className="card-body">
            <h3>Caminhões (Impressão 3D)</h3>
            <p>Os caminhões basculantes foram modelados no Tinkercad e impressos em PLA na impressora 3D da escola. Cada caminhão recebeu um motor DC micro com redução, montado na base oculta por baixo da pista.</p>
            <ul className="feature-list">
              <li>Material: PLA branco e cinza</li>
              <li>Tempo de impressão: ~4 h por unidade</li>
              <li>Motor: gearmotor 3 V com eixo de 6 mm</li>
            </ul>
          </div>
        </article>
      </div>

      <div className="callout">
        <strong>Materiais utilizados</strong>
        <p>MDF, trilhos HO, espuma, acrílico, fios, Arduino, sensores IR, servomotores, PLA para impressão 3D e tinta acrílica para acabamento paisagístico.</p>
      </div>

      <div className="content-block">
        <h3 className="block-title">Cronograma de Construção</h3>
        <div className="timeline">
          <div className="timeline-item">
            <span className="timeline-week">Semana 1–2</span>
            <strong>Base e estrutura</strong>
            <p>Corte do MDF, pintura do terreno, fixação dos trilhos e planejamento das áreas (mina, porto, aeroporto).</p>
          </div>
          <div className="timeline-item">
            <span className="timeline-week">Semana 3</span>
            <strong>Paisagismo e mina</strong>
            <p>Escultura da mina em espuma, aplicação de grama sintética, riachos com resina e detalhes rochosos.</p>
          </div>
          <div className="timeline-item">
            <span className="timeline-week">Semana 4</span>
            <strong>Impressão 3D</strong>
            <p>Modelagem no Tinkercad, impressão dos caminhões, lixamento, pintura e encaixe dos motores na base.</p>
          </div>
          <div className="timeline-item">
            <span className="timeline-week">Semana 5</span>
            <strong>Eletrônica</strong>
            <p>Montagem dos circuitos, soldagem, testes de motores, sensores IR e servomotores dos desvios.</p>
          </div>
          <div className="timeline-item">
            <span className="timeline-week">Semana 6</span>
            <strong>Integração e testes</strong>
            <p>Programação final, ajustes de velocidade, montagem do painel de controle e ensaios do modo automático.</p>
          </div>
        </div>
      </div>

      <div className="content-block">
        <h3 className="block-title">Especificações Técnicas</h3>
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Componente</th>
                <th>Especificação</th>
                <th>Observação</th>
              </tr>
            </thead>
            <tbody>
              <tr><td>Base</td><td>MDF 15 mm · 120 × 80 cm</td><td>Pintada com tinta acrílica marrom/verde</td></tr>
              <tr><td>Trilhos</td><td>Escala HO · código 100</td><td>Circuito oval com 2 desvios</td></tr>
              <tr><td>Locomotiva</td><td>Elétrica HO · 12 V DC</td><td>3 vagões basculantes</td></tr>
              <tr><td>Caminhões</td><td>PLA · ~8 cm cada</td><td>3 unidades com motor próprio</td></tr>
              <tr><td>Mina</td><td>Espuma + acrílico</td><td>2 poços (ferro e carvão)</td></tr>
            </tbody>
          </table>
        </div>
      </div>

      <div className="content-block">
        <h3 className="block-title">Processo de Impressão 3D dos Caminhões</h3>
        <div className="steps-grid">
          <div className="step-card">
            <span className="step-num">1</span>
            <strong>Modelagem</strong>
            <p>Desenho da carroceria basculante e chassi no Tinkercad, com furo para eixo do motor.</p>
          </div>
          <div className="step-card">
            <span className="step-num">2</span>
            <strong>Impressão</strong>
            <p>PLA a 210 °C, camada de 0,2 mm, preenchimento 20%. Suportes apenas na caçamba.</p>
          </div>
          <div className="step-card">
            <span className="step-num">3</span>
            <strong>Acabamento</strong>
            <p>Lixamento leve, pintura spray cinza e detalhes à mão (faróis, para-choque).</p>
          </div>
          <div className="step-card">
            <span className="step-num">4</span>
            <strong>Montagem</strong>
            <p>Motor colado na base oculta; caminhão encaixado sobre o eixo com silicone.</p>
          </div>
        </div>
      </div>

      <div className="callout callout-note">
        <strong>Desafio superado</strong>
        <p>Os caminhões derrapavam nas curvas da pista. Resolvemos colando tiras de borracha no eixo e aumentando o peso com chumbo fundido dentro da carroceria.</p>
      </div>

      <SectionNav
        prev={{ id: 'inicio', label: 'Início' }}
        next={{ id: 'maquete', label: 'Maquete' }}
        onNavigate={onNavigate}
      />
    </section>
  );
}
