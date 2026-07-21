require("dotenv").config();
const express = require("express");
const cors = require("cors");
const fs = require("fs");
const path = require("path");

const { auth, requireRole } = require("./middleware/auth");
const authController = require("./controllers/authController");
const configController = require("./controllers/configController");
const { migrarPasswordsPlanas } = require("./utils/migratePasswords");
const { migrarEsquema } = require("./utils/migrateSchema");
const { auditoriaAuto } = require("./utils/auditoria");

const authRoutes = require("./routes/authRoutes");
const eventoRoutes = require("./routes/eventoRoutes");
const participanteRoutes = require("./routes/participanteRoutes");
const configRoutes = require("./routes/configRoutes");
const usuarioRoutes = require("./routes/usuarioRoutes");
const materialRoutes = require("./routes/materialRoutes");
const certificadoRoutes = require("./routes/certificadoRoutes");
const inscripcionRoutes = require("./routes/inscripcionRoutes");
const plantillaRoutes = require("./routes/plantillaRoutes");
const importacionRoutes = require("./routes/importacionRoutes");
const encuestaRoutes = require("./routes/encuestaRoutes");
const statsRoutes = require("./routes/statsRoutes");
const tipoEventoRoutes = require("./routes/tipoEventoRoutes");
const descargaRoutes = require("./routes/descargaRoutes");
const finanzasRoutes = require("./routes/finanzasRoutes");
const auditoriaRoutes = require("./routes/auditoriaRoutes");

const app = express();
const PORT = process.env.PORT || 5000;

// Middlewares
app.use(cors());
app.use(express.json());

// Archivos subidos (públicos: logos, materiales, certificados, avatars)
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// ===== Rutas PÚBLICAS (sin token) =====
app.get("/api/health", (req, res) =>
  res.json({ ok: true, message: "API de EventFlow funcionando 🚀" }),
);
app.post("/api/auth/login", authController.login);
app.get("/api/config/logo", configController.getLogo); // logo para el login
app.get("/api/config", configController.getConfiguracion); // nombre/logo del sistema

// ===== A partir de aquí, TODO /api requiere token válido =====
app.use("/api", auth);

// Bitácora de auditoría: captura automática de mutaciones (tras autenticar).
app.use("/api", auditoriaAuto);

// ===== Rutas PROTEGIDAS =====
app.use("/api/auth", authRoutes); // change-password (login ya resuelto arriba)
app.use("/api/eventos", eventoRoutes);
app.use("/api/participantes", participanteRoutes);
app.use("/api/materiales", materialRoutes);
app.use("/api/certificados", certificadoRoutes);
app.use("/api/inscripciones", inscripcionRoutes);
app.use("/api/plantillas", plantillaRoutes);
app.use("/api/encuestas", encuestaRoutes);
app.use("/api/tipos-evento", tipoEventoRoutes);
app.use("/api/descargas", descargaRoutes);
// Solo administradores:
app.use("/api/config", requireRole("admin"), configRoutes);
app.use("/api/usuarios", requireRole("admin"), usuarioRoutes);
app.use("/api/importacion", requireRole("admin"), importacionRoutes);
app.use("/api/stats", requireRole("admin"), statsRoutes);
app.use("/api/finanzas", requireRole("admin"), finanzasRoutes);
app.use("/api/auditoria", requireRole("admin"), auditoriaRoutes);

// ===== Frontend (build de React) si existe ./public =====
const frontendDir = path.join(__dirname, "public");
if (fs.existsSync(frontendDir)) {
  app.use(express.static(frontendDir));
  // SPA fallback: cualquier GET que no sea /api ni /uploads → index.html
  app.use((req, res, next) => {
    if (req.method !== "GET") return next();
    if (req.path.startsWith("/api") || req.path.startsWith("/uploads"))
      return next();
    return res.sendFile(path.join(frontendDir, "index.html"));
  });
}

// Manejo de rutas no encontradas (API)
app.use((req, res) => {
  res.status(404).json({ message: "Ruta no encontrada" });
});

app.listen(PORT, () => {
  console.log(`✅ Servidor corriendo en el puerto ${PORT}`);
  // Migraciones idempotentes al arrancar
  migrarEsquema();
  migrarPasswordsPlanas();
});
