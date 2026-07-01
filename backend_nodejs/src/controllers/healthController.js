const pool = require("../config/db");
const redisClient = require("../config/redis");
const { PORT, NODE_ENV } = require("../config");
const pkg = require("../../package.json");

async function getHealth(req, res) {
  const health = {
    status: "ok",
    version: pkg.version,
    environment: NODE_ENV,
    uptime: Math.floor(process.uptime()),
    port: Number(PORT),
    services: {
      postgres: { status: "unknown" },
      redis: { status: redisClient.isOpen ? "connected" : "disconnected" },
    },
    timestamp: new Date().toISOString(),
  };

  try {
    await pool.query("SELECT 1");
    health.services.postgres.status = "connected";
  } catch (e) {
    health.status = "degraded";
    health.services.postgres.status = "error";
    health.services.postgres.error = e.message;
  }

  try {
    if (redisClient.isOpen) {
      await redisClient.ping();
      health.services.redis.status = "connected";
    }
  } catch (e) {
    health.status = "degraded";
    health.services.redis.status = "error";
    health.services.redis.error = e.message;
  }

  res.status(health.status === "ok" ? 200 : 503).json(health);
}

module.exports = {
  getHealth,
};
