const multer = require("multer");
const path = require("path");
const fs = require("fs");
const PDFDocument = require("pdfkit");
const pool = require("../config/db");

// ============================================
// CONFIGURACIÓN DE SUBIDA
// ============================================
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.join(__dirname, "../uploads/plantillas");
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    cb(
      null,
      `plantilla_${req.params.eventoId}_${Date.now()}${path.extname(file.originalname)}`,
    );
  },
});

const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    const allowed = /jpeg|jpg|png/;
    cb(null, allowed.test(path.extname(file.originalname).toLowerCase()));
  },
});

// ============================================
// SUBIR/ACTUALIZAR PLANTILLA
// ============================================
exports.uploadPlantilla = async (req, res) => {
  try {
    const { eventoId } = req.params;
    const {
      pos_nombre_x,
      pos_nombre_y,
      pos_tema_x,
      pos_tema_y,
      pos_calidad_x,
      pos_calidad_y,
      pos_fecha_x,
      pos_fecha_y,
    } = req.body;

    // Verificar si ya existe plantilla
    const [existing] = await pool.query(
      "SELECT id FROM plantillas_certificados WHERE evento_id = ?",
      [eventoId],
    );

    if (!req.file) {
      // Si no hay archivo nuevo, solo actualizar coordenadas
      if (existing.length === 0) {
        return res.status(400).json({ message: "Primero sube una imagen" });
      }

      await pool.query(
        `UPDATE plantillas_certificados 
         SET pos_nombre_x=?, pos_nombre_y=?, 
             pos_tema_x=?, pos_tema_y=?,
             pos_calidad_x=?, pos_calidad_y=?,
             pos_fecha_x=?, pos_fecha_y=?
         WHERE evento_id = ?`,
        [
          pos_nombre_x || 50,
          pos_nombre_y || 45,
          pos_tema_x || 50,
          pos_tema_y || 55,
          pos_calidad_x || 50,
          pos_calidad_y || 70,
          pos_fecha_x || 50,
          pos_fecha_y || 85,
          eventoId,
        ],
      );

      return res.json({ message: "Posiciones actualizadas" });
    }

    const urlPlantilla = `/uploads/plantillas/${req.file.filename}`;

    if (existing.length > 0) {
      // Actualizar
      await pool.query(
        `UPDATE plantillas_certificados 
         SET url_plantilla = ?, 
             pos_nombre_x = ?, pos_nombre_y = ?,
             pos_tema_x = ?, pos_tema_y = ?,
             pos_calidad_x = ?, pos_calidad_y = ?,
             pos_fecha_x = ?, pos_fecha_y = ?
         WHERE evento_id = ?`,
        [
          urlPlantilla,
          pos_nombre_x || 50,
          pos_nombre_y || 45,
          pos_tema_x || 50,
          pos_tema_y || 55,
          pos_calidad_x || 50,
          pos_calidad_y || 70,
          pos_fecha_x || 50,
          pos_fecha_y || 85,
          eventoId,
        ],
      );
    } else {
      // Insertar
      await pool.query(
        `INSERT INTO plantillas_certificados 
         (evento_id, url_plantilla, 
          pos_nombre_x, pos_nombre_y, 
          pos_tema_x, pos_tema_y, 
          pos_calidad_x, pos_calidad_y,
          pos_fecha_x, pos_fecha_y)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          eventoId,
          urlPlantilla,
          pos_nombre_x || 50,
          pos_nombre_y || 45,
          pos_tema_x || 50,
          pos_tema_y || 55,
          pos_calidad_x || 50,
          pos_calidad_y || 70,
          pos_fecha_x || 50,
          pos_fecha_y || 85,
        ],
      );
    }

    res.json({ message: "Plantilla guardada exitosamente", url: urlPlantilla });
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ message: "Error al guardar plantilla" });
  }
};

// ============================================
// OBTENER PLANTILLA DE UN EVENTO
// ============================================
exports.getPlantillaByEvento = async (req, res) => {
  try {
    const { eventoId } = req.params;
    const [plantillas] = await pool.query(
      "SELECT * FROM plantillas_certificados WHERE evento_id = ?",
      [eventoId],
    );

    if (plantillas.length === 0) {
      return res.status(404).json({ message: "Plantilla no encontrada" });
    }

    res.json(plantillas[0]);
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ message: "Error al obtener plantilla" });
  }
};

// ============================================
// GENERAR CERTIFICADO CON PLANTILLA PERSONALIZADA
// ============================================
exports.generarCertificadoConPlantilla = async (req, res) => {
  try {
    const { inscripcionId } = req.params;

    // Obtener datos de inscripción
    const [inscripciones] = await pool.query(
      `SELECT i.id as inscripcion_id, i.evento_id, i.calidad,
             u.nombre, u.apellido,
             e.nombre as evento_nombre, e.tema, e.fecha_inicio, e.horas_academicas
      FROM inscripciones i
      INNER JOIN usuarios u ON i.usuario_id = u.id
      INNER JOIN eventos e ON i.evento_id = e.id
      WHERE i.id = ?`,
      [inscripcionId],
    );

    if (inscripciones.length === 0) {
      return res.status(404).json({ message: "Inscripción no encontrada" });
    }

    const inscripcion = inscripciones[0];

    // Obtener plantilla
    const [plantillas] = await pool.query(
      "SELECT * FROM plantillas_certificados WHERE evento_id = ?",
      [inscripcion.evento_id],
    );

    if (plantillas.length === 0) {
      return res.status(404).json({ message: "No hay plantilla configurada" });
    }

    const plantilla = plantillas[0];

    // Crear directorio de salida
    const uploadDir = path.join(__dirname, "../uploads/certificados");
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    const fileName = `certificado_${inscripcionId}_${Date.now()}.pdf`;
    const filePath = path.join(uploadDir, fileName);
    const urlPdf = `/uploads/certificados/${fileName}`;

    // Crear PDF A4 horizontal
    const doc = new PDFDocument({
      size: "A4",
      layout: "landscape",
      margins: { top: 0, bottom: 0, left: 0, right: 0 },
    });

    const stream = fs.createWriteStream(filePath);
    doc.pipe(stream);

    // Cargar imagen de fondo
    const imagePath = path.join(__dirname, "..", plantilla.url_plantilla);
    if (fs.existsSync(imagePath)) {
      doc.image(imagePath, 0, 0, {
        width: doc.page.width,
        height: doc.page.height,
      });
    }

    // Función para convertir porcentaje a puntos PDF
    const toX = (percent) => (percent / 100) * doc.page.width;
    const toY = (percent) => (percent / 100) * doc.page.height;

    // NOMBRE
    doc
      .fontSize(plantilla.font_size_nombre || 24)
      .font("Helvetica-Bold")
      .fillColor(plantilla.color_nombre || "#1e3a8a")
      .text(
        `${inscripcion.nombre} ${inscripcion.apellido}`.toUpperCase(),
        toX(plantilla.pos_nombre_x),
        toY(plantilla.pos_nombre_y),
        { align: "center", width: 400 },
      );

    // TEMA (opcional)
    if (inscripcion.tema) {
      doc
        .fontSize(14)
        .font("Helvetica-Oblique")
        .fillColor("#3b82f6")
        .text(
          `"${inscripcion.tema}"`,
          toX(plantilla.pos_tema_x),
          toY(plantilla.pos_tema_y),
          { align: "center", width: 500 },
        );
    }

    // CALIDAD
    doc
      .fontSize(plantilla.font_size_calidad || 18)
      .font("Helvetica-Bold")
      .fillColor(plantilla.color_calidad || "#1e3a8a")
      .text(
        (inscripcion.calidad || "PARTICIPANTE").toUpperCase(),
        toX(plantilla.pos_calidad_x),
        toY(plantilla.pos_calidad_y),
        { align: "center", width: 300 },
      );

    // FECHA
    const fechaFormateada = inscripcion.fecha_inicio
      ? new Date(inscripcion.fecha_inicio).toLocaleDateString("es-ES", {
          day: "numeric",
          month: "long",
          year: "numeric",
        })
      : "22, 23 y 24 de abril del 2026";

    doc
      .fontSize(12)
      .font("Helvetica")
      .fillColor("#000000")
      .text(
        `Realizado el ${fechaFormateada} en la ciudad de Arequipa, Perú.`,
        toX(plantilla.pos_fecha_x),
        toY(plantilla.pos_fecha_y),
        { align: "center", width: 500 },
      );

    doc.end();

    // Guardar en BD
    stream.on("finish", async () => {
      try {
        await pool.query(
          `INSERT INTO certificados (evento_id, inscripcion_id, tipo, nombre_participante, url_pdf)
           VALUES (?, ?, ?, ?, ?)
           ON DUPLICATE KEY UPDATE url_pdf = ?`,
          [
            inscripcion.evento_id,
            inscripcionId,
            inscripcion.calidad || "PARTICIPANTE",
            `${inscripcion.nombre} ${inscripcion.apellido}`,
            urlPdf,
            urlPdf,
          ],
        );

        res.json({
          message: "Certificado generado",
          url: urlPdf,
          fileName,
        });
      } catch (dbError) {
        console.error("Error BD:", dbError);
        res.status(500).json({ message: "Error al guardar" });
      }
    });

    stream.on("error", (error) => {
      console.error("Error PDF:", error);
      res.status(500).json({ message: "Error al crear PDF" });
    });
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ message: "Error al generar certificado" });
  }
};

module.exports = {
  upload,
  uploadPlantilla,
  getPlantillaByEvento,
  generarCertificadoConPlantilla,
};
