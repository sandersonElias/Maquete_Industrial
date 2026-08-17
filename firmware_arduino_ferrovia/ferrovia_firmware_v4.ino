/**
 * ============================================================
 *  FIRMWARE FERROVIA v4.0 - 3 SERVOS + 6 LEDS + 7 SENSORES + SEMAFORO + HC-05
 * ============================================================
 *  
 *  SISTEMA:
 *  - 3 Servos SG90 para switches (SW1, SW2, SW3)
 *  - 6 LEDs indicadores (2 por servo, compartilhados SW1/SW2)
 *  - 7 Sensores HW-201 para localizacao da locomotiva
 *  - Modulo semaforo (Vermelho/Amarelo/Verde) para cancela
 *  - Modulo Bluetooth HC-01 para comunicacao
 *  
 *  PINOS:
 *  - D0:   HC-05 TX (Serial RX)
 *  - D1:   HC-05 RX (Serial TX) *DESCONECTAR AO PROGRAMAR*
 *  - D2:   Servo SW1
 *  - D3:   Servo SW2
 *  - D4:   Servo SW3
 *  - D5:   LED SW1/SW2 Esquerda (compartilhado)
 *  - D6:   LED SW1/SW2 Direita (compartilhado)
 *  - D7:   LED SW3 Esquerda
 *  - D8:   LED SW3 Direita
 *  - D9:   Semaforo Vermelho
 *  - D10:  Semaforo Amarelo
 *  - D11:  Semaforo Verde
 *  - D12:  Sensor S1
 *  - D13:  Sensor S2
 *  - A0:   Sensor S3
 *  - A1:   Sensor S4
 *  - A2:   Sensor S5
 *  - A3:   Sensor S6
 *  - A4:   Sensor S7
 *  
 *  PROTOCOLO BLUETOOTH:
 *  Entrada: CMD|SWITCH|<id>|SET|LEFT/RIGHT/CENTER
 *           CMD|SWITCH|<id>|ANGLE|<0-180>
 *           CMD|SWITCH|<id>|STATUS
 *           CMD|SWITCH|<id>|RESET
 *           CMD|GATE|OPEN
 *           CMD|GATE|CLOSE
 *  
 *  Saida:   ACK|SWITCH|<id>|<estado>
 *           STATUS|SWITCH|<id>|<angulo>|<estado>|<ts>
 *           EVENT|SENSOR|<id>|<DETECTED|CLEAR>|<ts>
 *           EVENT|GATE|<GREEN|YELLOW|RED|CLOSING|OPENING>|<ts>
 *  
 *  v4.0 - Arquitetura atualizada com sensores e semaforo
 * ============================================================
 */

#include <Servo.h>

// === CONFIGURACAO GERAL ===
const int BAUD_BT = 9600;
const unsigned long HEARTBEAT_INTERVAL = 5000;
const int MOVE_DELAY = 15;
const int MAX_BUFFER = 64;

// === PINOS DOS SERVOS ===
const int NUM_SERVOS = 3;
const int SERVO_PINS[NUM_SERVOS] = {2, 3, 4};
const char* SERVO_NAMES[NUM_SERVOS] = {"SW1", "SW2", "SW3"};

// === PINOS DOS LEDS (INDICADORES DE DIRECAO) ===
// SW1 e SW2 compartilham os mesmos LEDs (mesma direcao)
const int LED_SW12_LEFT = 5;
const int LED_SW12_RIGHT = 6;
// SW3 tem LEDs independentes
const int LED_SW3_LEFT = 7;
const int LED_SW3_RIGHT = 8;

// === PINOS DO SEMAFORO ===
const int SEM_RED = 9;
const int SEM_YELLOW = 10;
const int SEM_GREEN = 11;

// === PINOS DOS SENSORES HW-201 ===
const int NUM_SENSORS = 7;
const int SENSOR_PINS[NUM_SENSORS] = {12, 13, A0, A1, A2, A3, A4};
// Logica: LOW = locomotiva detectada, HIGH = sem deteccao

// === ANGULOS DOS SERVOS ===
const int ANGLE_LEFT = 0;
const int ANGLE_RIGHT = 180;
const int ANGLE_CENTER = 90;

// === ESTADOS DO SEMAFORO ===
enum GateState {
  GATE_GREEN,     // Livre
  GATE_YELLOW,    // Aproximando (pisca)
  GATE_RED,       // Fechado
  GATE_OPENING,   // Abrindo (verde pisca)
  GATE_CLOSING    // Fechando (amarelo pisca)
};

// === ESTADO DOS SENSORES ===
struct SensorState {
  bool detected;          // Estado atual
  bool lastDetected;      // Estado anterior (para detectar mudanca)
  unsigned long lastChange; // Ultima mudanca
};

