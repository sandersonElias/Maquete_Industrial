require("dotenv").config();

module.exports = {
  PORT: process.env.PORT || 4000,
  JWT_SECRET: process.env.JWT_SECRET || "fallback_secret",
  GATEWAY_API_KEY: process.env.GATEWAY_API_KEY || "default_key",
  CORS_ORIGIN: process.env.CORS_ORIGIN || "*",
  COMMAND_TIMEOUT_MS: parseInt(process.env.COMMAND_TIMEOUT_MS || "30000", 10),
  NODE_ENV: process.env.NODE_ENV || "development",
};
