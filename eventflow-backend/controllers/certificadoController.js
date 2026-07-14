const PDFDocument = require("pdfkit");
const fs = require("fs");
const path = require("path");
const pool = require("../config/db");

// ============================================
// FUNCIÓN AUXILIAR: Crear PDF usando plantilla personalizada
// ============================================
async function crearPDFCertificado(inscripcion, callback) {
  try {
    const nombreCompleto = `${inscripcion.nombre} ${inscripcion.apellido}`;
    const calidad = inscripcion.calidad || "PARTICIPANTE";

    // 1. Obtener plantilla de la BD
    const [plantillas] = await pool.query(
      "SELECT * FROM plantillas_certificados WHERE evento_id = ?",
      [inscripcion.evento_id],
    );

    if (plantillas.length === 0) {
      return callback(
        new Error("No hay plantilla configurada para este evento"),
        null,
      );
    }

    const p = plantillas[0];
    const imagePath = path.join(__dirname, "..", p.url_plantilla);

    if (!fs.existsSync(imagePath)) {
      return callback(new Error("Archivo de plantilla no encontrado"), null);
    }

    // 2. Crear directorio de salida
    const uploadDir = path.join(__dirname, "../uploads/certificados");
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    const fileName = `certificado_${inscripcion.inscripcion_id}_${Date.now()}.pdf`;
    const filePath = path.join(uploadDir, fileName);
    const urlPdf = `/uploads/certificados/${fileName}`;

    // 3. Crear PDF A4 horizontal (841.89 x 595.28 points)
    const doc = new PDFDocument({
      size: "A4",
      layout: "landscape",
      margins: { top: 0, bottom: 0, left: 0, right: 0 },
    });

    const stream = fs.createWriteStream(filePath);
    doc.pipe(stream);

    // 4. Dibujar imagen de fondo (plantilla)
    doc.image(imagePath, 0, 0, {
      width: doc.page.width,
      height: doc.page.height,
    });

    // 5. Función para convertir porcentaje a puntos PDF
    const toX = (percent) => (percent / 100) * doc.page.width;
    const toY = (percent) => (percent / 100) * doc.page.height;

    // Centra el texto sobre el punto (x, y) en %. Si es muy largo para el ancho
    // disponible, se ajusta a varias líneas (centradas). El ancho máximo se
    // limita para que no se salga del borde de la hoja.
    const drawCentered = (texto, xPct, yPct, fontSize, font, color) => {
      doc
        .fontSize(fontSize)
        .font(font)
        .fillColor(color || "#1e3a8a");
      const cx = toX(xPct);
      const maxW = Math.max(100, 2 * Math.min(cx, doc.page.width - cx) - 20);
      const alto = doc.heightOfString(texto, { width: maxW, align: "center" });
      doc.text(texto, cx - maxW / 2, toY(yPct) - alto / 2, {
        width: maxW,
        align: "center",
      });
    };

    // 6. Superponer textos en las coordenadas guardadas (solo campos activos,
    // para no pisar el texto que ya trae la imagen de la plantilla).

    // NOMBRE DEL PARTICIPANTE
    if (parseInt(p.activo_nombre) !== 0) {
      drawCentered(
        nombreCompleto.toUpperCase(),
        p.pos_nombre_x,
        p.pos_nombre_y,
        p.font_size_nombre || 24,
        "Helvetica-Bold",
        p.color_nombre,
      );
    }

    // TEMA DEL EVENTO
    if (parseInt(p.activo_tema) !== 0 && inscripcion.tema) {
      drawCentered(
        `"${inscripcion.tema}"`,
        p.pos_tema_x,
        p.pos_tema_y,
        14,
        "Helvetica-Oblique",
        "#3b82f6",
      );
    }

    // CALIDAD (EXPOSITOR, PARTICIPANTE, ORGANIZADOR)
    if (parseInt(p.activo_calidad) !== 0) {
      drawCentered(
        calidad.toUpperCase(),
        p.pos_calidad_x,
        p.pos_calidad_y,
        p.font_size_calidad || 18,
        "Helvetica-Bold",
        p.color_calidad,
      );
    }

    // FECHA Y LUGAR
    if (parseInt(p.activo_fecha) !== 0) {
      const fechaFormateada = inscripcion.fecha_inicio
        ? new Date(inscripcion.fecha_inicio).toLocaleDateString("es-ES", {
            day: "numeric",
            month: "long",
            year: "numeric",
          })
        : "22, 23 y 24 de abril del 2026";

      drawCentered(
        `Realizado el ${fechaFormateada} en la ciudad de Arequipa, Perú.`,
        p.pos_fecha_x,
        p.pos_fecha_y,
        12,
        "Helvetica",
        "#000000",
      );
    }

    doc.end();

    // 7. Guardar en BD cuando termine el stream
    stream.on("finish", async () => {
      try {
        await pool.query(
          `INSERT INTO certificados (evento_id, inscripcion_id, tipo, nombre_participante, url_pdf)
           VALUES (?, ?, ?, ?, ?)
           ON DUPLICATE KEY UPDATE url_pdf = ?, tipo = ?`,
          [
            inscripcion.evento_id,
            inscripcion.inscripcion_id,
            calidad,
            nombreCompleto,
            urlPdf,
            urlPdf,
            calidad,
          ],
        );

        callback(null, { urlPdf, fileName });
      } catch (dbError) {
        console.error("Error BD:", dbError);
        callback(dbError, null);
      }
    });

    stream.on("error", (error) => {
      console.error("Error PDF:", error);
      callback(error, null);
    });
  } catch (error) {
    console.error("Error en crearPDFCertificado:", error);
    callback(error, null);
  }
}

