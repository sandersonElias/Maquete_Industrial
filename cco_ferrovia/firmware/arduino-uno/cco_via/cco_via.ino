#include <Servo.h>

// CCO Ferrovia - Arduino Uno Rev3
// O Uno e alimentado pelo USB. Servos, sensores e farois usam fonte externa de 5 V.
// Interligue apenas os GNDs. Nao alimente os servos pelo pino 5 V do Uno.

constexpr unsigned long SERIAL_BAUD = 115200;
constexpr unsigned long SENSOR_DEBOUNCE_MS = 3;
constexpr unsigned long SENSOR_HOLD_MS = 150;
constexpr unsigned long PC_TIMEOUT_MS = 4000;
constexpr unsigned long CAL_INTERVAL_MS = 100;
constexpr unsigned long CAL_DURATION_MS = 30000;
constexpr bool SENSOR_ACTIVE_LOW = true;
constexpr bool SIGNAL_ACTIVE_HIGH = true; // Troque para false se o modulo for acionado em nivel baixo.
constexpr bool DETACH_SERVOS_AFTER_MOVE = false;
constexpr unsigned long SERVO_SETTLE_MS = 700;

uint8_t SENSOR_PINS[7] = {2, 3, 4, 5, 6, 7, 8};
uint8_t SERVO_PINS[3] = {9, 10, 11};
// Um unico conjunto de saidas comanda os dois semaforos combinados da passagem.
// Cada cor deve ser distribuida aos dois modulos por um driver adequado a corrente
// e a polaridade dos semaforos; nao some a corrente diretamente no pino do Uno.
const uint8_t SIGNAL_PINS[3] = {12, 13, A0}; // vermelho, amarelo, verde

// Valores iniciais. Calibre individualmente antes de ligar os servos as chaves.
uint8_t SERVO_NORMAL_ANGLE[3] = {45, 45, 45};
uint8_t SERVO_REVERSE_ANGLE[3] = {90, 90, 90};

enum SignalColor : uint8_t { RED = 0, YELLOW = 1, GREEN = 2 };

struct SensorState {
  bool raw;
  bool stable;
  bool occupied;
  unsigned long changedAt;
  unsigned long lastTransition;
  unsigned long passageStartedAt;
};

Servo servos[3];
SensorState sensors[7];
bool servoAttached[3] = {false, false, false};
bool switchReverse[3] = {false, false, false};
unsigned long servoCommandAt[3] = {0, 0, 0};
SignalColor signalState = RED;
bool emergencyActive = false;
bool timeoutReported = false;
bool calibrationActive = false;
bool hardwareConfigured = false;
bool setupMode = false;
uint32_t hardwareRevision = 0;
uint8_t servoCurrent[3] = {90, 90, 90};
uint8_t servoTarget[3] = {90, 90, 90};
bool servoMoving[3] = {false, false, false};
bool servoTest[3] = {false, false, false};
unsigned long lastServoStep = 0;
unsigned long lastPcPing = 0;
unsigned long calibrationStartedAt = 0;
unsigned long calibrationLastPrint = 0;
char serialBuffer[96];
uint8_t serialLength = 0;

bool logicalSensorRead(uint8_t index) {
  bool level = digitalRead(SENSOR_PINS[index]);
  return SENSOR_ACTIVE_LOW ? !level : level;
}

void writeSignalPin(uint8_t pin, bool on) {
  digitalWrite(pin, SIGNAL_ACTIVE_HIGH ? (on ? HIGH : LOW) : (on ? LOW : HIGH));
}

void setSignal(SignalColor color, bool report = true) {
  signalState = color;
  for (uint8_t channel = 0; channel < 3; channel++) {
    writeSignalPin(SIGNAL_PINS[channel], channel == color);
  }
  if (report) {
    Serial.print(F("SIGNAL|F1|"));
    Serial.print(color == RED ? F("RED") : color == YELLOW ? F("YELLOW") : F("GREEN"));
    Serial.print('|'); Serial.println(millis());
  }
}

void allSignalsRed() {
  setSignal(RED);
}

