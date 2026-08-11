/**
 * ============================================================
 *  CÓDIGO OFICIAL - CARRINHO BASCULANTE RC (BLUETOOTH)
 * ============================================================
 *  Este código recebe comandos via Bluetooth (HC-05) para
 *  controlar o carrinho com 2 servos + motor DC + 4 LEDs:
 *
 *  SERVOS:
 *    - Servo de Direção (D5)
 *    - Servo de Caçamba (D6)
 *
 *  MOTOR DC (via L298M):
 *    - IN1 (D12) = direção do motor
 *    - IN2 (D13) = direção do motor
 *    - ENA = jumper para 5V (velocidade constante)
 *
 *  LEDs:
 *    - Farol Esquerdo (D2)
 *    - Farol Direito (D3)
 *    - Seta Esquerda (D4)
 *    - Seta Direita (D7)
 *
 *  PROTOCOLO COMPOSTO:
 *    - Comandos de 1 ou 2 caracteres
 *    - 1º caractere = motor (F=frente, B=ré, S=parado)
 *    - 2º caractere = direção (L=esq, R=dir, C=centro)
 *    - Exemplos: FL=frente+esq, FR=frente+dir, BC=ré+centro
 *
 *  COMANDOS DE LED:
 *    - HH = toggle faróis (ligar/desligar)
 *    - TI = seta esquerda piscar
 *    - TO = seta direita piscar
 *    - TX = setas desligar
 *    - HA = pisca-alerta (toggle)
 *
 *  IMPORTANTE: Desconecte os pinos RX/TX do HC-05 ao carregar
 *  este código para o Arduino.
 * ============================================================
 */

#include <Servo.h>

// ── Definição dos Pinos ──────────────────────────────────
const int PIN_SERVO_DIR = 5;
const int PIN_SERVO_BUCKET = 6;

// NOTA IMPORTANTE: A biblioteca Servo.h toma conta do Timer 1 do ATMega.
// Os pinos PWM D9 e D10 tambem dependem do Timer 1 / Timer 2 -> conflito.
// Manter os LEDs e os sinais do motor FORA de D9/D10 evita resets
// espurios do Arduino (brownout / watchdog) quando os servos se movimentam.
const int PIN_FAROL_ESQ = 2;
const int PIN_FAROL_DIR = 3;
const int PIN_SETA_ESQ = 4;   // antes D8 -> ainda seguro (sem conflito Timer)
const int PIN_SETA_DIR = 7;   // antes D9 (Timer 1) -> longe do servo
const int PIN_MOTOR_IN1 = 12; // antes D12 (Timer 1) -> pino digital puro
const int PIN_MOTOR_IN2 = 13; // antes D13 (Timer 2) -> pino digital puro

// ── Objetos Servo ────────────────────────────────────────
Servo servoDirecao;
Servo servoCacamba;

// ── Variáveis de Estado ──────────────────────────────────
// Cada subsistema tem seu próprio estado independente
char estadoMotor = 'S';    // F=frente, B=ré, S=parado
char estadoDirecao = 'C';  // L=esq, R=dir, C=centro
char estadoCacamba = 'X';  // U=subindo, D=descendo, X=parado
bool farolLigado = false;
char estadoSeta = 'X';     // I=esq, O=dir, H=hazard, X=desligada

int anguloCacamba = 0;     // Posição atual da caçamba
int anguloCacambaTarget = 0; // Alvo da caçamba (não-bloqueante)
unsigned long ultimoMoveCacamba = 0;
const unsigned long CACAMBA_STEP_DELAY = 15; // ms entre passos

// ── Variáveis de Pisca (Setas e Hazard) ──────────────────
bool setaEstadoLed = false;       // Estado atual do LED (ON/OFF)
unsigned long ultimoPisca = 0;
const unsigned long PISCA_INTERVALO = 500; // 500ms = 0.5s

// ── Buffer para comando composto ─────────────────────────
String bufferComando = "";
const size_t MAX_CMD_LEN = 4; // nenhum comando valido passa disso; protege contra floods

