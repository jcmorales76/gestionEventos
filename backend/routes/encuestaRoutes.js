const express = require("express");
const router = express.Router();
const {
  getEncuestaByEvento,
  guardarEncuesta,
  getEstadoEncuesta,
  responderEncuesta,
  getEncuestasParticipante,
} = require("../controllers/encuestaController");

router.get("/evento/:eventoId", getEncuestaByEvento);
router.post("/", guardarEncuesta);
router.get("/estado/:eventoId/:usuarioId", getEstadoEncuesta);
router.post("/responder", responderEncuesta);
router.get("/participante/:usuarioId", getEncuestasParticipante);

module.exports = router;
