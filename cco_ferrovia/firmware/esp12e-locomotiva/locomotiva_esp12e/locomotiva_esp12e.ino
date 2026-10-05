#include <ESP8266WiFi.h>
#include <WiFiUdp.h>
#include "secrets.h"
#include "locomotive_config.h"

// CCO Ferrovia - firmware comum para L01, L02 e L03.
// ESP-12E trabalha em 3,3 V e nao tolera 5 V nos GPIOs.
// Use regulador 3,3 V adequado e GND comum entre ESP, MX1508 e bateria.

constexpr uint16_t SERVER_PORT = 4210;
constexpr uint16_t LOCAL_PORT = 4211;
constexpr unsigned long COMMAND_TIMEOUT_MS = 1800;
constexpr unsigned long STATUS_INTERVAL_MS = 500;
constexpr unsigned long DISCOVERY_INTERVAL_MS = 2000;
constexpr unsigned long REVERSAL_DELAY_MS = 300;
constexpr unsigned long BATTERY_INTERVAL_MS = 1000;

enum Motion : uint8_t { STOPPED, FORWARD, REVERSE };

WiFiUDP udp;
IPAddress serverIp;
bool serverKnown = false;
Motion motion = STOPPED;
Motion pendingMotion = STOPPED;
unsigned long pendingAt = 0;
unsigned long lastValidCommand = 0;
unsigned long lastStatus = 0;
unsigned long lastDiscovery = 0;
unsigned long lastBatteryRead = 0;
uint32_t lastSequence = 0;
uint16_t batteryMv = 0;
uint8_t batteryPct = 0;
char faultCode[24] = "NONE";

const char *motionName(Motion value) {
  if (value == FORWARD) return "FORWARD";
  if (value == REVERSE) return "REVERSE";
  return "STOP";
}

void motorStop() {
  digitalWrite(MOTOR_IN1_PIN, LOW);
  digitalWrite(MOTOR_IN2_PIN, LOW);
  motion = STOPPED;
}

void applyMotion(Motion requested) {
  if (requested == STOPPED) {
    pendingMotion = STOPPED;
    pendingAt = 0;
    motorStop();
    return;
  }
  if (motion != STOPPED && motion != requested) {
    motorStop();
    pendingMotion = requested;
    pendingAt = millis() + REVERSAL_DELAY_MS;
    return;
  }
  digitalWrite(MOTOR_IN1_PIN, requested == FORWARD ? HIGH : LOW);
  digitalWrite(MOTOR_IN2_PIN, requested == REVERSE ? HIGH : LOW);
  motion = requested;
  pendingMotion = STOPPED;
  pendingAt = 0;
}

uint8_t percentageFromVoltage(uint16_t mv) {
  // Aproximacao inicial para uma celula 18650 sob carga. Calibre com a bateria real.
  if (mv >= 4150) return 100;
  if (mv >= 4000) return 85 + (mv - 4000) * 15 / 150;
  if (mv >= 3800) return 55 + (mv - 3800) * 30 / 200;
  if (mv >= 3650) return 25 + (mv - 3650) * 30 / 150;
  if (mv >= 3450) return 8 + (mv - 3450) * 17 / 200;
  if (mv >= 3300) return (mv - 3300) * 8 / 150;
  return 0;
}

void updateBattery() {
  if (!BATTERY_MONITOR_ENABLED || millis() - lastBatteryRead < BATTERY_INTERVAL_MS) return;
  lastBatteryRead = millis();
  uint32_t sum = 0;
  for (uint8_t i = 0; i < 16; i++) {
    sum += analogRead(A0);
    delay(1);
  }
  float adc = sum / 16.0f;
  uint16_t measured = static_cast<uint16_t>((adc / 1023.0f) * ADC_REFERENCE_MV * BATTERY_DIVIDER_RATIO);
  batteryMv = batteryMv == 0 ? measured : static_cast<uint16_t>(batteryMv * 0.8f + measured * 0.2f);
  batteryPct = percentageFromVoltage(batteryMv);
  if (batteryMv <= BATTERY_CRITICAL_MV) {
    motorStop();
    strncpy(faultCode, "BATTERY_CRITICAL", sizeof(faultCode));
  } else if (strcmp(faultCode, "BATTERY_CRITICAL") == 0 && batteryMv > BATTERY_WARNING_MV) {
    strncpy(faultCode, "NONE", sizeof(faultCode));
  }
}

