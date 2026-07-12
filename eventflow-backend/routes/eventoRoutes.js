const express = require("express");
const router = express.Router();
const {
  getEventos,
  createEvento,
  updateEvento,
  deleteEvento,
} = require("../controllers/eventoController");

router.get("/", getEventos);
router.post("/", createEvento);
router.put("/:id", updateEvento);
router.delete("/:id", deleteEvento);

module.exports = router;
