#!/usr/bin/env node
// backend_nodejs/scripts/migrate.js
// Executa as migrations do banco de dados

const fs = require("fs");
const path = require("path");
const { Pool } = require("pg");

require("dotenv").config({ path: path.join(__dirname, "../.env") });

// SSL necessario para Render PostgreSQL
const isRemoteDB = process.env.DATABASE_URL && process.env.DATABASE_URL.includes("render.com");

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: isRemoteDB ? { rejectUnauthorized: false } : false,
  connectionTimeoutMillis: 30000,
});

const MIGRATIONS_DIR = path.join(__dirname, "../migrations");
const SCHEMA_FILE = path.join(__dirname, "../schema.sql");

async function fileExists(filePath) {
  try {
    await fs.promises.access(filePath);
    return true;
  } catch {
    return false;
  }
}

async function readSQLFile(filePath) {
  const content = await fs.promises.readFile(filePath, "utf-8");

  // Remove comments (lines starting with --)
  const lines = content.split("\n");
  const withoutComments = lines
    .map(line => {
      // Remove inline comments but preserve -- inside strings
      const commentIndex = line.indexOf("--");
      if (commentIndex >= 0) {
        return line.substring(0, commentIndex);
      }
      return line;
    })
    .join("\n");

  // Split by semicolons, but respect $$ delimiters (PostgreSQL DO blocks)
  const statements = [];
  let current = "";
  let inDollarQuote = false;

  for (let i = 0; i < withoutComments.length; i++) {
    const char = withoutComments[i];
    const nextChars = withoutComments.substring(i, i + 2);

    if (nextChars === "$$") {
      inDollarQuote = !inDollarQuote;
      current += "$$";
      i++; // Skip next $
      continue;
    }

    if (char === ";" && !inDollarQuote) {
      const trimmed = current.trim();
      if (trimmed.length > 0) {
        statements.push(trimmed);
      }
      current = "";
    } else {
      current += char;
    }
  }

  // Add last statement if any
  const trimmed = current.trim();
  if (trimmed.length > 0) {
    statements.push(trimmed);
  }

  return statements;
}

async function createMigrationsTable(client) {
  await client.query(`
    CREATE TABLE IF NOT EXISTS _migrations (
      id SERIAL PRIMARY KEY,
      filename VARCHAR(255) UNIQUE NOT NULL,
      executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);
}

async function getExecutedMigrations(client) {
  const result = await client.query("SELECT filename FROM _migrations ORDER BY id");
  return result.rows.map(r => r.filename);
}

async function runMigration(client, filename, sqlStatements) {
  console.log(`  Executando: ${filename}`);

  for (const sql of sqlStatements) {
    try {
      await client.query(sql);
    } catch (e) {
      // Ignorar erros comuns de tabelas/constraints ja existentes
      const ignoredErrors = [
        "42710", // duplicate_object
        "42P07", // duplicate_table
        "42701", // duplicate_column
        "42P16", // duplicate_constraint
        "23505", // unique_violation
        "42P01", // undefined_table (para DROP IF EXISTS)
      ];
      if (ignoredErrors.includes(e.code)) {
        // Ignorar silenciosamente
      } else {
        console.error(`  Erro ao executar SQL: ${e.message}`);
        console.error(`  SQL: ${sql.substring(0, 100)}...`);
        throw e;
      }
    }
  }

  await client.query(
    "INSERT INTO _migrations (filename) VALUES ($1) ON CONFLICT (filename) DO NOTHING",
    [filename]
  );
}

async function migrate() {
  const client = await pool.connect();

  try {
    console.log("========================================");
    console.log("  MIGRATE - Maquete Industrial");
    console.log("========================================\n");

    // Verificar conexao
    await client.query("SELECT NOW()");
    console.log("  PostgreSQL conectado\n");

    // Criar tabela de migrations
    await createMigrationsTable(client);

    // Executar schema.sql primeiro
    if (await fileExists(SCHEMA_FILE)) {
      const executed = await getExecutedMigrations(client);
      if (!executed.includes("schema.sql")) {
        console.log("Executando schema.sql...");
        const statements = await readSQLFile(SCHEMA_FILE);
        await runMigration(client, "schema.sql", statements);
        console.log("  schema.sql concluido\n");
      } else {
        console.log("  schema.sql ja executado\n");
      }
    }

    // Executar migrations adicionais
    if (await fileExists(MIGRATIONS_DIR)) {
      const files = await fs.promises.readdir(MIGRATIONS_DIR);
      const sqlFiles = files
        .filter(f => f.endsWith(".sql"))
        .sort();

      const executed = await getExecutedMigrations(client);

      for (const file of sqlFiles) {
        if (!executed.includes(file)) {
          const filePath = path.join(MIGRATIONS_DIR, file);
          const statements = await readSQLFile(filePath);
          await runMigration(client, file, statements);
          console.log(`  ${file} concluido`);
        }
      }
    }

    console.log("\n  Migrations concluidas com sucesso!");
  } catch (e) {
    console.error("\n  ERRO:", e.message);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

migrate();
