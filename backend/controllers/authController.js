const pool = require("../config/db");
const jwt = require("jsonwebtoken");

// Configuración de seguridad (puedes cambiar 30, 45 o 60)
const PASSWORD_EXPIRY_DAYS = 60;

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password)
      return res.status(400).json({ message: "Credenciales requeridas" });

    const [rows] = await pool.query("SELECT * FROM usuarios WHERE email = ?", [
      email,
    ]);
    if (rows.length === 0)
      return res.status(401).json({ message: "Credenciales incorrectas" });

    const user = rows[0];

    // Verificar contraseña (temporalmente en texto plano para desarrollo)
    if (password !== user.password) {
      return res.status(401).json({ message: "Credenciales incorrectas" });
    }

    // 🔒 VERIFICAR EXPIRACIÓN DE CONTRASEÑA
    const lastChanged = new Date(user.password_changed_at).getTime();
    const daysSinceChange = (Date.now() - lastChanged) / (1000 * 60 * 60 * 24);
    const isExpired = daysSinceChange > PASSWORD_EXPIRY_DAYS;

    const token = jwt.sign(
      { id: user.id, email: user.email, rol: user.rol },
      "tu_secreto_super_seguro_123",
      { expiresIn: "24h" },
    );
    const { password: _, ...userSafe } = user;

    // Retornar respuesta con flag de expiración
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

// Endpoint para cambiar contraseña
exports.changePassword = async (req, res) => {
  try {
    const { userId, currentPassword, newPassword } = req.body;
    const [rows] = await pool.query("SELECT * FROM usuarios WHERE id = ?", [
      userId,
    ]);

    if (rows.length === 0 || rows[0].password !== currentPassword) {
      return res.status(400).json({ message: "Contraseña actual incorrecta" });
    }

    await pool.query(
      "UPDATE usuarios SET password = ?, password_changed_at = NOW() WHERE id = ?",
      [newPassword, userId],
    );
    res.json({ message: "Contraseña actualizada exitosamente" });
  } catch (error) {
    res.status(500).json({ message: "Error al cambiar contraseña" });
  }
};
