// const multer = require("multer");
// const path = require("path");
// const fs = require("fs");
// const PDFDocument = require("pdfkit");
// const pool = require("../config/db");

// const storage = multer.diskStorage({
//   destination: (req, file, cb) => {
//     const dir = path.join(__dirname, "../uploads/plantillas");
//     if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
//     cb(null, dir);
//   },
//   filename: (req, file, cb) => {
//     cb(null, "plantilla_" + req.params.eventoId + "_" + Date.now() + path.extname(file.originalname));
//   }
// });

// const upload = multer({
//   storage: storage,
//   fileFilter: (req, file, cb) => {
//     cb(null, /jpeg|jpg|png/.test(path.extname(file.originalname).toLowerCase()));
//   }
// });

// exports.upload = upload;

// exports.uploadPlantilla = async (req, res) => {
//   try {
//     const { eventoId } = req.params;
//     const { 
//       pos_nombre_x, pos_nombre_y, 
//       pos_tema_x, pos_tema_y, 
//       pos_calidad_x, pos_calidad_y, 
//       pos_fecha_x, pos_fecha_y,
//       activo_nombre, activo_tema, activo_calidad, activo_fecha
//     } = req.body;

//     const [existing] = await pool.query("SELECT id FROM plantillas_certificados WHERE evento_id = ?", [eventoId]);

//     if (!req.file) {
//       if (existing.length === 0) return res.status(400).json({ message: "Sube una imagen" });
//       await pool.query("UPDATE plantillas_certificados SET pos_nombre_x=?, pos_nombre_y=?, pos_tema_x=?, pos_tema_y=?, pos_calidad_x=?, pos_calidad_y=?, pos_fecha_x=?, pos_fecha_y=?, activo_nombre=?, activo_tema=?, activo_calidad=?, activo_fecha=? WHERE evento_id=?", 
//         [pos_nombre_x||50, pos_nombre_y||45, pos_tema_x||50, pos_tema_y||55, pos_calidad_x||50, pos_calidad_y||70, pos_fecha_x||50, pos_fecha_y||85, activo_nombre||1, activo_tema||0, activo_calidad||1, activo_fecha||0, eventoId]);
//       return res.json({ message: "Posiciones actualizadas" });
//     }

//     const url = "/uploads/plantillas/" + req.file.filename;

//     if (existing.length > 0) {
//       await pool.query("UPDATE plantillas_certificados SET url_plantilla=?, pos_nombre_x=?, pos_nombre_y=?, pos_tema_x=?, pos_tema_y=?, pos_calidad_x=?, pos_calidad_y=?, pos_fecha_x=?, pos_fecha_y=?, activo_nombre=?, activo_tema=?, activo_calidad=?, activo_fecha=? WHERE evento_id=?",
//         [url, pos_nombre_x||50, pos_nombre_y||45, pos_tema_x||50, pos_tema_y||55, pos_calidad_x||50, pos_calidad_y||70, pos_fecha_x||50, pos_fecha_y||85, activo_nombre||1, activo_tema||0, activo_calidad||1, activo_fecha||0, eventoId]);
//     } else {
//       await pool.query("INSERT INTO plantillas_certificados (evento_id, url_plantilla, pos_nombre_x, pos_nombre_y, pos_tema_x, pos_tema_y, pos_calidad_x, pos_calidad_y, pos_fecha_x, pos_fecha_y, activo_nombre, activo_tema, activo_calidad, activo_fecha) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)",
//         [eventoId, url, pos_nombre_x||50, pos_nombre_y||45, pos_tema_x||50, pos_tema_y||55, pos_calidad_x||50, pos_calidad_y||70, pos_fecha_x||50, pos_fecha_y||85, activo_nombre||1, activo_tema||0, activo_calidad||1, activo_fecha||0]);
//     }

//     res.json({ message: "Plantilla guardada", url: url });
//   } catch (error) {
//     console.error(error);
//     res.status(500).json({ message: "Error al guardar" });
//   }
// };

