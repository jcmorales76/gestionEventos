const pool = require("../config/db");
const {
  enviarBienvenida,
  generarPasswordTemporal,
  FORZAR_CAMBIO,
} = require("../config/mailer");
const { hashPassword } = require("../utils/security");

// Obtener participantes (con su último evento inscrito)
exports.getParticipantes = async (req, res) => {
  try {
    const query = `SELECT u.*, 
      (SELECT nombre FROM inscripciones i JOIN eventos e ON i.evento_id = e.id WHERE i.usuario_id = u.id ORDER BY i.fecha_inscripcion DESC LIMIT 1) as evento,
      (SELECT COUNT(*) FROM inscripciones i WHERE i.usuario_id = u.id) as total_eventos
      FROM usuarios u WHERE u.rol = 'participante' ORDER BY u.fecha_creacion DESC`;
    
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
    const { nombre, apellido, email, password, dni, telefono, estado, evento, empresa } = req.body;

    if (!nombre || !apellido || !email || !dni || !telefono) {
      return res.status(400).json({
        message: "Faltan campos obligatorios (nombre, apellido, correo, DNI y teléfono)",
      });
    }

    // Contraseña temporal (DNI o una generada) + forzar cambio en el primer login
    const tempPassword = password || dni || generarPasswordTemporal();
    const hash = await hashPassword(tempPassword);

    const [userResult] = await pool.query(
      'INSERT INTO usuarios (nombre, apellido, email, password, rol, dni, telefono, estado, empresa, password_changed_at) VALUES (?, ?, ?, ?, "participante", ?, ?, ?, ?, ?)',
      [nombre, apellido, email, hash, dni, telefono, estado || "Activo", empresa || null, FORZAR_CAMBIO]
    );

    const userId = userResult.insertId;

    let eventoNombre = null;
    if (evento) {
      const [eventoRows] = await pool.query("SELECT id, nombre FROM eventos WHERE nombre = ?", [evento]);
      if (eventoRows.length > 0) {
        await pool.query("INSERT INTO inscripciones (usuario_id, evento_id) VALUES (?, ?)", [userId, eventoRows[0].id]);
        eventoNombre = eventoRows[0].nombre;
      }
    }

    // Correo de bienvenida (no bloquea la creación si falla)
    const correo = await enviarBienvenida({
      email,
      nombre: `${nombre} ${apellido}`,
      tempPassword,
      eventoNombre,
    });

    res.status(201).json({
      id: userId,
      message: "Participante creado exitosamente",
      emailEnviado: correo.ok,
      passwordTemporal: tempPassword,
    });
  } catch (error) {
    console.error("Error al crear participante:", error);
    if (error.code === "ER_DUP_ENTRY") {
      return res.status(400).json({ message: "El correo electrónico ya está registrado" });
    }
    res.status(500).json({ message: "Error al crear participante" });
  }
};

// Actualizar participante
exports.updateParticipante = async (req, res) => {
  try {
    const { id } = req.params;
    const { nombre, apellido, email, dni, telefono, estado, empresa } = req.body;

    if (!nombre || !apellido || !email) {
      return res.status(400).json({
        message: "Nombre, apellido y correo son obligatorios",
      });
    }

    await pool.query(
      "UPDATE usuarios SET nombre=?, apellido=?, email=?, dni=?, telefono=?, estado=?, empresa=? WHERE id=?",
      [nombre, apellido, email, dni, telefono, estado || "Activo", empresa || null, id]
    );

    res.json({ message: "Participante actualizado exitosamente" });
  } catch (error) {
    console.error("Error al actualizar participante:", error);
    if (error.code === "ER_DUP_ENTRY") {
      return res
        .status(400)
        .json({ message: "El correo electrónico ya está registrado" });
    }
    res.status(500).json({ message: "Error al actualizar participante" });
  }
};

// Eliminar participante
exports.deleteParticipante = async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query("DELETE FROM usuarios WHERE id=?", [id]);
    res.json({ message: "Participante eliminado exitosamente" });
  } catch (error) {
    console.error("Error al eliminar participante:", error);
    res.status(500).json({ message: "Error al eliminar participante" });
  }
};

// Eventos en los que está inscrito un participante (para el portal)
exports.getEventosByParticipante = async (req, res) => {
  try {
    const { id } = req.params;
    const [eventos] = await pool.query(
      `SELECT e.*,
              i.id AS inscripcion_id,
              i.estado AS estado_inscripcion,
              i.progreso,
              i.calidad,
              i.fecha_inscripcion
       FROM inscripciones i
       JOIN eventos e ON i.evento_id = e.id
       WHERE i.usuario_id = ?
       ORDER BY e.fecha_inicio DESC`,
      [id],
    );
    res.json(eventos);
  } catch (error) {
    console.error("Error al obtener eventos del participante:", error);
    res.status(500).json({ message: "Error al obtener eventos" });
  }
};

// Materiales de los eventos en los que está inscrito un participante
exports.getMaterialesByParticipante = async (req, res) => {
  try {
    const { id } = req.params;
    const [materiales] = await pool.query(
      `SELECT m.*, e.nombre AS evento_nombre
       FROM materiales m
       JOIN inscripciones i ON m.evento_id = i.evento_id
       JOIN eventos e ON m.evento_id = e.id
       WHERE i.usuario_id = ?
         AND m.nombre_archivo <> ''
         AND m.url_descarga <> ''
       ORDER BY m.fecha_subida DESC`,
      [id],
    );
    res.json(materiales);
  } catch (error) {
    console.error("Error al obtener materiales del participante:", error);
    res.status(500).json({ message: "Error al obtener materiales" });
  }
};