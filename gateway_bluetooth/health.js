const http = require("http");
const { CONFIG, logger } = require("./config");

function startHealthServer(deviceManager) {
  const server = http.createServer((req, res) => {
    if (req.url === "/health" && req.method === "GET") {
      const devices = deviceManager.getAll().map((d) => ({
        name: d.name,
        connected: d.connected,
        lastSeen: d.lastSeen,
        simulated: CONFIG.simulationMode && !d.port,
      }));

      const health = {
        gateway: CONFIG.gatewayId,
        uptime: process.uptime(),
        simulationMode: CONFIG.simulationMode,
        devices,
      };

      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify(health, null, 2));
    } else {
      res.writeHead(404);
      res.end("Not found");
    }
  });

  server.on("error", (err) => {
    if (err.code === "EADDRINUSE") {
      logger.error(`Porta ${CONFIG.healthPort} em uso. Health check indisponivel.`);
    } else {
      logger.error(`Erro no health server: ${err.message}`);
    }
  });

  server.listen(CONFIG.healthPort, () => {
    logger.info(`Health check em http://localhost:${CONFIG.healthPort}/health`);
  });

  return server;
}

module.exports = { startHealthServer };
