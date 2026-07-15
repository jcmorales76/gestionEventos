const pool = require("../config/db");

const TIPOS_VALIDOS = ["abierta", "opcion_unica", "opcion_multiple", "escala"];

// Obtener la encuesta de un evento (con preguntas y opciones)
exports.getEncuestaByEvento = async (req, res) => {
  try {
    const { eventoId } = req.params;

    const [evRows] = await pool.query(
      "SELECT id, nombre, requiere_encuesta FROM eventos WHERE id = ?",
      [eventoId],
    );
    if (evRows.length === 0) {
      return res.status(404).json({ message: "Evento no encontrado" });
    }

    const [encRows] = await pool.query(
      "SELECT * FROM encuestas WHERE evento_id = ?",
      [eventoId],
    );

    if (encRows.length === 0) {
      // Aún no hay encuesta creada para este evento
      return res.json({
        evento: evRows[0],
        requiere_encuesta: !!evRows[0].requiere_encuesta,
        encuesta: null,
        preguntas: [],
      });
    }

    const encuesta = encRows[0];

    const [preguntas] = await pool.query(
      "SELECT * FROM encuesta_preguntas WHERE encuesta_id = ? ORDER BY orden, id",
      [encuesta.id],
    );

    const ids = preguntas.map((p) => p.id);
    let opciones = [];
    if (ids.length > 0) {
      const [opts] = await pool.query(
        "SELECT * FROM encuesta_opciones WHERE pregunta_id IN (?) ORDER BY orden, id",
        [ids],
      );
      opciones = opts;
    }

    const preguntasConOpciones = preguntas.map((p) => ({
      ...p,
      opciones: opciones
        .filter((o) => o.pregunta_id === p.id)
        .map((o) => ({ id: o.id, texto: o.texto })),
    }));

    res.json({
      evento: evRows[0],
      requiere_encuesta: !!evRows[0].requiere_encuesta,
      encuesta,
      preguntas: preguntasConOpciones,
    });
  } catch (error) {
    console.error("Error al obtener encuesta:", error);
    res.status(500).json({ message: "Error al obtener la encuesta" });
  }
};

// Crear o actualizar la encuesta de un evento (reconstruye preguntas/opciones)
exports.guardarEncuesta = async (req, res) => {
  const conn = await pool.getConnection();
  try {
    const {
      eventoId,
      titulo,
      descripcion,
      requiere_encuesta,
      preguntas = [],
    } = req.body;

    if (!eventoId) {
      conn.release();
      return res.status(400).json({ message: "Falta el evento" });
    }

    // Validar preguntas
    for (const p of preguntas) {
      if (!p.texto || !p.texto.trim()) {
        conn.release();
        return res
          .status(400)
          .json({ message: "Todas las preguntas deben tener texto" });
      }
      if (!TIPOS_VALIDOS.includes(p.tipo)) {
        conn.release();
        return res
          .status(400)
          .json({ message: `Tipo de pregunta inválido: ${p.tipo}` });
      }
      if (
        (p.tipo === "opcion_unica" || p.tipo === "opcion_multiple") &&
        (!Array.isArray(p.opciones) ||
          p.opciones.filter((o) => (o.texto || o).toString().trim()).length < 2)
      ) {
        conn.release();
        return res.status(400).json({
          message: `La pregunta "${p.texto}" debe tener al menos 2 opciones`,
        });
      }
    }

    await conn.beginTransaction();

    // 1. Actualizar el flag del evento
    await conn.query("UPDATE eventos SET requiere_encuesta = ? WHERE id = ?", [
      requiere_encuesta ? 1 : 0,
      eventoId,
    ]);

    // 2. Upsert de la encuesta
    const [encRows] = await conn.query(
      "SELECT id FROM encuestas WHERE evento_id = ?",
      [eventoId],
    );

    let encuestaId;
    if (encRows.length > 0) {
      encuestaId = encRows[0].id;
      await conn.query(
        "UPDATE encuestas SET titulo = ?, descripcion = ? WHERE id = ?",
        [titulo || "Encuesta de satisfacción", descripcion || "", encuestaId],
      );
      // Borrar preguntas anteriores (las opciones caen por CASCADE)
      await conn.query("DELETE FROM encuesta_preguntas WHERE encuesta_id = ?", [
        encuestaId,
      ]);
    } else {
      const [ins] = await conn.query(
        "INSERT INTO encuestas (evento_id, titulo, descripcion) VALUES (?, ?, ?)",
        [eventoId, titulo || "Encuesta de satisfacción", descripcion || ""],
      );
      encuestaId = ins.insertId;
    }

    // 3. Insertar preguntas y opciones
    for (let i = 0; i < preguntas.length; i++) {
      const p = preguntas[i];
      const [pIns] = await conn.query(
        "INSERT INTO encuesta_preguntas (encuesta_id, texto, tipo, orden) VALUES (?, ?, ?, ?)",
        [encuestaId, p.texto.trim(), p.tipo, i],
      );
      const preguntaId = pIns.insertId;

      if (p.tipo === "opcion_unica" || p.tipo === "opcion_multiple") {
        const opciones = p.opciones
          .map((o) => (o.texto || o).toString().trim())
          .filter(Boolean);
        for (let j = 0; j < opciones.length; j++) {
          await conn.query(
            "INSERT INTO encuesta_opciones (pregunta_id, texto, orden) VALUES (?, ?, ?)",
            [preguntaId, opciones[j], j],
          );
        }
      }
    }

    await conn.commit();
    conn.release();

    res.json({ message: "Encuesta guardada correctamente", encuestaId });
  } catch (error) {
    await conn.rollback();
    conn.release();
    console.error("Error al guardar encuesta:", error);
    res.status(500).json({ message: "Error al guardar la encuesta" });
  }
};

