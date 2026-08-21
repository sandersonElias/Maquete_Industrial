# Backend Node.js

API REST + WebSocket para o sistema de monitoramento da maquete industrial.

## Stack

- Express 4.18
- Socket.IO 4.7
- PostgreSQL (via `pg`)
- Redis (via `redis`)
- JWT (`jsonwebtoken`) + bcryptjs
- Winston (logging)
- Joi (validação)
- Jest (testes)

## Estrutura

```
src/
├── server.js                 # Inicialização do servidor
├── app.js                    # Express + Socket.IO + rotas + middlewares
├── config/
│   ├── index.js              # Variáveis de ambiente centralizadas
│   ├── db.js                 # Pool PostgreSQL
│   ├── redis.js              # Cliente Redis
│   └── logger.js             # Winston logger (Console + server.log)
├── routes/
│   ├── authRoutes.js         # POST /login, /register
│   ├── ferroviaRoutes.js     # GET /status, POST /switch
│   ├── trucksRoutes.js       # GET /, POST /:id/telemetry, POST /:id/command
│   ├── locomotiveRoutes.js   # POST /position
│   ├── portRoutes.js         # GET /ships, POST /ships
│   ├── chemistryRoutes.js    # GET /equipment
│   ├── reportRoutes.js       # GET /, POST /export, GET /:id/download
│   ├── alertRoutes.js        # Rotas de alertas
│   └── gatewayRoutes.js      # POST /notify
├── controllers/
│   ├── authController.js     # Login e registro
│   ├── healthController.js   # Health check (PG + Redis)
│   ├── ferroviaController.js # Controle de switches
│   ├── trucksController.js   # Telemetria e comandos
│   ├── locomotiveController.js # Posição da locomotiva
│   ├── portController.js     # Navios do porto
│   ├── reportController.js   # Geração de relatórios
│   ├── alertController.js    # Alertas do sistema
│   └── gatewayController.js  # Notificações do gateway
├── services/
│   ├── authService.js        # Login, registro, JWT
│   ├── ferroviaService.js    # CRUD switches + comandos
│   ├── trucksService.js      # Telemetria + comandos
│   ├── locomotiveService.js  # Posição locomotiva
│   ├── portService.js        # Navios do porto
│   ├── reportService.js      # Criação de relatórios
│   ├── alertService.js       # Serviço de alertas
│   └── redisService.js       # Operações Redis (set/del)
├── middlewares/
│   ├── authenticateToken.js  # Verificação JWT
│   ├── authenticateGateway.js # Verificação API Key
│   └── validate.js           # Validação Joi
├── sockets/
│   └── index.js              # Eventos Socket.IO (gateway data, switch updates)
├── jobs/
│   └── index.js              # Timeout de comandos (a cada 5s)
├── utils/
│   └── validation.js         # Validações de switch e truck commands
└── migrations/
    └── 002_schema_evolution.sql # Migração adicional (RLS, tabelas extras)
scripts/
├── migrate.js                # Executa migrations do banco
└── seed.js                   # Popula dados iniciais (usuarios, equipamentos)
```

## Comandos

```bash
npm install          # Instalar dependências
npm run dev          # Desenvolvimento (nodemon, porta 4000)
npm start            # Produção (node)
npm test             # Executar testes (Jest)
npm run migrate      # Executar migrations do banco
npm run seed         # Popular dados iniciais (usuarios, equipamentos)
```

## Variáveis de Ambiente

```env
PORT=4000
NODE_ENV=development
DATABASE_URL=postgresql://user:pass@host:5432/db  # Render PostgreSQL
REDIS_URL=redis://localhost:6379                   # Opcional (sem cache se não configurado)
JWT_SECRET=seu_secret_aqui
JWT_EXPIRES_IN=24h
GATEWAY_API_KEY=sua_api_key
COMMAND_TIMEOUT_MS=30000
LOG_LEVEL=info
CORS_ORIGIN=*
```

## Banco de Dados

10 tabelas com UUID primary keys e extensão PostGIS (opcional):

| Tabela | Descrição |
|--------|-----------|
| `users` | Usuários (admin/operator/viewer) |
| `switches` | 3 switches da ferrovia (ângulo 0-180°) |
| `commands` | Histórico de comandos dos switches |
| `trucks` | Caminhões basculantes |
| `truck_telemetry` | Histórico de telemetria |
| `truck_commands` | Comandos enviados aos caminhões |
| `locomotive_position` | Posições da locomotiva |
| `ships` | Navios do porto |
| `alerts` | Alertas do sistema |
| `reports` | Relatórios gerados |
| `chemistry_equipment` | Equipamentos da área química |

Schema: `schema.sql` na raiz do módulo.
Migrations: `migrations/002_schema_evolution.sql` (tabelas extras, indexes, views).

## API Detalhada

### Auth

**POST `/api/auth/login`**
```json
// Request
{ "username": "admin", "password": "123456" }

// Response 200
{ "token": "eyJ...", "user": { "id": "uuid", "username": "admin", "role": "admin" } }
```

**POST `/api/auth/register`**
```json
// Request
{ "username": "operador", "email": "op@email.com", "password": "123456", "role": "operator" }

// Response 201
{ "id": "uuid", "username": "operador", "role": "operator" }
```

