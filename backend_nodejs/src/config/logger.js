const winston = require("winston");

const isProduction = process.env.NODE_ENV === "production";

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || "info",
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json(),
  ),
  transports: [
    new winston.transports.Console(),
    ...(!isProduction ? [new winston.transports.File({ filename: "server.log" })] : []),
  ],
});

module.exports = logger;
