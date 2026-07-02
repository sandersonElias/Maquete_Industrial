const jwt = require("jsonwebtoken");
const { JWT_SECRET, SUPABASE_JWT_SECRET } = require("../config");

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

    // Se tem SUPABASE_JWT_SECRET configurado, verificar como Supabase JWT
    if (SUPABASE_JWT_SECRET) {
      jwt.verify(token, SUPABASE_JWT_SECRET, (err2, payload) => {
        if (!err2 && payload) {
          // Token Supabase valido - buscar usuario no banco
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
            .catch(() => {
              return res.status(403).json({ error: "Erro ao validar usuario" });
            });
        } else {
          // Token invalido em ambos os metodos
          if (err.name === "TokenExpiredError" || err2?.name === "TokenExpiredError") {
            return res.status(401).json({ error: "Token expirado" });
          }
          return res.status(403).json({ error: "Token invalido" });
        }
      });
    } else {
      // Sem SUPABASE_JWT_SECRET - retornar erro do token local
      if (err.name === "TokenExpiredError") {
        return res.status(401).json({ error: "Token expirado" });
      }
      return res.status(403).json({ error: "Token invalido" });
    }
  });
}

module.exports = authenticateToken;