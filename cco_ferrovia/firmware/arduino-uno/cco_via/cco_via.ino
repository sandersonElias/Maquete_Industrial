#include <Servo.h>

// CCO Ferrovia - Arduino Uno Rev3
// O Uno e alimentado pelo USB. Servos, sensores e farois usam fonte externa de 5 V.
// Interligue apenas os GNDs. Nao alimente os servos pelo pino 5 V do Uno.

constexpr unsigned long SERIAL_BAUD = 115200;
constexpr unsigned long SENSOR_DEBOUNCE_MS = 35;
constexpr unsigned long PC_TIMEOUT_MS = 4000;
constexpr bool SENSOR_ACTIVE_LOW = true;
constexpr bool SIGNAL_ACTIVE_HIGH = true; // Troque para false se o modulo for acionado em nivel baixo.
constexpr bool DETACH_SERVOS_AFTER_MOVE = false;
constexpr unsigned long SERVO_SETTLE_MS = 700;

const uint8_t SENSOR_PINS[7] = {2, 3, 4, 5, 6, 7, 8};
const uint8_t SERVO_PINS[3] = {9, 10, 11};
const uint8_t SIGNAL_PINS[2][3] = {
  {12, 13, A0}, // F1 externo: vermelho, amarelo, verde
  {A1, A2, A3}  // F2 interno: vermelho, amarelo, verde
};

// Valores iniciais. Calibre individualmente antes de ligar os servos as chaves.
uint8_t SERVO_NORMAL_ANGLE[3] = {45, 45, 45};
uint8_t SERVO_REVERSE_ANGLE[3] = {90, 90, 90};

enum SignalColor : uint8_t { RED = 0, YELLOW = 1, GREEN = 2 };

struct SensorState {
  bool raw;
  bool stable;
  unsigned long changedAt;
};

Servo servos[3];
SensorState sensors[7];
bool servoAttached[3] = {false, false, false};
bool switchReverse[3] = {false, false, false};
unsigned long servoCommandAt[3] = {0, 0, 0};
SignalColor signalState[2] = {RED, RED};
bool emergencyActive = false;
bool timeoutReported = false;
unsigned long lastPcPing = 0;
char serialBuffer[96];
uint8_t serialLength = 0;

bool logicalSensorRead(uint8_t index) {
  bool level = digitalRead(SENSOR_PINS[index]);
  return SENSOR_ACTIVE_LOW ? !level : level;
}

void writeSignalPin(uint8_t pin, bool on) {
  digitalWrite(pin, SIGNAL_ACTIVE_HIGH ? (on ? HIGH : LOW) : (on ? LOW : HIGH));
}

void setSignal(uint8_t index, SignalColor color, bool report = true) {
  if (index >= 2) return;
  signalState[index] = color;
  for (uint8_t channel = 0; channel < 3; channel++) {
    writeSignalPin(SIGNAL_PINS[index][channel], channel == color);
  }
  if (report) {
    Serial.print(F("SIGNAL|F")); Serial.print(index + 1); Serial.print('|');
    Serial.print(color == RED ? F("RED") : color == YELLOW ? F("YELLOW") : F("GREEN"));
    Serial.print('|'); Serial.println(millis());
  }
}

void allSignalsRed() {
  setSignal(0, RED);
  setSignal(1, RED);
}

bool sensorProtectsSwitch(uint8_t switchIndex) {
  // C1: S06/S07; C2: S01; C3: S03/S04/S05.
  if (switchIndex == 0) return sensors[5].stable || sensors[6].stable;
  if (switchIndex == 1) return sensors[0].stable;
  return sensors[2].stable || sensors[3].stable || sensors[4].stable;
}

void ensureServoAttached(uint8_t index) {
  if (!servoAttached[index]) {
    servos[index].attach(SERVO_PINS[index]);
    servoAttached[index] = true;
  }
}

bool setSwitch(uint8_t index, bool reverse, bool report = true) {
  if (index >= 3 || emergencyActive) return false;
  if (switchReverse[index] != reverse && sensorProtectsSwitch(index)) {
    Serial.print(F("FAULT|SWITCH_BLOCKED|C")); Serial.println(index + 1);
    return false;
  }
  ensureServoAttached(index);
  servos[index].write(reverse ? SERVO_REVERSE_ANGLE[index] : SERVO_NORMAL_ANGLE[index]);
  switchReverse[index] = reverse;
  servoCommandAt[index] = millis();
  if (report) {
    Serial.print(F("SWITCH|C")); Serial.print(index + 1); Serial.print('|');
    Serial.print(reverse ? F("REVERSA") : F("NORMAL")); Serial.print('|'); Serial.println(millis());
  }
  return true;
}

SignalColor parseColor(const char *value) {
  if (strcmp(value, "GREEN") == 0) return GREEN;
  if (strcmp(value, "YELLOW") == 0) return YELLOW;
  return RED;
}

