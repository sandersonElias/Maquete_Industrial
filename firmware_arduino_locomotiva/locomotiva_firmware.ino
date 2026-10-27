/**
 * ============================================================
 *  FIRMWARE LOCOMOTIVA - ESP-12E + L298M + Motor DC 5V
 * ============================================================
 *  Cada locomotiva tem seu proprio ESP-12E controlando um motor DC
 *  via modulo L298M. Comunicação com o backend via Wi-Fi
 *  WebSocket + protocolo Socket.IO v4 (EIO=4).
 *
 *  BIBLIOTECAS (instalar na Arduino IDE):
 *    Sketch → Include Library → Manage Libraries...
 *    - Buscar "WebSockets" (autor: Markus Sattler / Links2004)
 *
 *  PINOS (ESP-12E / GPIO):
 *    - GPIO4 (D2)  = L298M IN1 (direção)
 *    - GPIO5 (D1)  = L298M IN2 (direção)
 *  OBS: ENA (enable) do L298M deve ser ligado direto no 5V -> velocidade
 *  constante (sem PWM). O campo speed do backend é ignorado.
 *
 *  PROTOCOLO SOCKET.IO v4 (ESP <-> Backend, namespace padrão):
 *    Envia  -> 42["loco:register", {locoId, apiKey}]
 *    Envia  -> 42["loco:status", {locoId, speed, direction, battery}]
 *    Recebe -> 42["loco:command", {command, speed}]
 *
 *  SEGURANÇA:
 *    - Motor para se perder conexão Wi-Fi/WebSocket
 * ============================================================
 */

#include <ESP8266WiFi.h>
#include <WebSocketsClient.h>

// ── Configuração Wi-Fi ─────────────────────────────────────
#define WIFI_SSID      "SUA_REDE_AQUI"
#define WIFI_PASS      "SUA_SENHA_AQUI"

// ── Configuração Backend ───────────────────────────────────
#define BACKEND_HOST   "192.168.1.100"  // IP do backend
#define BACKEND_PORT   4000
#define WS_PATH        "/socket.io/?EIO=4&transport=websocket"
#define LOCO_ID        "loco-01"        // loco-01 ou loco-02
#define API_KEY        "chave_api"      // GATEWAY_API_KEY do backend

// ── Pinos L298M ────────────────────────────────────────────
#define PIN_IN1        4   // GPIO4 = D2
#define PIN_IN2        5   // GPIO5 = D1

// ── Velocidade padrão ──────────────────────────────────────
#define DEFAULT_SPEED  200

// ── Intervalo de status (ms) ───────────────────────────────
#define STATUS_INTERVAL 2000

// ── Objetos ────────────────────────────────────────────────
WebSocketsClient webSocket;

// ── Variáveis de estado ────────────────────────────────────
String currentDirection = "stop";
int currentSpeed = 0;
bool connected = false;       // Socket.IO conectado
bool socketReady = false;     // recebeu ack de CONNECT (sessão aberta)
bool registered = false;
unsigned long lastStatus = 0;

// ── Reconexão Wi-Fi ────────────────────────────────────────
void reconnectWiFi() {
  if (WiFi.status() == WL_CONNECTED) return;

  Serial.print("Conectando Wi-Fi: ");
  Serial.println(WIFI_SSID);

  WiFi.begin(WIFI_SSID, WIFI_PASS);

  int attempts = 0;
  while (WiFi.status() != WL_CONNECTED && attempts < 20) {
    delay(500);
    Serial.print(".");
    attempts++;
  }

  if (WiFi.status() == WL_CONNECTED) {
    Serial.println("\nWi-Fi conectado!");
    Serial.print("IP: ");
    Serial.println(WiFi.localIP());
  } else {
    Serial.println("\nFalha ao conectar Wi-Fi");
  }
}

// ── Controle do motor (velocidade constante) ──────────────
void setMotor(String direction) {
  currentDirection = direction;

  if (direction == "forward") {
    digitalWrite(PIN_IN1, HIGH);
    digitalWrite(PIN_IN2, LOW);
    currentSpeed = DEFAULT_SPEED;
  } else if (direction == "backward") {
    digitalWrite(PIN_IN1, LOW);
    digitalWrite(PIN_IN2, HIGH);
    currentSpeed = DEFAULT_SPEED;
  } else { // stop
    digitalWrite(PIN_IN1, LOW);
    digitalWrite(PIN_IN2, LOW);
    currentSpeed = 0;
  }
}

// ── Emitir evento Socket.IO ────────────────────────────────
void emitEvent(const char* event, String payload) {
  String frame = "42[\"";
  frame += event;
  frame += "\",";
  frame += payload;
  frame += "]";
  webSocket.sendTXT(frame);
}

