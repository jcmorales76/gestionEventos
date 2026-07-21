const express = require("express");
const router = express.Router();
const finanzas = require("../controllers/finanzasController");

// Todas las rutas se montan bajo /api/finanzas y ya vienen protegidas como
// admin desde server.js (requireRole("admin")).

// Resumen general del evento (lo que consume el dashboard financiero)
router.get("/evento/:eventoId/resumen", finanzas.getResumen);
router.get("/evento/:eventoId/proyeccion", finanzas.getProyeccion);
router.get("/evento/:eventoId/historial", finanzas.getHistorial);

// Configuración y cuadro de precios
router.put("/evento/:eventoId/config", finanzas.updateConfig);
router.put("/evento/:eventoId/tramos", finanzas.updateTramos);

// Inscritos (lotes)
router.post("/evento/:eventoId/lotes", finanzas.crearLote);
router.post("/evento/:eventoId/sync-inscritos", finanzas.sincronizarInscritos);
router.put("/lotes/:id", finanzas.editarLote);
router.delete("/lotes/:id", finanzas.eliminarLote);

// Auspicios
router.post("/evento/:eventoId/auspicios", finanzas.crearAuspicio);
router.put("/auspicios/:id", finanzas.editarAuspicio);
router.delete("/auspicios/:id", finanzas.eliminarAuspicio);

// Categorías de auspicio
router.post("/evento/:eventoId/categorias", finanzas.crearCategoria);
router.delete("/categorias/:id", finanzas.eliminarCategoria);

module.exports = router;
