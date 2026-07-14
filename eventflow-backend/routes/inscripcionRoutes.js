const express = require("express");
const router = express.Router();
const pool = require("../config/db");
const { requireRole } = require("../middleware/auth");

// Inscritos de un evento (con su calidad)
router.get("/evento/:eventoId", async (req, res) => {
  try {
    const [inscripciones] = await pool.query(
      `SELECT i.id, i.usuario_id, i.evento_id, i.calidad, i.fecha_inscripcion,
              u.nombre, u.apellido, u.email, u.empresa, u.dni
       FROM inscripciones i
       JOIN usuarios u ON i.usuario_id = u.id
       WHERE i.evento_id = ?
       ORDER BY u.apellido, u.nombre`,
      [req.params.eventoId],
    );
    res.json(inscripciones);
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ message: "Error al obtener inscripciones" });
  }
});

// Inscribir varios usuarios existentes a un evento, con una calidad (admin)
router.post("/masiva", requireRole("admin"), async (req, res) => {
  try {
    const { eventoId, usuarioIds, calidad } = req.body;
    if (!eventoId || !Array.isArray(usuarioIds) || usuarioIds.length === 0) {
      return res
        .status(400)
        .json({ message: "Selecciona al menos un participante" });
    }
    let nuevas = 0;
    let yaInscritos = 0;
    for (const uid of usuarioIds) {
      const [ex] = await pool.query(
        "SELECT id FROM inscripciones WHERE usuario_id = ? AND evento_id = ?",
        [uid, eventoId],
      );
      if (ex.length > 0) {
        yaInscritos++;
        continue;
      }
      await pool.query(
        "INSERT INTO inscripciones (usuario_id, evento_id, calidad) VALUES (?, ?, ?)",
        [uid, eventoId, calidad || "Participante"],
      );
      nuevas++;
    }
    res.json({
      message: `Inscritos: ${nuevas} nuevo(s), ${yaInscritos} ya estaban`,
      nuevas,
      yaInscritos,
    });
  } catch (error) {
    console.error("Error al inscribir:", error);
    res.status(500).json({ message: "Error al inscribir participantes" });
  }
});

// Quitar una inscripción (admin)
router.delete("/:id", requireRole("admin"), async (req, res) => {
  try {
    await pool.query("DELETE FROM inscripciones WHERE id = ?", [req.params.id]);
    res.json({ message: "Inscripción eliminada" });
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ message: "Error al eliminar la inscripción" });
  }
});

module.exports = router;