void setup() {
  // D uma pequena pausa para a alimentacao 5V estabilizar apos o BT
  // ligar. Evita brownout quando os servos ja pedem corrente no boot.
  delay(300);

  Serial.begin(9600);

  // Configura pinos dos LEDs como saída
  pinMode(PIN_FAROL_ESQ, OUTPUT);
  pinMode(PIN_FAROL_DIR, OUTPUT);
  pinMode(PIN_SETA_ESQ, OUTPUT);
  pinMode(PIN_SETA_DIR, OUTPUT);

  // Configura motor DC via L298M
  pinMode(PIN_MOTOR_IN1, OUTPUT);
  pinMode(PIN_MOTOR_IN2, OUTPUT);
  digitalWrite(PIN_MOTOR_IN1, LOW);
  digitalWrite(PIN_MOTOR_IN2, LOW);

  // Posicao inicial (centro = 90°)
  servoDirecao.write(90);
  servoCacamba.write(0);

  // Configura servos  SOMENTE DEPOIS de os pinos estarem estaveis.
  // Anexar servo antes dos LOW pode gerar um pulso espurio no motor/LEDs.
  servoDirecao.attach(PIN_SERVO_DIR);
  servoCacamba.attach(PIN_SERVO_BUCKET);

  // LEDs desligados
  atualizarLEDs();

  Serial.println(F("=== CAMINHAO BASCULANTE v2.0 ==="));
  Serial.println(F("Aguardando comandos BT..."));
  Serial.println(F("ACK|TRUCK|BOOT|OK"));
}

void loop() {
  // 1. Processar comandos Bluetooth
  // Filtra lixo binario (BT pode entregar bytes corrompidos apos reset)
  // e só aceita os caracteres que formam comandos validos.
  while (Serial.available() > 0) {
    char c = Serial.read();

    // Ignora bytes não-ASCII imprimiveis. So aceita A-Z, 0-9 e alguns simbolos.
    // Isso evita que lixo venha como terminador/marcador de comando.
    if (c != '\n' && c != '\r') {
      if (c < 32 || c > 126) {
        // byte invalido: descarta e limpa buffer se ja tinha algo
        // (sinal de que o pacote veio corrompido)
        if (bufferComando.length() > 0) {
          bufferComando = "";
        }
        continue;
      }
    }

    if (c == '\n' || c == '\r') {
      if (bufferComando.length() > 0) {
        bufferComando.trim();
        if (bufferComando.length() > MAX_CMD_LEN) {
          bufferComando = "";
          continue;
        }
        Serial.print(F("RX: "));
        Serial.println(bufferComando);
        executarComando(bufferComando);
        bufferComando = "";
      }
    } else {
      bufferComando += c;
      // Protecao extra: se estourar mesmo sem \n, descarta (BT em flood)
      if (bufferComando.length() > MAX_CMD_LEN) {
        bufferComando = "";
      }
    }
  }

  // 2. Atualizar caçamba (não-bloqueante)
  atualizarCacamba();

  // 3. Atualizar pisca das setas (não-bloqueante)
  atualizarPisca();
}

/**
 * ============================================================
 *  EXECUTAR COMANDO
 * ============================================================
 *  Analisa o comando recebido e atualiza os estados.
 *  Suporta comandos simples (1 char) e compostos (2 chars).
 * ============================================================
 */
void executarComando(String cmd) {
  // ── Comando de parada total (app envia "SC" ao soltar DPad) ──
  if (cmd == "SC") {
    estadoMotor = 'S';
    estadoDirecao = 'C';
    atualizarMotor();
    atualizarDirecao();
    enviarACK("SC");
    return;
  }

  // ── Comandos especiais de LED (2 chars) ──
  if (cmd == "HH") {
    farolLigado = !farolLigado;
    atualizarLEDs();
    enviarACK("HH");
    return;
  }
  if (cmd == "TI") {
    estadoSeta = 'I';
    atualizarLEDs();
    enviarACK("TI");
    return;
  }
  if (cmd == "TO") {
    estadoSeta = 'O';
    atualizarLEDs();
    enviarACK("TO");
    return;
  }
  if (cmd == "TX") {
    estadoSeta = 'X';
    setaEstadoLed = false;
    atualizarLEDs();
    enviarACK("TX");
    return;
  }
  if (cmd == "HA") {
    estadoSeta = (estadoSeta == 'H') ? 'X' : 'H'; // Toggle hazard
    setaEstadoLed = false;
    atualizarLEDs();
    enviarACK("HA");
    return;
  }

  // ── Comandos de caçamba (1 char) ──
  if (cmd == "U") {
    anguloCacambaTarget = 90;
    estadoCacamba = 'U';
    enviarACK("U");
    return;
  }
  if (cmd == "D") {
    anguloCacambaTarget = 0;
    estadoCacamba = 'D';
    enviarACK("D");
    return;
  }
  if (cmd == "X") {
    anguloCacambaTarget = anguloCacamba;
    estadoCacamba = 'X';
    enviarACK("X");
    return;
  }

  // ── Comandos compostos: Motor + Direção ──
  if (cmd.length() >= 1) {
    char m = cmd.charAt(0);
    if (m == 'F' || m == 'B' || m == 'S') {
      estadoMotor = m;
      atualizarMotor();
    }
    else if (m == 'L' || m == 'R' || m == 'C') {
      estadoDirecao = m;
      atualizarDirecao();
    }
  }

  if (cmd.length() >= 2) {
    char d = cmd.charAt(1);
    if (d == 'L' || d == 'R' || d == 'C') {
      estadoDirecao = d;
      atualizarDirecao();
    }
  }

  enviarACK(cmd);
}

