const express = require("express");
const router = express.Router();
const auditoria = require("../controllers/auditoriaController");

// Montado bajo /api/auditoria y protegido como admin desde server.js.
router.get("/", auditoria.getAuditoria);
router.get("/filtros", auditoria.getFiltros);

module.exports = router;
