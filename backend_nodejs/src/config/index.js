require("dotenv").config();

const isProduction = process.env.NODE_ENV === "production";

const requiredInProduction = ["JWT_SECRET", "GATEWAY_API_KEY", "DATABASE_URL"];
if (isProduction) {
  for (const key of requiredInProduction) {
    if (!process.env[key]) {
      throw new Error(`Variavel obrigatoria nao definida em producao: ${key}`);
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
  // Database - PostgreSQL (Render)
  DATABASE_URL: process.env.DATABASE_URL,
};
