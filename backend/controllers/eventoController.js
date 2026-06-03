const pool = require("../config/db");

// Obtener todos los eventos
exports.getEventos = async (req, res) => {
  try {
    const [eventos] = await pool.query(
      "SELECT * FROM eventos ORDER BY fecha_inicio DESC",
    );
    res.json(eventos);
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
    await pool.query("DELETE FROM eventos WHERE id=?", [id]);
    res.json({ message: "Evento eliminado exitosamente" });
  } catch (error) {
    console.error("Error al eliminar evento:", error);
    res.status(500).json({ message: "Error al eliminar evento" });
  }
};
