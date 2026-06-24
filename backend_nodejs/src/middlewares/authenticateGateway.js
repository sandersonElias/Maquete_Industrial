const { GATEWAY_API_KEY } = require("../config");

function authenticateGateway(req, res, next) {
  const apiKey = req.headers["x-api-key"];
  if (apiKey !== GATEWAY_API_KEY) {
    return res.status(403).json({ error: "API Key inválida" });
  }
  next();
}

module.exports = authenticateGateway;
