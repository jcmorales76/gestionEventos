const express = require("express");
const router = express.Router();
const {
  getParticipantes,
  createParticipante,
  deleteParticipante,
} = require("../controllers/participanteController");

router.get("/", getParticipantes);
router.post("/", createParticipante);
router.delete("/:id", deleteParticipante);

module.exports = router;