// Estado de la encuesta para un usuario en un evento (¿requiere?, ¿respondió?)
exports.getEstadoEncuesta = async (req, res) => {
  try {
    const { eventoId, usuarioId } = req.params;
    const [ev] = await pool.query(
      "SELECT requiere_encuesta FROM eventos WHERE id = ?",
      [eventoId],
    );
    const [enc] = await pool.query(
      "SELECT id FROM encuestas WHERE evento_id = ?",
      [eventoId],
    );

    let respondida = false;
    if (enc.length > 0) {
      const [r] = await pool.query(
        "SELECT id FROM encuesta_respuestas WHERE encuesta_id = ? AND usuario_id = ?",
        [enc[0].id, usuarioId],
      );
      respondida = r.length > 0;
    }

    res.json({
      requiere_encuesta: ev.length ? !!ev[0].requiere_encuesta : false,
      tieneEncuesta: enc.length > 0,
      respondida,
    });
  } catch (error) {
    console.error("Error al obtener estado de encuesta:", error);
    res.status(500).json({ message: "Error al obtener estado de encuesta" });
  }
};

// Guardar las respuestas de un participante
exports.responderEncuesta = async (req, res) => {
  const conn = await pool.getConnection();
  try {
    const { eventoId, usuarioId, respuestas } = req.body;

    if (!eventoId || !usuarioId) {
      conn.release();
      return res.status(400).json({ message: "Faltan datos" });
    }

    const [enc] = await conn.query(
      "SELECT id FROM encuestas WHERE evento_id = ?",
      [eventoId],
    );
    if (enc.length === 0) {
      conn.release();
      return res
        .status(404)
        .json({ message: "Este evento no tiene encuesta configurada" });
    }
    const encuestaId = enc[0].id;

    const [prev] = await conn.query(
      "SELECT id FROM encuesta_respuestas WHERE encuesta_id = ? AND usuario_id = ?",
      [encuestaId, usuarioId],
    );
    if (prev.length > 0) {
      conn.release();
      return res.status(400).json({ message: "Ya respondiste esta encuesta" });
    }

    await conn.beginTransaction();

    const [ins] = await conn.query(
      "INSERT INTO encuesta_respuestas (encuesta_id, usuario_id, evento_id) VALUES (?, ?, ?)",
      [encuestaId, usuarioId, eventoId],
    );
    const respuestaId = ins.insertId;

    for (const r of respuestas || []) {
      if (r.tipo === "opcion_multiple") {
        for (const oid of r.opcionIds || []) {
          await conn.query(
            "INSERT INTO encuesta_respuesta_detalle (respuesta_id, pregunta_id, opcion_id) VALUES (?, ?, ?)",
            [respuestaId, r.preguntaId, oid],
          );
        }
      } else if (r.tipo === "opcion_unica") {
        if (r.opcionIds && r.opcionIds[0]) {
          await conn.query(
            "INSERT INTO encuesta_respuesta_detalle (respuesta_id, pregunta_id, opcion_id) VALUES (?, ?, ?)",
            [respuestaId, r.preguntaId, r.opcionIds[0]],
          );
        }
      } else {
        // abierta o escala → se guarda en 'valor'
        await conn.query(
          "INSERT INTO encuesta_respuesta_detalle (respuesta_id, pregunta_id, valor) VALUES (?, ?, ?)",
          [respuestaId, r.preguntaId, (r.valor ?? "").toString()],
        );
      }
    }

    await conn.commit();
    conn.release();
    res.json({ message: "¡Gracias! Tu encuesta fue registrada." });
  } catch (error) {
    await conn.rollback();
    conn.release();
    console.error("Error al responder encuesta:", error);
    res.status(500).json({ message: "Error al enviar la encuesta" });
  }
};

