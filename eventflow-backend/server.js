require("dotenv").config();
const express = require("express");
const cors = require("cors");
const fs = require("fs");
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
const path = require("path");

const app = express();
const PORT = process.env.PORT || 5000;

// Middlewares
app.use(cors());
app.use(express.json());

// Rutas
app.use("/api/auth", authRoutes);
app.use("/api/eventos", eventoRoutes);
app.use("/api/participantes", participanteRoutes);
app.use("/api/config", configRoutes);
app.use("/uploads", express.static(path.join(__dirname, "uploads")));
app.use("/api/usuarios", usuarioRoutes);
app.use("/api/materiales", materialRoutes);
app.use("/uploads", express.static(path.join(__dirname, "uploads")));
app.use("/api/certificados", certificadoRoutes);
app.use("/api/inscripciones", inscripcionRoutes);
app.use("/uploads", express.static("uploads"));
app.use(
  "/uploads/certificados",
  express.static(path.join(__dirname, "uploads/certificados")),
);
app.use("/api/plantillas", plantillaRoutes);
app.use("/api/importacion", importacionRoutes);
app.use("/api/encuestas", encuestaRoutes);
app.use("/api/stats", statsRoutes);
app.use(
  "/uploads/plantillas",
  express.static(path.join(__dirname, "uploads/plantillas")),
);

// Health check de la API
app.get("/api/health", (req, res) => {
  res.json({ ok: true, message: "API de EventFlow funcionando 🚀" });
});

// Servir el frontend (build de React) si existe la carpeta ./public.
// En producción (cPanel) se copia el contenido de frontend/dist aquí.
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
});
