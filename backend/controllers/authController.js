const pool = require("../config/db");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validar campos
    if (!email || !password) {
      return res
        .status(400)
        .json({ message: "Email y contraseña son requeridos" });
    }

    // Buscar usuario por email
    const [rows] = await pool.query("SELECT * FROM usuarios WHERE email = ?", [
      email,
    ]);

    if (rows.length === 0) {
      return res.status(401).json({ message: "Credenciales incorrectas" });
    }

    const user = rows[0];

    // Verificar contraseña (para prueba temporal)
    // Si la contraseña en BD está en texto plano (sin encriptar):
    if (password !== user.password) {
      // Si usas bcrypt en el futuro, descomenta esto:
      // const isMatch = await bcrypt.compare(password, user.password);
      // if (!isMatch) {
      return res.status(401).json({ message: "Credenciales incorrectas" });
      // }
    }

    // Generar token JWT
    const token = jwt.sign(
      { id: user.id, email: user.email, rol: user.rol },
      "tu_secreto_super_seguro_123", // En producción usar process.env.JWT_SECRET
      { expiresIn: "24h" },
    );

    // Retornar datos sin la contraseña
    const { password: _, ...userWithoutPassword } = user;

    res.json({
      message: "Login exitoso",
      token,
      user: userWithoutPassword,
    });
  } catch (error) {
    console.error("Error en login:", error);
    res.status(500).json({ message: "Error en el servidor: " + error.message });
  }
};