// === ESTADO DOS SERVOS ===
struct ServoState {
  int currentAngle;
  int targetAngle;
  bool moving;
  unsigned long lastMove;
};

// === OBJETOS GLOBAIS ===
Servo servos[NUM_SERVOS];
ServoState servoStates[NUM_SERVOS];
SensorState sensorStates[NUM_SENSORS];
GateState gateState = GATE_GREEN;
unsigned long lastHeartbeat = 0;
unsigned long gateStateTimer = 0;
int gateBlinkCount = 0;
String inputBuffer = "";

// === VARIAVEIS PARA SEMAFORO PISCANTE ===
unsigned long lastBlink = 0;
bool blinkState = false;
const unsigned long BLINK_INTERVAL = 500;

// === SETUP ===
void setup() {
  Serial.begin(BAUD_BT);
  
  Serial.println(F("=== FERROVIA FIRMWARE v4.0 ==="));
  Serial.println(F("3 Servos + 6 LEDs + 7 Sensores + Semaforo"));
  
  inputBuffer.reserve(MAX_BUFFER);
  
  // Inicializar servos
  Serial.print(F("Inicializando "));
  Serial.print(NUM_SERVOS);
  Serial.println(F(" servos..."));
  for (int i = 0; i < NUM_SERVOS; i++) {
    servos[i].attach(SERVO_PINS[i]);
    servoStates[i].currentAngle = ANGLE_CENTER;
    servoStates[i].targetAngle = ANGLE_CENTER;
    servoStates[i].moving = false;
    servoStates[i].lastMove = 0;
    servos[i].write(ANGLE_CENTER);
    delay(200);
  }
  
  // Inicializar LEDs indicadores
  Serial.println(F("Inicializando LEDs..."));
  pinMode(LED_SW12_LEFT, OUTPUT);
  pinMode(LED_SW12_RIGHT, OUTPUT);
  pinMode(LED_SW3_LEFT, OUTPUT);
  pinMode(LED_SW3_RIGHT, OUTPUT);
  digitalWrite(LED_SW12_LEFT, LOW);
  digitalWrite(LED_SW12_RIGHT, LOW);
  digitalWrite(LED_SW3_LEFT, LOW);
  digitalWrite(LED_SW3_RIGHT, LOW);
  
  // Inicializar semaforo
  Serial.println(F("Inicializando semaforo..."));
  pinMode(SEM_RED, OUTPUT);
  pinMode(SEM_YELLOW, OUTPUT);
  pinMode(SEM_GREEN, OUTPUT);
  setGateState(GATE_GREEN);
  
  // Inicializar sensores
  Serial.print(F("Inicializando "));
  Serial.print(NUM_SENSORS);
  Serial.println(F(" sensores..."));
  for (int i = 0; i < NUM_SENSORS; i++) {
    pinMode(SENSOR_PINS[i], INPUT_PULLUP);
    sensorStates[i].detected = false;
    sensorStates[i].lastDetected = false;
    sensorStates[i].lastChange = 0;
  }
  
  Serial.println(F("Sistema pronto. Aguardando comandos BT..."));
  sendStatusAll();
}

// === LOOP PRINCIPAL ===
void loop() {
  unsigned long now = millis();
  
  // 1. Processar comandos Bluetooth
  processBluetooth();
  
  // 2. Atualizar servos (movimento suave)
  updateServos();
  
  // 3. Atualizar LEDs indicadores
  updateLEDs();
  
  // 4. Ler sensores e atualizar localizacao
  updateSensors();
  
  // 5. Atualizar semaforo
  updateGate();
  
  // 6. Heartbeat periodico
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
  
  // Parse: CMD|TYPE|ID|ACTION|VALUE
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
  
  if (partCount < 3) return;
  
  String type = parts[1];
  
  // === COMANDO: CMD|SWITCH|<id>|ACTION|VALUE ===
  if (type == "SWITCH") {
    if (partCount < 4) return;
    
    int switchId = parts[2].toInt();
    String action = parts[3];
    String value = (partCount >= 5) ? parts[4] : "";
    
    if (switchId < 1 || switchId > NUM_SERVOS) return;
    int idx = switchId - 1;
    
    if (action == "SET") {
      if (value == "LEFT") {
        servoStates[idx].targetAngle = ANGLE_LEFT;
        servoStates[idx].moving = true;
      } else if (value == "RIGHT") {
        servoStates[idx].targetAngle = ANGLE_RIGHT;
        servoStates[idx].moving = true;
      } else if (value == "CENTER") {
        servoStates[idx].targetAngle = ANGLE_CENTER;
        servoStates[idx].moving = true;
      } else {
        return;
      }
      sendAck(switchId, value);
      
    } else if (action == "ANGLE") {
      int angle = value.toInt();
      if (angle < 0 || angle > 180) return;
      servoStates[idx].targetAngle = angle;
      servoStates[idx].moving = true;
      sendAck(switchId, "ANGLE_" + String(angle));
      
    } else if (action == "STATUS") {
      sendStatus(switchId);
      
    } else if (action == "RESET") {
      servoStates[idx].targetAngle = ANGLE_CENTER;
      servoStates[idx].moving = true;
      sendAck(switchId, "RESET");
    }
  }
  
  // === COMANDO: CMD|GATE|ACTION ===
  else if (type == "GATE") {
    if (partCount < 4) return;
    
    String action = parts[3];
    
    if (action == "OPEN") {
      setGateState(GATE_GREEN);
      Serial.print(F("EVENT|GATE|OPEN|"));
      Serial.println(millis());
    } else if (action == "CLOSE") {
      setGateState(GATE_RED);
      Serial.print(F("EVENT|GATE|RED|"));
      Serial.println(millis());
    }
  }
}

