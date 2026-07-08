const express = require("express");
const router = express.Router();
const {
  getParticipantes,
  createParticipante,
  updateParticipante,
  deleteParticipante,
} = require("../controllers/participanteController");

router.get("/", getParticipantes);
router.post("/", createParticipante);
router.put("/:id", updateParticipante);
router.delete("/:id", deleteParticipante);

module.exports = router;