bool sensorOccupied(uint8_t index) {
  return sensors[index].occupied || sensors[index].stable;
}

bool sensorProtectsSwitch(uint8_t switchIndex) {
  // C1: S06/S07; C2: S01; C3: S03/S04/S05.
  if (switchIndex == 0) return sensorOccupied(5) || sensorOccupied(6);
  if (switchIndex == 1) return sensorOccupied(0);
  return sensorOccupied(2) || sensorOccupied(3) || sensorOccupied(4);
}

void ensureServoAttached(uint8_t index) {
  if (!servoAttached[index]) {
    servos[index].attach(SERVO_PINS[index]);
    servos[index].write(servoCurrent[index]);
    servoAttached[index] = true;
  }
}

bool setSwitch(uint8_t index, bool reverse, bool report = true) {
  if (index >= 3 || emergencyActive || setupMode || !hardwareConfigured) return false;
  uint8_t requestedAngle = reverse ? SERVO_REVERSE_ANGLE[index] : SERVO_NORMAL_ANGLE[index];
  if (sensorProtectsSwitch(index) && (switchReverse[index] != reverse || !servoAttached[index] || servoCurrent[index] != requestedAngle)) {
    Serial.print(F("FAULT|SWITCH_BLOCKED|C")); Serial.println(index + 1);
    return false;
  }
  ensureServoAttached(index);
  servoTarget[index] = reverse ? SERVO_REVERSE_ANGLE[index] : SERVO_NORMAL_ANGLE[index];
  servoCurrent[index] = servoTarget[index];
  servos[index].write(servoCurrent[index]);
  servoMoving[index] = false;
  servoTest[index] = false;
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
  for (uint8_t i = 0; i < 7; i++) {
    Serial.print(F("SENSOR|")); Serial.print(i + 1); Serial.print('|');
    Serial.print(sensors[i].occupied ? F("ACTIVE") : F("CLEAR")); Serial.print('|'); Serial.println(millis());
    Serial.print(F("INPUT|")); Serial.print(SENSOR_PINS[i]); Serial.print('|');
    Serial.println(sensors[i].occupied ? F("ACTIVE") : F("CLEAR"));
  }
  for (uint8_t i = 0; i < 3; i++) {
    Serial.print(F("SWITCH|C")); Serial.print(i + 1); Serial.print('|');
    Serial.print(switchReverse[i] ? F("REVERSA") : F("NORMAL")); Serial.print('|'); Serial.println(millis());
  }
  setSignal(signalState);
}

bool safeHardwarePin(uint8_t pin) {
  return (pin >= 2 && pin <= 11) || (pin >= A1 && pin <= A5);
}

bool parseNumbers(char *text, uint8_t *values, uint8_t count, uint8_t maximum) {
  if (!text) return false;
  char *cursor = text;
  for (uint8_t i = 0; i < count; i++) {
    if (*cursor < '0' || *cursor > '9') return false;
    char *end;
    unsigned long value = strtoul(cursor, &end, 10);
    if (value > maximum) return false;
    values[i] = static_cast<uint8_t>(value);
    if (i + 1 == count) return *end == '\0';
    if (*end != ',') return false;
    cursor = end + 1;
  }
  return false;
}

