const pool = require("../config/db");

// Obtener todas las inscripciones (con datos de usuario y evento)
exports.getInscripciones = async (req, res) => {
  try {
    const [inscripciones] = await pool.query(`
      SELECT i.*, 
             u.nombre, u.apellido, u.email,
             e.nombre as evento_nombre, e.tipo as evento_tipo
      FROM inscripciones i
      LEFT JOIN usuarios u ON i.usuario_id = u.id
      LEFT JOIN eventos e ON i.evento_id = e.id
      ORDER BY i.fecha_inscripcion DESC
    `);
    res.json(inscripciones);
  } catch (error) {
    console.error("Error al obtener inscripciones:", error);
    res.status(500).json({ message: "Error al obtener inscripciones" });
  }
};

// ✅ Obtener inscripciones de un evento específico (Usado por Certificados)
exports.getInscripcionesByEvento = async (req, res) => {
  try {
    const { eventoId } = req.params;

    const [inscripciones] = await pool.query(
      `
      SELECT i.*, 
             u.nombre, u.apellido, u.email, u.dni, u.telefono
      FROM inscripciones i
      INNER JOIN usuarios u ON i.usuario_id = u.id
      WHERE i.evento_id = ?
      ORDER BY i.fecha_inscripcion DESC
    `,
      [eventoId],
    );

    res.json(inscripciones);
  } catch (error) {
    console.error("Error al obtener inscripciones del evento:", error);
    res
      .status(500)
      .json({ message: "Error al obtener inscripciones del evento" });
  }
};

// Crear nueva inscripción
exports.createInscripcion = async (req, res) => {
  try {
    const { usuario_id, evento_id, estado, progreso, calidad } = req.body;

    if (!usuario_id || !evento_id) {
      return res
        .status(400)
        .json({ message: "usuario_id y evento_id son requeridos" });
    }

    const [result] = await pool.query(
      "INSERT INTO inscripciones (usuario_id, evento_id, estado, progreso, calidad) VALUES (?, ?, ?, ?, ?)",
      [
        usuario_id,
        evento_id,
        estado || "Inscrito",
        progreso || 0,
        calidad || "PARTICIPANTE",
      ],
    );

    res
      .status(201)
      .json({
        id: result.insertId,
        message: "Inscripción creada exitosamente",
      });
  } catch (error) {
    console.error("Error al crear inscripción:", error);
    if (error.code === "ER_DUP_ENTRY") {
      return res
        .status(400)
        .json({
          message: "Ya existe una inscripción para este usuario en este evento",
        });
    }
    res.status(500).json({ message: "Error al crear inscripción" });
  }
};

// Actualizar inscripción
exports.updateInscripcion = async (req, res) => {
  try {
    const { id } = req.params;
    const { estado, progreso, calidad } = req.body;

    await pool.query(
      "UPDATE inscripciones SET estado = ?, progreso = ?, calidad = ? WHERE id = ?",
      [estado, progreso, calidad, id],
    );

    res.json({ message: "Inscripción actualizada exitosamente" });
  } catch (error) {
    console.error("Error al actualizar inscripción:", error);
    res.status(500).json({ message: "Error al actualizar inscripción" });
  }
};

// Eliminar inscripción
exports.deleteInscripcion = async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query("DELETE FROM inscripciones WHERE id = ?", [id]);
    res.json({ message: "Inscripción eliminada exitosamente" });
  } catch (error) {
    console.error("Error al eliminar inscripción:", error);
    res.status(500).json({ message: "Error al eliminar inscripción" });
  }
};

module.exports = {
  getInscripciones,
  getInscripcionesByEvento,
  createInscripcion,
  updateInscripcion,
  deleteInscripcion,
};
