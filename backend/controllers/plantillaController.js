const multer = require("multer");
const path = require("path");
const fs = require("fs");
const PDFDocument = require("pdfkit");
const pool = require("../config/db");

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const dir = path.join(__dirname, "../uploads/plantillas");
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: function (req, file, cb) {
    cb(
      null,
      "plantilla_" +
        req.params.eventoId +
        "_" +
        Date.now() +
        path.extname(file.originalname),
    );
  },
});

const upload = multer({
  storage: storage,
  fileFilter: function (req, file, cb) {
    cb(
      null,
      /jpeg|jpg|png/.test(path.extname(file.originalname).toLowerCase()),
    );
  },
});

exports.upload = upload;

exports.uploadPlantilla = async function (req, res) {
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
      activo_nombre,
      activo_tema,
      activo_calidad,
      activo_fecha,
    } = req.body;

    console.log("=== DATOS RECIBIDOS ===");
    console.log("eventoId:", eventoId);
    console.log("posiciones:", {
      pos_nombre_x,
      pos_nombre_y,
      pos_calidad_x,
      pos_calidad_y,
    });
    console.log("activos:", {
      activo_nombre,
      activo_tema,
      activo_calidad,
      activo_fecha,
    });

    const [existing] = await pool.query(
      "SELECT id FROM plantillas_certificados WHERE evento_id = ?",
      [eventoId],
    );

    if (!req.file) {
      if (existing.length === 0)
        return res.status(400).json({ message: "Sube una imagen" });
      await pool.query(
        "UPDATE plantillas_certificados SET pos_nombre_x=?, pos_nombre_y=?, pos_tema_x=?, pos_tema_y=?, pos_calidad_x=?, pos_calidad_y=?, pos_fecha_x=?, pos_fecha_y=?, activo_nombre=?, activo_tema=?, activo_calidad=?, activo_fecha=? WHERE evento_id=?",
        [
          parseFloat(pos_nombre_x) || 50,
          parseFloat(pos_nombre_y) || 45,
          parseFloat(pos_tema_x) || 50,
          parseFloat(pos_tema_y) || 55,
          parseFloat(pos_calidad_x) || 50,
          parseFloat(pos_calidad_y) || 70,
          parseFloat(pos_fecha_x) || 50,
          parseFloat(pos_fecha_y) || 85,
          parseInt(activo_nombre) || 1,
          parseInt(activo_tema) || 0,
          parseInt(activo_calidad) || 1,
          parseInt(activo_fecha) || 0,
          eventoId,
        ],
      );
      console.log("✅ Posiciones actualizadas en BD");
      return res.json({ message: "Posiciones actualizadas", guardado: true });
    }

    const url = "/uploads/plantillas/" + req.file.filename;

    if (existing.length > 0) {
      await pool.query(
        "UPDATE plantillas_certificados SET url_plantilla=?, pos_nombre_x=?, pos_nombre_y=?, pos_tema_x=?, pos_tema_y=?, pos_calidad_x=?, pos_calidad_y=?, pos_fecha_x=?, pos_fecha_y=?, activo_nombre=?, activo_tema=?, activo_calidad=?, activo_fecha=? WHERE evento_id=?",
        [
          url,
          parseFloat(pos_nombre_x) || 50,
          parseFloat(pos_nombre_y) || 45,
          parseFloat(pos_tema_x) || 50,
          parseFloat(pos_tema_y) || 55,
          parseFloat(pos_calidad_x) || 50,
          parseFloat(pos_calidad_y) || 70,
          parseFloat(pos_fecha_x) || 50,
          parseFloat(pos_fecha_y) || 85,
          parseInt(activo_nombre) || 1,
          parseInt(activo_tema) || 0,
          parseInt(activo_calidad) || 1,
          parseInt(activo_fecha) || 0,
          eventoId,
        ],
      );
    } else {
      await pool.query(
        "INSERT INTO plantillas_certificados (evento_id, url_plantilla, pos_nombre_x, pos_nombre_y, pos_tema_x, pos_tema_y, pos_calidad_x, pos_calidad_y, pos_fecha_x, pos_fecha_y, activo_nombre, activo_tema, activo_calidad, activo_fecha) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)",
        [
          eventoId,
          url,
          parseFloat(pos_nombre_x) || 50,
          parseFloat(pos_nombre_y) || 45,
          parseFloat(pos_tema_x) || 50,
          parseFloat(pos_tema_y) || 55,
          parseFloat(pos_calidad_x) || 50,
          parseFloat(pos_calidad_y) || 70,
          parseFloat(pos_fecha_x) || 50,
          parseFloat(pos_fecha_y) || 85,
          parseInt(activo_nombre) || 1,
          parseInt(activo_tema) || 0,
          parseInt(activo_calidad) || 1,
          parseInt(activo_fecha) || 0,
        ],
      );
    }

    console.log("✅ Plantilla guardada en BD correctamente");
    res.json({ message: "Plantilla guardada", url: url, guardado: true });
  } catch (error) {
    console.error("❌ Error al guardar:", error);
    res.status(500).json({ message: "Error: " + error.message });
  }
};