void applyHardwareConfig() {
  char *revisionText = strtok(nullptr, "|");
  char *sensorText = strtok(nullptr, "|");
  char *servoText = strtok(nullptr, "|");
  char *normalText = strtok(nullptr, "|");
  char *reverseText = strtok(nullptr, "|");
  uint8_t sensorPins[7], servoPins[3], normal[3], reverse[3];
  if (!revisionText || !parseNumbers(sensorText, sensorPins, 7, A5) ||
      !parseNumbers(servoText, servoPins, 3, A5) ||
      !parseNumbers(normalText, normal, 3, 180) || !parseNumbers(reverseText, reverse, 3, 180)) {
    Serial.println(F("FAULT|HWCONFIG_INVALID")); return;
  }
  uint32_t used = 0;
  for (uint8_t i = 0; i < 10; i++) {
    uint8_t pin = i < 7 ? sensorPins[i] : servoPins[i - 7];
    if (!safeHardwarePin(pin) || (used & (1UL << pin))) {
      Serial.println(F("FAULT|HWCONFIG_INVALID")); return;
    }
    used |= 1UL << pin;
  }
  for (uint8_t i = 0; i < 3; i++) {
    servos[i].detach(); servoAttached[i] = false;
    servoMoving[i] = false; servoTest[i] = false;
    pinMode(SERVO_PINS[i], INPUT);
  }
  for (uint8_t i = 0; i < 7; i++) pinMode(SENSOR_PINS[i], INPUT);
  for (uint8_t i = 0; i < 7; i++) {
    SENSOR_PINS[i] = sensorPins[i]; pinMode(SENSOR_PINS[i], INPUT_PULLUP);
    bool initial = logicalSensorRead(i);
    unsigned long now = millis();
    sensors[i] = {initial, initial, initial, now, now, now};
  }
  for (uint8_t i = 0; i < 3; i++) {
    SERVO_PINS[i] = servoPins[i];
    SERVO_NORMAL_ANGLE[i] = normal[i]; SERVO_REVERSE_ANGLE[i] = reverse[i];
  }
  hardwareRevision = strtoul(revisionText, nullptr, 10);
  hardwareConfigured = true; lastPcPing = millis();
  Serial.print(F("HWACK|")); Serial.println(hardwareRevision);
  sendSnapshot();
}

void handleServoTest() {
  char *id = strtok(nullptr, "|"); char *angleText = strtok(nullptr, "|");
  if (!setupMode || !hardwareConfigured || emergencyActive || !id || !angleText ||
      strlen(id) != 2 || id[0] != 'C' || id[1] < '1' || id[1] > '3') {
    Serial.println(F("FAULT|SERVO_TEST_BLOCKED")); return;
  }
  uint8_t angle[1];
  if (!parseNumbers(angleText, angle, 1, 180)) {
    Serial.println(F("FAULT|SERVO_TEST_ANGLE")); return;
  }
  for (uint8_t i = 0; i < 7; i++) {
    if (logicalSensorRead(i) || sensorOccupied(i)) {
      Serial.println(F("FAULT|SERVO_TEST_SENSOR_ACTIVE")); return;
    }
  }
  for (uint8_t i = 0; i < 3; i++) {
    if (servoMoving[i]) { Serial.println(F("FAULT|SERVO_TEST_BUSY")); return; }
  }
  uint8_t index = id[1] - '1';
  ensureServoAttached(index);
  servoTarget[index] = angle[0]; servoMoving[index] = true; servoTest[index] = true;
  lastPcPing = millis();
}

void updateServoMovement() {
  unsigned long now = millis();
  if (now - lastServoStep < 20) return;
  lastServoStep = now;
  for (uint8_t i = 0; i < 3; i++) {
    if (!servoMoving[i]) continue;
    bool blocked = emergencyActive || now - lastPcPing > PC_TIMEOUT_MS;
    if (servoTest[i]) {
      for (uint8_t sensor = 0; sensor < 7; sensor++) if (logicalSensorRead(sensor) || sensorOccupied(sensor)) blocked = true;
    } else if (sensorProtectsSwitch(i)) blocked = true;
    if (blocked) {
      servoMoving[i] = false; servoTest[i] = false; servoTarget[i] = servoCurrent[i];
      Serial.println(F("FAULT|SERVO_MOVEMENT_BLOCKED")); continue;
    }
    if (servoCurrent[i] < servoTarget[i]) servoCurrent[i]++;
    else if (servoCurrent[i] > servoTarget[i]) servoCurrent[i]--;
    servos[i].write(servoCurrent[i]); servoCommandAt[i] = now;
    if (servoCurrent[i] == servoTarget[i]) {
      servoMoving[i] = false;
      if (servoTest[i]) {
        Serial.print(F("SERVO|C")); Serial.print(i + 1); Serial.print('|');
        Serial.print(servoCurrent[i]); Serial.println(F("|DONE")); servoTest[i] = false;
      }
    }
  }
}

