const express = require("express");
const router = express.Router();
const certificadoController = require("../controllers/certificadoController");

// Rutas
router.get(
  "/participante/:usuarioId",
  certificadoController.getCertificadosByParticipante,
);
router.get(
  "/verificar-eventos",
  certificadoController.verificarEventosFinalizados,
);
router.post(
  "/generar-automatico",
  certificadoController.generarCertificadosAutomaticos,
);
router.post(
  "/generar-masivo/:eventoId",
  certificadoController.generarCertificadosMasivos,
);
router.post(
  "/generar/:inscripcionId",
  certificadoController.generarCertificado,
);

module.exports = router;
