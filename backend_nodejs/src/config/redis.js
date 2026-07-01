const redis = require("redis");
const logger = require("./logger");

const redisClient = redis.createClient({
  url: process.env.REDIS_URL || "redis://localhost:6379",
});

redisClient.on("error", (err) => {
  logger.error("Erro na conexão Redis:", err);
});

redisClient.connect().catch((err) => {
  logger.warn("Não foi possível conectar ao Redis:", err.message);
});

module.exports = redisClient;
