const pool = require("../config/db");
const jwt = require("jsonwebtoken");
const { hashPassword, verifyPassword, esHash } = require("../utils/security");
const { SECRET } = require("../middleware/auth");

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password)
      return res.status(400).json({ message: "Credenciales requeridas" });

    // 1. Configuración (expiración + bloqueo por intentos)
    const [configRows] = await pool.query(
      "SELECT clave, valor FROM configuraciones WHERE clave IN ('password_expiry_days','max_intentos_login','minutos_bloqueo')",
    );
    const cfg = {};
    configRows.forEach((r) => (cfg[r.clave] = r.valor));
    const expiryDays = parseInt(cfg.password_expiry_days) || 60;
    const maxIntentos = parseInt(cfg.max_intentos_login) || 5;
    const minutosBloqueo = parseInt(cfg.minutos_bloqueo) || 30;

    // 2. Buscar usuario
    const [rows] = await pool.query("SELECT * FROM usuarios WHERE email = ?", [
      email,
    ]);
    if (rows.length === 0)
      return res.status(401).json({ message: "Credenciales incorrectas" });

    const user = rows[0];

    // 2b. ¿Cuenta bloqueada por intentos fallidos?
    if (user.bloqueado_hasta && new Date(user.bloqueado_hasta) > new Date()) {
      const mins = Math.ceil(
        (new Date(user.bloqueado_hasta) - new Date()) / 60000,
      );
      return res.status(423).json({
        message: `Cuenta bloqueada por demasiados intentos. Intenta en ${mins} min o contacta al administrador.`,
      });
    }

    // 3. Verificar contraseña (soporta hash bcrypt y texto plano legado)
    const ok = await verifyPassword(password, user.password);
    if (!ok) {
      const intentos = (user.intentos_fallidos || 0) + 1;
      if (intentos >= maxIntentos) {
        const hasta = new Date(Date.now() + minutosBloqueo * 60000);
        await pool.query(
          "UPDATE usuarios SET intentos_fallidos = ?, bloqueado_hasta = ? WHERE id = ?",
          [intentos, hasta, user.id],
        );
        return res.status(423).json({
          message: `Cuenta bloqueada por ${minutosBloqueo} minutos tras ${maxIntentos} intentos fallidos.`,
        });
      }
      await pool.query(
        "UPDATE usuarios SET intentos_fallidos = ? WHERE id = ?",
        [intentos, user.id],
      );
      const restantes = maxIntentos - intentos;
      return res.status(401).json({
        message: `Credenciales incorrectas. Te queda(n) ${restantes} intento(s).`,
      });
    }

    // Éxito: reiniciar contador y desbloquear
    if (user.intentos_fallidos > 0 || user.bloqueado_hasta) {
      await pool.query(
        "UPDATE usuarios SET intentos_fallidos = 0, bloqueado_hasta = NULL WHERE id = ?",
        [user.id],
      );
    }

    // 3b. Migración perezosa: si estaba en texto plano, la ciframos ahora
    if (!esHash(user.password)) {
      try {
        const hash = await hashPassword(password);
        await pool.query("UPDATE usuarios SET password = ? WHERE id = ?", [
          hash,
          user.id,
        ]);
      } catch (e) {
        console.error("No se pudo migrar la contraseña a hash:", e.message);
      }
    }

    // 4. Expiración de contraseña
    const lastChanged = new Date(
      user.password_changed_at || user.fecha_creacion,
    ).getTime();
    const daysSinceChange = (Date.now() - lastChanged) / (1000 * 60 * 60 * 24);
    const isExpired = daysSinceChange > expiryDays;

    const token = jwt.sign(
      { id: user.id, email: user.email, rol: user.rol },
      SECRET,
      { expiresIn: "24h" },
    );
    const { password: _, ...userSafe } = user;

    res.json({
      message: "Login exitoso",
      token,
      user: { ...userSafe, passwordExpired: isExpired },
    });
  } catch (error) {
    console.error("Error en login:", error);
    res.status(500).json({ message: "Error en el servidor" });
  }
};

// Cambiar contraseña
exports.changePassword = async (req, res) => {
  try {
    const { userId, currentPassword, newPassword } = req.body;
    const [rows] = await pool.query("SELECT * FROM usuarios WHERE id = ?", [
      userId,
    ]);

    if (rows.length === 0) {
      return res.status(400).json({ message: "Usuario no encontrado" });
    }

    const ok = await verifyPassword(currentPassword, rows[0].password);
    if (!ok) {
      return res.status(400).json({ message: "Contraseña actual incorrecta" });
    }

    const hash = await hashPassword(newPassword);
    await pool.query(
      "UPDATE usuarios SET password = ?, password_changed_at = NOW() WHERE id = ?",
      [hash, userId],
    );
    res.json({ message: "Contraseña actualizada exitosamente" });
  } catch (error) {
    console.error("Error al cambiar contraseña:", error);
    res.status(500).json({ message: "Error al cambiar contraseña" });
  }
};
