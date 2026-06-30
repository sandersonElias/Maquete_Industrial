# Maquete Industrial - Sistema Integrado

Sistema completo de monitoramento e controle para maquete industrial com 4 módulos: Ferrovia, Mineradora, Porto Logístico e Aeroporto Logístico.

## Arquitetura

```
┌─────────────┐     ┌──────────────┐     ┌─────────────┐
│  Dashboard  │◄───►│   Backend    │◄───►│   Gateway   │──► Arduino
│  React/CRA  │  WS │  Express +   │  WS │  Node.js +  │   BT/Serial
│  Tailwind   │     │  PostgreSQL  │     │  SerialPort │
└─────────────┘     │  + Redis     │     └─────────────┘
                    └──────┬───────┘
                           │ WS/HTTP
                    ┌──────┴───────┐
                    │ App React    │
                    │ Native/Expo  │
                    └──────────────┘
```

## Estrutura do Projeto

```
maquete_industrial/
├── backend_nodejs/              # API REST + WebSocket (Express + Socket.IO)
│   └── src/
│       ├── config/              # Configurações (DB, Redis, Logger)
│       ├── controllers/         # Handlers das rotas
│       ├── services/            # Lógica de negócio
│       ├── routes/              # Definição de rotas Express
│       ├── middlewares/         # Auth JWT + API Key
│       ├── sockets/             # Eventos Socket.IO
│       ├── jobs/                # Tarefas agendadas (timeout)
│       └── utils/               # Validações
├── dashboard_react/             # Dashboard React.js
│   └── src/
│       ├── pages/               # 6 páginas (Overview, Ferrovia, Mina, Porto, Aeroporto, Relatórios)
│       ├── components/          # Sidebar, Header
│       └── contexts/            # AuthContext, SocketContext
├── gateway_bluetooth/           # Gateway Node.js (Raspberry Pi)
├── app_react_native/            # App React Native (Expo)
├── firmware_arduino_ferrovia/   # Arduino - 4 servos SG90 + HC-05
└── firmware_arduino_caminho_basculante/  # Arduino - carrinho basculante RC
```

## Início Rápido

### Pré-requisitos

- Node.js 18+
- PostgreSQL 14+
- Redis 6+
- Arduino IDE (para firmware)
- Expo CLI (para app mobile)

### 1. Banco de Dados

```bash
psql -U postgres -f backend_nodejs/schema.sql
```

### 2. Back-end

```bash
cd backend_nodejs
npm install
cp .env.exemplo .env   # Configure as variáveis
npm run migrate         # Dados iniciais (seed)
npm run dev             # Porta 4000
```

### 3. Gateway Bluetooth (Raspberry Pi ou PC com dongle)

```bash
cd gateway_bluetooth
npm install
cp .env.exemplo .env   # Configure BACKEND_WS_URL, SIMULATION_MODE
npm start               # SIMULATION_MODE=true para desenvolvimento sem hardware
```

### 4. Dashboard

```bash
cd dashboard_react
npm install
cp .env.exemplo .env   # REACT_APP_API_URL=http://localhost:4000
npm start               # Porta 3000
```

### 5. App React Native (controle BT do caminhão)

```bash
cd app_react_native
npm install
npx expo prebuild --clean   # Gera pasta android/
npx expo run:android         # Compila e instala no celular
```

> O app se conecta diretamente ao HC-05 via Bluetooth. Pareie o celular com o HC-05 antes de abrir o app.

### 6. Arduino

- Abra o sketch correspondente no Arduino IDE
- Para ferrovia: `firmware_arduino_ferrovia/ferrovia_firmware.ino`
- Para caminhão: `firmware_arduino_caminho_basculante/caminhao_basculante_firmware.ino`
- Conecte o HC-05 e carregue o sketch

## Variáveis de Ambiente

Cada módulo possui um arquivo `.env.exemplo`. Copie para `.env` e preencha:

| Módulo    | Arquivo                   | Variáveis Principais                                                                                    |
| --------- | ------------------------- | ------------------------------------------------------------------------------------------------------- |
| Backend   | `backend_nodejs/.env`     | `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD`, `REDIS_URL`, `JWT_SECRET`, `GATEWAY_API_KEY` |
| Gateway   | `gateway_bluetooth/.env`  | `BACKEND_WS_URL`, `BACKEND_API_URL`, `GATEWAY_API_KEY`, `BT_DEVICE_FERROVIA`, `SIMULATION_MODE`         |
| Dashboard | `dashboard_react/.env`    | `REACT_APP_API_URL=http://localhost:4000`                                                               |
| App       | `app_react_native/App.js` | `API_BASE_URL`, `WS_URL` (hardcoded, editar direto no código)                                           |

## Protocolo de Comunicação

### Serial (Gateway ↔ Arduino)

```
CMD|SWITCH|<id>|SET|LEFT       # Mover switch para esquerda
CMD|SWITCH|<id>|SET|RIGHT      # Mover switch para direita
CMD|SWITCH|<id>|SET|CENTER     # Mover switch para centro
CMD|SWITCH|<id>|ANGLE|90       # Mover switch para ângulo específico
CMD|SWITCH|<id>|STATUS         # Solicitar status
CMD|SWITCH|<id>|RESET          # Resetar para centro

ACK|SWITCH|<id>|<estado>       # Resposta do Arduino
STATUS|SWITCH|<id>|<angulo>|<estado>|<timestamp>  # Heartbeat
ERR|<codigo_erro>              # Erro
```

### Socket.IO (Backend ↔ Dashboard/App)

| Evento             | Direção             | Payload                                            |
| ------------------ | ------------------- | -------------------------------------------------- |
| `authenticate`     | Dashboard → Backend | `{ token }`                                        |
| `authenticated`    | Backend → Dashboard | `{ success, error? }`                              |
| `gateway:register` | Gateway → Backend   | `{ gatewayId, apiKey }`                            |
| `command`          | Backend → Gateway   | `{ target, cmd, switchId, action, angle }`         |
| `switch:update`    | Backend → Dashboard | `{ switchId, state, timestamp }`                   |
| `switch:status`    | Backend → Dashboard | `{ switchId, angle, state, timestamp }`            |
| `truck:telemetry`  | Backend → Dashboard | `{ truckId, x, y, speed, load, battery, heading }` |
| `gateway:status`   | Backend → Dashboard | `{ gatewayId, devices[], timestamp }`              |
| `device:data`      | Gateway → Backend   | `{ gatewayId, deviceName, data, timestamp }`       |

## API REST (Backend)

Todas as rotas estão sob o prefixo `/api/`. Rotas autenticadas requerem header `Authorization: Bearer <jwt>`.

| Método | Rota                        | Descrição                       | Auth    |
| ------ | --------------------------- | ------------------------------- | ------- |
| POST   | `/api/auth/login`           | Login (retorna JWT)             | Não     |
| POST   | `/api/auth/register`        | Criar usuário                   | Não     |
| GET    | `/api/health`               | Health check (PG + Redis)       | Não     |
| GET    | `/api/ferrovia/status`      | Status dos 4 switches           | JWT     |
| POST   | `/api/ferrovia/switch`      | Enviar comando ao switch        | JWT     |
| GET    | `/api/trucks`               | Listar caminhões                | JWT     |
| POST   | `/api/trucks/:id/telemetry` | Enviar telemetria               | JWT     |
| POST   | `/api/trucks/:id/command`   | Enviar comando ao caminhão      | JWT     |
| POST   | `/api/locomotive/position`  | Registrar posição da locomotiva | JWT     |
| GET    | `/api/port/ships`           | Listar navios                   | JWT     |
| GET    | `/api/airport/airplanes`    | Listar aeronaves                | JWT     |
| POST   | `/api/reports/export`       | Gerar relatório                 | JWT     |
| POST   | `/api/gateway/notify`       | Notificação do gateway          | API Key |