// === ATUALIZACAO SUAVE DOS SERVOS ===
void updateServos() {
  unsigned long now = millis();
  
  for (int i = 0; i < NUM_SERVOS; i++) {
    if (!servoStates[i].moving) continue;
    if (now - servoStates[i].lastMove < MOVE_DELAY) continue;
    
    int current = servoStates[i].currentAngle;
    int target = servoStates[i].targetAngle;
    
    if (current == target) {
      servoStates[i].moving = false;
      sendStatus(i + 1);
      continue;
    }
    
    if (current < target) {
      current++;
    } else {
      current--;
    }
    
    servoStates[i].currentAngle = current;
    servos[i].write(current);
    servoStates[i].lastMove = now;
  }
}

// === ATUALIZACAO DOS LEDS INDICADORES ===
void updateLEDs() {
  // SW1 e SW2 compartilhados (mesma direcao)
  int angle12 = servoStates[0].currentAngle; // Usa SW1 como referencia
  
  if (angle12 <= 10) {
    // LEFT
    digitalWrite(LED_SW12_LEFT, HIGH);
    digitalWrite(LED_SW12_RIGHT, LOW);
  } else if (angle12 >= 170) {
    // RIGHT
    digitalWrite(LED_SW12_LEFT, LOW);
    digitalWrite(LED_SW12_RIGHT, HIGH);
  } else {
    // CENTER
    digitalWrite(LED_SW12_LEFT, LOW);
    digitalWrite(LED_SW12_RIGHT, LOW);
  }
  
  // SW3 independente
  int angle3 = servoStates[2].currentAngle;
  
  if (angle3 <= 10) {
    // LEFT
    digitalWrite(LED_SW3_LEFT, HIGH);
    digitalWrite(LED_SW3_RIGHT, LOW);
  } else if (angle3 >= 170) {
    // RIGHT
    digitalWrite(LED_SW3_LEFT, LOW);
    digitalWrite(LED_SW3_RIGHT, HIGH);
  } else {
    // CENTER
    digitalWrite(LED_SW3_LEFT, LOW);
    digitalWrite(LED_SW3_RIGHT, LOW);
  }
}

// === LEITURA DOS SENSORES ===
void updateSensors() {
  unsigned long now = millis();
  
  for (int i = 0; i < NUM_SENSORS; i++) {
    // HW-201: LOW = detectado, HIGH = nao detectado
    bool detected = (digitalRead(SENSOR_PINS[i]) == LOW);
    
    // Detectar mudanca de estado
    if (detected != sensorStates[i].lastDetected) {
      // Debounce: 50ms
      if (now - sensorStates[i].lastChange > 50) {
        sensorStates[i].detected = detected;
        sensorStates[i].lastChange = now;
        
        // Enviar evento de sensor
        Serial.print(F("EVENT|SENSOR|"));
        Serial.print(i + 1);
        Serial.print(F("|"));
        Serial.print(detected ? "DETECTED" : "CLEAR");
        Serial.print(F("|"));
        Serial.println(now);
        
        // Atualizar semaforo baseado no sensor
        updateGateFromSensor(i + 1, detected);
      }
      
      sensorStates[i].lastDetected = detected;
    }
  }
}

// === ATUALIZACAO DO SEMAFORO BASEADO NO SENSOR ===
void updateGateFromSensor(int sensorId, bool detected) {
  if (!detected) return; // So reage quando detecta
  
  // Mapeamento Sensor -> Semaforo
  // S1-S3: Verde (locomotiva longe)
  // S4: Amarelo (aproximando)
  // S5-S6: Vermelho (na cancela)
  // S7: Verde pisca (liberando)
  
  switch (sensorId) {
    case 1:
    case 2:
    case 3:
      setGateState(GATE_GREEN);
      break;
    case 4:
      setGateState(GATE_YELLOW);
      break;
    case 5:
    case 6:
      setGateState(GATE_RED);
      break;
    case 7:
      setGateState(GATE_OPENING);
      break;
  }
}

