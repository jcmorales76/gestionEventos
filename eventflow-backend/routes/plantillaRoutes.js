const express = require("express");
const router = express.Router();
const { 
  upload, 
  uploadPlantilla, 
  getPlantillaByEvento, 
  generarCertificadoConPlantilla,
  generarCertificadosMasivos 
} = require("../controllers/plantillaController");

router.get("/:eventoId", getPlantillaByEvento);
router.post("/:eventoId", upload.single("imagen"), uploadPlantilla);
router.post("/generar/:inscripcionId", generarCertificadoConPlantilla);
router.post("/generar-masivo/:eventoId", generarCertificadosMasivos);

module.exports = router;