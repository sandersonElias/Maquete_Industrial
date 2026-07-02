const authService = require("../services/authService");
const supabase = require("../config/supabase");
const logger = require("../config/logger");

async function login(req, res) {
  try {
    const { email, password, username } = req.body;

    // Se supabase esta configurado, usar Supabase Auth
    if (supabase && process.env.SUPABASE_ANON_KEY && process.env.SUPABASE_ANON_KEY !== "SEU_ANON_KEY_AQUI") {
      const loginEmail = email || `${username}@maquete.local`;
      const { data, error } = await supabase.auth.signInWithPassword({
        email: loginEmail,
        password,
      });

      if (error) {
        logger.error(`Supabase login erro: ${error.message}`);
        return res.status(401).json({ error: "Credenciais invalidas" });
      }

      // Buscar dados do usuario no banco local
      const pool = require("../config/db");
      const result = await pool.query("SELECT * FROM users WHERE id = $1", [data.user.id]);
      let user = result.rows[0];

      // Se nao existe no banco local, criar
      if (!user) {
        const insertResult = await pool.query(
          "INSERT INTO users (id, username, email, password_hash, role) VALUES ($1, $2, $3, $4, $5) ON CONFLICT (id) DO NOTHING RETURNING *",
          [data.user.id, username || data.user.email?.split("@")[0] || "user", data.user.email || loginEmail, "supabase_auth", "operator"]
        );
        user = insertResult.rows[0] || { id: data.user.id, username: username || "user", role: "operator" };
      }

      return res.json({
        token: data.session.access_token,
        refreshToken: data.session.refresh_token,
        user: { id: user.id, username: user.username, role: user.role },
      });
    }

    // Fallback: login local com JWT proprio
    const { token, user } = await authService.login(username || email, password);
    res.json({ token, user });
  } catch (e) {
    logger.error(`Erro login: ${e.message}`);
    res.status(401).json({ error: e.message });
  }
}

async function register(req, res) {
  try {
    const { username, email, password, role } = req.body;

    // Se supabase esta configurado, registrar via Supabase Auth
    if (supabase && process.env.SUPABASE_ANON_KEY && process.env.SUPABASE_ANON_KEY !== "SEU_ANON_KEY_AQUI") {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { username, role: role || "operator" },
        },
      });

      if (error) {
        logger.error(`Supabase register erro: ${error.message}`);
        return res.status(400).json({ error: error.message });
      }

      // Registrar no banco local tambem
      const pool = require("../config/db");
      const result = await pool.query(
        "INSERT INTO users (id, username, email, password_hash, role) VALUES ($1, $2, $3, $4, $5) ON CONFLICT (id) DO NOTHING RETURNING id, username, role",
        [data.user?.id || "", username, email, "supabase_auth", role || "operator"]
      );

      return res.status(201).json(result.rows[0] || { username, role: role || "operator" });
    }

    // Fallback: registro local
    const newUser = await authService.register(username, email, password, role);
    res.status(201).json(newUser);
  } catch (e) {
    logger.error(`Erro registro: ${e.message}`);
    if (e.code === "23505") {
      return res.status(409).json({ error: "Usuario ou email ja existe" });
    }
    res.status(500).json({ error: "Erro ao criar usuario" });
  }
}

async function logout(req, res) {
  try {
    if (supabase && process.env.SUPABASE_ANON_KEY && process.env.SUPABASE_ANON_KEY !== "SEU_ANON_KEY_AQUI") {
      const authHeader = req.headers["authorization"];
      const token = authHeader && authHeader.split(" ")[1];
      if (token) {
        await supabase.auth.admin.signOut(token);
      }
    }
    res.json({ message: "Logout realizado" });
  } catch (e) {
    res.json({ message: "Logout realizado" });
  }
}

async function me(req, res) {
  res.json({ user: req.user });
}

module.exports = {
  login,
  register,
  logout,
  me,
};
