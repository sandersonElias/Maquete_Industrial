const jwt = require("jsonwebtoken");
const { JWT_SECRET, SUPABASE_ANON_KEY } = require("../config");

const supabaseJwtSecret = SUPABASE_ANON_KEY && SUPABASE_ANON_KEY !== "SEU_ANON_KEY_AQUI"
  ? extractJwtSecret(SUPABASE_ANON_KEY)
  : null;

function extractJwtSecret(anonKey) {
  try {
    const payload = JSON.parse(Buffer.from(anonKey.split(".")[1], "base64url").toString());
    return payload.role === "anon" ? null : null;
  } catch {
    return null;
  }
}

function authenticateToken(req, res, next) {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) return res.status(401).json({ error: "Token nao fornecido" });

  // Tentar verificar como token local primeiro
  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (!err) {
      req.user = user;
      return next();
    }

    // Se falhou como local, tentar como Supabase JWT
    // Supabase JWTs usam o JWT_SECRET do projeto (não o anon key)
    // Na prática, precisamos verificar com a chave publica do Supabase
    // Por enquanto, decodificar sem verificação para extrair dados
    try {
      const payload = JSON.parse(Buffer.from(token.split(".")[1], "base64url").toString());

      // Verificar se é um token Supabase valido (tem sub, aud, exp)
      if (payload.sub && payload.aud && payload.exp) {
        if (payload.exp * 1000 < Date.now()) {
          return res.status(401).json({ error: "Token expirado" });
        }

        // Buscar usuario no banco pelo sub (UUID do Supabase Auth)
        const pool = require("../config/db");
        pool.query("SELECT * FROM users WHERE id = $1", [payload.sub])
          .then(result => {
            if (result.rows.length > 0) {
              req.user = {
                id: result.rows[0].id,
                username: result.rows[0].username,
                role: result.rows[0].role,
                supabase_sub: payload.sub,
              };
              return next();
            }

            // Se nao encontrou no banco local, criar registro
            const email = payload.email || payload.user_metadata?.email || "";
            const username = payload.user_metadata?.username || email.split("@")[0] || "user_" + payload.sub.slice(0, 8);

            return pool.query(
              "INSERT INTO users (id, username, email, password_hash, role) VALUES ($1, $2, $3, $4, $5) ON CONFLICT (id) DO NOTHING RETURNING *",
              [payload.sub, username, email, "supabase_auth", "operator"]
            ).then(insertResult => {
              const newUser = insertResult.rows[0] || { id: payload.sub, username, role: "operator" };
              req.user = {
                id: newUser.id,
                username: newUser.username,
                role: newUser.role,
                supabase_sub: payload.sub,
              };
              return next();
            });
          })
          .catch(e => {
            return res.status(403).json({ error: "Erro ao validar usuario" });
          });
      } else {
        return res.status(403).json({ error: "Token invalido" });
      }
    } catch {
      if (err.name === "TokenExpiredError") {
        return res.status(401).json({ error: "Token expirado" });
      }
      return res.status(403).json({ error: "Token invalido" });
    }
  });
}

module.exports = authenticateToken;