## Comandos do Caminhão

### Movimentação (simples ou compostos)

| Comando | Ação                |
| ------- | ------------------- |
| `F`     | Frente              |
| `B`     | Ré                  |
| `S`     | Parar motor         |
| `L`     | Virar esquerda      |
| `R`     | Virar direita       |
| `C`     | Centro (direção)    |
| `FL`    | Frente + Esquerda   |
| `FR`    | Frente + Direita    |
| `BL`    | Ré + Esquerda       |
| `BR`    | Ré + Direita        |
| `SC`    | Parada total (motor + direção) |

### Caçamba

| Comando | Ação             |
| ------- | ---------------- |
| `U`     | Subir caçamba    |
| `D`     | Descer caçamba   |
| `X`     | Parar caçamba    |

### Iluminação

| Comando | Ação                  |
| ------- | --------------------- |
| `HH`    | Toggle faróis         |
| `TI`    | Seta esquerda ligar   |
| `TO`    | Seta direita ligar    |
| `TX`    | Desligar setas        |

## Pinagem Arduino

### Ferrovia (4 Servos + HC-05)

| Componente            | Pino                 |
| --------------------- | -------------------- |
| Servo Switch 1        | D3                   |
| Servo Switch 2        | D5                   |
| Servo Switch 3        | D6                   |
| Servo Switch 4        | D9                   |
| HC-05 TX → Arduino RX | D10 (SoftwareSerial) |
| HC-05 RX ← Arduino TX | D11 (SoftwareSerial) |
| GND comum             | GND                  |
| VCC Servos            | Fonte 5V externa     |
| VCC HC-05             | 5V                   |

### Caminhão Basculante (3 Servos + 4 LEDs)

| Componente      | Pino | Função                        |
| --------------- | ---- | ----------------------------- |
| Servo Direção   | D5   | Controle de direção (45°-135°) |
| Servo Caçamba   | D6   | Subir/descer (0°-90°)         |
| Servo Motor     | D7   | Rotação contínua (0°-180°)    |
| Farol Esquerdo  | D2   | LED farol esquerdo            |
| Farol Direito   | D3   | LED farol direito             |
| Seta Esquerda   | D8   | LED seta esquerda             |
| Seta Direita    | D9   | LED seta direita              |
| HC-05 TX→RX     | 0/1  | Serial padrão (9600 baud)     |

## Stack Tecnológica

| Camada       | Tecnologias                                                       |
| ------------ | ----------------------------------------------------------------- |
| Frontend Web | React 18, Tailwind CSS, Socket.IO Client, Recharts, Lucide Icons  |
| Backend      | Node.js, Express, Socket.IO, PostgreSQL, Redis, JWT, bcryptjs     |
| Gateway      | Node.js, SerialPort, Socket.IO Client, Winston                    |
| Mobile       | React Native (Expo SDK 49), Axios, Socket.IO Client, AsyncStorage |
| Hardware     | Arduino, Servos SG90, HC-05 Bluetooth, Motor DC                   |

## Tema Visual

Paleta de cores compartilhada entre Dashboard e App:

| Cor     | Código    | Uso                              |
| ------- | --------- | -------------------------------- |
| Glow    | `#00FFB2` | Destaques, indicadores positivos |
| Dark    | `#0D0F14` | Fundo principal                  |
| Surface | `#161B26` | Superfícies elevadas             |
| Card    | `#1C2333` | Cards e painéis                  |
| Border  | `#252D40` | Bordas                           |
| Accent  | `#3D9EFF` | Botões, links, switches LEFT     |
| Warning | `#FFB800` | Alertas, bateria média           |
| Danger  | `#FF4560` | Erros, bateria baixa, stop       |
| Purple  | `#A855F7` | Switches RIGHT, caçamba          |
