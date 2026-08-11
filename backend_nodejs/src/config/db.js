const { Pool } = require("pg");
const logger = require("./logger");

const useSSL = process.env.DATABASE_URL && !process.env.DATABASE_URL.includes("localhost");

const pool = new Pool(
  process.env.DATABASE_URL
    ? {
        connectionString: process.env.DATABASE_URL,
        ...(useSSL ? { ssl: { rejectUnauthorized: false } } : {}),
        max: parseInt(process.env.DB_POOL_MAX || "20", 10),
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 30000,
      }
    : {
        host: process.env.DB_HOST,
        port: process.env.DB_PORT,
        database: process.env.DB_NAME,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        max: parseInt(process.env.DB_POOL_MAX || "20", 10),
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 15000,
      }
);

pool.on("error", (err) => {
  logger.error("Erro inesperado em client idle do PostgreSQL:", err);
});

module.exports = pool;