exports.getPlantillaByEvento = async function (req, res) {
  try {
    const [plantillas] = await pool.query(
      "SELECT * FROM plantillas_certificados WHERE evento_id = ?",
      [req.params.eventoId],
    );
    if (plantillas.length === 0)
      return res.status(404).json({ message: "No encontrada" });
    console.log("✅ Plantilla cargada:", plantillas[0]);
    res.json(plantillas[0]);
  } catch (error) {
    console.error("❌ Error:", error);
    res.status(500).json({ message: "Error" });
  }
};

exports.generarCertificadoConPlantilla = async function (req, res) {
  try {
    const [inscripciones] = await pool.query(
      "SELECT i.id as inscripcion_id, i.evento_id, i.calidad, u.nombre, u.apellido FROM inscripciones i JOIN usuarios u ON i.usuario_id=u.id WHERE i.id=?",
      [req.params.inscripcionId],
    );
    if (inscripciones.length === 0)
      return res.status(404).json({ message: "No encontrada" });

    const insc = inscripciones[0];
    const [plantillas] = await pool.query(
      "SELECT * FROM plantillas_certificados WHERE evento_id=?",
      [insc.evento_id],
    );
    if (plantillas.length === 0)
      return res.status(404).json({ message: "Sin plantilla" });

    const p = plantillas[0];
    console.log("=== GENERANDO CERTIFICADO ===");
    console.log("Coordenadas BD:", {
      nombre_x: p.pos_nombre_x,
      nombre_y: p.pos_nombre_y,
      activo: p.activo_nombre,
    });

    const imgPath = path.join(__dirname, "..", p.url_plantilla);
    if (!fs.existsSync(imgPath))
      return res.status(404).json({ message: "Imagen no existe" });

    const dir = path.join(__dirname, "../uploads/certificados");
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

    const fileName = "cert_" + insc.inscripcion_id + "_" + Date.now() + ".pdf";
    const filePath = path.join(dir, fileName);
    const urlPdf = "/uploads/certificados/" + fileName;

    const doc = new PDFDocument({
      size: "A4",
      layout: "landscape",
      margins: { top: 0, bottom: 0, left: 0, right: 0 },
    });
    const stream = fs.createWriteStream(filePath);
    doc.pipe(stream);

    doc.image(imgPath, 0, 0, {
      width: doc.page.width,
      height: doc.page.height,
    });

    const toX = function (pct) {
      return (parseFloat(pct) / 100) * doc.page.width;
    };
    const toY = function (pct) {
      return (parseFloat(pct) / 100) * doc.page.height;
    };

    if (parseInt(p.activo_nombre) !== 0) {
      doc
        .fontSize(20)
        .font("Helvetica-Bold")
        .fillColor("#1e3a8a")
        .text(
          (insc.nombre + " " + insc.apellido).toUpperCase(),
          toX(50),
          toY(25),
          { align: "center", width: 500 },
        );
    }

    if (parseInt(p.activo_calidad) !== 0) {
      doc
        .fontSize(16)
        .font("Helvetica-Bold")
        .fillColor("#1e3a8a")
        .text(
          (insc.calidad || "PARTICIPANTE").toUpperCase(),
          toX(50),
          toY(55),
          { align: "center", width: 300 },
        );
    }

    doc.end();

    stream.on("finish", async function () {
      await pool.query(
        "INSERT INTO certificados (evento_id, inscripcion_id, tipo, nombre_participante, url_pdf) VALUES (?,?,?,?,?) ON DUPLICATE KEY UPDATE url_pdf=?",
        [
          insc.evento_id,
          insc.inscripcion_id,
          insc.calidad || "PARTICIPANTE",
          insc.nombre + " " + insc.apellido,
          urlPdf,
          urlPdf,
        ],
      );
      res.json({ message: "Generado", url: urlPdf, fileName: fileName });
    });

    stream.on("error", function (err) {
      console.error(err);
      res.status(500).json({ message: "Error PDF" });
    });
  } catch (error) {
    console.error("❌ Error:", error);
    res.status(500).json({ message: "Error: " + error.message });
  }
};

