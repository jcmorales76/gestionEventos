const express = require("express");
const router = express.Router();
const { requireRole } = require("../middleware/auth");
const {
  upload,
  getMaterialesByEvento,
  uploadMaterial,
  deleteMaterial,
  crearSesion,
  getSesionesByEvento,
  renombrarSesion,
} = require("../controllers/materialController");

router.get("/evento/:eventoId", getMaterialesByEvento);
router.get("/evento/:eventoId/sesiones", getSesionesByEvento);
router.post("/upload", upload.single("archivo"), uploadMaterial);
router.post("/crear-sesion", crearSesion);
router.put("/renombrar-sesion", requireRole("admin"), renombrarSesion);
router.delete("/:id", deleteMaterial);

module.exports = router;
