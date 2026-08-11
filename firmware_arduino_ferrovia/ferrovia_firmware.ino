/**
 * ============================================================
 *  FIRMWARE FERROVIA - 4 SERVOS + 8 LEDS + HC-05 (BLUETOOTH)
 * ============================================================
 *  Recebe comandos via Bluetooth (HC-05) no formato:
 *    CMD|SWITCH|<id>|<acao>|<valor>\n
 *  Responde com:
 *    ACK|SWITCH|<id>|<estado>\n
 *  Envia heartbeat periodico:
 *    STATUS|SWITCH|<id>|<angulo>|<estado>|<ts>\n
 *  
 *  Pinos Servos:
 *    - Servo 1 (SwitchId 1): D2
 *    - Servo 2 (SwitchId 2): D3
 *    - Servo 3 (SwitchId 3): D4
 *    - Servo 4 (SwitchId 4): D5
 *  
 *  Pinos LEDs (Indicador de Direcao):
 *    - Divisao 1: Esquerda=D6, Direita=D7
 *    - Divisao 2: Esquerda=D8, Direita=D9
 *    - Divisao 3: Esquerda=D10, Direita=D11
 *    - Divisao 4: Esquerda=D12, Direita=D13
 *  
 *  Bluetooth:
 *    - HC-05 TX -> Arduino RX (D0 Serial)
 *    - HC-05 RX <- Arduino TX (D1 Serial)
 *  
 *  IMPORTANTE: Desconecte o HC-05 ao carregar o sketch!
 * ============================================================
 */

#include <Servo.h>

// === CONFIGURACAO ===
const int NUM_SWITCHES = 4;
const int SERVO_PINS[NUM_SWITCHES] = {2, 3, 4, 5};

// === PINOS DOS LEDS (INDICADOR DE DIRECAO) ===
// LED Esquerda aceso = Locomotiva vai para linha esquerda
// LED Direita aceso = Locomotiva vai para linha direita
const int LED_LEFT[NUM_SWITCHES] = {6, 8, 10, 12};
const int LED_RIGHT[NUM_SWITCHES] = {7, 9, 11, 13};

const int BAUD_BT = 9600;
const unsigned long HEARTBEAT_INTERVAL = 5000; // ms
const int ANGLE_LEFT = 0;
const int ANGLE_RIGHT = 180;
const int ANGLE_CENTER = 90;
const int MOVE_DELAY = 15; // ms entre passos do servo

// === OBJETOS ===
Servo servos[NUM_SWITCHES];

// === ESTADO ===
struct SwitchState {
  int currentAngle;
  int targetAngle;
  bool moving;
  unsigned long lastMove;
};
SwitchState switchStates[NUM_SWITCHES];

unsigned long lastHeartbeat = 0;
String inputBuffer = "";
const int MAX_BUFFER = 64;

// === CONFIGURACAO DOS LEDS ===
void setupLEDs() {
  for (int i = 0; i < NUM_SWITCHES; i++) {
    pinMode(LED_LEFT[i], OUTPUT);
    pinMode(LED_RIGHT[i], OUTPUT);
    digitalWrite(LED_LEFT[i], LOW);
    digitalWrite(LED_RIGHT[i], LOW);
  }
  Serial.println(F("LEDs inicializados."));
}

// === ATUALIZACAO DOS LEDS ===
void updateLEDs() {
  for (int i = 0; i < NUM_SWITCHES; i++) {
    int angle = switchStates[i].currentAngle;
    
    if (angle <= 10) {
      // LEFT - Locomotiva vai para linha esquerda
      digitalWrite(LED_LEFT[i], HIGH);
      digitalWrite(LED_RIGHT[i], LOW);
    } else if (angle >= 170) {
      // RIGHT - Locomotiva vai para linha direita
      digitalWrite(LED_LEFT[i], LOW);
      digitalWrite(LED_RIGHT[i], HIGH);
    } else {
      // CENTER - Ambos apagados (neutro)
      digitalWrite(LED_LEFT[i], LOW);
      digitalWrite(LED_RIGHT[i], LOW);
    }
  }
}

// === SETUP ===
void setup() {
  Serial.begin(BAUD_BT);

  Serial.println(F("=== FERROVIA FIRMWARE v3.2 ==="));
  Serial.println(F("Inicializando servos..."));

  inputBuffer.reserve(MAX_BUFFER);

  for (int i = 0; i < NUM_SWITCHES; i++) {
    servos[i].attach(SERVO_PINS[i]);
    switchStates[i].currentAngle = ANGLE_CENTER;
    switchStates[i].targetAngle = ANGLE_CENTER;
    switchStates[i].moving = false;
    switchStates[i].lastMove = 0;
    servos[i].write(ANGLE_CENTER);
    delay(200);
  }

  // Inicializar LEDs
  setupLEDs();

  Serial.println(F("Sistema pronto. Aguardando comandos BT..."));
  sendStatusAll();
}

