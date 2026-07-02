const { createClient } = require("@supabase/supabase-js");
const { SUPABASE_URL, SUPABASE_ANON_KEY } = require("./index");
const logger = require("./logger");

if (!SUPABASE_URL || !SUPABASE_ANON_KEY || SUPABASE_ANON_KEY === "SEU_ANON_KEY_AQUI") {
  logger.warn("Supabase nao configurado (URL ou ANON_KEY ausente). Auth por Supabase desativada.");
}

const supabase = createClient(
  SUPABASE_URL || "https://placeholder.supabase.co",
  SUPABASE_ANON_KEY || "placeholder"
);

module.exports = supabase;
