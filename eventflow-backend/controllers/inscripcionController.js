const pool = require("../config/db");

// Obtener inscripciones de un evento específico
exports.getInscripcionesByEvento = async (req, res) => {
  try {
    const { eventoId } = req.params;
    
    const [inscripciones] = await pool.query(
      `SELECT i.id, i.usuario_id, i.evento_id, i.calidad, i.estado, i.fecha_inscripcion,
              u.nombre, u.apellido, u.email, u.dni
       FROM inscripciones i
       INNER JOIN usuarios u ON i.usuario_id = u.id
       WHERE i.evento_id = ?
       ORDER BY i.fecha_inscripcion DESC`,
      [eventoId]
    );

    res.json(inscripciones);
  } catch (error) {
    console.error("Error al obtener inscripciones:", error);
    res.status(500).json({ message: "Error al obtener inscripciones" });
  }
};

// Obtener todas las inscripciones
exports.getAllInscripciones = async (req, res) => {
  try {
    const [inscripciones] = await pool.query(
      `SELECT i.id, i.usuario_id, i.evento_id, i.calidad, i.estado, i.fecha_inscripcion,
              u.nombre, u.apellido, u.email,
              e.nombre as evento_nombre
       FROM inscripciones i
       INNER JOIN usuarios u ON i.usuario_id = u.id
       INNER JOIN eventos e ON i.evento_id = e.id
       ORDER BY i.fecha_inscripcion DESC`
    );

    res.json(inscripciones);
  } catch (error) {
    console.error("Error al obtener inscripciones:", error);
    res.status(500).json({ message: "Error al obtener inscripciones" });
  }
};