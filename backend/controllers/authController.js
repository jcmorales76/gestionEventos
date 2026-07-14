const pool = require("../config/db");
const jwt = require("jsonwebtoken");
const { hashPassword, verifyPassword, esHash } = require("../utils/security");
const { SECRET } = require("../middleware/auth");

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password)
      return res.status(400).json({ message: "Credenciales requeridas" });

    // 1. Días de expiración desde la BD
    const [configRows] = await pool.query(
      "SELECT valor FROM configuraciones WHERE clave = 'password_expiry_days'",
    );
    const expiryDays =
      configRows.length > 0 ? parseInt(configRows[0].valor) : 60;

    // 2. Buscar usuario
    const [rows] = await pool.query("SELECT * FROM usuarios WHERE email = ?", [
      email,
    ]);
    if (rows.length === 0)
      return res.status(401).json({ message: "Credenciales incorrectas" });

    const user = rows[0];

    // 3. Verificar contraseña (soporta hash bcrypt y texto plano legado)
    const ok = await verifyPassword(password, user.password);
    if (!ok) {
      return res.status(401).json({ message: "Credenciales incorrectas" });
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
