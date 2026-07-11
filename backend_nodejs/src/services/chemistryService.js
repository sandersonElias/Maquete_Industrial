const pool = require("../config/db");
const logger = require("../config/logger");

// Listar todos os equipamentos
async function listEquipment() {
  const result = await pool.query(
    "SELECT * FROM chemistry_equipment ORDER BY id"
  );
  return result.rows;
}

// Buscar equipamento por ID
async function getEquipmentById(id) {
  const result = await pool.query(
    "SELECT * FROM chemistry_equipment WHERE id = $1",
    [id]
  );
  return result.rows[0] || null;
}

// Criar equipamento
async function createEquipment(data) {
  const { id, name, type, min_temperature, max_temperature, min_humidity, max_humidity, min_level, max_level } = data;
  const result = await pool.query(
    `INSERT INTO chemistry_equipment (id, name, type, min_temperature, max_temperature, min_humidity, max_humidity, min_level, max_level)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *`,
    [id, name, type, min_temperature || 10, max_temperature || 50, min_humidity || 20, max_humidity || 80, min_level || 10, max_level || 95]
  );
  return result.rows[0];
}

// Atualizar equipamento
async function updateEquipment(id, data) {
  const { name, type, status, min_temperature, max_temperature, min_humidity, max_humidity, min_level, max_level } = data;
  const result = await pool.query(
    `UPDATE chemistry_equipment SET 
      name = COALESCE($2, name),
      type = COALESCE($3, type),
      status = COALESCE($4, status),
      min_temperature = COALESCE($5, min_temperature),
      max_temperature = COALESCE($6, max_temperature),
      min_humidity = COALESCE($7, min_humidity),
      max_humidity = COALESCE($8, max_humidity),
      min_level = COALESCE($9, min_level),
      max_level = COALESCE($10, max_level),
      updated_at = NOW()
     WHERE id = $1 RETURNING *`,
    [id, name, type, status, min_temperature, max_temperature, min_humidity, max_humidity, min_level, max_level]
  );
  return result.rows[0] || null;
}

// Deletar equipamento
async function deleteEquipment(id) {
  const result = await pool.query(
    "DELETE FROM chemistry_equipment WHERE id = $1 RETURNING id",
    [id]
  );
  return result.rows[0] || null;
}

// Registrar medição
async function addReading(equipmentId, data) {
  const { temperature, humidity, level, pressure, ph } = data;
  const result = await pool.query(
    `INSERT INTO chemistry_readings (equipment_id, temperature, humidity, level, pressure, ph)
     VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
    [equipmentId, temperature, humidity, level, pressure, ph]
  );

  // Atualizar valores atuais no equipamento
  await pool.query(
    `UPDATE chemistry_equipment SET 
      temperature = $2, humidity = $3, level = $4, 
      pressure = COALESCE($5, pressure), ph = COALESCE($6, ph),
      updated_at = NOW()
     WHERE id = $1`,
    [equipmentId, temperature, humidity, level, pressure, ph]
  );

  return result.rows[0];
}

// Buscar histórico de medições
async function getReadings(equipmentId, limit = 50) {
  const result = await pool.query(
    `SELECT * FROM chemistry_readings 
     WHERE equipment_id = $1 
     ORDER BY timestamp DESC 
     LIMIT $2`,
    [equipmentId, limit]
  );
  return result.rows;
}

// Verificar thresholds e gerar status
async function checkThresholds() {
  const equipment = await listEquipment();
  const alerts = [];

  for (const eq of equipment) {
    let newStatus = "online";
    const reasons = [];

    if (eq.temperature > eq.max_temperature) {
      newStatus = "warning";
      reasons.push(`temperatura ${eq.temperature}°C > max ${eq.max_temperature}°C`);
    } else if (eq.temperature < eq.min_temperature) {
      newStatus = "warning";
      reasons.push(`temperatura ${eq.temperature}°C < min ${eq.min_temperature}°C`);
    }

    if (eq.humidity > eq.max_humidity) {
      newStatus = "warning";
      reasons.push(`umidade ${eq.humidity}% > max ${eq.max_humidity}%`);
    } else if (eq.humidity < eq.min_humidity) {
      newStatus = "warning";
      reasons.push(`umidade ${eq.humidity}% < min ${eq.min_humidity}%`);
    }

    if (eq.level > eq.max_level) {
      newStatus = "warning";
      reasons.push(`nivel ${eq.level}% > max ${eq.max_level}%`);
    } else if (eq.level < eq.min_level) {
      newStatus = "warning";
      reasons.push(`nivel ${eq.level}% < min ${eq.min_level}%`);
    }

    if (newStatus !== eq.status) {
      await pool.query(
        "UPDATE chemistry_equipment SET status = $2, updated_at = NOW() WHERE id = $1",
        [eq.id, newStatus]
      );
    }

    if (reasons.length > 0) {
      alerts.push({
        equipmentId: eq.id,
        equipmentName: eq.name,
        severity: "warning",
        reasons,
      });
    }
  }

  return alerts;
}

// Simular leituras (oscilação realista)
async function simulateReadings() {
  const equipment = await listEquipment();
  const updates = [];

  for (const eq of equipment) {
    // Oscilação baseada nos limites
    const tempRange = eq.max_temperature - eq.min_temperature;
    const humRange = eq.max_humidity - eq.min_humidity;
    const levelRange = eq.max_level - eq.min_level;

    // Variação aleatória pequena
    const tempDelta = (Math.random() - 0.5) * (tempRange * 0.05);
    const humDelta = (Math.random() - 0.5) * (humRange * 0.05);
    const levelDelta = (Math.random() - 0.5) * (levelRange * 0.02);

    const newTemp = Math.round((eq.temperature + tempDelta) * 10) / 10;
    const newHum = Math.round((eq.humidity + humDelta) * 10) / 10;
    const newLevel = Math.round(Math.min(100, Math.max(0, eq.level + levelDelta)) * 10) / 10;

    // Registrar leitura
    await addReading(eq.id, {
      temperature: newTemp,
      humidity: newHum,
      level: newLevel,
      pressure: eq.pressure,
      ph: eq.ph,
    });

    updates.push({
      id: eq.id,
      name: eq.name,
      temperature: newTemp,
      humidity: newHum,
      level: newLevel,
    });
  }

  return updates;
}

module.exports = {
  listEquipment,
  getEquipmentById,
  createEquipment,
  updateEquipment,
  deleteEquipment,
  addReading,
  getReadings,
  checkThresholds,
  simulateReadings,
};
