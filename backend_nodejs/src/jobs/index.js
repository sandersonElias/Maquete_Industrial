const logger = require("../config/logger");
const ferroviaService = require("../services/ferroviaService");
const trucksService = require("../services/trucksService");
const chemistryService = require("../services/chemistryService");
const locomotiveService = require("../services/locomotiveService");
const { delRedisKey } = require("../services/redisService");

module.exports = (io) => {
  // Verificar timeouts de comandos
  async function markTimedOutCommands() {
    try {
      const timedOutSwitches = await ferroviaService.markTimedOutCommands();
      for (const command of timedOutSwitches) {
        await delRedisKey(`switch:${command.switch_id}:pending`);
        io.to("dashboard").emit("switch:command-timeout", {
          commandId: command.id,
          switchId: command.switch_id,
          timestamp: Date.now(),
        });
      }

      await trucksService.markTimedOutTruckCommands();
    } catch (e) {
      logger.error(`Erro verificando timeouts: ${e.message}`);
    }
  }

  // Simular leituras de quimica
  async function simulateChemistry() {
    try {
      const updates = await chemistryService.simulateReadings();
      const alerts = await chemistryService.checkThresholds();

      // Enviar atualizacoes para o dashboard
      io.to("dashboard").emit("chemistry:update", {
        equipment: updates,
        timestamp: Date.now(),
      });

      // Enviar alertas se houver
      for (const alert of alerts) {
        io.to("dashboard").emit("alert:new", {
          severity: alert.severity,
          module: "quimica",
          message: `${alert.equipmentName}: ${alert.reasons.join(", ")}`,
          equipmentId: alert.equipmentId,
          timestamp: Date.now(),
        });
      }
    } catch (e) {
      logger.error(`Erro na simulacao de quimica: ${e.message}`);
    }
  }

  // Simular movimentacao de navios
  async function simulatePort() {
    try {
      const pool = require("../config/db");
      const result = await pool.query("SELECT * FROM ships WHERE status != 'departed'");
      const ships = result.rows;

      const statusFlow = {
        arriving: "docked",
        docked: "loading",
        loading: "unloading",
        unloading: "departed",
      };

      for (const ship of ships) {
        // 20% de chance de mudar de status a cada ciclo
        if (Math.random() < 0.2) {
          const newStatus = statusFlow[ship.status] || ship.status;
          await pool.query(
            "UPDATE ships SET status = $2 WHERE id = $1",
            [ship.id, newStatus]
          );

          io.to("dashboard").emit("port:ship_update", {
            shipId: ship.id,
            status: newStatus,
            timestamp: Date.now(),
          });
        }
      }

      // Criar novos navios ocasionalmente
      if (Math.random() < 0.05 && ships.length < 8) {
        const allShips = await pool.query("SELECT id FROM ships");
        const maxNum = allShips.rows.reduce((max, r) => {
          const n = parseInt(r.id.replace("SHIP-", ""), 10);
          return n > max ? n : max;
        }, 0);
        const shipId = `SHIP-${String(maxNum + 1).padStart(3, "0")}`;
        const cargoTypes = ["Minério de Ferro", "Soja", "Petroleo", "Containeres", "Acucar"];
        const cargoType = cargoTypes[Math.floor(Math.random() * cargoTypes.length)];
        const cargoWeight = Math.floor(Math.random() * 20000) + 5000;

        await pool.query(
          `INSERT INTO ships (id, name, cargo_type, cargo_weight, eta, dock_number) 
           VALUES ($1, $2, $3, $4, NOW() + INTERVAL '1 hour', $5)`,
          [shipId, `Navio ${shipId}`, cargoType, cargoWeight, (ships.length % 4) + 1]
        );
      }
    } catch (e) {
      logger.error(`Erro na simulacao do porto: ${e.message}`);
    }
  }

  // Simular movimentacao de avioes
  async function simulateAirport() {
    try {
      const pool = require("../config/db");
      const result = await pool.query("SELECT * FROM airplanes WHERE status != 'in_air'");
      const airplanes = result.rows;

      const statusFlow = {
        arriving: "landed",
        landed: "boarding",
        boarding: "departing",
        departing: "in_air",
      };

      for (const plane of airplanes) {
        if (Math.random() < 0.2) {
          const newStatus = statusFlow[plane.status] || plane.status;
          await pool.query(
            "UPDATE airplanes SET status = $2 WHERE id = $1",
            [plane.id, newStatus]
          );

          io.to("dashboard").emit("airport:airplane_update", {
            airplaneId: plane.id,
            status: newStatus,
            timestamp: Date.now(),
          });
        }
      }

      // Criar novos voos ocasionalmente
      if (Math.random() < 0.05 && airplanes.length < 10) {
        const allPlanes = await pool.query("SELECT id FROM airplanes");
        const maxNum = allPlanes.rows.reduce((max, r) => {
          const n = parseInt(r.id.replace("FL-", ""), 10);
          return n > max ? n : max;
        }, 0);
        const flightId = `FL-${String(maxNum + 1).padStart(3, "0")}`;
        const flightNumber = `CARGO-${2024 + Math.floor(Math.random() * 3)}`;
        const cargoTypes = ["Equipamentos", "Alimentos", "Medicamentos", "Eletronicos"];
        const cargoType = cargoTypes[Math.floor(Math.random() * cargoTypes.length)];
        const cargoWeight = Math.floor(Math.random() * 8000) + 1000;

        await pool.query(
          `INSERT INTO airplanes (id, flight_number, cargo_type, cargo_weight, eta, gate) 
           VALUES ($1, $2, $3, $4, NOW() + INTERVAL '2 hours', $5)`,
          [flightId, flightNumber, cargoType, cargoWeight, `G${(airplanes.length % 6) + 1}`]
        );
      }
    } catch (e) {
      logger.error(`Erro na simulacao do aeroporto: ${e.message}`);
    }
  }

  // Simular movimentação da locomotiva
  async function simulateLocomotive() {
    try {
      const position = await locomotiveService.simulateLocomotive();
      if (position) {
        io.to("dashboard").emit("locomotive:update", {
          ...position,
          timestamp: Date.now(),
        });
      }
    } catch (e) {
      logger.error(`Erro na simulacao da locomotiva: ${e.message}`);
    }
  }

  return {
    markTimedOutCommands,
    simulateChemistry,
    simulatePort,
    simulateAirport,
    simulateLocomotive,
  };
};