void sendPacket(const String &message, const IPAddress &destination) {
  udp.beginPacket(destination, SERVER_PORT);
  udp.write(reinterpret_cast<const uint8_t *>(message.c_str()), message.length());
  udp.endPacket();
}

void sendHello() {
  String packet = String("HELLO|") + LOCO_ID + "|1";
  sendPacket(packet, IPAddress(255, 255, 255, 255));
}

void sendStatus() {
  IPAddress destination = serverKnown ? serverIp : IPAddress(255, 255, 255, 255);
  String packet = String("STATUS|") + LOCO_ID + "|" + motionName(motion) + "|" +
                  String(batteryMv) + "|" + String(batteryPct) + "|" +
                  String(WiFi.RSSI()) + "|" + faultCode;
  sendPacket(packet, destination);
}

void sendAck(uint32_t sequence, const char *action) {
  if (!serverKnown) return;
  String packet = String("ACK|") + LOCO_ID + "|" + String(sequence) + "|" + action;
  sendPacket(packet, serverIp);
}

void handleCommand(char *payload) {
  char *kind = strtok(payload, "|");
  char *target = strtok(nullptr, "|");
  char *sequenceText = strtok(nullptr, "|");
  char *action = strtok(nullptr, "|");
  if (!kind || !target || !sequenceText || !action) return;
  if (strcmp(kind, "CMD") != 0 || strcmp(target, LOCO_ID) != 0) return;

  uint32_t sequence = strtoul(sequenceText, nullptr, 10);
  if (sequence <= lastSequence) {
    sendAck(sequence, "STALE");
    return;
  }
  lastSequence = sequence;
  lastValidCommand = millis();
  if (strcmp(faultCode, "COMM_TIMEOUT") == 0) strncpy(faultCode, "NONE", sizeof(faultCode));

  if (strcmp(action, "PING") == 0) {
    sendAck(sequence, action);
    return;
  }
  if (strcmp(action, "STOP") == 0) applyMotion(STOPPED);
  else if (strcmp(action, "FORWARD") == 0 && strcmp(faultCode, "BATTERY_CRITICAL") != 0) applyMotion(FORWARD);
  else if (strcmp(action, "REVERSE") == 0 && strcmp(faultCode, "BATTERY_CRITICAL") != 0) applyMotion(REVERSE);
  sendAck(sequence, action);
  sendStatus();
}

void receivePackets() {
  int packetSize = udp.parsePacket();
  if (!packetSize) return;
  char buffer[128];
  int count = udp.read(buffer, sizeof(buffer) - 1);
  if (count <= 0) return;
  buffer[count] = '\0';
  serverIp = udp.remoteIP();
  serverKnown = true;
  handleCommand(buffer);
}

void updateSafety() {
  unsigned long now = millis();
  if (motion != STOPPED && now - lastValidCommand > COMMAND_TIMEOUT_MS) {
    motorStop();
    strncpy(faultCode, "COMM_TIMEOUT", sizeof(faultCode));
    sendStatus();
  }
  if (pendingAt && static_cast<long>(now - pendingAt) >= 0) {
    Motion requested = pendingMotion;
    pendingAt = 0;
    pendingMotion = STOPPED;
    applyMotion(requested);
  }
}

void connectWiFi() {
  WiFi.persistent(false);
  WiFi.mode(WIFI_STA);
  WiFi.setAutoReconnect(true);
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  while (WiFi.status() != WL_CONNECTED) {
    motorStop();
    delay(250);
  }
  udp.begin(LOCAL_PORT);
  sendHello();
}

void setup() {
  pinMode(MOTOR_IN1_PIN, OUTPUT);
  pinMode(MOTOR_IN2_PIN, OUTPUT);
  motorStop();
  Serial.begin(115200);
  delay(50);
  lastValidCommand = millis();
  connectWiFi();
}

void loop() {
  if (WiFi.status() != WL_CONNECTED) {
    motorStop();
    strncpy(faultCode, "WIFI_OFFLINE", sizeof(faultCode));
    WiFi.reconnect();
    delay(100);
    return;
  }
  receivePackets();
  updateSafety();
  updateBattery();
  unsigned long now = millis();
  if (!serverKnown && now - lastDiscovery >= DISCOVERY_INTERVAL_MS) {
    lastDiscovery = now;
    sendHello();
  }
  if (now - lastStatus >= STATUS_INTERVAL_MS) {
    lastStatus = now;
    sendStatus();
  }
  delay(2);
}
