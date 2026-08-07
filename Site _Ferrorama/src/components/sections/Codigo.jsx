import { useState } from 'react';
import SectionHeader from '../SectionHeader';
import SectionNav from '../SectionNav';

const TABS = [
  { id: 'tab-caminhoes', label: 'Caminhões' },
  { id: 'tab-trem', label: 'Trem' },
  { id: 'tab-desvios', label: 'Desvios' },
];

const codeCaminhao = `const int motorA = 5, motorB = 6;
const int sensorEsq = 2, sensorDir = 3;

void setup() {
  pinMode(motorA, OUTPUT);
  pinMode(motorB, OUTPUT);
  pinMode(sensorEsq, INPUT);
  pinMode(sensorDir, INPUT);
}

void loop() {
  if (digitalRead(sensorDir) == LOW) {
    // Fim da pista — inverte
    analogWrite(motorA, 0);
    analogWrite(motorB, 180);
    delay(500);
  } else {
    analogWrite(motorA, 180);
    analogWrite(motorB, 0);
  }
}`;

const codeTrem = `const int pinoMotorTrem = 9;
const int sensorEstacao = 4;

void loop() {
  analogWrite(pinoMotorTrem, 200);

  if (digitalRead(sensorEstacao) == LOW) {
    analogWrite(pinoMotorTrem, 0);
    delay(3000);
  }
}`;

const codeDesvio = `#include <Servo.h>
Servo desvioPorto;

void setup() {
  desvioPorto.attach(10);
  desvioPorto.write(0);
}

void irParaAeroporto() {
  desvioPorto.write(90);
  delay(800);
}`;