// ============================================
// 1. GENERAR CERTIFICADO INDIVIDUAL
// ============================================
exports.generarCertificado = async (req, res) => {
  try {
    const { inscripcionId } = req.params;

    const [inscripciones] = await pool.query(
      `SELECT i.id as inscripcion_id, i.evento_id, i.calidad,
             u.nombre, u.apellido, u.email,
             e.nombre as evento_nombre, e.tipo, e.fecha_inicio, e.fecha_fin,
             e.horas_academicas, e.lugar, e.tema
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

    crearPDFCertificado(inscripcion, (error, result) => {
      if (error) {
        console.error("Error al crear PDF:", error);
        return res
          .status(500)
          .json({ message: error.message || "Error al crear el certificado" });
      }

      res.json({
        message: "Certificado generado",
        url: result.urlPdf,
        fileName: result.fileName,
      });
    });
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ message: "Error al generar certificado" });
  }
};

// ============================================
// 2. GENERAR CERTIFICADOS MASIVOS
// ============================================
exports.generarCertificadosMasivos = async (req, res) => {
  try {
    const { eventoId } = req.params;

    const [inscripciones] = await pool.query(
      `SELECT i.id as inscripcion_id, i.evento_id, i.calidad,
             u.nombre, u.apellido,
             e.nombre as evento_nombre, e.horas_academicas, e.lugar, e.fecha_inicio, e.tema
      FROM inscripciones i
      INNER JOIN usuarios u ON i.usuario_id = u.id
      INNER JOIN eventos e ON i.evento_id = e.id
      WHERE i.evento_id = ?`,
      [eventoId],
    );

    if (inscripciones.length === 0) {
      return res.status(404).json({ message: "No hay inscripciones" });
    }

    let totalGenerados = 0;
    const certificadosGenerados = [];

    for (const inscripcion of inscripciones) {
      try {
        const resultado = await new Promise((resolve, reject) => {
          crearPDFCertificado(inscripcion, (error, result) => {
            if (error) reject(error);
            else resolve(result);
          });
        });

        totalGenerados++;
        certificadosGenerados.push({
          inscripcionId: inscripcion.inscripcion_id,
          nombre: `${inscripcion.nombre} ${inscripcion.apellido}`,
          url: resultado.urlPdf,
        });
      } catch (error) {
        console.error(`Error con ${inscripcion.nombre}:`, error.message);
      }
    }

    res.json({
      message: `Generados ${totalGenerados} de ${inscripciones.length} certificados`,
      certificados: certificadosGenerados,
    });
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ message: "Error en generación masiva" });
  }
};

// ============================================
// 3. OBTENER CERTIFICADOS POR PARTICIPANTE (PORTAL)
// ============================================
exports.getCertificadosByParticipante = async (req, res) => {
  try {
    const { usuarioId } = req.params;

    const [certificados] = await pool.query(
      `SELECT c.*, e.nombre as evento_nombre, e.tipo, e.fecha_fin, e.horas_academicas,
              e.requiere_encuesta,
              (SELECT COUNT(*) FROM encuestas enc
                 JOIN encuesta_respuestas r ON r.encuesta_id = enc.id
                 WHERE enc.evento_id = c.evento_id AND r.usuario_id = i.usuario_id
              ) AS encuesta_respondida
       FROM certificados c
       INNER JOIN inscripciones i ON c.inscripcion_id = i.id
       INNER JOIN eventos e ON c.evento_id = e.id
       WHERE i.usuario_id = ?
       ORDER BY c.fecha_generacion DESC`,
      [usuarioId],
    );

    res.json(
      certificados.map((c) => ({
        ...c,
        requiere_encuesta: !!c.requiere_encuesta,
        encuesta_respondida: c.encuesta_respondida > 0,
      })),
    );
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ message: "Error al obtener certificados" });
  }
};

// ============================================
// 3b. ESTADO DE CERTIFICADOS DEL PARTICIPANTE (por evento inscrito)
// ============================================
exports.getMisCertificados = async (req, res) => {
  try {
    const { usuarioId } = req.params;

    const [rows] = await pool.query(
      `SELECT i.id AS inscripcion_id, e.id AS evento_id, e.nombre AS evento_nombre,
              e.tipo, e.fecha_fin, e.horas_academicas, e.requiere_encuesta,
              c.id AS certificado_id, c.url_pdf,
              (SELECT COUNT(*) FROM plantillas_certificados pc WHERE pc.evento_id = e.id) AS tiene_plantilla,
              (SELECT COUNT(*) FROM encuestas enc
                 JOIN encuesta_respuestas r ON r.encuesta_id = enc.id
                 WHERE enc.evento_id = e.id AND r.usuario_id = i.usuario_id) AS encuesta_respondida
       FROM inscripciones i
       JOIN eventos e ON i.evento_id = e.id
       LEFT JOIN certificados c ON c.inscripcion_id = i.id
       WHERE i.usuario_id = ?
       ORDER BY e.fecha_fin DESC`,
      [usuarioId],
    );

    res.json(
      rows.map((r) => ({
        inscripcion_id: r.inscripcion_id,
        evento_id: r.evento_id,
        evento_nombre: r.evento_nombre,
        tipo: r.tipo,
        fecha_fin: r.fecha_fin,
        horas_academicas: r.horas_academicas,
        requiere_encuesta: !!r.requiere_encuesta,
        encuesta_respondida: r.encuesta_respondida > 0,
        tiene_certificado: !!r.certificado_id,
        url_pdf: r.url_pdf || null,
        tiene_plantilla: r.tiene_plantilla > 0,
      })),
    );
  } catch (error) {
    console.error("Error al obtener mis certificados:", error);
    res.status(500).json({ message: "Error al obtener certificados" });
  }
};

// ============================================
// 3c. GENERAR CERTIFICADO BAJO DEMANDA (participante)
// ============================================
exports.generarCertificadoParticipante = async (req, res) => {
  try {
    const { inscripcionId } = req.params;

    const [rows] = await pool.query(
      `SELECT i.id as inscripcion_id, i.evento_id, i.usuario_id, i.calidad,
              u.nombre, u.apellido,
              e.fecha_fin, e.tema, e.fecha_inicio, e.requiere_encuesta
       FROM inscripciones i
       INNER JOIN usuarios u ON i.usuario_id = u.id
       INNER JOIN eventos e ON i.evento_id = e.id
       WHERE i.id = ?`,
      [inscripcionId],
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: "Inscripción no encontrada" });
    }
    const insc = rows[0];

    // Validación 1: el evento debe haber finalizado
    if (insc.fecha_fin && new Date(insc.fecha_fin) > new Date()) {
      return res.status(403).json({
        message: "El certificado estará disponible al finalizar el evento",
      });
    }

    // Validación 2: si requiere encuesta, debe haberla respondido
    if (insc.requiere_encuesta) {
      const [enc] = await pool.query(
        "SELECT id FROM encuestas WHERE evento_id = ?",
        [insc.evento_id],
      );
      if (enc.length > 0) {
        const [r] = await pool.query(
          "SELECT id FROM encuesta_respuestas WHERE encuesta_id = ? AND usuario_id = ?",
          [enc[0].id, insc.usuario_id],
        );
        if (r.length === 0) {
          return res.status(403).json({
            message:
              "Debes responder la encuesta de satisfacción antes de obtener tu certificado",
          });
        }
      }
    }

    crearPDFCertificado(insc, (error, result) => {
      if (error) {
        console.error("Error al crear PDF:", error);
        return res.status(500).json({
          message: error.message || "Error al generar el certificado",
        });
      }
      res.json({ message: "Certificado generado", url: result.urlPdf });
    });
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ message: "Error al generar el certificado" });
  }
};

// ============================================
// 4. OBTENER CERTIFICADOS POR EVENTO (PANEL ADMIN)
// ============================================
exports.getCertificadosByEvento = async (req, res) => {
  try {
    const { eventoId } = req.params;

    const [certificados] = await pool.query(
      `SELECT c.*, i.usuario_id,
             u.nombre, u.apellido, u.email
       FROM certificados c
       INNER JOIN inscripciones i ON c.inscripcion_id = i.id
       INNER JOIN usuarios u ON i.usuario_id = u.id
       WHERE c.evento_id = ?
       ORDER BY c.fecha_generacion DESC`,
      [eventoId],
    );

    res.json(certificados);
  } catch (error) {
    console.error("Error al obtener certificados del evento:", error);
    res
      .status(500)
      .json({ message: "Error al obtener certificados del evento" });
  }
};

// ============================================
// 5. VERIFICAR EVENTOS FINALIZADOS
// ============================================
exports.verificarEventosFinalizados = async (req, res) => {
  try {
    const ahora = new Date();

    const [eventos] = await pool.query(
      `SELECT DISTINCT e.id, e.nombre, e.fecha_fin
       FROM eventos e
       INNER JOIN inscripciones i ON e.id = i.evento_id
       LEFT JOIN certificados c ON e.id = c.evento_id
       WHERE e.fecha_fin < ? AND c.id IS NULL`,
      [ahora],
    );

    res.json({ eventosFinalizados: eventos, count: eventos.length });
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ message: "Error al verificar eventos" });
  }
};

// ============================================
// 6. GENERACIÓN AUTOMÁTICA
// ============================================
exports.generarCertificadosAutomaticos = async (req, res) => {
  try {
    const ahora = new Date();

    const [eventos] = await pool.query(
      `SELECT DISTINCT e.id, e.nombre
       FROM eventos e
       INNER JOIN inscripciones i ON e.id = i.evento_id
       LEFT JOIN certificados c ON e.id = c.evento_id
       WHERE e.fecha_fin < ? AND c.id IS NULL`,
      [ahora],
    );

    let totalGenerados = 0;

    for (const evento of eventos) {
      const [inscripciones] = await pool.query(
        `SELECT i.id as inscripcion_id, i.evento_id, i.calidad,
               u.nombre, u.apellido,
               e.nombre as evento_nombre, e.horas_academicas, e.lugar, e.fecha_inicio, e.tema
        FROM inscripciones i
        INNER JOIN usuarios u ON i.usuario_id = u.id
        INNER JOIN eventos e ON i.evento_id = e.id
        WHERE i.evento_id = ?`,
        [evento.id],
      );

      for (const inscripcion of inscripciones) {
        try {
          await new Promise((resolve, reject) => {
            crearPDFCertificado(inscripcion, (error) => {
              if (error) reject(error);
              else resolve();
            });
          });
          totalGenerados++;
        } catch (error) {
          console.error(`Error con ${inscripcion.nombre}:`, error.message);
        }
      }
    }

    res.json({
      message: `Proceso completado. ${totalGenerados} certificados generados`,
      eventosProcesados: eventos.length,
      certificadosGenerados: totalGenerados,
    });
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ message: "Error en generación automática" });
  }
};