// ── Registrar a locomotiva (com apiKey) ────────────────────
void registerLoco() {
  String regJson = "{\"locoId\":\"" + String(LOCO_ID) + "\",\"apiKey\":\"" + String(API_KEY) + "\"}";
  emitEvent("loco:register", regJson);
  Serial.print("Enviado loco:register: ");
  Serial.println(regJson);
}

// ── Enviar status ──────────────────────────────────────────
void sendStatus() {
  if (!socketReady) return;

  // Ler tensão da bateria (ADC do ESP8266)
  int raw = analogRead(A0);
  float battery = raw * (3.3 / 1023.0);  // Ajuste conforme divisor de tensão

  String json = "{\"locoId\":\"" + String(LOCO_ID) + "\",\"speed\":" + String(currentSpeed) +
                ",\"direction\":\"" + currentDirection + "\",\"battery\":" + String(battery, 2) + "}";

  emitEvent("loco:status", json);
}

// ── Evento recebido do backend ─────────────────────────────
void handleEvent(String data) {
  Serial.print("Evento: ");
  Serial.println(data);

  if (data.indexOf("loco:command") == -1) return;

  String command = "";

  // Extrair command: ..."command":"forward"...
  int cmdIdx = data.indexOf("\"command\":\"");
  if (cmdIdx != -1) {
    cmdIdx += 11;
    int cmdEnd = data.indexOf("\"", cmdIdx);
    command = data.substring(cmdIdx, cmdEnd);
  }

  if (command == "forward") {
    setMotor("forward");
  } else if (command == "backward") {
    setMotor("backward");
  } else if (command == "stop") {
    setMotor("stop");
  }

  Serial.print("Comando: ");
  Serial.println(command);
}

// ── Callback do WebSocket ──────────────────────────────────
void webSocketEvent(WStype_t type, uint8_t* payload, size_t length) {
  switch (type) {
    case WStype_ERROR:
      Serial.println("[WS] Erro de conexão");
      break;

    case WStype_DISCONNECTED:
      Serial.println("[WS] Desconectado — parando motor por segurança");
      socketReady = false;
      connected = false;
      registered = false;
      setMotor("stop");
      break;

    case WStype_CONNECTED:
      Serial.println("[WS] WebSocket conectado — abrindo sessão Socket.IO");
      // Engine.IO v4: "4" = message, "0" = socket.io CONNECT (namespace padrão)
      webSocket.sendTXT("40");
      break;

    case WStype_TEXT: {
      // Engine.IO ping → responder pong
      if (length == 1 && payload[0] == '2') {
        webSocket.sendTXT("3");
        break;
      }

      String data = "";
      for (uint16_t i = 0; i < length; i++) data += (char)payload[i];

      if (data.startsWith("40")) {
        // Socket.IO CONNECT ack — sessão aberta
        socketReady = true;
        connected = true;
        registered = false;
        Serial.println("[WS] Socket.IO conectado");
      } else if (data.startsWith("42")) {
        // Socket.IO evento (2 = EVENT)
        handleEvent(data.substring(2));
      }
      break;
    }

    default:
      break;
  }
}

// ── Setup ──────────────────────────────────────────────────
void setup() {
  Serial.begin(9600);
  Serial.println("\n=== LOCOMOTIVA " + String(LOCO_ID) + " ===");

  // Configurar pinos
  pinMode(PIN_IN1, OUTPUT);
  pinMode(PIN_IN2, OUTPUT);

  // Motor parado inicialmente
  setMotor("stop");

  // Conectar Wi-Fi
  reconnectWiFi();

  // Backend via WebSocket + Socket.IO v4
  Serial.print("Conectando backend: ");
  Serial.print(BACKEND_HOST);
  Serial.print(":");
  Serial.println(BACKEND_PORT);

  webSocket.begin(BACKEND_HOST, BACKEND_PORT, WS_PATH);
  webSocket.onEvent(webSocketEvent);
  webSocket.setReconnectInterval(5000);
  webSocket.enableHeartbeat(25000, 20000, 5);
}

// ── Loop principal ─────────────────────────────────────────
void loop() {
  // Reconectar Wi-Fi se necessário
  reconnectWiFi();

  // Processar WebSocket (reconecta e roteia eventos)
  webSocket.loop();

  // Registrar a locomotiva assim que a sessão abrir
  if (socketReady && !registered) {
    registered = true;
    registerLoco();
  }

  // Enviar status periodicamente
  unsigned long now = millis();
  if (socketReady && now - lastStatus > STATUS_INTERVAL) {
    sendStatus();
    lastStatus = now;
  }

  // Pequena pausa para estabilidade
  delay(10);
}