// exports.getPlantillaByEvento = async (req, res) => {
//   try {
//     const [plantillas] = await pool.query("SELECT * FROM plantillas_certificados WHERE evento_id = ?", [req.params.eventoId]);
//     if (plantillas.length === 0) return res.status(404).json({ message: "No encontrada" });
//     res.json(plantillas[0]);
//   } catch (error) {
//     res.status(500).json({ message: "Error" });
//   }
// };

// exports.generarCertificadoConPlantilla = async (req, res) => {
//   try {
//     const [inscripciones] = await pool.query("SELECT i.id as inscripcion_id, i.evento_id, i.calidad, u.nombre, u.apellido, e.tema, e.fecha_inicio FROM inscripciones i JOIN usuarios u ON i.usuario_id=u.id JOIN eventos e ON i.evento_id=e.id WHERE i.id=?", [req.params.inscripcionId]);
//     if (inscripciones.length === 0) return res.status(404).json({ message: "No encontrada" });
    
//     const insc = inscripciones[0];
//     const [plantillas] = await pool.query("SELECT * FROM plantillas_certificados WHERE evento_id=?", [insc.evento_id]);
//     if (plantillas.length === 0) return res.status(404).json({ message: "Sin plantilla" });
    
//     const p = plantillas[0];
//     const imgPath = path.join(__dirname, "..", p.url_plantilla);
//     if (!fs.existsSync(imgPath)) return res.status(404).json({ message: "Imagen no existe" });
    
//     const dir = path.join(__dirname, "../uploads/certificados");
//     if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    
//     const fileName = "cert_" + insc.inscripcion_id + "_" + Date.now() + ".pdf";
//     const filePath = path.join(dir, fileName);
//     const urlPdf = "/uploads/certificados/" + fileName;
    
//     const doc = new PDFDocument({ size: "A4", layout: "landscape", margins: { top: 0, bottom: 0, left: 0, right: 0 } });
//     const stream = fs.createWriteStream(filePath);
//     doc.pipe(stream);
    
//     doc.image(imgPath, 0, 0, { width: doc.page.width, height: doc.page.height });
    
//     const toX = function(pct) { return (pct/100) * doc.page.width; };
//     const toY = function(pct) { return (pct/100) * doc.page.height; };
    
//     // NOMBRE (si está activo)
//     if (p.activo_nombre !== 0) {
//       doc.fontSize(p.font_size_nombre||24).font("Helvetica-Bold").fillColor(p.color_nombre||"#1e3a8a")
//          .text((insc.nombre + " " + insc.apellido).toUpperCase(), toX(p.pos_nombre_x), toY(p.pos_nombre_y), { align: "center", width: 400 });
//     }
    
//     // TEMA (si está activo)
//     if (p.activo_tema !== 0 && insc.tema) {
//       doc.fontSize(14).font("Helvetica-Oblique").fillColor("#3b82f6")
//          .text("\"" + insc.tema + "\"", toX(p.pos_tema_x), toY(p.pos_tema_y), { align: "center", width: 500 });
//     }
    
//     // CALIDAD (si está activa)
//     if (p.activo_calidad !== 0) {
//       doc.fontSize(p.font_size_calidad||18).font("Helvetica-Bold").fillColor(p.color_calidad||"#1e3a8a")
//          .text((insc.calidad||"PARTICIPANTE").toUpperCase(), toX(p.pos_calidad_x), toY(p.pos_calidad_y), { align: "center", width: 300 });
//     }
    
//     // FECHA (si está activa)
//     if (p.activo_fecha !== 0) {
//       const fecha = insc.fecha_inicio ? new Date(insc.fecha_inicio).toLocaleDateString("es-ES", { day: "numeric", month: "long", year: "numeric" }) : "22, 23 y 24 de abril del 2026";
//       doc.fontSize(12).font("Helvetica").fillColor("#000000")
//          .text("Realizado el " + fecha + " en Arequipa, Peru.", toX(p.pos_fecha_x), toY(p.pos_fecha_y), { align: "center", width: 500 });
//     }
    
