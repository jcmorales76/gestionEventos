const express = require("express");
const cors = require("cors");
const authRoutes = require("./routes/authRoutes");
const eventoRoutes = require("./routes/eventoRoutes");
const participanteRoutes = require("./routes/participanteRoutes");
const configRoutes = require("./routes/configRoutes");
const usuarioRoutes = require("./routes/usuarioRoutes");
const materialRoutes = require("./routes/materialRoutes");
const certificadoRoutes = require("./routes/certificadoRoutes");
const inscripcionRoutes = require("./routes/inscripcionRoutes");
const plantillaRoutes = require("./routes/plantillaRoutes");
const path = require("path");

const app = express();
const PORT = 5000;

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
app.use(
  "/uploads/certificados",
  express.static(path.join(__dirname, "uploads/certificados")),
);
app.use("/api/plantillas", plantillaRoutes);
app.use(
  "/uploads/plantillas",
  express.static(path.join(__dirname, "uploads/plantillas")),
);

// Ruta de prueba
app.get("/", (req, res) => {
  res.send("API de EventFlow funcionando correctamente 🚀");
});

// Manejo de rutas no encontradas
app.use((req, res) => {
  res.status(404).json({ message: "Ruta no encontrada" });
});

app.listen(PORT, () => {
  console.log(`✅ Servidor corriendo en http://localhost:${PORT}`);
  console.log(`📌 Rutas disponibles:`);
  console.log(`   - GET  http://localhost:${PORT}/`);
  console.log(`   - POST http://localhost:${PORT}/api/auth/login`);
  console.log(`   - GET  http://localhost:${PORT}/api/eventos`);
  console.log(`   - POST http://localhost:${PORT}/api/eventos`);
});