void handleCommand(char *line) {
  char *kind = strtok(line, "|");
  if (!kind) return;
  if (strcmp(kind, "HWCONFIG") == 0) { applyHardwareConfig(); return; }
  if (strcmp(kind, "SETUP") == 0) {
    char *value = strtok(nullptr, "|"); setupMode = value && strcmp(value, "ON") == 0;
    lastPcPing = millis();
    Serial.print(F("SETUP|")); Serial.println(setupMode ? F("ON") : F("OFF")); return;
  }
  if (strcmp(kind, "SERVO_TEST") == 0) { handleServoTest(); return; }
  if (strcmp(kind, "PING") == 0) {
    lastPcPing = millis(); timeoutReported = false;
    char *sequence = strtok(nullptr, "|");
    Serial.print(F("PONG|")); Serial.println(sequence ? sequence : "0");
    return;
  }
  if (strcmp(kind, "SNAPSHOT") == 0) {
    lastPcPing = millis(); sendSnapshot(); return;
  }
  if (strcmp(kind, "CAL") == 0) {
    char *value = strtok(nullptr, "|");
    calibrationActive = value && strcmp(value, "START") == 0;
    if (calibrationActive) {
      calibrationStartedAt = millis();
      calibrationLastPrint = 0;
    }
    lastPcPing = millis();
    Serial.print(F("CAL|")); Serial.println(calibrationActive ? F("ON") : F("OFF"));
    return;
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
  if (!hardwareConfigured) { Serial.println(F("FAULT|HWCONFIG_REQUIRED")); return; }
  if (setupMode) { Serial.println(F("FAULT|SETUP_ACTIVE")); return; }
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
    if (id && color && strcmp(id, "F1") == 0) {
      setSignal(parseColor(color));
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
      sensors[i].lastTransition = now;
      if (current && !sensors[i].occupied) {
        sensors[i].occupied = true;
        sensors[i].passageStartedAt = now;
        Serial.print(F("INPUT|")); Serial.print(SENSOR_PINS[i]); Serial.println(F("|ACTIVE"));
        Serial.print(F("SENSOR|")); Serial.print(i + 1); Serial.print(F("|ACTIVE|")); Serial.println(now);
      }
    }
    if (sensors[i].occupied && !sensors[i].stable && now - sensors[i].lastTransition >= SENSOR_HOLD_MS) {
      sensors[i].occupied = false;
      Serial.print(F("INPUT|")); Serial.print(SENSOR_PINS[i]); Serial.println(F("|CLEAR"));
      unsigned long duration = sensors[i].lastTransition - sensors[i].passageStartedAt;
      Serial.print(F("PASS|")); Serial.print(i + 1); Serial.print('|'); Serial.println(duration);
      Serial.print(F("SENSOR|")); Serial.print(i + 1); Serial.print(F("|CLEAR|")); Serial.println(now);
    }
  }
}

void updateCalibration() {
  if (!calibrationActive) return;
  unsigned long now = millis();
  if (now - calibrationStartedAt >= CAL_DURATION_MS) {
    calibrationActive = false;
    Serial.println(F("CAL|TIMEOUT"));
    return;
  }
  if (now - calibrationLastPrint < CAL_INTERVAL_MS) return;
  calibrationLastPrint = now;
  Serial.print(F("CAL|"));
  for (uint8_t i = 0; i < 7; i++) Serial.print(logicalSensorRead(i) ? '1' : '0');
  Serial.print('|');
  for (uint8_t i = 0; i < 7; i++) Serial.print(digitalRead(SENSOR_PINS[i]) ? '1' : '0');
  Serial.print('|'); Serial.println(now);
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
    sensors[i] = {initial, initial, initial, millis(), millis(), millis()};
  }
  for (uint8_t channel = 0; channel < 3; channel++) pinMode(SIGNAL_PINS[channel], OUTPUT);
  allSignalsRed();
  lastPcPing = millis();
  delay(300);
  Serial.print(F("HELLO|UNO|2|")); Serial.println(millis());
  sendSnapshot();
}

void loop() {
  readSerialCommands();
  updateSensors();
  updateCalibration();
  updateServoMovement();
  updateServoDetach();
  updatePcFailsafe();
}
