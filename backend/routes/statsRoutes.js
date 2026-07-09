const express = require("express");
const router = express.Router();
const { getDashboard, getReportes } = require("../controllers/statsController");

router.get("/dashboard", getDashboard);
router.get("/reportes", getReportes);

module.exports = router;