// === LOOP ===
void loop() {
  // 1. Processar comandos Bluetooth
  processBluetooth();

  // 2. Atualizar servos (movimento suave)
  updateServos();

  // 3. Atualizar LEDs indicador de direcao
  updateLEDs();

  // 4. Heartbeat periodico
  unsigned long now = millis();
  if (now - lastHeartbeat >= HEARTBEAT_INTERVAL) {
    sendStatusAll();
    lastHeartbeat = now;
  }
}

// === PROCESSAMENTO BLUETOOTH ===
void processBluetooth() {
  while (Serial.available()) {
    char c = Serial.read();
    if (c == '\n') {
      inputBuffer.trim();
      if (inputBuffer.length() > 0) {
        processCommand(inputBuffer);
      }
      inputBuffer = "";
    } else if (c != '\r') {
      if (inputBuffer.length() < MAX_BUFFER) {
        inputBuffer += c;
      } else {
        inputBuffer = "";
      }
    }
  }
}

// === PARSER DE COMANDO ===
void processCommand(String& cmd) {
  if (!cmd.startsWith("CMD|")) {
    return;
  }

  String parts[6];
  int partCount = 0;
  int start = 0;

  for (int i = 0; i < cmd.length() && partCount < 6; i++) {
    if (cmd.charAt(i) == '|') {
      parts[partCount++] = cmd.substring(start, i);
      start = i + 1;
    }
  }
  if (start < (int)cmd.length()) {
    parts[partCount++] = cmd.substring(start);
  }

  if (partCount < 4) {
    return;
  }

  String type = parts[1];
  int switchId = parts[2].toInt();
  String action = parts[3];
  String value = (partCount >= 5) ? parts[4] : "";

  if (type != "SWITCH") return;
  if (switchId < 1 || switchId > NUM_SWITCHES) return;

  int idx = switchId - 1;

  if (action == "SET") {
    if (value == "LEFT") {
      switchStates[idx].targetAngle = ANGLE_LEFT;
      switchStates[idx].moving = true;
    } else if (value == "RIGHT") {
      switchStates[idx].targetAngle = ANGLE_RIGHT;
      switchStates[idx].moving = true;
    } else if (value == "CENTER") {
      switchStates[idx].targetAngle = ANGLE_CENTER;
      switchStates[idx].moving = true;
    } else {
      return;
    }
    sendAck(switchId, value);

  } else if (action == "ANGLE") {
    int angle = value.toInt();
    if (angle < 0 || angle > 180) return;
    switchStates[idx].targetAngle = angle;
    switchStates[idx].moving = true;
    sendAck(switchId, "ANGLE_" + String(angle));

  } else if (action == "STATUS") {
    sendStatus(switchId);

  } else if (action == "RESET") {
    switchStates[idx].targetAngle = ANGLE_CENTER;
    switchStates[idx].moving = true;
    sendAck(switchId, "RESET");
  }
}

// === ATUALIZACAO SUAVE DOS SERVOS ===
void updateServos() {
  unsigned long now = millis();

  for (int i = 0; i < NUM_SWITCHES; i++) {
    if (!switchStates[i].moving) continue;
    if (now - switchStates[i].lastMove < MOVE_DELAY) continue;

    int current = switchStates[i].currentAngle;
    int target = switchStates[i].targetAngle;

    if (current == target) {
      switchStates[i].moving = false;
      sendStatus(i + 1);
      continue;
    }

    if (current < target) {
      current++;
    } else {
      current--;
    }

    switchStates[i].currentAngle = current;
    servos[i].write(current);
    switchStates[i].lastMove = now;
  }
}

// === ENVIO DE MENSAGENS ===
void sendAck(int switchId, String state) {
  Serial.println("ACK|SWITCH|" + String(switchId) + "|" + state);
}

void sendStatus(int switchId) {
  int idx = switchId - 1;
  String state;
  int angle = switchStates[idx].currentAngle;

  if (angle <= 10) state = "LEFT";
  else if (angle >= 170) state = "RIGHT";
  else if (angle >= 85 && angle <= 95) state = "CENTER";
  else state = "TRANSITION";

  Serial.println("STATUS|SWITCH|" + String(switchId) + "|" + String(angle) + "|" + state + "|" + String(millis()));
}

void sendStatusAll() {
  for (int i = 1; i <= NUM_SWITCHES; i++) {
    sendStatus(i);
    delay(50);
  }
}