//     doc.end();
    
//     stream.on("finish", async function() {
//       await pool.query("INSERT INTO certificados (evento_id, inscripcion_id, tipo, nombre_participante, url_pdf) VALUES (?,?,?,?,?) ON DUPLICATE KEY UPDATE url_pdf=?",
//         [insc.evento_id, insc.inscripcion_id, insc.calidad||"PARTICIPANTE", insc.nombre + " " + insc.apellido, urlPdf, urlPdf]);
//       res.json({ message: "Generado", url: urlPdf, fileName: fileName });
//     });
    
//     stream.on("error", function(err) {
//       console.error(err);
//       res.status(500).json({ message: "Error PDF" });
//     });
//   } catch (error) {
//     console.error(error);
//     res.status(500).json({ message: "Error" });
//   }
// };

// // ============================================
// // GENERAR CERTIFICADOS MASIVOS
// // ============================================
// exports.generarCertificadosMasivos = async (req, res) => {
//   try {
//     const { eventoId } = req.params;

//     const [inscripciones] = await pool.query(
//       "SELECT i.id as inscripcion_id, i.evento_id, i.calidad, u.nombre, u.apellido, e.tema, e.fecha_inicio FROM inscripciones i JOIN usuarios u ON i.usuario_id=u.id JOIN eventos e ON i.evento_id=e.id WHERE i.evento_id=?",
//       [eventoId]
//     );

//     if (inscripciones.length === 0) {
//       return res.status(404).json({ message: "No hay inscripciones para este evento" });
//     }

//     const [plantillas] = await pool.query(
//       "SELECT * FROM plantillas_certificados WHERE evento_id=?",
//       [eventoId]
//     );

//     if (plantillas.length === 0) {
//       return res.status(404).json({ message: "No hay plantilla configurada" });
//     }

//     const p = plantillas[0];
//     const imgPath = path.join(__dirname, "..", p.url_plantilla);

//     if (!fs.existsSync(imgPath)) {
//       return res.status(404).json({ message: "Imagen de plantilla no existe" });
//     }

//     const dir = path.join(__dirname, "../uploads/certificados");
//     if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

//     const certificadosGenerados = [];
//     const errores = [];

//     for (const insc of inscripciones) {
//       try {
//         const fileName = "cert_" + insc.inscripcion_id + "_" + Date.now() + ".pdf";
//         const filePath = path.join(dir, fileName);
//         const urlPdf = "/uploads/certificados/" + fileName;

//         const doc = new PDFDocument({ size: "A4", layout: "landscape", margins: { top: 0, bottom: 0, left: 0, right: 0 } });
//         const stream = fs.createWriteStream(filePath);
//         doc.pipe(stream);

//         doc.image(imgPath, 0, 0, { width: doc.page.width, height: doc.page.height });

//         const toX = function(pct) { return (pct/100) * doc.page.width; };
//         const toY = function(pct) { return (pct/100) * doc.page.height; };

//         if (p.activo_nombre !== 0) {
//           doc.fontSize(p.font_size_nombre||24).font("Helvetica-Bold").fillColor(p.color_nombre||"#1e3a8a")
//              .text((insc.nombre + " " + insc.apellido).toUpperCase(), toX(p.pos_nombre_x), toY(p.pos_nombre_y), { align: "center", width: 400 });
//         }

//         if (p.activo_tema !== 0 && insc.tema) {
//           doc.fontSize(14).font("Helvetica-Oblique").fillColor("#3b82f6")
//              .text("\"" + insc.tema + "\"", toX(p.pos_tema_x), toY(p.pos_tema_y), { align: "center", width: 500 });
//         }

