#!/usr/bin/env node
// backend_nodejs/scripts/seed.js
// Popula o banco de dados com dados iniciais

const path = require("path");
const { Pool } = require("pg");
const bcrypt = require("bcryptjs");

require("dotenv").config({ path: path.join(__dirname, "../.env") });

// SSL necessario para Render PostgreSQL
const isRemoteDB = process.env.DATABASE_URL && process.env.DATABASE_URL.includes("render.com");

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: isRemoteDB ? { rejectUnauthorized: false } : false,
  connectionTimeoutMillis: 30000,
});

async function seed() {
  const client = await pool.connect();

  try {
    console.log("========================================");
    console.log("  SEED - Maquete Industrial");
    console.log("========================================\n");

    await client.query("SELECT NOW()");
    console.log("  PostgreSQL conectado\n");

    // 1. Criar usuario admin
    console.log("1. Criando usuario admin...");
    const adminPassword = await bcrypt.hash("admin123", 10);
    await client.query(
      `INSERT INTO users (username, email, password_hash, role)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (username) DO NOTHING`,
      ["admin", "admin@maquete.local", adminPassword, "admin"]
    );
    console.log("   Admin criado (admin / admin123)\n");

    // 2. Criar usuario operador
    console.log("2. Criando usuario operador...");
    const operatorPassword = await bcrypt.hash("oper123", 10);
    await client.query(
      `INSERT INTO users (username, email, password_hash, role)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (username) DO NOTHING`,
      ["operador", "operador@maquete.local", operatorPassword, "operator"]
    );
    console.log("   Operador criado (operador / oper123)\n");

    // 3. Switches (ja inseridos pelo schema.sql)
    console.log("3. Verificando switches...");
    const switchesRes = await client.query("SELECT COUNT(*) as count FROM switches");
    console.log(`   ${switchesRes.rows[0].count} switches existentes\n`);

    // 4. Caminhoes
    console.log("4. Verificando caminhoes...");
    const trucksRes = await client.query("SELECT COUNT(*) as count FROM trucks");
    console.log(`   ${trucksRes.rows[0].count} caminhoes existentes\n`);

    // 5. Navios
    console.log("5. Verificando navios...");
    const shipsRes = await client.query("SELECT COUNT(*) as count FROM ships");
    console.log(`   ${shipsRes.rows[0].count} navios existentes\n`);

    // 6. Dados de quimica (exemplo)
    console.log("6. Verificando dados de quimica...");
    try {
      await client.query(`
        CREATE TABLE IF NOT EXISTS chemistry_equipment (
          id VARCHAR(20) PRIMARY KEY,
          name VARCHAR(100) NOT NULL,
          status VARCHAR(20) DEFAULT 'online',
          temperature FLOAT,
          humidity FLOAT,
          level FLOAT,
          last_calibration DATE,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);

      const chemRes = await client.query("SELECT COUNT(*) as count FROM chemistry_equipment");
      if (parseInt(chemRes.rows[0].count) === 0) {
        await client.query(`
          INSERT INTO chemistry_equipment (id, name, status, temperature, humidity, level, last_calibration) VALUES
          ('CHEM-001', 'Tanque Alpha', 'online', 25.4, 45, 78, '2024-06-15'),
          ('CHEM-002', 'Reator Beta', 'online', 42.1, 38, 62, '2024-06-10'),
          ('CHEM-003', 'Misturador Gamma', 'warning', 31.8, 52, 91, '2024-06-01'),
          ('CHEM-004', 'Resfriador Delta', 'online', 8.2, 85, 45, '2024-06-20')
          ON CONFLICT (id) DO NOTHING
        `);
        console.log("   4 equipamentos de quimica criados\n");
      } else {
        console.log(`   ${chemRes.rows[0].count} equipamentos existentes\n`);
      }
    } catch (e) {
      console.log("   Tabela chemistry_equipment criada (pode ja existir)\n");
    }

    console.log("  Seed concluido com sucesso!");
    console.log("\n  Usuarios criados:");
    console.log("    admin / admin123 (administrador)");
    console.log("    operador / oper123 (operador)");
  } catch (e) {
    console.error("\n  ERRO:", e.message);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

seed();
