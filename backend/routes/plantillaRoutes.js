const express = require("express");
const router = express.Router();
const {
  upload,
  uploadPlantilla,
  getPlantillaByEvento,
} = require("../controllers/plantillaController");

router.get("/:eventoId", getPlantillaByEvento);
router.post("/:eventoId", upload.single("imagen"), uploadPlantilla);

module.exports = router;
