const pool = require("../config/db");

// Obtener participantes (con su último evento inscrito)
exports.getParticipantes = async (req, res) => {
  try {
    // Unimos usuarios con su última inscripción y el nombre del evento
    const query = `
      SELECT u.*, 
        (SELECT nombre FROM inscripciones i 
         JOIN eventos e ON i.evento_id = e.id 
         WHERE i.usuario_id = u.id 
         ORDER BY i.fecha_inscripcion DESC LIMIT 1) as evento,
        (SELECT COUNT(*) FROM inscripciones i WHERE i.usuario_id = u.id) as total_eventos
      FROM usuarios u 
      WHERE u.rol = 'participante' 
      ORDER BY u.fecha_creacion DESC
    `;
    const [participantes] = await pool.query(query);
    res.json(participantes);
  } catch (error) {
    console.error("Error al obtener participantes:", error);
    res.status(500).json({ message: "Error al obtener participantes" });
  }
};

// Crear nuevo participante
exports.createParticipante = async (req, res) => {
  try {
    const { nombre, apellido, email, password, dni, telefono, estado, evento } =
      req.body;

    // 1. Crear usuario
    const [userResult] = await pool.query(
      'INSERT INTO usuarios (nombre, apellido, email, password, rol, dni, telefono, estado) VALUES (?, ?, ?, ?, "participante", ?, ?, ?)',
      [
        nombre,
        apellido,
        email,
        password || "123456",
        dni,
        telefono,
        estado || "Activo",
      ],
    );

    const userId = userResult.insertId;

    // 2. Si seleccionó un evento, crear inscripción
    if (evento) {
      // Buscamos el ID del evento por su nombre
      const [eventoRows] = await pool.query(
        "SELECT id FROM eventos WHERE nombre = ?",
        [evento],
      );
      if (eventoRows.length > 0) {
        await pool.query(
          "INSERT INTO inscripciones (usuario_id, evento_id) VALUES (?, ?)",
          [userId, eventoRows[0].id],
        );
      }
    }

    res
      .status(201)
      .json({ id: userId, message: "Participante creado exitosamente" });
  } catch (error) {
    console.error("Error al crear participante:", error);
    // Manejo simple de error si el email ya existe
    if (error.code === "ER_DUP_ENTRY") {
      return res
        .status(400)
        .json({ message: "El correo electrónico ya está registrado" });
    }
    res.status(500).json({ message: "Error al crear participante" });
  }
};

// Eliminar participante
exports.deleteParticipante = async (req, res) => {
  try {
    const { id } = req.params;
    // Gracias a ON DELETE CASCADE en las tablas, esto borrará también las inscripciones
    await pool.query("DELETE FROM usuarios WHERE id=?", [id]);
    res.json({ message: "Participante eliminado exitosamente" });
  } catch (error) {
    console.error("Error al eliminar participante:", error);
    res.status(500).json({ message: "Error al eliminar participante" });
  }
};
