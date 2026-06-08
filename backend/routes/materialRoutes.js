const express = require("express");
const router = express.Router();
const {
  upload,
  getMaterialesByEvento,
  uploadMaterial,
  deleteMaterial,
  crearSesion,
  getSesionesByEvento,
} = require("../controllers/materialController");

router.get("/evento/:eventoId", getMaterialesByEvento);
router.get("/evento/:eventoId/sesiones", getSesionesByEvento);
router.post("/upload", upload.single("archivo"), uploadMaterial);
router.post("/crear-sesion", crearSesion);
router.delete("/:id", deleteMaterial);

module.exports = router;
