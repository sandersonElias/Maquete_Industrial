# Gateway Bluetooth

Bridge between Node.js backend and Arduino devices via Bluetooth (HC-05). Designed to run on Raspberry Pi.

## Stack

- Node.js
- SerialPort 12 (serial communication)
- Socket.IO Client 4.8 (backend connection)
- Axios (HTTP notifications)
- Winston (logging)

## Structure

```
gateway_bluetooth/
├── index.js              # Entry point (initialization + graceful shutdown)
├── config.js             # Configuration + Winston logger
├── socket.js             # Socket.IO connection with backend
├── health.js             # HTTP health check server
├── protocol/
│   ├── index.js          # Protocol exports
│   ├── serial.js         # Command encoding (switch + truck)
│   └── parse.js          # Incoming data parsing
├── devices/
│   ├── index.js          # DeviceManager (device registry + lifecycle)
│   ├── base.js           # BluetoothDeviceBase (serial connection + simulation)
│   ├── ferrovia.js       # FerroviaDevice (4 servo switches)
│   └── truck.js          # TruckDevice (dump truck)
├── simulation/
│   ├── index.js          # SimulationManager (mock orchestrator)
│   ├── ferrovia.js       # Ferrovia mock factory
│   └── truck.js          # Truck mock factory
├── .env                  # Configuration (copy from .env.example)
├── .env.example          # Configuration template
├── gateway.log           # Runtime log
└── package.json
```

## Commands

```bash
npm install    # Install dependencies
npm start      # Run gateway
npm run dev    # Development (nodemon)
```

## Environment Variables

```env
# Backend Connection
BACKEND_WS_URL=http://localhost:4000
BACKEND_API_URL=http://localhost:4000/api
GATEWAY_API_KEY=your_api_key
GATEWAY_ID=gateway-rpi-01

# Bluetooth Devices (MAC addresses of HC-05)
BT_DEVICE_FERROVIA=98:D3:31:FD:15:F5
BT_DEVICE_TRUCK01=98:D3:31:FD:15:A1

# Serial Configuration
SERIAL_BAUD=9600
RECONNECT_INTERVAL=5000
HEARTBEAT_INTERVAL=3000

# Simulation Mode (true = no hardware)
SIMULATION_MODE=true

# Health Check
HEALTH_PORT=3001

# Simulation Intervals (ms)
SIM_FERROVIA_INTERVAL=10000
SIM_TRUCK_INTERVAL=2000

# Device List (JSON array, optional — uses defaults if not set)
# DEVICES=[{"name":"FERROVIA_SW","mac":"98:D3:31:FD:15:F5","type":"ferrovia"},{"name":"TRUCK_T01","mac":"98:D3:31:FD:15:A1","type":"truck"}]

LOG_LEVEL=info
```

## Simulation Mode

When `SIMULATION_MODE=true`, the gateway:

- Does not attempt to find serial ports
- Creates virtual devices
- Generates mock data at configured intervals:
  - **Ferrovia**: `STATUS|SWITCH|<id>|<angle>|<state>|<ts>` (random switch, angle 0-180)
  - **Truck**: `STATUS|TRUCK|POS|x|y|LOAD|load|BAT|bat|TS|ts`
- Simulates ACK responses to commands (500ms delay)

Useful for development without physical hardware.

## Health Check

GET `/health` returns JSON with gateway status:

```json
{
  "gateway": "gateway-rpi-01",
  "uptime": 12345.67,
  "simulationMode": true,
  "devices": [
    {
      "name": "FERROVIA_SW",
      "connected": true,
      "lastSeen": 1699999999999,
      "simulated": true
    }
  ]
}
```

## Serial Protocol

### Ferrovia Commands (Gateway → Arduino)

```
CMD|SWITCH|<id>|SET|LEFT       # Switch to left
CMD|SWITCH|<id>|SET|RIGHT      # Switch to right
CMD|SWITCH|<id>|SET|CENTER     # Switch to center
CMD|SWITCH|<id>|ANGLE|<0-180>  # Switch to specific angle
CMD|SWITCH|<id>|STATUS         # Request status
CMD|SWITCH|<id>|RESET          # Reset to center
```

### Ferrovia Responses (Arduino → Gateway)

```
ACK|SWITCH|<id>|<state>                       # Command confirmation
STATUS|SWITCH|<id>|<angle>|<state>|<ts>       # Status/heartbeat
ERR|<code>                                     # Error
```

### Truck Commands (Single-char)

```
F  # Forward
B  # Backward
S  # Stop
L  # Left
R  # Right
C  # Center
U  # Up (raise bed)
D  # Down (lower bed)
X  # Dump
```

### Truck Responses

```
ACK|TRUCK|<action>|OK    # Command confirmation
STATUS|TRUCK|POS|x|y|LOAD|load|BAT|bat|TS|ts  # Status
```

## Socket.IO Events

| Event | Direction | Payload |
|-------|-----------|---------|
| `gateway:register` | Sent | `{ gatewayId, apiKey }` |
| `gateway:registered` | Received | `{ success }` |
| `command` | Received | `{ target, cmd, switchId, angle, action }` |
| `device:data` | Sent | `{ gatewayId, deviceName, data, timestamp }` |
| `gateway:status` | Sent | `{ gatewayId, devices[], timestamp }` |

## Execution Flow

```
1. Connect to Backend via Socket.IO
2. Emit "gateway:register" with API Key
3. Initialize Bluetooth devices (or simulation)
4. For each device:
   - Find serial port (rfcomm*)
   - If found: open SerialPort, listen for data
   - If not found: enter simulation mode or schedule reconnect
5. Start health check server on HEALTH_PORT
6. Heartbeat every 3s → emit "gateway:status"
7. On receiving "command" from backend → send to device via Serial
8. On receiving data from Arduino → emit "device:data" to backend
```

## Devices

| Name | MAC (default) | Type | Use |
|------|---------------|------|-----|
| FERROVIA_SW | `98:D3:31:FD:15:F5` | ferrovia | 4 switches (servos) |
| TRUCK_T01 | `98:D3:31:FD:15:A1` | truck | Dump truck |

## Reconnection

- If a Bluetooth device disconnects, schedules reconnect after `RECONNECT_INTERVAL` (5s)
- If backend disconnects, Socket.IO reconnects automatically
- `process.on("SIGINT")` cleans up all devices and closes connections

## Raspberry Pi Setup

### Pairing HC-05

```bash
# Enable Bluetooth
sudo bluetoothctl
  power on
  agent on
  default-agent
  scan on
  # Find HC-05 MAC address
  pair XX:XX:XX:XX:XX:XX
  trust XX:XX:XX:XX:XX:XX
  connect XX:XX:XX:XX:XX:XX
  quit

# Create serial port
sudo rfcomm bind /dev/rfcomm0 XX:XX:XX:XX:XX:XX 1
```

### Permissions

```bash
# Add user to dialout group
sudo usermod -a -G dialout $USER
# Logout and login again
```

### Run as Service (optional)

```bash
# Create file /etc/systemd/system/gateway.service
[Unit]
Description=Maquete Gateway Bluetooth
After=network.target

[Service]
ExecStart=/usr/bin/node /path/to/gateway_bluetooth/index.js
WorkingDirectory=/path/to/gateway_bluetooth
Restart=always
User=pi
Environment=NODE_ENV=production

[Install]
WantedBy=multi-user.target
```