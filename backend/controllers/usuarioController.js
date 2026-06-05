const pool = require("../config/db");

// Obtener todos los usuarios (admins y participantes)
exports.getUsuarios = async (req, res) => {
  try {
    const [usuarios] = await pool.query(
      "SELECT * FROM usuarios ORDER BY fecha_creacion DESC",
    );
    res.json(usuarios);
  } catch (error) {
    console.error("Error al obtener usuarios:", error);
    res.status(500).json({ message: "Error al obtener usuarios" });
  }
};

// Crear nuevo usuario
exports.createUsuario = async (req, res) => {
  try {
    const { nombre, apellido, email, password, rol, dni, telefono, estado } =
      req.body;

    const [result] = await pool.query(
      "INSERT INTO usuarios (nombre, apellido, email, password, rol, dni, telefono, estado) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
      [
        nombre,
        apellido,
        email,
        password || "123456",
        rol || "admin",
        dni,
        telefono,
        estado || "Activo",
      ],
    );

    res
      .status(201)
      .json({ id: result.insertId, message: "Usuario creado exitosamente" });
  } catch (error) {
    console.error("Error al crear usuario:", error);
    if (error.code === "ER_DUP_ENTRY") {
      return res
        .status(400)
        .json({ message: "El correo electrónico ya está registrado" });
    }
    res.status(500).json({ message: "Error al crear usuario" });
  }
};

// Actualizar usuario
exports.updateUsuario = async (req, res) => {
  try {
    const { id } = req.params;
    const { nombre, apellido, email, rol, dni, telefono, estado } = req.body;

    await pool.query(
      "UPDATE usuarios SET nombre=?, apellido=?, email=?, rol=?, dni=?, telefono=?, estado=? WHERE id=?",
      [nombre, apellido, email, rol, dni, telefono, estado, id],
    );

    res.json({ message: "Usuario actualizado exitosamente" });
  } catch (error) {
    console.error("Error al actualizar usuario:", error);
    if (error.code === "ER_DUP_ENTRY") {
      return res
        .status(400)
        .json({ message: "El correo electrónico ya está registrado" });
    }
    res.status(500).json({ message: "Error al actualizar usuario" });
  }
};

// Eliminar usuario
exports.deleteUsuario = async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query("DELETE FROM usuarios WHERE id=?", [id]);
    res.json({ message: "Usuario eliminado exitosamente" });
  } catch (error) {
    console.error("Error al eliminar usuario:", error);
    res.status(500).json({ message: "Error al eliminar usuario" });
  }
};

// Resetear contraseña
exports.resetPassword = async (req, res) => {
  try {
    const { id } = req.params;
    const { newPassword } = req.body;

    await pool.query(
      "UPDATE usuarios SET password = ?, password_changed_at = NOW() WHERE id = ?",
      [newPassword || "123456", id],
    );

    res.json({ message: "Contraseña reseteada exitosamente" });
  } catch (error) {
    console.error("Error al resetear contraseña:", error);
    res.status(500).json({ message: "Error al resetear contraseña" });
  }
};
