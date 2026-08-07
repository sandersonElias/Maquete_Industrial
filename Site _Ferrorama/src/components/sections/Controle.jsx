import { useEffect, useState } from 'react';
import SectionHeader from '../SectionHeader';
import SectionNav from '../SectionNav';

const PANEL_ITEMS = [
  { led: 'green', label: 'Trem — Em operação' },
  { led: 'green', label: 'Caminhão 1 — Ida' },
  { led: 'yellow', label: 'Caminhão 2 — Carga' },
  { led: 'green', label: 'Porto — Embarque' },
  { led: 'red', label: 'Aeroporto — Standby' },
  { led: 'green', label: 'Mina — Extraindo' },
];

const codeAuto = `void modoAutomatico() {
  iniciarMina();
  aguardarCarga();
  liberarCaminhoes();
  aguardarTrem();
  acionarPorto();
  if (cargaUrgente) acionarAeroporto();
  exibirStatus("Ciclo completo");
}`;

export default function Controle({ onNavigate }) {
  const [panelIndex, setPanelIndex] = useState(0);

  useEffect(() => {
    const id = setInterval(() => {
      setPanelIndex((i) => (i + 1) % PANEL_ITEMS.length);
    }, 3000);
    return () => clearInterval(id);
  }, []);

  return (
    <section id="controle" className="section active">
      <SectionHeader number="05" title="Área de Controle Geral" desc="Central que coordena trem, caminhões, porto e aeroporto" />

      <div className="control-layout">
        <div className="control-panel-visual">
          <div className="card">
            <div className="card-image">
              <img src="/images/controle.jpg" alt="Painel de controle da maquete" loading="lazy" decoding="async" width={800} height={500} />
            </div>
          </div>

          <div className="panel-mockup">
            <div className="panel-header">CENTRAL FERRORAMA</div>
            <div className="panel-grid">
              {PANEL_ITEMS.map((item, i) => (
                <div key={item.label} className={`panel-item${i === panelIndex ? ' active' : ''}`}>
                  <span className={`panel-led ${item.led}`} />
                  <span>{item.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="control-info">
          <h3>Como funciona a central</h3>
          <p>A área de controle concentra um Arduino Mega conectado a todos os subsistemas. Botões físicos e um display LCD 16×2 permitem ligar/desligar cada módulo, ajustar velocidade do trem e acionar sequências automáticas.</p>

          <div className="control-features">
            <div className="control-feature">
              <div>
                <strong>Botões de modo</strong>
                <p>Manual (cada elemento independente) ou automático (sequência completa mina → porto).</p>
              </div>
            </div>
            <div className="control-feature">
              <div>
                <strong>Display LCD</strong>
                <p>Mostra status em tempo real: posição do trem, estado dos caminhões e alertas.</p>
              </div>
            </div>
            <div className="control-feature">
              <div>
                <strong>Alimentação centralizada</strong>
                <p>Fonte 12 V com barramento de distribuição; fusíveis individuais por circuito.</p>
              </div>
            </div>
            <div className="control-feature">
              <div>
                <strong>Comunicação serial</strong>
                <p>Monitor serial no PC para debug e logs de eventos durante demonstrações.</p>
              </div>
            </div>
          </div>

          <div className="code-block">
            <div className="code-header">
              <span>Modo automático — sequência</span>
              <span className="code-lang">C++</span>
            </div>
            <pre><code>{codeAuto}</code></pre>
          </div>
        </div>
      </div>

      <div className="content-block">
        <h3 className="block-title">Modos de Operação</h3>
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr><th>Modo</th><th>Descrição</th><th>Quando usar</th></tr>
            </thead>
            <tbody>
              <tr><td>Manual</td><td>Cada botão liga/desliga um subsistema</td><td>Demonstrações, testes, manutenção</td></tr>
              <tr><td>Automático</td><td>Sequência completa mina → exportação</td><td>Apresentações e feiras de ciências</td></tr>
              <tr><td>Emergência</td><td>Botão vermelho para todos os motores</td><td>Imprevistos ou superaquecimento</td></tr>
            </tbody>
          </table>
        </div>
      </div>

      <div className="content-block">
        <h3 className="block-title">Arquitetura do Sistema</h3>
        <div className="architecture-diagram">
          <div className="arch-layer">
            <span className="arch-label">Interface</span>
            <div className="arch-items">
              <span>Botões</span>
              <span>LCD 16×2</span>
              <span>LEDs status</span>
            </div>
          </div>
          <div className="arch-connector">↕</div>
          <div className="arch-layer arch-main">
            <span className="arch-label">Controlador</span>
            <div className="arch-items">
              <span>Arduino Mega</span>
            </div>
          </div>
          <div className="arch-connector">↕</div>
          <div className="arch-layer">
            <span className="arch-label">Atuadores & Sensores</span>
            <div className="arch-items">
              <span>Motores DC</span>
              <span>Servos</span>
              <span>IR / Reed</span>
              <span>Esteiras</span>
            </div>
          </div>
        </div>
      </div>

      <div className="content-block">
        <h3 className="block-title">Checklist antes de ligar</h3>
        <ul className="checklist">
          <li>Trilhos livres de objetos e fios soltos</li>
          <li>Desvios alinhados na posição correta</li>
          <li>Fonte 12 V conectada e fusíveis ok</li>
          <li>Caminhões encaixados na pista guia</li>
          <li>Código carregado e monitor serial testado</li>
          <li>Botão de emergência acessível</li>
        </ul>
      </div>

      <div className="content-block">
        <h3 className="block-title">Glossário Rápido</h3>
        <div className="glossary-grid">
          <div className="glossary-item"><strong>HO</strong><p>Escala 1:87, padrão em modelismo ferroviário.</p></div>
          <div className="glossary-item"><strong>L298N</strong><p>Driver que controla motores DC com Arduino.</p></div>
          <div className="glossary-item"><strong>PWM</strong><p>Modulação de largura de pulso — controla velocidade.</p></div>
          <div className="glossary-item"><strong>Reed switch</strong><p>Sensor magnético de proximidade.</p></div>
          <div className="glossary-item"><strong>PLA</strong><p>Plástico biodegradável usado na impressão 3D.</p></div>
          <div className="glossary-item"><strong>DCC</strong><p>Digital Command Control — controle digital de trens.</p></div>
        </div>
      </div>

      <SectionNav
        prev={{ id: 'mina', label: 'Mina de Ferro' }}
        next={{ id: 'inicio', label: 'Voltar ao Início' }}
        onNavigate={onNavigate}
      />
    </section>
  );
}
