const pool = require("../config/db");

exports.getTipos = async (req, res) => {
  try {
    const [tipos] = await pool.query(
      "SELECT id, nombre FROM tipos_evento ORDER BY nombre",
    );
    res.json(tipos);
  } catch (error) {
    console.error("Error al obtener tipos de evento:", error);
    res.status(500).json({ message: "Error al obtener tipos de evento" });
  }
};

exports.createTipo = async (req, res) => {
  try {
    const { nombre } = req.body;
    if (!nombre || !nombre.trim()) {
      return res.status(400).json({ message: "El nombre es obligatorio" });
    }
    const [r] = await pool.query(
      "INSERT INTO tipos_evento (nombre) VALUES (?)",
      [nombre.trim()],
    );
    res.status(201).json({ id: r.insertId, nombre: nombre.trim() });
  } catch (error) {
    if (error.code === "ER_DUP_ENTRY") {
      return res.status(400).json({ message: "Ese tipo ya existe" });
    }
    console.error("Error al crear tipo de evento:", error);
    res.status(500).json({ message: "Error al crear tipo de evento" });
  }
};

exports.updateTipo = async (req, res) => {
  try {
    const { id } = req.params;
    const { nombre } = req.body;
    if (!nombre || !nombre.trim()) {
      return res.status(400).json({ message: "El nombre es obligatorio" });
    }
    await pool.query("UPDATE tipos_evento SET nombre = ? WHERE id = ?", [
      nombre.trim(),
      id,
    ]);
    res.json({ message: "Tipo actualizado" });
  } catch (error) {
    if (error.code === "ER_DUP_ENTRY") {
      return res.status(400).json({ message: "Ese tipo ya existe" });
    }
    console.error("Error al actualizar tipo de evento:", error);
    res.status(500).json({ message: "Error al actualizar tipo de evento" });
  }
};

exports.deleteTipo = async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query("DELETE FROM tipos_evento WHERE id = ?", [id]);
    res.json({ message: "Tipo eliminado" });
  } catch (error) {
    console.error("Error al eliminar tipo de evento:", error);
    res.status(500).json({ message: "Error al eliminar tipo de evento" });
  }
};