void sendSnapshot() {
  Serial.print(F("HELLO|UNO|1|")); Serial.println(millis());
  for (uint8_t i = 0; i < 7; i++) {
    Serial.print(F("SENSOR|")); Serial.print(i + 1); Serial.print('|');
    Serial.print(sensors[i].stable ? F("ACTIVE") : F("CLEAR")); Serial.print('|'); Serial.println(millis());
  }
  for (uint8_t i = 0; i < 3; i++) {
    Serial.print(F("SWITCH|C")); Serial.print(i + 1); Serial.print('|');
    Serial.print(switchReverse[i] ? F("REVERSA") : F("NORMAL")); Serial.print('|'); Serial.println(millis());
  }
  for (uint8_t i = 0; i < 2; i++) setSignal(i, signalState[i]);
}

void handleCommand(char *line) {
  char *kind = strtok(line, "|");
  if (!kind) return;
  if (strcmp(kind, "PING") == 0) {
    lastPcPing = millis(); timeoutReported = false;
    char *sequence = strtok(nullptr, "|");
    Serial.print(F("PONG|")); Serial.println(sequence ? sequence : "0");
    return;
  }
  if (strcmp(kind, "SNAPSHOT") == 0) {
    lastPcPing = millis(); sendSnapshot(); return;
  }
  if (strcmp(kind, "EMERGENCY") == 0) {
    char *value = strtok(nullptr, "|");
    emergencyActive = value && strcmp(value, "ON") == 0;
    if (emergencyActive) allSignalsRed();
    lastPcPing = millis();
    Serial.print(F("EMERGENCY|")); Serial.println(emergencyActive ? F("ON") : F("OFF"));
    return;
  }
  if (emergencyActive) {
    Serial.println(F("FAULT|EMERGENCY_ACTIVE"));
    return;
  }
  if (strcmp(kind, "SWITCH") == 0) {
    char *id = strtok(nullptr, "|"); char *position = strtok(nullptr, "|");
    if (id && position && id[0] == 'C' && id[1] >= '1' && id[1] <= '3') {
      setSwitch(id[1] - '1', strcmp(position, "REVERSA") == 0);
      lastPcPing = millis();
    }
    return;
  }
  if (strcmp(kind, "SIGNAL") == 0) {
    char *id = strtok(nullptr, "|"); char *color = strtok(nullptr, "|");
    if (id && color && id[0] == 'F' && id[1] >= '1' && id[1] <= '2') {
      setSignal(id[1] - '1', parseColor(color));
      lastPcPing = millis();
    }
  }
}

void readSerialCommands() {
  while (Serial.available()) {
    char incoming = static_cast<char>(Serial.read());
    if (incoming == '\r') continue;
    if (incoming == '\n') {
      serialBuffer[serialLength] = '\0';
      if (serialLength > 0) handleCommand(serialBuffer);
      serialLength = 0;
    } else if (serialLength < sizeof(serialBuffer) - 1) {
      serialBuffer[serialLength++] = incoming;
    } else {
      serialLength = 0;
      Serial.println(F("FAULT|SERIAL_OVERFLOW"));
    }
  }
}

void updateSensors() {
  unsigned long now = millis();
  for (uint8_t i = 0; i < 7; i++) {
    bool current = logicalSensorRead(i);
    if (current != sensors[i].raw) {
      sensors[i].raw = current;
      sensors[i].changedAt = now;
    }
    if (current != sensors[i].stable && now - sensors[i].changedAt >= SENSOR_DEBOUNCE_MS) {
      sensors[i].stable = current;
      Serial.print(F("SENSOR|")); Serial.print(i + 1); Serial.print('|');
      Serial.print(current ? F("ACTIVE") : F("CLEAR")); Serial.print('|'); Serial.println(now);
    }
  }
}

void updateServoDetach() {
  if (!DETACH_SERVOS_AFTER_MOVE) return;
  unsigned long now = millis();
  for (uint8_t i = 0; i < 3; i++) {
    if (servoAttached[i] && now - servoCommandAt[i] >= SERVO_SETTLE_MS) {
      servos[i].detach(); servoAttached[i] = false;
    }
  }
}

void updatePcFailsafe() {
  if (millis() - lastPcPing <= PC_TIMEOUT_MS) return;
  allSignalsRed();
  if (!timeoutReported) {
    Serial.println(F("FAULT|PC_TIMEOUT"));
    timeoutReported = true;
  }
}

void setup() {
  Serial.begin(SERIAL_BAUD);
  for (uint8_t i = 0; i < 7; i++) {
    pinMode(SENSOR_PINS[i], INPUT_PULLUP);
    bool initial = logicalSensorRead(i);
    sensors[i] = {initial, initial, millis()};
  }
  for (uint8_t signal = 0; signal < 2; signal++) {
    for (uint8_t channel = 0; channel < 3; channel++) pinMode(SIGNAL_PINS[signal][channel], OUTPUT);
  }
  allSignalsRed();
  for (uint8_t i = 0; i < 3; i++) {
    ensureServoAttached(i);
    servos[i].write(SERVO_NORMAL_ANGLE[i]);
    servoCommandAt[i] = millis();
  }
  lastPcPing = millis();
  delay(300);
  sendSnapshot();
}

void loop() {
  readSerialCommands();
  updateSensors();
  updateServoDetach();
  updatePcFailsafe();
}
