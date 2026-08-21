#!/usr/bin/env node
/**
 * Aplica schema.sql e cada arquivo de migrations/, em ordem, contra
 * DATABASE_URL, pulando o que já foi executado (rastreado na tabela
 * `_migrations`). Statements são separados respeitando blocos `$$ ... $$`
 * (DO blocks do Postgres), e erros de "já existe" (tabela/coluna/constraint
 * duplicada) são ignorados por statement — permite rodar de novo com
 * segurança mesmo em cima de um banco parcialmente migrado.
 */
const fs = require("fs");
const path = require("path");
const { Pool } = require("pg");

// Sempre a raiz do monorepo, nunca backend_nodejs/.env — é lá que o
// DATABASE_URL do Supabase vive (mesma convenção do docker-compose).
require("dotenv").config({ path: path.resolve(__dirname, "../../.env") });

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error(
    "DATABASE_URL nao definida. Crie um .env na raiz do repositorio " +
      "(nao em backend_nodejs/) com a connection string do Supabase."
  );
  process.exit(1);
}

// SSL por qualquer host remoto, não só Render — hoje o banco é Supabase.
const useSSL = !DATABASE_URL.includes("localhost");
const pool = new Pool({
  connectionString: DATABASE_URL,
  ssl: useSSL ? { rejectUnauthorized: false } : false,
  connectionTimeoutMillis: 30000,
});

const MIGRATIONS_DIR = path.resolve(__dirname, "../migrations");
const SCHEMA_FILE = path.resolve(__dirname, "../schema.sql");

async function fileExists(filePath) {
  try {
    await fs.promises.access(filePath);
    return true;
  } catch {
    return false;
  }
}

/** Separa um arquivo SQL em statements, respeitando blocos $$ ... $$ (DO blocks). */
async function readSQLFile(filePath) {
  const content = await fs.promises.readFile(filePath, "utf-8");

  const withoutComments = content
    .split("\n")
    .map((line) => {
      const commentIndex = line.indexOf("--");
      return commentIndex >= 0 ? line.substring(0, commentIndex) : line;
    })
    .join("\n");

  const statements = [];
  let current = "";
  let inDollarQuote = false;

  for (let i = 0; i < withoutComments.length; i++) {
    const char = withoutComments[i];
    if (withoutComments.substring(i, i + 2) === "$$") {
      inDollarQuote = !inDollarQuote;
      current += "$$";
      i++;
      continue;
    }
    if (char === ";" && !inDollarQuote) {
      const trimmed = current.trim();
      if (trimmed.length > 0) statements.push(trimmed);
      current = "";
    } else {
      current += char;
    }
  }

  const trimmed = current.trim();
  if (trimmed.length > 0) statements.push(trimmed);

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
  return result.rows.map((r) => r.filename);
}

async function runMigration(client, filename, sqlStatements) {
  console.log(`  Executando: ${filename}`);

  // Códigos que significam "já existe" — seguros de ignorar ao reaplicar.
  const ignoredErrors = new Set([
    "42710", // duplicate_object
    "42P07", // duplicate_table
    "42701", // duplicate_column
    "42P16", // duplicate_constraint
    "23505", // unique_violation
    "42P01", // undefined_table (para DROP IF EXISTS)
  ]);

  for (const sql of sqlStatements) {
    try {
      await client.query(sql);
    } catch (e) {
      if (!ignoredErrors.has(e.code)) {
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

    await client.query("SELECT NOW()");
    console.log("  PostgreSQL conectado\n");

    await createMigrationsTable(client);
    const executed = await getExecutedMigrations(client);

    if (await fileExists(SCHEMA_FILE)) {
      if (!executed.includes("schema.sql")) {
        console.log("Executando schema.sql...");
        const statements = await readSQLFile(SCHEMA_FILE);
        await runMigration(client, "schema.sql", statements);
        console.log("  schema.sql concluido\n");
      } else {
        console.log("  schema.sql ja executado\n");
      }
    }

    if (await fileExists(MIGRATIONS_DIR)) {
      const files = (await fs.promises.readdir(MIGRATIONS_DIR))
        .filter((f) => f.endsWith(".sql"))
        .sort();

      const jaExecutadas = await getExecutedMigrations(client);
      for (const file of files) {
        if (!jaExecutadas.includes(file)) {
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