//         if (p.activo_calidad !== 0) {
//           doc.fontSize(p.font_size_calidad||18).font("Helvetica-Bold").fillColor(p.color_calidad||"#1e3a8a")
//              .text((insc.calidad||"PARTICIPANTE").toUpperCase(), toX(p.pos_calidad_x), toY(p.pos_calidad_y), { align: "center", width: 300 });
//         }

//         if (p.activo_fecha !== 0) {
//           const fecha = insc.fecha_inicio ? new Date(insc.fecha_inicio).toLocaleDateString("es-ES", { day: "numeric", month: "long", year: "numeric" }) : "22, 23 y 24 de abril del 2026";
//           doc.fontSize(12).font("Helvetica").fillColor("#000000")
//              .text("Realizado el " + fecha + " en Arequipa, Peru.", toX(p.pos_fecha_x), toY(p.pos_fecha_y), { align: "center", width: 500 });
//         }

//         doc.end();

//         await new Promise(function(resolve, reject) {
//           stream.on("finish", resolve);
//           stream.on("error", reject);
//         });

//         await pool.query(
//           "INSERT INTO certificados (evento_id, inscripcion_id, tipo, nombre_participante, url_pdf) VALUES (?,?,?,?,?) ON DUPLICATE KEY UPDATE url_pdf=?",
//           [insc.evento_id, insc.inscripcion_id, insc.calidad||"PARTICIPANTE", insc.nombre + " " + insc.apellido, urlPdf, urlPdf]
//         );

//         certificadosGenerados.push({
//           inscripcion_id: insc.inscripcion_id,
//           nombre: insc.nombre + " " + insc.apellido,
//           url: urlPdf
//         });

//       } catch (error) {
//         errores.push({
//           inscripcion_id: insc.inscripcion_id,
//           nombre: insc.nombre + " " + insc.apellido,
//           error: error.message
//         });
//       }
//     }

//     res.json({
//       message: "Generados " + certificadosGenerados.length + " de " + inscripciones.length + " certificados",
//       certificados: certificadosGenerados,
//       errores: errores
//     });

//   } catch (error) {
//     console.error(error);
//     res.status(500).json({ message: "Error al generar certificados masivos" });
//   }
// };

// module.exports = {
//   upload,
//   uploadPlantilla: exports.uploadPlantilla,
//   getPlantillaByEvento: exports.getPlantillaByEvento,
//   generarCertificadoConPlantilla: exports.generarCertificadoConPlantilla,
//   generarCertificadosMasivos: exports.generarCertificadosMasivos
// };

const multer = require("multer");
const path = require("path");
const fs = require("fs");
const PDFDocument = require("pdfkit");
const pool = require("../config/db");

// ============================================
// CONFIGURACIÓN DE MULTER
// ============================================
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(__dirname, "../uploads/plantillas");
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    cb(null, "plantilla_" + req.params.eventoId + "_" + Date.now() + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  fileFilter: (req, file, cb) => {
    cb(null, /jpeg|jpg|png/.test(path.extname(file.originalname).toLowerCase()));
  }
});

exports.upload = upload;

