const express = require("express");
const router = express.Router();
const {
  getInscripciones,
  getInscripcionesByEvento,
  createInscripcion,
  updateInscripcion,
  deleteInscripcion,
} = require("../controllers/inscripcionController");

router.get("/", getInscripciones);
router.get("/evento/:eventoId", getInscripcionesByEvento); // ✅ Ruta clave para Certificados
router.post("/", createInscripcion);
router.put("/:id", updateInscripcion);
router.delete("/:id", deleteInscripcion);

module.exports = router;
