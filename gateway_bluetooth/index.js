// gateway_bluetooth/index.js

const { CONFIG, logger } = require("./config");
const { DeviceManager } = require("./devices");
const { SimulationManager } = require("./simulation");
const { connectToBackend, sendGatewayStatus, notifyBackend } = require("./socket");
const { startHealthServer } = require("./health");

logger.info("========================================");
logger.info(" GATEWAY BLUETOOTH - Maquete Industrial");
logger.info(` ID: ${CONFIG.gatewayId}`);
logger.info(` MODO SIMULACAO: ${CONFIG.simulationMode}`);
logger.info(` DEVICES: ${CONFIG.devices.length}`);
logger.info("========================================");

let wsClient = null;

const onDataEvent = (event, data) => {
  if (event === "device:parsed" && wsClient && wsClient.connected) {
    wsClient.emit("device:data", {
      gatewayId: CONFIG.gatewayId,
      deviceName: data.deviceName,
      data: data.parsed,
      timestamp: Date.now(),
    });
  }
  if (event === "device:connected") {
    notifyBackend(event, data);
  }
};

const deviceManager = new DeviceManager(onDataEvent);
deviceManager.init();

if (CONFIG.simulationMode) {
  const simManager = new SimulationManager(deviceManager);
  simManager.startAll();
}

wsClient = connectToBackend(deviceManager);
startHealthServer(deviceManager);

setInterval(() => {
  sendGatewayStatus(wsClient, deviceManager);
}, CONFIG.heartbeatInterval);

process.on("SIGINT", () => {
  logger.info("Encerrando gateway...");
  deviceManager.disconnectAll();
  if (wsClient) wsClient.close();
  process.exit(0);
});
