const express = require("express");
const router = express.Router();
const { requireRole } = require("../middleware/auth");
const {
  getEncuestaByEvento,
  guardarEncuesta,
  getEstadoEncuesta,
  responderEncuesta,
  getEncuestasParticipante,
  getReporteEncuesta,
} = require("../controllers/encuestaController");

router.get("/evento/:eventoId", getEncuestaByEvento);
router.post("/", guardarEncuesta);
router.get("/estado/:eventoId/:usuarioId", getEstadoEncuesta);
router.post("/responder", responderEncuesta);
router.get("/participante/:usuarioId", getEncuestasParticipante);
router.get("/reportes/:eventoId", requireRole("admin"), getReporteEncuesta);

module.exports = router;
