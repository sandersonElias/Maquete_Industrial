import SectionHeader from '../SectionHeader';
import SectionNav from '../SectionNav';

export default function Mina({ onNavigate }) {
  return (
    <section id="mina" className="section active">
      <SectionHeader number="04" title="Mina de Ferro" desc="O que é uma mina e como funciona na realidade e na maquete" />

      <div className="two-col reverse">
        <div className="col-visual">
          <div className="card">
            <div className="card-image">
              <img src="/images/mina-real.jpg" alt="Mina de ferro a céu aberto" loading="lazy" decoding="async" width={800} height={500} />
            </div>
          </div>
          <div className="card">
            <div className="card-image">
              <img src="/images/mina-maquete.jpg" alt="Detalhe da mina na maquete" loading="lazy" decoding="async" width={800} height={500} />
            </div>
          </div>
        </div>

        <div className="col-text">
          <h3>O que é uma mina de ferro?</h3>
          <p>Uma mina de ferro é uma instalação onde o minério de ferro — rocha rica em óxido de ferro (hematita ou magnetita) — é extraído do subsolo ou a céu aberto. O minério passa por britagem, separação magnética e pelletização antes de ser transportado ao aço.</p>

          <h3>Tipos de mineração</h3>
          <div className="mini-cards">
            <div className="mini-card">
              <strong>A céu aberto</strong>
              <p>Grandes crateras escavadas com caminhões fora de estrada. Comum no Brasil (Minas Gerais, Pará).</p>
            </div>
            <div className="mini-card">
              <strong>Subterrânea</strong>
              <p>Túneis e galerias abaixo da superfície. Usada quando o minério está em profundidade.</p>
            </div>
          </div>

          <h3>Na nossa maquete</h3>
          <p>Reproduzimos uma mina a céu aberto com dois poços: um para ferro (tom avermelhado) e outro para carvão (tom escuro). Uma esteira motorizada leva o material até os caminhões 3D, que por sua vez entregam ao trem — espelhando a logística real de uma operação integrada.</p>

          <div className="stats-row">
            <div className="stat">
              <span className="stat-value">~67%</span>
              <span className="stat-label">Ferro no minério brasileiro (média)</span>
            </div>
            <div className="stat">
              <span className="stat-value">400M+</span>
              <span className="stat-label">Ton/ano exportadas (Brasil)</span>
            </div>
          </div>
        </div>
      </div>

      <div className="content-block">
        <h3 className="block-title">Do minério ao aço — Etapas do processo</h3>
        <div className="process-chain">
          {[
            { n: '1', t: 'Extração', d: 'Perfuração, detonação e escavação do minério.' },
            { n: '2', t: 'Britagem', d: 'Fragmentação da rocha em pedaços menores.' },
            { n: '3', t: 'Beneficiamento', d: 'Separação magnética do ferro da ganga.' },
            { n: '4', t: 'Transporte', d: 'Trem ou caminhão até porto ou siderúrgica.' },
            { n: '5', t: 'Alto-forno', d: 'Minério + carvão → ferro-gusa → aço.' },
          ].map((s) => (
            <div key={s.n} className="process-step">
              <span className="process-num">{s.n}</span>
              <strong>{s.t}</strong>
              <p>{s.d}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="content-block">
        <h3 className="block-title">Ferro vs. Carvão na maquete</h3>
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr><th>Aspecto</th><th>Minério de Ferro</th><th>Carvão Mineral</th></tr>
            </thead>
            <tbody>
              <tr><td>Cor na maquete</td><td>Tom avermelhado / ferrugem</td><td>Preto / cinza escuro</td></tr>
              <tr><td>Função</td><td>Matéria-prima do aço</td><td>Combustível do alto-forno</td></tr>
              <tr><td>Poço na mina</td><td>Poço principal (maior)</td><td>Poço secundário</td></tr>
              <tr><td>Transporte</td><td>Vagão basculante 1 e 2</td><td>Vagão basculante 3</td></tr>
            </tbody>
          </table>
        </div>
      </div>

      <div className="callout callout-note">
        <strong>Sustentabilidade</strong>
        <p>Na vida real, mineradoras investem em recuperação de áreas degradadas e redução de emissões. Na maquete, representamos isso com uma faixa verde de reflorestamento ao redor da mina.</p>
      </div>

      <SectionNav
        prev={{ id: 'porto-aeroporto', label: 'Porto & Aeroporto' }}
        next={{ id: 'controle', label: 'Área de Controle' }}
        onNavigate={onNavigate}
      />
    </section>
  );
}
