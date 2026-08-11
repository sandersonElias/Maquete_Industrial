const pool = require("../config/db");
const logger = require("../config/logger");

// Registrar posição da locomotiva
async function recordLocomotivePosition(x, y, speed, heading, trackSegment) {
  await pool.query(
    `INSERT INTO locomotive_position (x, y, speed, heading, track_segment) VALUES ($1, $2, $3, $4, $5)`,
    [x, y, speed, heading, trackSegment],
  );
  return { x, y, speed, heading, trackSegment };
}

// Buscar última posição
async function getLatestPosition() {
  const result = await pool.query(
    "SELECT * FROM locomotive_position ORDER BY timestamp DESC LIMIT 1"
  );
  return result.rows[0] || null;
}

// Buscar histórico de posições
async function getPositionHistory(limit = 50) {
  const result = await pool.query(
    "SELECT * FROM locomotive_position ORDER BY timestamp DESC LIMIT $1",
    [limit]
  );
  return result.rows;
}

// Simular movimentação da locomotiva
const trackPoints = [
  { x: 0, y: 0, segment: "Patio Sul" },
  { x: 50, y: 0, segment: "Trilho Principal" },
  { x: 100, y: 10, segment: "Curva Leste" },
  { x: 150, y: 20, segment: "Trilho Norte" },
  { x: 150, y: 60, segment: "Subida" },
  { x: 120, y: 80, segment: "Desvio Oeste" },
  { x: 80, y: 80, segment: "Patio Norte" },
  { x: 40, y: 60, segment: "Descida" },
  { x: 0, y: 40, segment: "Retorno Sul" },
];

let currentPositionIndex = 0;
let targetPositionIndex = 1;
let currentX = 0;
let currentY = 0;
let currentSpeed = 0;
let currentHeading = 0;

async function simulateLocomotive() {
  try {
    const target = trackPoints[targetPositionIndex];
    const dx = target.x - currentX;
    const dy = target.y - currentY;
    const distance = Math.sqrt(dx * dx + dy * dy);

    if (distance < 5) {
      // Chegou ao ponto, avançar para o próximo
      currentPositionIndex = targetPositionIndex;
      targetPositionIndex = (targetPositionIndex + 1) % trackPoints.length;
      currentSpeed = 0;
    } else {
      // Mover em direção ao alvo
      const speed = 5 + Math.random() * 5; // 5-10 unidades por ciclo
      const ratio = Math.min(speed / distance, 1);
      currentX = Math.round((currentX + dx * ratio) * 10) / 10;
      currentY = Math.round((currentY + dy * ratio) * 10) / 10;
      currentSpeed = Math.round(speed * 10) / 10;
      currentHeading = Math.round(Math.atan2(dy, dx) * (180 / Math.PI) * 10) / 10;
    }

    const segment = trackPoints[currentPositionIndex].segment;

    // Salvar no banco
    await recordLocomotivePosition(currentX, currentY, currentSpeed, currentHeading, segment);

    return {
      x: currentX,
      y: currentY,
      speed: currentSpeed,
      heading: currentHeading,
      trackSegment: segment,
    };
  } catch (e) {
    logger.error(`Erro na simulacao da locomotiva: ${e.message}`);
    return null;
  }
}

module.exports = {
  recordLocomotivePosition,
  getLatestPosition,
  getPositionHistory,
  simulateLocomotive,
};
