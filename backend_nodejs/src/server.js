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
const { markTimedOutCommands } = setupJobs(io);
const jobsInterval = setInterval(markTimedOutCommands, 5000);

// Teste das Conexões
async function testConnections() {
  try {
    await pool.query("SELECT NOW()");
    logger.info("PostgreSQL conectado");
  } catch (e) {
    logger.error(`PostgreSQL ERRO: ${e.message}`);
  }

  try {
    await redisClient.ping();
    logger.info("Redis conectado");
  } catch (e) {
    logger.error(`Redis ERRO: ${e.message}`);
  }
}

testConnections();

// Graceful Shutdown
async function gracefulShutdown(signal) {
  logger.info(`${signal} recebido. Encerrando servidor...`);

  clearInterval(jobsInterval);

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

  try {
    await redisClient.quit();
    logger.info("Redis encerrado");
  } catch (e) {
    logger.error("Erro ao encerrar Redis:", e);
  }

  process.exit(0);
}

process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
process.on("SIGINT", () => gracefulShutdown("SIGINT"));

// Inicialização do Servidor
server.listen(PORT, () => {
  logger.info("========================================");
  logger.info(`  SERVIDOR MAQUETE INDUSTRIAL`);
  logger.info(`  Porta: ${PORT}`);
  logger.info(`  Ambiente: ${NODE_ENV}`);
  logger.info("========================================");
});
