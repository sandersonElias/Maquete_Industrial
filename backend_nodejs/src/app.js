const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const { v4: uuidv4 } = require("uuid");

const { CORS_ORIGIN } = require("./config");
const logger = require("./config/logger");

// Controllers
const healthController = require("./controllers/healthController");

// Criação da aplicação
const app = express();
const server = http.createServer(app);

// Socket.IO
const io = new Server(server, {
  cors: {
    origin: CORS_ORIGIN,
    methods: ["GET", "POST"],
    credentials: true,
  },
});

// Rotas (carregadas após criação do io)
const authRoutes = require("./routes/authRoutes");
const ferroviaRoutes = require("./routes/ferroviaRoutes")(io);
const trucksRoutes = require("./routes/trucksRoutes")(io);
const locomotiveRoutes = require("./routes/locomotiveRoutes")(io);
const { portRouter, airportRouter } = require("./routes/portAirportRoutes");
const chemistryRoutes = require("./routes/chemistryRoutes")(io);
const reportRoutes = require("./routes/reportRoutes")(io);
const gatewayRoutes = require("./routes/gatewayRoutes")(io);
const alertRoutes = require("./routes/alertRoutes")(io);
const adminRoutes = require("./routes/adminRoutes");

// =========================
// Middlewares
// =========================

app.use(
  helmet({
    crossOriginResourcePolicy: false,
  }),
);

app.use(
  cors({
    origin: CORS_ORIGIN,
    credentials: true,
  }),
);

app.use(express.json());

app.use(
  express.urlencoded({
    extended: true,
  }),
);

app.use(
  rateLimit({
    windowMs: 15 * 60 * 1000,
    max: process.env.NODE_ENV === 'production' ? 100 : 1000,
    standardHeaders: true,
    legacyHeaders: false,
  }),
);

// =========================
// Correlation ID + Logs
// =========================

app.use((req, res, next) => {
  const correlationId = req.headers["x-correlation-id"] || uuidv4();
  req.correlationId = correlationId;
  res.setHeader("X-Correlation-Id", correlationId);
  logger.info(`${req.method} ${req.originalUrl}`, { correlationId });
  next();
});

// =========================
// Health Check
// =========================

app.get("/api/health", healthController.getHealth);

// =========================
// API Routes
// =========================

app.use("/api/auth", rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
}), authRoutes);

app.use("/api/ferrovia", ferroviaRoutes);

app.use("/api/trucks", trucksRoutes);

app.use("/api/locomotive", locomotiveRoutes);

app.use("/api/port", portRouter);

app.use("/api/airport", airportRouter);

app.use("/api/chemistry", chemistryRoutes);

app.use("/api/reports", reportRoutes);

app.use("/api/gateway", gatewayRoutes);

app.use("/api/alerts", alertRoutes);

app.use("/api/admin", adminRoutes);

// =========================
// 404
// =========================

app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: "Endpoint não encontrado",
    path: req.originalUrl,
  });
});

// =========================
// Error Handler
// =========================

app.use((err, req, res, next) => {
  logger.error(err);

  res.status(err.status || 500).json({
    success: false,
    error: err.message || "Erro interno do servidor",
  });
});

// =========================
// Socket.IO (handlers em sockets/index.js via setupSockets)
// =========================

// =========================
// Exportações
// =========================

module.exports = {
  app,
  server,
  io,
};
