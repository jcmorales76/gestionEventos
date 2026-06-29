const express = require("express");
const router = express.Router();
const pool = require("../config/db");

router.get("/evento/:eventoId", async (req, res) => {
  try {
    const [inscripciones] = await pool.query(
      "SELECT i.id, i.usuario_id, i.evento_id, i.calidad, u.nombre, u.apellido, u.email FROM inscripciones i JOIN usuarios u ON i.usuario_id = u.id WHERE i.evento_id = ?",
      [req.params.eventoId]
    );
    res.json(inscripciones);
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ message: "Error al obtener inscripciones" });
  }
});

module.exports = router;