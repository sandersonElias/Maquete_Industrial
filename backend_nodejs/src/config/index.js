require("dotenv").config();

const isProduction = process.env.NODE_ENV === "production";

const requiredInProduction = ["JWT_SECRET", "GATEWAY_API_KEY", "DB_HOST", "DB_NAME", "DB_USER", "DB_PASSWORD"];
if (isProduction) {
  for (const key of requiredInProduction) {
    if (!process.env[key]) {
      throw new Error(`Variável obrigatória não definida em produção: ${key}`);
    }
  }
}

module.exports = {
  PORT: parseInt(process.env.PORT || "4000", 10),
  JWT_SECRET: process.env.JWT_SECRET || (isProduction ? null : "fallback_secret_dev_only"),
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || "24h",
  GATEWAY_API_KEY: process.env.GATEWAY_API_KEY || (isProduction ? null : "default_key"),
  CORS_ORIGIN: process.env.CORS_ORIGIN || (isProduction ? "" : "*"),
  COMMAND_TIMEOUT_MS: parseInt(process.env.COMMAND_TIMEOUT_MS || "30000", 10),
  NODE_ENV: process.env.NODE_ENV || "development",
  DB_HOST: process.env.DB_HOST,
  DB_PORT: process.env.DB_PORT,
  DB_NAME: process.env.DB_NAME,
  DB_USER: process.env.DB_USER,
  DB_PASSWORD: process.env.DB_PASSWORD,
  REDIS_URL: process.env.REDIS_URL || "redis://localhost:6379",
};
