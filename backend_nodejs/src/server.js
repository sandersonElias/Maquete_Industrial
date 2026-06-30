const { app, server, io } = require("./app");
const { PORT } = require("./config");
const logger = require("./config/logger");
const pool = require("./config/db");
const redisClient = require("./config/redis");
const setupSockets = require("./sockets");
const setupJobs = require("./jobs");

// Inicializa Socket.IO
setupSockets(io);

// Inicializa jobs
const { markTimedOutCommands } = setupJobs(io);
setInterval(markTimedOutCommands, 5000);

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

// Inicialização do Servidor
server.listen(PORT, () => {
  logger.info("========================================");
  logger.info(`  SERVIDOR MAQUETE INDUSTRIAL`);
  logger.info(`  Porta: ${PORT}`);
  logger.info("========================================");
});