### Ferrovia

**GET `/api/ferrovia/status`** (JWT obrigatório)
```json
// Response 200
[
  {
    "id": 1,
    "switch_id": 1,
    "name": "Desvio Norte",
    "current_angle": 90,
    "current_state": "CENTER",
    "target_angle": 90,
    "is_moving": false,
    "last_command_at": null
  },
  {
    "id": 2,
    "switch_id": 2,
    "name": "Desvio Leste",
    "current_angle": 90,
    "current_state": "CENTER",
    "target_angle": 90,
    "is_moving": false,
    "last_command_at": null
  },
  {
    "id": 3,
    "switch_id": 3,
    "name": "Desvio Sul",
    "current_angle": 90,
    "current_state": "CENTER",
    "target_angle": 90,
    "is_moving": false,
    "last_command_at": null
  }
]
```

**POST `/api/ferrovia/switch`** (JWT obrigatório)
```json
// Request (por ação)
{ "switchId": 1, "action": "LEFT" }

// Request (por ângulo)
{ "switchId": 1, "angle": 45 }

// Response 200
{ "success": true, "command": { "id": "uuid", "switch_id": 1, "status": "pending", ... } }
```

### Caminhões

**GET `/api/trucks`** (JWT obrigatório)
```json
// Response 200
[{
  "id": "T01",
  "name": "Caminhão Basculante 01",
  "status": "active",
  "current_x": 5.2,
  "current_y": -3.1,
  "current_load": 2500,
  "max_load": 5000,
  "battery_level": 85
}]
```

**POST `/api/trucks/:id/telemetry`** (JWT obrigatório)
```json
// Request
{ "deltaX": 0.5, "deltaY": -0.2, "speed": 10, "load": 2500, "battery": 85, "heading": 90 }

// Response 200
{ "success": true, "position": { "x": 5.7, "y": -3.3 } }
```

**POST `/api/trucks/:id/command`** (JWT obrigatório)
```json
// Request
{ "command": "F" }  // F=B/S/L/R/C/U/D/X

// Response 200
{ "success": true, "command": { "id": "uuid", "truck_id": "T01", "command": "F", "status": "pending" } }
```

### Porto

**GET `/api/port/ships`** (JWT obrigatório)

Retorna array de navios ordenados por ETA.

### Química

**GET `/api/chemistry/equipment`** (sem auth)
```json
// Response 200
[
  { "id": "CHEM-001", "name": "Tanque Alpha", "status": "online", "temperature": 25.4, "humidity": 45, "level": 78 }
]
```

### Relatórios

**GET `/api/reports`** (JWT obrigatório)
```json
// Response 200
[
  { "id": "uuid", "report_type": "switches", "format": "csv", "status": "ready", "created_at": "..." }
]
```

**POST `/api/reports/export`** (JWT obrigatório)
```json
// Request
{ "reportType": "switches", "format": "csv", "dateFrom": "2024-01-01", "dateTo": "2024-12-31" }

// Response 200
{ "success": true, "report": { "id": "uuid", "status": "generating", ... } }
```

**GET `/api/reports/:id/download`** (JWT obrigatório)

Download do arquivo gerado (CSV, XLSX ou PDF).

### Health Check

**GET `/api/health`** (sem auth)
```json
{
  "status": "ok",
  "port": 4000,
  "postgres": true,
  "redis": true,
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

## Socket.IO

### Eventos Recebidos

| Evento | Origem | Payload | Ação |
|--------|--------|---------|------|
| `authenticate` | Dashboard | `{ token }` | Valida JWT, adiciona à room "dashboard" |
| `gateway:register` | Gateway | `{ gatewayId, apiKey }` | Valida API Key, adiciona à room "gateway" |
| `device:data` | Gateway | `{ gatewayId, deviceName, data }` | Processa dados do Arduino |

### Eventos Enviados

| Evento | Destino | Payload |
|--------|---------|---------|
| `authenticated` | Dashboard | `{ success, error? }` |
| `switch:update` | Dashboard | `{ switchId, state, timestamp }` |
| `switch:status` | Dashboard | `{ switchId, angle, state, timestamp }` |
| `switch:command-timeout` | Dashboard | `{ commandId, switchId, timestamp }` |
| `truck:telemetry` | Todos | `{ truckId, x, y, speed, load, battery, heading }` |
| `truck:command` | Dashboard | `{ truckId, command, status, commandId }` |
| `gateway:status` | Dashboard | `{ gatewayId, eventType, data, timestamp }` |
| `command` | Gateway | `{ target, cmd, switchId, action, angle, commandId }` |

### Fluxo: Controle de Switch

```
Dashboard → POST /api/ferrovia/switch → Backend grava comando no DB
  → Backend emite "command" para room "gateway"
    → Gateway recebe, envia CMD|SWITCH|... via Serial
      → Arduino processa, responde ACK|SWITCH|...
        → Gateway emite "device:data" para Backend
          → Backend atualiza DB, emite "switch:update" para Dashboard
```

## Jobs

- **`markTimedOutCommands`**: Executada a cada 5 segundos. Marca comandos pendentes como `timeout` se ultrapassaram `COMMAND_TIMEOUT_MS` (30s padrão). Remove do Redis e notifica o dashboard.
