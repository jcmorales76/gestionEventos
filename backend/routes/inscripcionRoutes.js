const express = require("express");
const router = express.Router();
const { getInscripcionesByEvento, getAllInscripciones } = require("../controllers/inscripcionController");

router.get("/evento/:eventoId", getInscripcionesByEvento);
router.get("/", getAllInscripciones);

module.exports = router;