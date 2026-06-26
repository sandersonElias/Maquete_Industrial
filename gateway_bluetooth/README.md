# Gateway Bluetooth

Ponte entre o servidor Node.js e os dispositivos Arduino via Bluetooth (HC-05). Projetado para rodar em Raspberry Pi.

## Stack

- Node.js
- SerialPort 12 (comunicação serial)
- Socket.IO Client 4.8 (conexão com backend)
- Axios (HTTP para notificações)
- Winston (logging)

## Estrutura

```
gateway_bluetooth/
├── index.js           # Código completo do gateway (tudo em um arquivo)
├── .env               # Configurações (copiar de .env.exemplo)
├── .env.exemplo       # Template de configuração
├── gateway.log        # Log de execução
└── package.json
```

## Comandos

```bash
npm install    # Instalar dependências
npm start      # Executar gateway
npm run dev    # Desenvolvimento (nodemon)
```

## Variáveis de Ambiente

```env
# Conexão com o Backend
BACKEND_WS_URL=http://localhost:4000
BACKEND_API_URL=http://localhost:4000/api
GATEWAY_API_KEY=sua_api_key
GATEWAY_ID=gateway-rpi-01

# Dispositivos Bluetooth (endereços MAC dos HC-05)
BT_DEVICE_FERROVIA=98:D3:31:FD:15:F5
BT_DEVICE_TRUCK01=98:D3:31:FD:15:A1

# Configuração Serial
SERIAL_BAUD=9600
RECONNECT_INTERVAL=5000
HEARTBEAT_INTERVAL=3000

# Modo Simulação (true = sem hardware)
SIMULATION_MODE=true

LOG_LEVEL=info
```

## Modo Simulação

Quando `SIMULATION_MODE=true`, o gateway:

- Não tenta encontrar portas seriais
- Cria dispositivos virtuais
- Gera dados mock a cada 10 segundos:
  - **Ferrovia**: `STATUS|SWITCH|<id>|<angle>|<timestamp>` (switch aleatório, ângulo 0 ou 180)
  - **Truck**: `STATUS|TRUCK|LOADED|<carga>`
- Simula respostas ACK ao receber comandos (500ms delay)

Útil para desenvolvimento sem hardware físico.

## Fluxo de Execução

```
1. Conecta ao Backend via Socket.IO
2. Emite "gateway:register" com API Key
3. Inicializa dispositivos Bluetooth (ou simulação)
4. Para cada dispositivo:
   - Tenta encontrar porta serial (rfcomm*)
   - Se encontrar: abre SerialPort, escuta dados
   - Se não encontrar: entra em modo simulação ou agenda reconexão
5. Heartbeat a cada 3s → emite "gateway:status"
6. Ao receber "command" do backend → envia para dispositivo via Serial
7. Ao receber dados do Arduino → emite "device:data" para backend
```

## Dispositivos

| Nome | MAC (padrão) | Tipo | Uso |
|------|-------------|------|-----|
| FERROVIA_SW | `98:D3:31:FD:15:F5` | ferrovia | 4 switches (servos) |
| TRUCK_T01 | `98:D3:31:FD:15:A1` | truck | Caminhão basculante |

## Protocolo Serial

### Enviado (Gateway → Arduino)

```
CMD|SWITCH|<id>|SET|LEFT       # Switch para esquerda
CMD|SWITCH|<id>|SET|RIGHT      # Switch para direita
CMD|SWITCH|<id>|SET|CENTER     # Switch para centro
CMD|SWITCH|<id>|ANGLE|<0-180>  # Switch para ângulo específico
CMD|SWITCH|<id>|STATUS         # Solicitar status
CMD|SWITCH|<id>|RESET          # Resetar para centro
```

### Recebido (Arduino → Gateway)

```
ACK|SWITCH|<id>|<estado>                       # Confirmação de comando
STATUS|SWITCH|<id>|<angulo>|<estado>|<ts>       # Status/heartbeat
ERR|<codigo_erro>                               # Erro
```

## Socket.IO Events

| Evento | Direção | Payload |
|--------|---------|---------|
| `gateway:register` | Enviado | `{ gatewayId, apiKey }` |
| `gateway:registered` | Recebido | `{ success }` |
| `command` | Recebido | `{ target, cmd, switchId, angle, action }` |
| `device:data` | Enviado | `{ gatewayId, deviceName, data, timestamp }` |
| `gateway:status` | Enviado | `{ gatewayId, devices[], timestamp }` |

## Reconexão

- Se um dispositivo Bluetooth desconecta, agenda reconexão após `RECONNECT_INTERVAL` (5s)
- Se o backend desconecta, Socket.IO reconecta automaticamente
- `process.on("SIGINT")` limpa todos os dispositivos e fecha conexões

## Configuração na Raspberry Pi

### Pareamento dos HC-05

```bash
# Habilitar Bluetooth
sudo bluetoothctl
  power on
  agent on
  default-agent
  scan on
  # Encontrar endereço MAC do HC-05
  pair XX:XX:XX:XX:XX:XX
  trust XX:XX:XX:XX:XX:XX
  connect XX:XX:XX:XX:XX:XX
  quit

# Criar porta serial
sudo rfcomm bind /dev/rfcomm0 XX:XX:XX:XX:XX:XX 1
```

### Permissões

```bash
# Adicionar usuário ao grupo dialout
sudo usermod -a -G dialout $USER
# Deslogar e logar novamente
```

### Executar como serviço (opcional)

```bash
# Criar arquivo /etc/systemd/system/gateway.service
[Unit]
Description=Maquete Gateway Bluetooth
After=network.target

[Service]
ExecStart=/usr/bin/node /caminho/para/gateway_bluetooth/index.js
WorkingDirectory=/caminho/para/gateway_bluetooth
Restart=always
User=pi
Environment=NODE_ENV=production

[Install]
WantedBy=multi-user.target
```
