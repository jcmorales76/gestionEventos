const express = require("express");
const router = express.Router();
const { importarParticipantes } = require("../controllers/importacionController");

router.post("/", importarParticipantes);

module.exports = router;