// Encuestas de los eventos del participante (con estado respondida)
exports.getEncuestasParticipante = async (req, res) => {
  try {
    const { usuarioId } = req.params;
    const [rows] = await pool.query(
      `SELECT e.id AS evento_id, e.nombre AS evento_nombre, e.fecha_fin,
              enc.id AS encuesta_id, enc.titulo,
              (SELECT COUNT(*) FROM encuesta_respuestas r
                 WHERE r.encuesta_id = enc.id AND r.usuario_id = i.usuario_id) AS respondida
       FROM inscripciones i
       JOIN eventos e ON i.evento_id = e.id
       JOIN encuestas enc ON enc.evento_id = e.id
       WHERE i.usuario_id = ?
       ORDER BY e.fecha_inicio DESC`,
      [usuarioId],
    );
    res.json(rows.map((r) => ({ ...r, respondida: r.respondida > 0 })));
  } catch (error) {
    console.error("Error al obtener encuestas del participante:", error);
    res.status(500).json({ message: "Error al obtener encuestas" });
  }
};

// Reporte de resultados de la encuesta de un evento (admin)
exports.getReporteEncuesta = async (req, res) => {
  try {
    const { eventoId } = req.params;

    const [enc] = await pool.query(
      "SELECT * FROM encuestas WHERE evento_id = ?",
      [eventoId],
    );
    if (enc.length === 0) return res.json({ encuesta: null });
    const encuesta = enc[0];

    const [[tot]] = await pool.query(
      "SELECT COUNT(*) AS n FROM encuesta_respuestas WHERE encuesta_id = ?",
      [encuesta.id],
    );
    const [[insc]] = await pool.query(
      "SELECT COUNT(*) AS n FROM inscripciones WHERE evento_id = ?",
      [eventoId],
    );

    const [preguntas] = await pool.query(
      "SELECT * FROM encuesta_preguntas WHERE encuesta_id = ? ORDER BY orden, id",
      [encuesta.id],
    );
    const pids = preguntas.map((p) => p.id);

    let opciones = [];
    let detalles = [];
    if (pids.length > 0) {
      [opciones] = await pool.query(
        "SELECT * FROM encuesta_opciones WHERE pregunta_id IN (?)",
        [pids],
      );
      [detalles] = await pool.query(
        `SELECT d.pregunta_id, d.opcion_id, d.valor
         FROM encuesta_respuesta_detalle d
         JOIN encuesta_respuestas r ON d.respuesta_id = r.id
         WHERE r.encuesta_id = ?`,
        [encuesta.id],
      );
    }

    let escalaSum = 0;
    let escalaCount = 0;

    const preguntasReporte = preguntas.map((p) => {
      const dets = detalles.filter((d) => d.pregunta_id === p.id);

      if (p.tipo === "opcion_unica" || p.tipo === "opcion_multiple") {
        const ops = opciones
          .filter((o) => o.pregunta_id === p.id)
          .map((o) => ({
            texto: o.texto,
            count: dets.filter((d) => d.opcion_id === o.id).length,
          }));
        return { id: p.id, texto: p.texto, tipo: p.tipo, opciones: ops };
      }

      if (p.tipo === "escala") {
        const vals = dets
          .map((d) => parseInt(d.valor))
          .filter((v) => !isNaN(v));
        const distribucion = [1, 2, 3, 4, 5].map((n) => ({
          valor: n,
          count: vals.filter((v) => v === n).length,
        }));
        const suma = vals.reduce((a, b) => a + b, 0);
        escalaSum += suma;
        escalaCount += vals.length;
        return {
          id: p.id,
          texto: p.texto,
          tipo: p.tipo,
          distribucion,
          promedio: vals.length ? Number((suma / vals.length).toFixed(2)) : 0,
        };
      }

      // abierta
      const respuestas = dets
        .map((d) => d.valor)
        .filter((v) => v && v.trim());
      return { id: p.id, texto: p.texto, tipo: p.tipo, respuestas };
    });

    res.json({
      encuesta,
      totalRespuestas: tot.n,
      inscritos: insc.n,
      participacion: insc.n ? Math.round((tot.n / insc.n) * 100) : 0,
      satisfaccion: escalaCount
        ? Number((escalaSum / escalaCount).toFixed(2))
        : null,
      preguntas: preguntasReporte,
    });
  } catch (error) {
    console.error("Error al obtener el reporte de la encuesta:", error);
    res.status(500).json({ message: "Error al obtener el reporte" });
  }
};
