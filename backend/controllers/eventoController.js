const pool = require("../config/db");
const { registrarAuditoria } = require("../utils/auditoria");

// Obtener todos los eventos
exports.getEventos = async (req, res) => {
  try {
    const [eventos] = await pool.query(
      `SELECT e.*,
              (SELECT COUNT(*) FROM inscripciones i WHERE i.evento_id = e.id) AS inscritos_reales
       FROM eventos e
       ORDER BY e.fecha_inicio DESC`,
    );
    // El conteo real de inscritos se calcula desde inscripciones (la columna
    // eventos.inscritos quedaba desactualizada).
    res.json(eventos.map((e) => ({ ...e, inscritos: e.inscritos_reales })));
  } catch (error) {
    console.error("Error al obtener eventos:", error);
    res.status(500).json({ message: "Error al obtener eventos" });
  }
};

// Crear nuevo evento
exports.createEvento = async (req, res) => {
  try {
    const {
      nombre,
      tipo,
      estado,
      descripcion,
      fecha_inicio,
      fecha_fin,
      hora_inicio,
      capacidad,
      lugar,
      expositor,
      color,
      horas_academicas,
      instructor,
    } = req.body;

    const [result] = await pool.query(
      `INSERT INTO eventos (nombre, tipo, estado, descripcion, fecha_inicio, fecha_fin, 
        hora_inicio, capacidad, lugar, expositor, color, horas_academicas, instructor) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        nombre,
        tipo,
        estado,
        descripcion,
        fecha_inicio,
        fecha_fin,
        hora_inicio,
        capacidad,
        lugar,
        expositor,
        color,
        horas_academicas,
        instructor,
      ],
    );

    await registrarAuditoria(req, {
      accion: "crear",
      modulo: "eventos",
      entidad_id: result.insertId,
      descripcion: `Creó el evento "${nombre}"`,
    });

    res.status(201).json({
      id: result.insertId,
      message: "Evento creado exitosamente",
    });
  } catch (error) {
    console.error("Error al crear evento:", error);
    res.status(500).json({ message: "Error al crear evento" });
  }
};

// Actualizar evento
exports.updateEvento = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      nombre,
      tipo,
      estado,
      descripcion,
      fecha_inicio,
      fecha_fin,
      hora_inicio,
      capacidad,
      lugar,
      expositor,
      color,
      horas_academicas,
      instructor,
    } = req.body;

    await pool.query(
      `UPDATE eventos SET nombre=?, tipo=?, estado=?, descripcion=?, 
        fecha_inicio=?, fecha_fin=?, hora_inicio=?, capacidad=?, 
        lugar=?, expositor=?, color=?, horas_academicas=?, instructor=? 
       WHERE id=?`,
      [
        nombre,
        tipo,
        estado,
        descripcion,
        fecha_inicio,
        fecha_fin,
        hora_inicio,
        capacidad,
        lugar,
        expositor,
        color,
        horas_academicas,
        instructor,
        id,
      ],
    );

    await registrarAuditoria(req, {
      accion: "editar",
      modulo: "eventos",
      entidad_id: Number(id) || null,
      descripcion: `Editó el evento "${nombre}"`,
    });

    res.json({ message: "Evento actualizado exitosamente" });
  } catch (error) {
    console.error("Error al actualizar evento:", error);
    res.status(500).json({ message: "Error al actualizar evento" });
  }
};

// Eliminar evento
exports.deleteEvento = async (req, res) => {
  try {
    const { id } = req.params;
    const [[ev]] = await pool.query("SELECT nombre FROM eventos WHERE id=?", [id]);
    await pool.query("DELETE FROM eventos WHERE id=?", [id]);
    await registrarAuditoria(req, {
      accion: "eliminar",
      modulo: "eventos",
      entidad_id: Number(id) || null,
      descripcion: `Eliminó el evento "${ev?.nombre || id}"`,
    });
    res.json({ message: "Evento eliminado exitosamente" });
  } catch (error) {
    console.error("Error al eliminar evento:", error);
    res.status(500).json({ message: "Error al eliminar evento" });
  }
};

// Obtener un evento por ID
exports.getEventoById = async (req, res) => {
  try {
    const { id } = req.params;
    const [eventos] = await pool.query(
      `SELECT e.*,
              (SELECT COUNT(*) FROM inscripciones i WHERE i.evento_id = e.id) AS inscritos_reales
       FROM eventos e WHERE e.id = ?`,
      [id],
    );

    if (eventos.length === 0) {
      return res.status(404).json({ message: "Evento no encontrado" });
    }

    const ev = eventos[0];
    res.json({ ...ev, inscritos: ev.inscritos_reales });
  } catch (error) {
    console.error("Error al obtener evento:", error);
    res.status(500).json({ message: "Error al obtener evento" });
  }
};
