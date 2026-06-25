# 🏭 Maquete Industrial - Sistema Integrado

Sistema completo de monitoramento e controle para maquete industrial com 4 módulos: Ferrovia, Mineradora, Porto Logístico e Aeroporto Logístico.

## 📁 Estrutura do Projeto

```
maquete_industrial/
├── firmware_arduino_ferrovia/   # Sketch Arduino (4 servos SG90 + HC-05)
├── gateway_bluetooth/             # Gateway Node.js para Raspberry Pi
├── backend_nodejs/              # API REST + WebSocket (Express + Socket.IO)
├── dashboard_react/             # Dashboard React.js (painéis dos 4 módulos)
└── app_react_native/            # App React Native (telemetria + controle)
```

## 🚀 Início Rápido

### 1. Banco de Dados (PostgreSQL)

```bash
psql -U postgres -f backend_nodejs/schema.sql
```

### 2. Back-end

```bash
cd backend_nodejs
npm install
# Edite .env com suas configurações
npm run migrate
npm start
```

### 3. Gateway Bluetooth (Raspberry Pi)

```bash
cd gateway_bluetooth
npm install
# Emparelhe os HC-05 via bluetoothctl
# Edite .env com o IP do servidor
npm start
```

### 4. Dashboard

```bash
cd dashboard_react
npm install
# Crie .env.local: REACT_APP_API_URL=http://localhost:3000
npm start
```

### 5. App React Native

```bash
cd app_react_native
npm install
# Edite API_BASE_URL no App.js para o IP do servidor
npx expo start
```

### 6. Arduino

- Abra `firmware_arduino_ferrovia/ferrovia_firmware.ino` no Arduino IDE
- Conecte o HC-05 (TX->D10, RX->D11 via divisor de tensão)
- Conecte os 4 servos SG90 (D3, D5, D6, D9)
- Carregue o sketch

## 🔌 Pinagem Arduino Ferrovia

| Componente     | Pino Arduino            |
| -------------- | ----------------------- |
| Servo Switch 1 | D3                      |
| Servo Switch 2 | D5                      |
| Servo Switch 3 | D6                      |
| Servo Switch 4 | D9                      |
| HC-05 TX       | D10 (SoftwareSerial RX) |
| HC-05 RX       | D11 (SoftwareSerial TX) |
| GND comum      | GND                     |
| VCC Servos     | Fonte 5V externa        |
| VCC HC-05      | 5V                      |

## 📡 Protocolo Serial

### Comando (Gateway → Arduino)

```
CMD|SWITCH|<id>|<acao>|<valor>
```

- `CMD|SWITCH|1|SET|LEFT` - Mover switch 1 para esquerda
- `CMD|SWITCH|2|ANGLE|90` - Mover switch 2 para 90°
- `CMD|SWITCH|3|STATUS` - Solicitar status
- `CMD|SWITCH|4|RESET` - Resetar para centro

### Resposta (Arduino → Gateway)

```
ACK|SWITCH|<id>|<estado>
STATUS|SWITCH|<id>|<angulo>|<estado>|<timestamp>
ERR|<codigo_erro>
```

## 🔐 Segurança

- JWT para autenticação de usuários (dashboard + app)
- API Key para gateway (`GATEWAY_API_KEY`)
- TLS em produção (configurar nginx/caddy)
- Rate limiting nas APIs

## 📊 Funcionalidades

| Módulo         | Funcionalidades                                                                     |
| -------------- | ----------------------------------------------------------------------------------- |
| **Ferrovia**   | Controle de 4 switches, mapa esquemático, botão de emergência, ACK em tempo real    |
| **Mina**       | Mapa cartesiano com caminhões, telemetria (posição, carga, bateria), buffer offline |
| **Porto**      | Lista de navios, ETA, status de carga, docas                                        |
| **Aeroporto**  | Lista de aeronaves, ETA, portões, status de carga                                   |
| **Relatórios** | Exportação CSV/XLSX/PDF, filtros por data                                           |

## 🛠️ Tecnologias

- **Front-end**: React.js, Tailwind CSS, Socket.IO Client, Recharts
- **Back-end**: Node.js, Express, Socket.IO, PostgreSQL, Redis
- **Gateway**: Node.js, SerialPort, WebSocket
- **Mobile**: React Native (Expo), Axios, Socket.IO Client
- **Hardware**: Arduino, HC-05, SG90

## 📄 Licença

Projeto acadêmico/institucional.
