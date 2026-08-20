#!/usr/bin/env node
/**
 * Aplica schema.sql e depois cada arquivo de migrations/, em ordem, contra
 * DATABASE_URL. Cada arquivo é enviado inteiro numa única query — não
 * dividimos por ";" porque schema.sql e as migrations têm blocos
 * `DO $$ ... $$;` com ponto e vírgula dentro, que uma divisão ingênua
 * quebraria. O protocolo simples do node-postgres já lida bem com múltiplos
 * comandos numa string só.
 *
 * schema.sql usa `CREATE TABLE IF NOT EXISTS` e as migrations usam
 * `ON CONFLICT DO NOTHING` / `IF NOT EXISTS` — rodar de novo em cima de um
 * banco já migrado não deve dar erro nem duplicar dado.
 */
const fs = require("fs");
const path = require("path");
const { Pool } = require("pg");

require("dotenv").config({ path: path.resolve(__dirname, "../../.env") });

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error(
    "DATABASE_URL nao definida. Crie um .env na raiz do repositorio " +
      "(nao em backend_nodejs/) com a connection string do Supabase."
  );
  process.exit(1);
}

const useSSL = !DATABASE_URL.includes("localhost");
const pool = new Pool({
  connectionString: DATABASE_URL,
  ...(useSSL ? { ssl: { rejectUnauthorized: false } } : {}),
});

/** Lista migrations/*.sql em ordem alfabética (por isso o prefixo numérico nos nomes). */
function listarMigrations() {
  const dir = path.resolve(__dirname, "../migrations");
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir)
    .filter((f) => f.endsWith(".sql"))
    .sort()
    .map((f) => path.join(dir, f));
}

async function aplicar(client, caminho) {
  const nome = path.basename(caminho);
  const sql = fs.readFileSync(caminho, "utf8");
  process.stdout.write(`  -> ${nome} ... `);
  await client.query(sql);
  console.log("ok");
}

async function main() {
  const client = await pool.connect();
  try {
    console.log("Conectado. Aplicando schema base...");
    await aplicar(client, path.resolve(__dirname, "../schema.sql"));

    const migrations = listarMigrations();
    if (migrations.length) {
      console.log(`Aplicando ${migrations.length} migration(s)...`);
      for (const caminho of migrations) {
        await aplicar(client, caminho);
      }
    }

    console.log("\nBanco pronto.");
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch((err) => {
  console.error("\nFalhou:", err.message);
  process.exit(1);
});
