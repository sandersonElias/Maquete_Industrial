require("dotenv").config();

const defaultDevices = [
  { name: "FERROVIA_SW", mac: process.env.BT_DEVICE_FERROVIA || "98:D3:31:FD:15:F5", type: "ferrovia" },
  { name: "TRUCK_T01", mac: process.env.BT_DEVICE_TRUCK01 || "98:D3:31:FD:15:A1", type: "truck" },
];

let devices = defaultDevices;
try {
  if (process.env.DEVICES) {
    devices = JSON.parse(process.env.DEVICES);
  }
} catch (e) {
  console.warn("DEVICES env var invalid, using defaults");
}

const CONFIG = {
  backendWsUrl: process.env.BACKEND_WS_URL || "http://localhost:4000",
  backendApiUrl: process.env.BACKEND_API_URL || "http://localhost:4000/api",
  apiKey: process.env.GATEWAY_API_KEY || "default_key",
  gatewayId: process.env.GATEWAY_ID || "gateway-rpi-01",
  reconnectInterval: parseInt(process.env.RECONNECT_INTERVAL, 10) || 5000,
  heartbeatInterval: parseInt(process.env.HEARTBEAT_INTERVAL, 10) || 3000,
  serialBaud: parseInt(process.env.SERIAL_BAUD, 10) || 9600,
  simulationMode: process.env.SIMULATION_MODE === "true",
  healthPort: parseInt(process.env.HEALTH_PORT, 10) || 3001,
  devices,
  simulation: {
    ferroviaInterval: parseInt(process.env.SIM_FERROVIA_INTERVAL, 10) || 10000,
    truckInterval: parseInt(process.env.SIM_TRUCK_INTERVAL, 10) || 2000,
  },
};

const winston = require("winston");

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || "info",
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.printf(({ level, message, timestamp }) => {
      return `[${timestamp}] ${level.toUpperCase()}: ${message}`;
    }),
  ),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: "gateway.log" }),
  ],
});

module.exports = { CONFIG, logger };