exports.generarCertificadosMasivos = async function (req, res) {
  try {
    const { eventoId } = req.params;
    const [inscripciones] = await pool.query(
      "SELECT i.id as inscripcion_id, i.evento_id, i.calidad, u.nombre, u.apellido FROM inscripciones i JOIN usuarios u ON i.usuario_id=u.id WHERE i.evento_id=?",
      [eventoId],
    );
    if (inscripciones.length === 0)
      return res.status(404).json({ message: "No hay inscripciones" });

    const [plantillas] = await pool.query(
      "SELECT * FROM plantillas_certificados WHERE evento_id=?",
      [eventoId],
    );
    if (plantillas.length === 0)
      return res.status(404).json({ message: "No hay plantilla" });

    const p = plantillas[0];
    const imgPath = path.join(__dirname, "..", p.url_plantilla);
    if (!fs.existsSync(imgPath))
      return res.status(404).json({ message: "Imagen no existe" });

    const dir = path.join(__dirname, "../uploads/certificados");
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

    const certificadosGenerados = [];

    for (const insc of inscripciones) {
      try {
        const fileName =
          "cert_" + insc.inscripcion_id + "_" + Date.now() + ".pdf";
        const filePath = path.join(dir, fileName);
        const urlPdf = "/uploads/certificados/" + fileName;

        const doc = new PDFDocument({
          size: "A4",
          layout: "landscape",
          margins: { top: 0, bottom: 0, left: 0, right: 0 },
        });
        const stream = fs.createWriteStream(filePath);
        doc.pipe(stream);

        doc.image(imgPath, 0, 0, {
          width: doc.page.width,
          height: doc.page.height,
        });

        const toX = function (pct) {
          return (parseFloat(pct) / 100) * doc.page.width;
        };
        const toY = function (pct) {
          return (parseFloat(pct) / 100) * doc.page.height;
        };

        if (parseInt(p.activo_nombre) !== 0) {
          doc
            .fontSize(24)
            .font("Helvetica-Bold")
            .fillColor("#1e3a8a")
            .text(
              (insc.nombre + " " + insc.apellido).toUpperCase(),
              toX(p.pos_nombre_x),
              toY(p.pos_nombre_y),
              { align: "center", width: 500 },
            );
        }

        if (parseInt(p.activo_calidad) !== 0) {
          doc
            .fontSize(24)
            .font("Helvetica-Bold")
            .fillColor("#1e3a8a")
            .text(
              (insc.calidad || "PARTICIPANTE").toUpperCase(),
              toX(p.pos_calidad_x),
              toY(p.pos_calidad_y),
              { align: "center", width: 300 },
            );
        }

        doc.end();

        await new Promise(function (resolve, reject) {
          stream.on("finish", resolve);
          stream.on("error", reject);
        });

        await pool.query(
          "INSERT INTO certificados (evento_id, inscripcion_id, tipo, nombre_participante, url_pdf) VALUES (?,?,?,?,?) ON DUPLICATE KEY UPDATE url_pdf=?",
          [
            insc.evento_id,
            insc.inscripcion_id,
            insc.calidad || "PARTICIPANTE",
            insc.nombre + " " + insc.apellido,
            urlPdf,
            urlPdf,
          ],
        );

        certificadosGenerados.push({
          inscripcion_id: insc.inscripcion_id,
          nombre: insc.nombre + " " + insc.apellido,
          url: urlPdf,
        });
      } catch (error) {
        console.error("Error:", error);
      }
    }

    res.json({
      message:
        "Generados " +
        certificadosGenerados.length +
        " de " +
        inscripciones.length +
        " certificados",
      certificados: certificadosGenerados,
    });
  } catch (error) {
    console.error("❌ Error:", error);
    res.status(500).json({ message: "Error al generar masivamente" });
  }
};

module.exports = {
  upload: upload,
  uploadPlantilla: exports.uploadPlantilla,
  getPlantillaByEvento: exports.getPlantillaByEvento,
  generarCertificadoConPlantilla: exports.generarCertificadoConPlantilla,
  generarCertificadosMasivos: exports.generarCertificadosMasivos,
};
