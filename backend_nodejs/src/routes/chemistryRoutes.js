const express = require("express");
const pool = require("../config/db");
const logger = require("../config/logger");

const router = express.Router();

// GET /api/chemistry/equipment - Listar equipamentos de quimica
router.get("/equipment", async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT * FROM chemistry_equipment ORDER BY id"
    );
    res.json(result.rows);
  } catch (e) {
    // Tabela pode nao existir ainda - retornar dados de exemplo
    logger.warn(`Tabela chemistry_equipment pode nao existir: ${e.message}`);
    res.json([
      { id: "CHEM-001", name: "Tanque Alpha", status: "online", temperature: 25.4, humidity: 45, level: 78 },
      { id: "CHEM-002", name: "Reator Beta", status: "online", temperature: 42.1, humidity: 38, level: 62 },
      { id: "CHEM-003", name: "Misturador Gamma", status: "warning", temperature: 31.8, humidity: 52, level: 91 },
      { id: "CHEM-004", name: "Resfriador Delta", status: "online", temperature: 8.2, humidity: 85, level: 45 },
    ]);
  }
});

module.exports = router;
