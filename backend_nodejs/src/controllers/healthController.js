const pool = require("../config/db");
const redisClient = require("../config/redis");
const { PORT } = require("../config");

async function getHealth(req, res) {
  const health = {
    status: "ok",
    port: Number(PORT),
    postgres: false,
    redis: redisClient.isOpen,
    timestamp: new Date().toISOString(),
  };

  try {
    await pool.query("SELECT 1");
    health.postgres = true;
  } catch (e) {
    health.status = "degraded";
    health.postgresError = e.message;
  }

  try {
    if (redisClient.isOpen) await redisClient.ping();
  } catch (e) {
    health.status = "degraded";
    health.redis = false;
    health.redisError = e.message;
  }

  res.status(health.status === "ok" ? 200 : 503).json(health);
}

module.exports = {
  getHealth,
};