/**
 * ============================================================
 *  ATUALIZAR subsistemas
 * ============================================================
 *  Cada função atualiza apenas seu subsistema, mantendo
 *  os outros inalterados.
 * ============================================================
 */
void atualizarMotor() {
  if (estadoMotor == 'F') {
    digitalWrite(PIN_MOTOR_IN1, HIGH);
    digitalWrite(PIN_MOTOR_IN2, LOW);
  } else if (estadoMotor == 'B') {
    digitalWrite(PIN_MOTOR_IN1, LOW);
    digitalWrite(PIN_MOTOR_IN2, HIGH);
  } else {
    digitalWrite(PIN_MOTOR_IN1, LOW);
    digitalWrite(PIN_MOTOR_IN2, LOW);
  }
}

void atualizarDirecao() {
  if (estadoDirecao == 'L') {
    servoDirecao.write(120); 
  } else if (estadoDirecao == 'R') {
    servoDirecao.write(60);
  } else {
    servoDirecao.write(90);
  }
}

void atualizarLEDs() {
  // Faróis
  digitalWrite(PIN_FAROL_ESQ, farolLigado ? HIGH : LOW);
  digitalWrite(PIN_FAROL_DIR, farolLigado ? HIGH : LOW);

  // Setas - lógica inicial (o pisca atualiza em tempo real)
  if (estadoSeta == 'X') {
    // Desligado
    digitalWrite(PIN_SETA_ESQ, LOW);
    digitalWrite(PIN_SETA_DIR, LOW);
  }
  // Setas I, O e H são atualizadas por atualizarPisca()
}

/**
 * ============================================================
 *  CAÇAMBA NÃO-BLOQUEANTE
 * ============================================================
 *  Move a caçamba um grau por chamada do loop(),
 *  sem bloquear a leitura de novos comandos BT.
 * ============================================================
 */
void atualizarCacamba() {
  if (anguloCacamba == anguloCacambaTarget) return;

  unsigned long agora = millis();
  if (agora - ultimoMoveCacamba < CACAMBA_STEP_DELAY) return;
  ultimoMoveCacamba = agora;

  if (anguloCacamba < anguloCacambaTarget) {
    anguloCacamba++;
  } else {
    anguloCacamba--;
  }
  servoCacamba.write(anguloCacamba);

  if (anguloCacamba == anguloCacambaTarget) {
    estadoCacamba = 'X';
  }
}

/**
 * ============================================================
 *  ATUALIZAR PISCA (Setas e Hazard)
 * ============================================================
 *  Pisca os LEDs das setas em intervalo configurável.
 *  - 'I': Seta esquerda pisca
 *  - 'O': Seta direita pisca
 *  - 'H': Ambas piscam juntos (pisca-alerta)
 * ============================================================
 */
void atualizarPisca() {
  if (estadoSeta != 'I' && estadoSeta != 'O' && estadoSeta != 'H') return;

  unsigned long agora = millis();
  if (agora - ultimoPisca < PISCA_INTERVALO) return;
  ultimoPisca = agora;

  // Alterna estado do LED
  setaEstadoLed = !setaEstadoLed;

  if (estadoSeta == 'I') {
    // Seta esquerda pisca
    digitalWrite(PIN_SETA_ESQ, setaEstadoLed ? HIGH : LOW);
    digitalWrite(PIN_SETA_DIR, LOW);
  }
  else if (estadoSeta == 'O') {
    // Seta direita pisca
    digitalWrite(PIN_SETA_ESQ, LOW);
    digitalWrite(PIN_SETA_DIR, setaEstadoLed ? HIGH : LOW);
  }
  else if (estadoSeta == 'H') {
    // Pisca-alerta: ambos piscam juntos
    digitalWrite(PIN_SETA_ESQ, setaEstadoLed ? HIGH : LOW);
    digitalWrite(PIN_SETA_DIR, setaEstadoLed ? HIGH : LOW);
  }
}

/**
 * ============================================================
 *  ENVIAR ACK
 * ============================================================
 *  Envia confirmação de que o comando foi recebido.
 * ============================================================
 */
void enviarACK(String cmd) {
  String ack = "ACK|TRUCK|" + cmd + "|OK";
  Serial.println(ack);
}