// === CONTROLE DO ESTADO DO SEMAFORO ===
void setGateState(GateState newState) {
  gateState = newState;
  gateStateTimer = millis();
  gateBlinkCount = 0;
  
  switch (newState) {
    case GATE_GREEN:
      digitalWrite(SEM_RED, LOW);
      digitalWrite(SEM_YELLOW, LOW);
      digitalWrite(SEM_GREEN, HIGH);
      Serial.print(F("EVENT|GATE|GREEN|"));
      Serial.println(millis());
      break;
      
    case GATE_YELLOW:
      // Amarelo pisca
      break;
      
    case GATE_RED:
      digitalWrite(SEM_GREEN, LOW);
      digitalWrite(SEM_YELLOW, LOW);
      digitalWrite(SEM_RED, HIGH);
      Serial.print(F("EVENT|GATE|RED|"));
      Serial.println(millis());
      break;
      
    case GATE_OPENING:
      // Verde pisca 3 vezes
      break;
      
    case GATE_CLOSING:
      // Amarelo pisca
      break;
  }
}

// === ATUALIZACAO DO SEMAFORO (PISCANTE) ===
void updateGate() {
  unsigned long now = millis();
  
  if (now - lastBlink < BLINK_INTERVAL) return;
  lastBlink = now;
  
  switch (gateState) {
    case GATE_YELLOW:
      // Amarelo pisca
      blinkState = !blinkState;
      digitalWrite(SEM_YELLOW, blinkState);
      digitalWrite(SEM_RED, LOW);
      digitalWrite(SEM_GREEN, LOW);
      break;
      
    case GATE_OPENING:
      // Verde pisca 3 vezes, depois volta para verde fixo
      blinkState = !blinkState;
      digitalWrite(SEM_GREEN, blinkState);
      digitalWrite(SEM_YELLOW, LOW);
      digitalWrite(SEM_RED, LOW);
      
      if (!blinkState) { // Conta apenas quando apaga
        gateBlinkCount++;
        if (gateBlinkCount >= 3) {
          setGateState(GATE_GREEN);
        }
      }
      break;
      
    case GATE_CLOSING:
      // Amarelo pisca, depois fica vermelho
      blinkState = !blinkState;
      digitalWrite(SEM_YELLOW, blinkState);
      digitalWrite(SEM_GREEN, LOW);
      digitalWrite(SEM_RED, LOW);
      
      if (!blinkState) {
        gateBlinkCount++;
        if (gateBlinkCount >= 3) {
          setGateState(GATE_RED);
        }
      }
      break;
      
    default:
      // Verde ou Vermelho fixo - nada a fazer
      break;
  }
}

// === ENVIO DE MENSAGENS ===
void sendAck(int switchId, String state) {
  Serial.print(F("ACK|SWITCH|"));
  Serial.print(switchId);
  Serial.print(F("|"));
  Serial.println(state);
}

void sendStatus(int switchId) {
  int idx = switchId - 1;
  String state;
  int angle = servoStates[idx].currentAngle;
  
  if (angle <= 10) state = "LEFT";
  else if (angle >= 170) state = "RIGHT";
  else if (angle >= 85 && angle <= 95) state = "CENTER";
  else state = "TRANSITION";
  
  Serial.print(F("STATUS|SWITCH|"));
  Serial.print(switchId);
  Serial.print(F("|"));
  Serial.print(angle);
  Serial.print(F("|"));
  Serial.print(state);
  Serial.print(F("|"));
  Serial.println(millis());
}

void sendStatusAll() {
  for (int i = 1; i <= NUM_SERVOS; i++) {
    sendStatus(i);
    delay(50);
  }
  
  // Status dos sensores
  for (int i = 0; i < NUM_SENSORS; i++) {
    bool detected = (digitalRead(SENSOR_PINS[i]) == LOW);
    Serial.print(F("STATUS|SENSOR|"));
    Serial.print(i + 1);
    Serial.print(F("|"));
    Serial.print(detected ? "DETECTED" : "CLEAR");
    Serial.print(F("|"));
    Serial.println(millis());
    delay(10);
  }
  
  // Status do semaforo
  Serial.print(F("STATUS|GATE|"));
  switch (gateState) {
    case GATE_GREEN: Serial.println(F("GREEN")); break;
    case GATE_YELLOW: Serial.println(F("YELLOW")); break;
    case GATE_RED: Serial.println(F("RED")); break;
    case GATE_OPENING: Serial.println(F("OPENING")); break;
    case GATE_CLOSING: Serial.println(F("CLOSING")); break;
  }
}