export default function Codigo({ onNavigate }) {
  const [tab, setTab] = useState('tab-caminhoes');

  return (
    <section id="codigo" className="section active">
      <SectionHeader number="02" title="Código & Automação" desc="Como os caminhões se locomovem e como o trem funciona" />

      <div className="tabs" role="tablist">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            className={`tab-btn${tab === t.id ? ' active' : ''}`}
            role="tab"
            aria-selected={tab === t.id}
            onClick={() => setTab(t.id)}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'tab-caminhoes' && (
        <div id="tab-caminhoes" className="tab-panel active">
          <div className="two-col">
            <div className="col-text">
              <h3>Locomoção dos Caminhões</h3>
              <p>Cada caminhão possui um motor DC controlado por um driver L298N conectado ao Arduino. O movimento segue uma pista guia; sensores infravermelhos (IR) nas extremidades detectam quando o veículo chega ao fim e invertem a direção automaticamente.</p>

              <div className="code-block">
                <div className="code-header">
                  <span>Arduino — Caminhão</span>
                  <span className="code-lang">C++</span>
                </div>
                <pre><code>{codeCaminhao}</code></pre>
              </div>

              <h3>Lógica de inversão</h3>
              <p>Quando o sensor IR detecta a borda preta da pista (sinal LOW), o motor inverte por 500 ms antes de retomar. Isso evita que o caminhão saia dos trilhos guia nas extremidades.</p>
            </div>

            <div className="col-visual">
              <div className="card">
                <div className="card-image">
                  <img src="/images/arduino.jpg" alt="Placa Arduino e sensores na maquete" loading="lazy" decoding="async" width={800} height={500} />
                </div>
                <div className="card-body">
                  <h3>Hardware</h3>
                  <p>Arduino Mega, L298N, sensores IR TCRT5000, servomotores SG90 e fonte 12 V regulada para 5 V.</p>
                </div>
              </div>

              <div className="flow-diagram">
                <h4>Fluxo de controle</h4>
                <div className="flow-steps">
                  <div className="flow-step"><span>1</span> Sensor detecta posição</div>
                  <div className="flow-arrow">↓</div>
                  <div className="flow-step"><span>2</span> Arduino processa sinal</div>
                  <div className="flow-arrow">↓</div>
                  <div className="flow-step"><span>3</span> Motor / servomotor responde</div>
                  <div className="flow-arrow">↓</div>
                  <div className="flow-step"><span>4</span> Ciclo se repete</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {tab === 'tab-trem' && (
        <div id="tab-trem" className="tab-panel active">
          <div className="two-col">
            <div className="col-text">
              <h3>Controle da Locomotiva</h3>
              <p>O trem é acionado por um motor DC na locomotiva, com velocidade regulada por PWM no pino 9. Reed switches nas estações de carga pausam o trem por 3 segundos enquanto os vagões são &quot;carregados&quot;.</p>
              <div className="code-block">
                <div className="code-header">
                  <span>Arduino — Trem</span>
                  <span className="code-lang">C++</span>
                </div>
                <pre><code>{codeTrem}</code></pre>
              </div>
              <p>O sensor magnético detecta um ímã colado no vagão. Quando o trem passa pela estação da mina ou do porto, o ímã aciona o reed switch e dispara a parada programada.</p>
            </div>
            <div className="col-visual">
              <div className="card">
                <div className="card-image">
                  <img src="/images/trem-circuito.jpg" alt="Circuito do trem" loading="lazy" decoding="async" width={800} height={500} />
                </div>
                <div className="card-body">
                  <h3>Estações de parada</h3>
                  <p>2 pontos: estação da mina (carga) e estação do porto (descarga). Cada uma com reed switch e LED indicador.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {tab === 'tab-desvios' && (
        <div id="tab-desvios" className="tab-panel active">
          <div className="two-col">
            <div className="col-text">
              <h3>Desvios Ferroviários</h3>
              <p>Dois desvios SG90 definem se o trem segue para o porto ou para o ramal do aeroporto. O ângulo padrão é 0° (porto); ao receber sinal da central, move para 90° (aeroporto).</p>
              <div className="code-block">
                <div className="code-header">
                  <span>Arduino — Servomotor desvio</span>
                  <span className="code-lang">C++</span>
                </div>
                <pre><code>{codeDesvio}</code></pre>
              </div>
            </div>
            <div className="col-visual">
              <div className="flow-diagram">
                <h4>Decisão de rota</h4>
                <div className="flow-steps">
                  <div className="flow-step"><span>1</span> Central recebe comando</div>
                  <div className="flow-arrow">↓</div>
                  <div className="flow-step"><span>2</span> Servomotor gira agulha</div>
                  <div className="flow-arrow">↓</div>
                  <div className="flow-step"><span>3</span> Trem segue ramal escolhido</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="content-block">
        <h3 className="block-title">Mapa de Pinos (Arduino Mega)</h3>
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr><th>Pino</th><th>Função</th><th>Componente</th></tr>
            </thead>
            <tbody>
              <tr><td>2, 3</td><td>Entrada digital</td><td>Sensores IR caminhão 1</td></tr>
              <tr><td>4</td><td>Entrada digital</td><td>Reed switch estação mina</td></tr>
              <tr><td>5, 6</td><td>Saída PWM</td><td>Motor caminhão 1 (L298N)</td></tr>
              <tr><td>7, 8</td><td>Saída PWM</td><td>Motor caminhão 2 (L298N)</td></tr>
              <tr><td>9</td><td>Saída PWM</td><td>Motor locomotiva</td></tr>
              <tr><td>10, 11</td><td>Saída PWM</td><td>Servomotores desvios</td></tr>
              <tr><td>12–17</td><td>Entrada digital</td><td>Botões do painel</td></tr>
              <tr><td>A4, A5</td><td>I2C</td><td>Display LCD 16×2</td></tr>
            </tbody>
          </table>
        </div>
      </div>

      <div className="content-block">
        <h3 className="block-title">Lista de Componentes Eletrônicos</h3>
        <div className="chip-list">
          <span className="chip">1× Arduino Mega</span>
          <span className="chip">2× Driver L298N</span>
          <span className="chip">4× Sensor IR TCRT5000</span>
          <span className="chip">2× Servo SG90</span>
          <span className="chip">2× Reed switch</span>
          <span className="chip">1× LCD 16×2 I2C</span>
          <span className="chip">6× Botões push</span>
          <span className="chip">1× Fonte 12 V 3 A</span>
          <span className="chip">Protoboard + jumpers</span>
        </div>
      </div>

      <div className="callout callout-note">
        <strong>Dica de programação</strong>
        <p>Evite usar <code>delay()</code> longo no loop principal quando vários motores rodam ao mesmo tempo. Preferimos flags e <code>millis()</code> para não travar os outros subsistemas durante pausas do trem.</p>
      </div>

      <SectionNav
        prev={{ id: 'maquete', label: 'Maquete' }}
        next={{ id: 'porto-aeroporto', label: 'Porto & Aeroporto' }}
        onNavigate={onNavigate}
      />
    </section>
  );
}
