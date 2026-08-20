const crypto = require("crypto");
const { GATEWAY_API_KEY } = require("../config");

function safeCompare(a, b) {
  if (!a || !b) return false;
  const bufA = Buffer.from(a, "utf8");
  const bufB = Buffer.from(b, "utf8");
  if (bufA.length !== bufB.length) return false;
  return crypto.timingSafeEqual(bufA, bufB);
}

function authenticateGateway(req, res, next) {
  const apiKey = req.headers["x-api-key"];
  if (!safeCompare(apiKey, GATEWAY_API_KEY)) {
    return res.status(403).json({ error: "API Key inválida" });
  }
  next();
}

module.exports = authenticateGateway;
