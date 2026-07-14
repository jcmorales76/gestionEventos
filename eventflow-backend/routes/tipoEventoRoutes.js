const express = require("express");
const router = express.Router();
const { requireRole } = require("../middleware/auth");
const {
  getTipos,
  createTipo,
  updateTipo,
  deleteTipo,
} = require("../controllers/tipoEventoController");

// Leer: cualquier usuario autenticado (lo usan los formularios de eventos)
router.get("/", getTipos);
// Escribir: solo administradores
router.post("/", requireRole("admin"), createTipo);
router.put("/:id", requireRole("admin"), updateTipo);
router.delete("/:id", requireRole("admin"), deleteTipo);

module.exports = router;
