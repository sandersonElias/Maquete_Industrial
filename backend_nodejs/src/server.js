const { app, server, io } = require("./app");
const { PORT, NODE_ENV } = require("./config");
const logger = require("./config/logger");
const pool = require("./config/db");
const redisClient = require("./config/redis");
const setupSockets = require("./sockets");
const setupJobs = require("./jobs");

// Inicializa Socket.IO
setupSockets(io);

// Inicializa jobs
const { markTimedOutCommands, simulateChemistry, simulatePort, simulateLocomotive } = setupJobs(io);
const jobsInterval = setInterval(markTimedOutCommands, 5000);
const chemistryInterval = setInterval(simulateChemistry, 10000); // A cada 10s
const portInterval = setInterval(simulatePort, 30000); // A cada 30s
const locomotiveInterval = setInterval(simulateLocomotive, 5000); // A cada 5s

// Teste das Conexoes
async function testConnections() {
  try {
    await pool.query("SELECT NOW()");
    logger.info("PostgreSQL conectado");
  } catch (e) {
    logger.error(`PostgreSQL ERRO: ${e.message}`);
  }

  if (redisClient) {
    try {
      await redisClient.ping();
      logger.info("Redis conectado");
    } catch (e) {
      logger.error(`Redis ERRO: ${e.message}`);
    }
  } else {
    logger.info("Redis: modo sem cache (nao configurado)");
  }
}

testConnections();

// Graceful Shutdown
async function gracefulShutdown(signal) {
  logger.info(`${signal} recebido. Encerrando servidor...`);

  clearInterval(jobsInterval);
  clearInterval(chemistryInterval);
  clearInterval(portInterval);
  clearInterval(locomotiveInterval);

  server.close(() => {
    logger.info("Servidor HTTP encerrado");
  });

  io.close(() => {
    logger.info("Socket.IO encerrado");
  });

  try {
    await pool.end();
    logger.info("PostgreSQL pool encerrado");
  } catch (e) {
    logger.error("Erro ao encerrar PostgreSQL:", e);
  }

  if (redisClient) {
    try {
      await redisClient.quit();
      logger.info("Redis encerrado");
    } catch (e) {
      logger.error("Erro ao encerrar Redis:", e);
    }
  }

  process.exit(0);
}

process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
process.on("SIGINT", () => gracefulShutdown("SIGINT"));

// Inicializacao do Servidor
server.listen(PORT, () => {
  logger.info("========================================");
  logger.info(`  SERVIDOR MAQUETE INDUSTRIAL`);
  logger.info(`  Porta: ${PORT}`);
  logger.info(`  Ambiente: ${NODE_ENV}`);
  logger.info("========================================");
});
