const express = require("express");
const router = express.Router();
const pool = require("../config/db");

// Registrar una descarga (el usuario se toma del token, no del body)
router.post("/", async (req, res) => {
  try {
    const { tipo, referenciaId } = req.body;
    if (!["certificado", "material"].includes(tipo) || !referenciaId) {
      return res.status(400).json({ message: "Datos inválidos" });
    }
    await pool.query(
      "INSERT INTO descargas (tipo, referencia_id, usuario_id) VALUES (?, ?, ?)",
      [tipo, referenciaId, req.user.id],
    );
    res.json({ ok: true });
  } catch (error) {
    console.error("Error al registrar descarga:", error);
    res.status(500).json({ message: "Error al registrar la descarga" });
  }
});

module.exports = router;