// ============================================
// SUBIR/ACTUALIZAR PLANTILLA
// ============================================
exports.uploadPlantilla = async (req, res) => {
  try {
    const { eventoId } = req.params;
    const { 
      pos_nombre_x, pos_nombre_y, 
      pos_tema_x, pos_tema_y, 
      pos_calidad_x, pos_calidad_y, 
      pos_fecha_x, pos_fecha_y,
      activo_nombre, activo_tema, activo_calidad, activo_fecha
    } = req.body;

    const [existing] = await pool.query("SELECT id FROM plantillas_certificados WHERE evento_id = ?", [eventoId]);

    if (!req.file) {
      if (existing.length === 0) return res.status(400).json({ message: "Sube una imagen" });
      await pool.query("UPDATE plantillas_certificados SET pos_nombre_x=?, pos_nombre_y=?, pos_tema_x=?, pos_tema_y=?, pos_calidad_x=?, pos_calidad_y=?, pos_fecha_x=?, pos_fecha_y=?, activo_nombre=?, activo_tema=?, activo_calidad=?, activo_fecha=? WHERE evento_id=?", 
        [pos_nombre_x||50, pos_nombre_y||45, pos_tema_x||50, pos_tema_y||55, pos_calidad_x||50, pos_calidad_y||70, pos_fecha_x||50, pos_fecha_y||85, activo_nombre||1, activo_tema||0, activo_calidad||1, activo_fecha||0, eventoId]);
      return res.json({ message: "Posiciones actualizadas" });
    }

    const url = "/uploads/plantillas/" + req.file.filename;

    if (existing.length > 0) {
      await pool.query("UPDATE plantillas_certificados SET url_plantilla=?, pos_nombre_x=?, pos_nombre_y=?, pos_tema_x=?, pos_tema_y=?, pos_calidad_x=?, pos_calidad_y=?, pos_fecha_x=?, pos_fecha_y=?, activo_nombre=?, activo_tema=?, activo_calidad=?, activo_fecha=? WHERE evento_id=?",
        [url, pos_nombre_x||50, pos_nombre_y||45, pos_tema_x||50, pos_tema_y||55, pos_calidad_x||50, pos_calidad_y||70, pos_fecha_x||50, pos_fecha_y||85, activo_nombre||1, activo_tema||0, activo_calidad||1, activo_fecha||0, eventoId]);
    } else {
      await pool.query("INSERT INTO plantillas_certificados (evento_id, url_plantilla, pos_nombre_x, pos_nombre_y, pos_tema_x, pos_tema_y, pos_calidad_x, pos_calidad_y, pos_fecha_x, pos_fecha_y, activo_nombre, activo_tema, activo_calidad, activo_fecha) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)",
        [eventoId, url, pos_nombre_x||50, pos_nombre_y||45, pos_tema_x||50, pos_tema_y||55, pos_calidad_x||50, pos_calidad_y||70, pos_fecha_x||50, pos_fecha_y||85, activo_nombre||1, activo_tema||0, activo_calidad||1, activo_fecha||0]);
    }

    res.json({ message: "Plantilla guardada", url: url });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error al guardar" });
  }
};

// ============================================
// OBTENER PLANTILLA
// ============================================
exports.getPlantillaByEvento = async (req, res) => {
  try {
    const [plantillas] = await pool.query("SELECT * FROM plantillas_certificados WHERE evento_id = ?", [req.params.eventoId]);
    if (plantillas.length === 0) return res.status(404).json({ message: "No encontrada" });
    res.json(plantillas[0]);
  } catch (error) {
    res.status(500).json({ message: "Error" });
  }
};

