const express = require("express");
const router = express.Router();
const {
  getParticipantes,
  createParticipante,
  updateParticipante,
  deleteParticipante,
  getEventosByParticipante,
  getMaterialesByParticipante,
} = require("../controllers/participanteController");

router.get("/", getParticipantes);
router.get("/:id/eventos", getEventosByParticipante);
router.get("/:id/materiales", getMaterialesByParticipante);
router.post("/", createParticipante);
router.put("/:id", updateParticipante);
router.delete("/:id", deleteParticipante);

module.exports = router;
