import SectionHeader from '../SectionHeader';
import SectionNav from '../SectionNav';

export default function Maquete({ onNavigate }) {
  return (
    <section id="maquete" className="section active">
      <SectionHeader number="01" title="A Maquete" desc="Registro fotográfico da montagem do ferrorama na sala de aula" />

      <div className="card-grid photo-gallery">
        <article className="card card-featured">
          <div className="card-image">
            <img
              src="/images/maquete-montagem-2.png"
              alt="Visão geral da maquete ferroviária montada sobre mesas cobertas com papel kraft, com trilhos em circuito e equipe trabalhando ao redor"
              loading="lazy"
              decoding="async"
              width={1200}
              height={675}
            />
          </div>
          <div className="card-body">
            <h3>Visão geral do circuito</h3>
            <p>O layout foi montado sobre mesas unidas e cobertas com papel kraft, formando a base provisória da maquete. Os trilhos em escala HO criam um circuito com desvios, trechos elevados e acessórios como semáforos e passagem de nível — tudo montado de forma colaborativa pela turma.</p>
          </div>
        </article>

        <article className="card">
          <div className="card-image">
            <img
              src="/images/maquete-montagem-1.png"
              alt="Detalhe dos trilhos com guindaste laranja, painel de controle amarelo e estudantes programando ao fundo"
              loading="lazy"
              decoding="async"
              width={800}
              height={450}
            />
          </div>
          <div className="card-body">
            <h3>Detalhes e automação</h3>
            <p>Além dos trilhos, a maquete integra elementos de automação: sensores, motores e um painel de controle embutido na via. Ao fundo, a equipe trabalha no código e nos ajustes eletrônicos que coordenam o funcionamento do trem.</p>
          </div>
        </article>

        <article className="card">
          <div className="card-image">
            <img
              src="/images/maquete-montagem-3.png"
              alt="Equipe observando a maquete com tablet sobre a mesa e vagões posicionados nos trilhos"
              loading="lazy"
              decoding="async"
              width={800}
              height={450}
            />
          </div>
          <div className="card-body">
            <h3>Trabalho em equipe</h3>
            <p>A construção envolveu toda a turma do terceirão: uns cuidaram da parte física dos trilhos e suportes, outros da programação e testes. O tablet na mesa era usado para monitorar sensores e ajustar parâmetros em tempo real.</p>
          </div>
        </article>
      </div>

      <div className="content-block">
        <h3 className="block-title">Etapas visíveis nas fotos</h3>
        <div className="steps-grid">
          <div className="step-card">
            <span className="step-num">1</span>
            <strong>Base e trilhos</strong>
            <p>Mesas niveladas, papel kraft como terreno e fixação dos trilhos com suportes de cartão para trechos elevados.</p>
          </div>
          <div className="step-card">
            <span className="step-num">2</span>
            <strong>Acessórios</strong>
            <p>Semáforos, passagem de nível, guindaste e vagões posicionados para simular uma operação logística real.</p>
          </div>
          <div className="step-card">
            <span className="step-num">3</span>
            <strong>Integração</strong>
            <p>Conexão dos circuitos eletrônicos, testes com locomotiva e programação via Arduino e laptops.</p>
          </div>
        </div>
      </div>

      <div className="callout">
        <strong>Projeto escolar</strong>
        <p>Estas fotos documentam a fase de prototipagem e montagem do Ferrorama — antes da transferência definitiva para a base de MDF e do acabamento paisagístico final descritos na seção de Montagem.</p>
      </div>

      <SectionNav
        prev={{ id: 'montagem', label: 'Montagem' }}
        next={{ id: 'codigo', label: 'Código & Automação' }}
        onNavigate={onNavigate}
      />
    </section>
  );
}
