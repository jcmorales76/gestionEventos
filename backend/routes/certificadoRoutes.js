const express = require("express");
const router = express.Router();
const {
  generarCertificado,
  generarCertificadosMasivos,
  getCertificadosByParticipante,
  verificarEventosFinalizados,
  generarCertificadosAutomaticos,
} = require("../controllers/certificadoController");

// Rutas
router.get("/participante/:usuarioId", getCertificadosByParticipante);
router.get("/verificar-eventos", verificarEventosFinalizados);
router.post("/generar-automatico", generarCertificadosAutomaticos);
router.post("/generar-masivo/:eventoId", generarCertificadosMasivos);
router.post("/generar/:inscripcionId", generarCertificado);

module.exports = router;
