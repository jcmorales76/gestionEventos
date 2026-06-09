const PDFDocument = require("pdfkit");
const fs = require("fs");
const path = require("path");
const pool = require("../config/db");

// Función auxiliar para crear el PDF
function crearPDFCertificado(inscripcion, callback) {
  const nombreCompleto = `${inscripcion.nombre} ${inscripcion.apellido}`;
  const calidad = inscripcion.calidad || "PARTICIPANTE";

  // Crear directorio si no existe
  const uploadDir = path.join(__dirname, "../uploads/certificados");
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }

  // Nombre del archivo
  const fileName = `certificado_${inscripcion.inscripcion_id}_${Date.now()}.pdf`;
  const filePath = path.join(uploadDir, fileName);
  const urlPdf = `/uploads/certificados/${fileName}`;

  // Crear PDF
  const doc = new PDFDocument({
    size: "A4",
    layout: "landscape",
    margins: {
      top: 0,
      bottom: 0,
      left: 0,
      right: 0,
    },
  });

  const stream = fs.createWriteStream(filePath);
  doc.pipe(stream);

  // ============================================
  // DISEÑO DEL CERTIFICADO
  // ============================================

  // Fondo
  doc.rect(0, 0, doc.page.width, doc.page.height).fill("#fafafa");

  // Borde decorativo
  doc
    .rect(20, 20, doc.page.width - 40, doc.page.height - 40)
    .lineWidth(3)
    .stroke("#dc2626");

  doc
    .rect(30, 30, doc.page.width - 60, doc.page.height - 60)
    .lineWidth(1)
    .stroke("#f97316");

  // Logo SIM
  doc
    .fontSize(48)
    .font("Helvetica-Bold")
    .fillColor("#dc2626")
    .text("SIM", 100, 100, { align: "center" });

  doc
    .fontSize(24)
    .fillColor("#1f2937")
    .text("AREQUIPA 2026", 100, 150, { align: "center" });

  // Título del evento
  doc
    .fontSize(28)
    .font("Helvetica-Bold")
    .fillColor("#1f2937")
    .text("Seminario Internacional", doc.page.width / 2, 100, {
      align: "center",
    });

  doc
    .fontSize(24)
    .text("de Microfinanzas", doc.page.width / 2, 130, { align: "center" });

  // Línea decorativa
  doc
    .moveTo(200, 180)
    .lineTo(doc.page.width - 200, 180)
    .lineWidth(2)
    .stroke("#dc2626");

  // Texto "CERTIFICAN QUE:"
  doc
    .fontSize(20)
    .font("Helvetica-Bold")
    .fillColor("#374151")
    .text("CERTIFICAN QUE:", doc.page.width / 2, 220, { align: "center" });

  // Nombre del participante
  doc
    .fontSize(32)
    .font("Helvetica-Bold")
    .fillColor("#dc2626")
    .text(nombreCompleto.toUpperCase(), doc.page.width / 2, 270, {
      align: "center",
    });

  // Texto descriptivo
  doc
    .fontSize(16)
    .font("Helvetica")
    .fillColor("#374151")
    .text("Ha participado en el", doc.page.width / 2, 330, { align: "center" });

  doc
    .fontSize(22)
    .font("Helvetica-Bold")
    .text(inscripcion.evento_nombre, doc.page.width / 2, 360, {
      align: "center",
    });

  // Tema del evento
  if (inscripcion.evento_nombre.toLowerCase().includes("inteligencia")) {
    doc
      .fontSize(14)
      .font("Helvetica-Oblique")
      .text(
        '"Cuando la inteligencia artificial amplifica lo humano, el valor se multiplica: Marcas con propósito al servicio de las personas"',
        doc.page.width / 2,
        395,
        { align: "center", width: 700 },
      );
  }

  // Duración
  doc
    .fontSize(16)
    .font("Helvetica")
    .text(
      `Con una duración de ${inscripcion.horas_academicas || 24} horas académicas`,
      doc.page.width / 2,
      440,
      { align: "center" },
    );

  // Calidad
  doc
    .fontSize(24)
    .font("Helvetica-Bold")
    .fillColor("#dc2626")
    .text(`En calidad de:`, doc.page.width / 2, 480, { align: "center" });

  doc
    .fontSize(28)
    .font("Helvetica-Bold")
    .text(calidad.toUpperCase(), doc.page.width / 2, 515, { align: "center" });

  // Fechas y lugar
  let fechaFormateada = "Por definir";
  if (inscripcion.fecha_inicio) {
    const fechaInicio = new Date(inscripcion.fecha_inicio);
    fechaFormateada = fechaInicio.toLocaleDateString("es-ES", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  }

  doc
    .fontSize(14)
    .font("Helvetica")
    .fillColor("#374151")
    .text(
      `Realizado el ${fechaFormateada} en la ciudad de ${inscripcion.lugar || "Arequipa"}, Perú.`,
      doc.page.width / 2,
      570,
      { align: "center", width: 700 },
    );

  // Fecha de emisión
  const fechaEmision = new Date().toLocaleDateString("es-ES", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  doc
    .fontSize(12)
    .text(`Arequipa, ${fechaEmision}`, doc.page.width / 2, 600, {
      align: "center",
    });

  // Firmas
  doc
    .moveTo(doc.page.width / 2 - 150, 650)
    .lineTo(doc.page.width / 2 - 50, 650)
    .lineWidth(1)
    .stroke("#374151");

  doc
    .moveTo(doc.page.width / 2 + 50, 650)
    .lineTo(doc.page.width / 2 + 150, 650)
    .stroke("#374151");

  doc
    .fontSize(11)
    .text("Director del Evento", doc.page.width / 2 - 100, 660, {
      align: "center",
    });
  doc.text("Coordinador Académico", doc.page.width / 2 + 100, 660, {
    align: "center",
  });

  // Finalizar PDF
  doc.end();

  stream.on("finish", () => {
    callback(null, { urlPdf, fileName });
  });

  stream.on("error", (error) => {
    callback(error, null);
  });
}

// Generar certificado individual
exports.generarCertificado = async (req, res) => {
  try {
    const { inscripcionId } = req.params;

    // Obtener datos de la inscripción
    const [inscripciones] = await pool.query(
      `
      SELECT i.*, u.nombre, u.apellido, u.email,
             e.nombre as evento_nombre, e.tipo, e.fecha_inicio, e.fecha_fin,
             e.hora_inicio, e.horas_academicas, e.lugar
      FROM inscripciones i
      INNER JOIN usuarios u ON i.usuario_id = u.id
      INNER JOIN eventos e ON i.evento_id = e.id
      WHERE i.id = ?
    `,
      [inscripcionId],
    );

    if (inscripciones.length === 0) {
      return res.status(404).json({ message: "Inscripción no encontrada" });
    }

    const inscripcion = inscripciones[0];

    crearPDFCertificado(inscripcion, async (error, result) => {
      if (error) {
        console.error("Error al crear PDF:", error);
        return res
          .status(500)
          .json({ message: "Error al crear el certificado" });
      }

      try {
        await pool.query(
          `
          INSERT INTO certificados (evento_id, inscripcion_id, tipo, nombre_participante, url_pdf)
          VALUES (?, ?, ?, ?, ?)
          ON DUPLICATE KEY UPDATE url_pdf = ?, tipo = ?
        `,
          [
            inscripcion.evento_id,
            inscripcionId,
            inscripcion.calidad || "PARTICIPANTE",
            `${inscripcion.nombre} ${inscripcion.apellido}`,
            result.urlPdf,
            result.urlPdf,
            inscripcion.calidad || "PARTICIPANTE",
          ],
        );

        res.json({
          message: "Certificado generado exitosamente",
          url: result.urlPdf,
          fileName: result.fileName,
        });
      } catch (dbError) {
        console.error("Error al guardar en BD:", dbError);
        res.status(500).json({ message: "Error al guardar certificado" });
      }
    });
  } catch (error) {
    console.error("Error al generar certificado:", error);
    res.status(500).json({ message: "Error al generar certificado" });
  }
};

// Generar certificados masivos para un evento
exports.generarCertificadosMasivos = async (req, res) => {
  try {
    const { eventoId } = req.params;

    // Obtener todas las inscripciones del evento
    const [inscripciones] = await pool.query(
      `
      SELECT i.id as inscripcion_id, i.calidad, u.nombre, u.apellido,
             e.nombre as evento_nombre, e.horas_academicas, e.lugar, e.fecha_inicio
      FROM inscripciones i
      INNER JOIN usuarios u ON i.usuario_id = u.id
      INNER JOIN eventos e ON i.evento_id = e.id
      WHERE i.evento_id = ?
    `,
      [eventoId],
    );

    if (inscripciones.length === 0) {
      return res
        .status(404)
        .json({ message: "No hay inscripciones para este evento" });
    }

    let totalGenerados = 0;
    let errores = 0;
    const certificadosGenerados = [];

    // Generar certificado para cada inscripción
    for (const inscripcion of inscripciones) {
      try {
        const resultado = await new Promise((resolve, reject) => {
          crearPDFCertificado(inscripcion, async (error, result) => {
            if (error) {
              reject(error);
            } else {
              try {
                await pool.query(
                  `
                  INSERT INTO certificados (evento_id, inscripcion_id, tipo, nombre_participante, url_pdf)
                  VALUES (?, ?, ?, ?, ?)
                  ON DUPLICATE KEY UPDATE url_pdf = ?, tipo = ?
                `,
                  [
                    eventoId,
                    inscripcion.inscripcion_id,
                    inscripcion.calidad || "PARTICIPANTE",
                    `${inscripcion.nombre} ${inscripcion.apellido}`,
                    result.urlPdf,
                    result.urlPdf,
                    inscripcion.calidad || "PARTICIPANTE",
                  ],
                );
                resolve(result);
              } catch (dbError) {
                reject(dbError);
              }
            }
          });
        });

        totalGenerados++;
        certificadosGenerados.push({
          inscripcionId: inscripcion.inscripcion_id,
          nombre: `${inscripcion.nombre} ${inscripcion.apellido}`,
          url: resultado.urlPdf,
        });
      } catch (error) {
        console.error(
          `Error generando certificado para ${inscripcion.nombre}:`,
          error,
        );
        errores++;
      }
    }

    res.json({
      message: `Se generaron ${totalGenerados} de ${inscripciones.length} certificados`,
      certificados: certificadosGenerados,
      errores: errores,
    });
  } catch (error) {
    console.error("Error al generar certificados masivos:", error);
    res.status(500).json({ message: "Error al generar certificados masivos" });
  }
};

// Obtener certificados de un participante
exports.getCertificadosByParticipante = async (req, res) => {
  try {
    const { usuarioId } = req.params;

    const [certificados] = await pool.query(
      `
      SELECT c.*, e.nombre as evento_nombre, e.tipo, e.fecha_fin
      FROM certificados c
      INNER JOIN inscripciones i ON c.inscripcion_id = i.id
      INNER JOIN eventos e ON c.evento_id = e.id
      WHERE i.usuario_id = ?
      ORDER BY c.fecha_generacion DESC
    `,
      [usuarioId],
    );

    res.json(certificados);
  } catch (error) {
    console.error("Error al obtener certificados:", error);
    res.status(500).json({ message: "Error al obtener certificados" });
  }
};

// Verificar si el evento finalizó (para generación automática)
exports.verificarEventosFinalizados = async (req, res) => {
  try {
    const ahora = new Date();

    // Buscar eventos que ya finalizaron pero no tienen certificados generados
    const [eventos] = await pool.query(
      `
      SELECT DISTINCT e.id, e.nombre, e.fecha_fin
      FROM eventos e
      INNER JOIN inscripciones i ON e.id = i.evento_id
      LEFT JOIN certificados c ON e.id = c.evento_id
      WHERE e.fecha_fin < ?
      AND c.id IS NULL
    `,
      [ahora],
    );

    res.json({
      eventosFinalizados: eventos,
      count: eventos.length,
    });
  } catch (error) {
    console.error("Error al verificar eventos:", error);
    res.status(500).json({ message: "Error al verificar eventos finalizados" });
  }
};

// Generar certificados automáticamente para eventos finalizados
exports.generarCertificadosAutomaticos = async (req, res) => {
  try {
    const ahora = new Date();

    // Obtener eventos finalizados sin certificados
    const [eventos] = await pool.query(
      `
      SELECT DISTINCT e.id, e.nombre
      FROM eventos e
      INNER JOIN inscripciones i ON e.id = i.evento_id
      LEFT JOIN certificados c ON e.id = c.evento_id
      WHERE e.fecha_fin < ?
      AND c.id IS NULL
    `,
      [ahora],
    );

    let totalGenerados = 0;

    for (const evento of eventos) {
      // Obtener inscripciones del evento
      const [inscripciones] = await pool.query(
        `
        SELECT i.id as inscripcion_id, i.calidad, u.nombre, u.apellido,
               e.nombre as evento_nombre, e.horas_academicas, e.lugar, e.fecha_inicio
        FROM inscripciones i
        INNER JOIN usuarios u ON i.usuario_id = u.id
        INNER JOIN eventos e ON i.evento_id = e.id
        WHERE i.evento_id = ?
      `,
        [evento.id],
      );

      for (const inscripcion of inscripciones) {
        try {
          await new Promise((resolve, reject) => {
            crearPDFCertificado(inscripcion, async (error, result) => {
              if (error) {
                reject(error);
              } else {
                try {
                  await pool.query(
                    `
                    INSERT INTO certificados (evento_id, inscripcion_id, tipo, nombre_participante, url_pdf)
                    VALUES (?, ?, ?, ?, ?)
                  `,
                    [
                      evento.id,
                      inscripcion.inscripcion_id,
                      inscripcion.calidad || "PARTICIPANTE",
                      `${inscripcion.nombre} ${inscripcion.apellido}`,
                      result.urlPdf,
                    ],
                  );
                  resolve();
                } catch (dbError) {
                  reject(dbError);
                }
              }
            });
          });
          totalGenerados++;
        } catch (error) {
          console.error(`Error con ${inscripcion.nombre}:`, error);
        }
      }
    }

    res.json({
      message: `Proceso completado. Se generaron ${totalGenerados} certificados`,
      eventosProcesados: eventos.length,
      certificadosGenerados: totalGenerados,
    });
  } catch (error) {
    console.error("Error en generación automática:", error);
    res.status(500).json({ message: "Error en generación automática" });
  }
};

module.exports = {
  generarCertificado,
  generarCertificadosMasivos,
  getCertificadosByParticipante,
  verificarEventosFinalizados,
  generarCertificadosAutomaticos,
};