// ============================================
// GENERAR CERTIFICADO INDIVIDUAL
// ============================================
exports.generarCertificadoConPlantilla = async (req, res) => {
  try {
    const [inscripciones] = await pool.query("SELECT i.id as inscripcion_id, i.evento_id, i.calidad, u.nombre, u.apellido, e.tema, e.fecha_inicio FROM inscripciones i JOIN usuarios u ON i.usuario_id=u.id JOIN eventos e ON i.evento_id=e.id WHERE i.id=?", [req.params.inscripcionId]);
    if (inscripciones.length === 0) return res.status(404).json({ message: "No encontrada" });
    
    const insc = inscripciones[0];
    const [plantillas] = await pool.query("SELECT * FROM plantillas_certificados WHERE evento_id=?", [insc.evento_id]);
    if (plantillas.length === 0) return res.status(404).json({ message: "Sin plantilla" });
    
    const p = plantillas[0];
    const imgPath = path.join(__dirname, "..", p.url_plantilla);
    if (!fs.existsSync(imgPath)) return res.status(404).json({ message: "Imagen no existe" });
    
    const dir = path.join(__dirname, "../uploads/certificados");
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    
    const fileName = "cert_" + insc.inscripcion_id + "_" + Date.now() + ".pdf";
    const filePath = path.join(dir, fileName);
    const urlPdf = "/uploads/certificados/" + fileName;
    
    const doc = new PDFDocument({ size: "A4", layout: "landscape", margins: { top: 0, bottom: 0, left: 0, right: 0 } });
    const stream = fs.createWriteStream(filePath);
    doc.pipe(stream);
    
    doc.image(imgPath, 0, 0, { width: doc.page.width, height: doc.page.height });
    
    const toX = function(pct) { return (pct/100) * doc.page.width; };
    const toY = function(pct) { return (pct/100) * doc.page.height; };
    
    if (p.activo_nombre !== 0) {
      doc.fontSize(p.font_size_nombre||24).font("Helvetica-Bold").fillColor(p.color_nombre||"#1e3a8a")
         .text((insc.nombre + " " + insc.apellido).toUpperCase(), toX(p.pos_nombre_x), toY(p.pos_nombre_y), { align: "center", width: 400 });
    }
    
    if (p.activo_tema !== 0 && insc.tema) {
      doc.fontSize(14).font("Helvetica-Oblique").fillColor("#3b82f6")
         .text("\"" + insc.tema + "\"", toX(p.pos_tema_x), toY(p.pos_tema_y), { align: "center", width: 500 });
    }
    
    if (p.activo_calidad !== 0) {
      doc.fontSize(p.font_size_calidad||18).font("Helvetica-Bold").fillColor(p.color_calidad||"#1e3a8a")
         .text((insc.calidad||"PARTICIPANTE").toUpperCase(), toX(p.pos_calidad_x), toY(p.pos_calidad_y), { align: "center", width: 300 });
    }
    
    if (p.activo_fecha !== 0) {
      const fecha = insc.fecha_inicio ? new Date(insc.fecha_inicio).toLocaleDateString("es-ES", { day: "numeric", month: "long", year: "numeric" }) : "22, 23 y 24 de abril del 2026";
      doc.fontSize(12).font("Helvetica").fillColor("#000000")
         .text("Realizado el " + fecha + " en Arequipa, Peru.", toX(p.pos_fecha_x), toY(p.pos_fecha_y), { align: "center", width: 500 });
    }
    
    doc.end();
    
    stream.on("finish", async function() {
      await pool.query("INSERT INTO certificados (evento_id, inscripcion_id, tipo, nombre_participante, url_pdf) VALUES (?,?,?,?,?) ON DUPLICATE KEY UPDATE url_pdf=?",
        [insc.evento_id, insc.inscripcion_id, insc.calidad||"PARTICIPANTE", insc.nombre + " " + insc.apellido, urlPdf, urlPdf]);
      res.json({ message: "Generado", url: urlPdf, fileName: fileName });
    });
    
    stream.on("error", function(err) {
      console.error(err);
      res.status(500).json({ message: "Error PDF" });
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error" });
  }
};

// ============================================
// GENERAR CERTIFICADOS MASIVOS
// ============================================
exports.generarCertificadosMasivos = async (req, res) => {
  try {
    const { eventoId } = req.params;

    const [inscripciones] = await pool.query(
      "SELECT i.id as inscripcion_id, i.evento_id, i.calidad, u.nombre, u.apellido, e.tema, e.fecha_inicio FROM inscripciones i JOIN usuarios u ON i.usuario_id=u.id JOIN eventos e ON i.evento_id=e.id WHERE i.evento_id=?",
      [eventoId]
    );

    if (inscripciones.length === 0) {
      return res.status(404).json({ message: "No hay inscripciones para este evento" });
    }

    const [plantillas] = await pool.query(
      "SELECT * FROM plantillas_certificados WHERE evento_id=?",
      [eventoId]
    );

    if (plantillas.length === 0) {
      return res.status(404).json({ message: "No hay plantilla configurada" });
    }

    const p = plantillas[0];
    const imgPath = path.join(__dirname, "..", p.url_plantilla);

    if (!fs.existsSync(imgPath)) {
      return res.status(404).json({ message: "Imagen de plantilla no existe" });
    }

    const dir = path.join(__dirname, "../uploads/certificados");
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

    const certificadosGenerados = [];
    const errores = [];

    for (const insc of inscripciones) {
      try {
        const fileName = "cert_" + insc.inscripcion_id + "_" + Date.now() + ".pdf";
        const filePath = path.join(dir, fileName);
        const urlPdf = "/uploads/certificados/" + fileName;

        const doc = new PDFDocument({ size: "A4", layout: "landscape", margins: { top: 0, bottom: 0, left: 0, right: 0 } });
        const stream = fs.createWriteStream(filePath);
        doc.pipe(stream);

        doc.image(imgPath, 0, 0, { width: doc.page.width, height: doc.page.height });

        const toX = function(pct) { return (pct/100) * doc.page.width; };
        const toY = function(pct) { return (pct/100) * doc.page.height; };

        if (p.activo_nombre !== 0) {
          doc.fontSize(p.font_size_nombre||24).font("Helvetica-Bold").fillColor(p.color_nombre||"#1e3a8a")
             .text((insc.nombre + " " + insc.apellido).toUpperCase(), toX(p.pos_nombre_x), toY(p.pos_nombre_y), { align: "center", width: 400 });
        }

        if (p.activo_tema !== 0 && insc.tema) {
          doc.fontSize(14).font("Helvetica-Oblique").fillColor("#3b82f6")
             .text("\"" + insc.tema + "\"", toX(p.pos_tema_x), toY(p.pos_tema_y), { align: "center", width: 500 });
        }

        if (p.activo_calidad !== 0) {
          doc.fontSize(p.font_size_calidad||18).font("Helvetica-Bold").fillColor(p.color_calidad||"#1e3a8a")
             .text((insc.calidad||"PARTICIPANTE").toUpperCase(), toX(p.pos_calidad_x), toY(p.pos_calidad_y), { align: "center", width: 300 });
        }

        if (p.activo_fecha !== 0) {
          const fecha = insc.fecha_inicio ? new Date(insc.fecha_inicio).toLocaleDateString("es-ES", { day: "numeric", month: "long", year: "numeric" }) : "22, 23 y 24 de abril del 2026";
          doc.fontSize(12).font("Helvetica").fillColor("#000000")
             .text("Realizado el " + fecha + " en Arequipa, Peru.", toX(p.pos_fecha_x), toY(p.pos_fecha_y), { align: "center", width: 500 });
        }

        doc.end();

        await new Promise(function(resolve, reject) {
          stream.on("finish", resolve);
          stream.on("error", reject);
        });

        await pool.query(
          "INSERT INTO certificados (evento_id, inscripcion_id, tipo, nombre_participante, url_pdf) VALUES (?,?,?,?,?) ON DUPLICATE KEY UPDATE url_pdf=?",
          [insc.evento_id, insc.inscripcion_id, insc.calidad||"PARTICIPANTE", insc.nombre + " " + insc.apellido, urlPdf, urlPdf]
        );

        certificadosGenerados.push({
          inscripcion_id: insc.inscripcion_id,
          nombre: insc.nombre + " " + insc.apellido,
          url: urlPdf
        });

      } catch (error) {
        errores.push({
          inscripcion_id: insc.inscripcion_id,
          nombre: insc.nombre + " " + insc.apellido,
          error: error.message
        });
      }
    }

    res.json({
      message: "Generados " + certificadosGenerados.length + " de " + inscripciones.length + " certificados",
      certificados: certificadosGenerados,
      errores: errores
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error al generar certificados masivos" });
  }
};

// ============================================
// EXPORTAR FUNCIONES
// ============================================
module.exports = {
  upload,
  uploadPlantilla: exports.uploadPlantilla,
  getPlantillaByEvento: exports.getPlantillaByEvento,
  generarCertificadoConPlantilla: exports.generarCertificadoConPlantilla,
  generarCertificadosMasivos: exports.generarCertificadosMasivos
};