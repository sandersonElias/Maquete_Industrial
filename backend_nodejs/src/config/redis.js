const redis = require("redis");
const logger = require("./logger");

let redisClient = null;

// Redis e opcional - so conectar se REDIS_URL estiver configurado
if (process.env.REDIS_URL) {
  redisClient = redis.createClient({
    url: process.env.REDIS_URL,
  });

  redisClient.on("error", (err) => {
    logger.error("Erro na conexao Redis:", err);
  });

  redisClient.connect().catch((err) => {
    logger.warn("Nao foi possivel conectar ao Redis:", err.message);
  });
} else {
  logger.info("Redis nao configurado (REDIS_URL nao definido). Modo sem cache.");
}

module.exports = redisClient;
