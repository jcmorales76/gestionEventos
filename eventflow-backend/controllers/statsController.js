const pool = require("../config/db");

// Estadísticas del Dashboard (admin)
exports.getDashboard = async (req, res) => {
  try {
    const [[totInsc]] = await pool.query(
      "SELECT COUNT(*) AS n FROM inscripciones",
    );
    const [[evActivos]] = await pool.query(
      "SELECT COUNT(*) AS n FROM eventos WHERE estado = 'Activo'",
    );
    const [[certEmit]] = await pool.query(
      "SELECT COUNT(*) AS n FROM certificados",
    );
    const [[matN]] = await pool.query(
      "SELECT COUNT(*) AS n FROM materiales WHERE nombre_archivo <> ''",
    );

    const [eventosPorTipo] = await pool.query(
      "SELECT tipo AS name, COUNT(*) AS value FROM eventos GROUP BY tipo",
    );

    const [porMes] = await pool.query(
      `SELECT DATE_FORMAT(fecha_inscripcion, '%Y-%m') AS ym, COUNT(*) AS inscritos
       FROM inscripciones
       GROUP BY ym ORDER BY ym DESC LIMIT 6`,
    );

    const [proximosEventos] = await pool.query(
      `SELECT e.id, e.nombre, e.tipo, e.fecha_inicio, e.capacidad, e.estado, e.color,
              (SELECT COUNT(*) FROM inscripciones i WHERE i.evento_id = e.id) AS inscritos
       FROM eventos e
       WHERE e.fecha_inicio >= CURDATE()
       ORDER BY e.fecha_inicio ASC LIMIT 5`,
    );

    res.json({
      stats: {
        totalInscritos: totInsc.n,
        eventosActivos: evActivos.n,
        certificadosEmitidos: certEmit.n,
        materiales: matN.n,
      },
      eventosPorTipo,
      inscripcionesPorMes: porMes.reverse(),
      proximosEventos,
    });
  } catch (error) {
    console.error("Error en dashboard stats:", error);
    res.status(500).json({ message: "Error al obtener estadísticas" });
  }
};

// Estadísticas de Reportes (admin)
exports.getReportes = async (req, res) => {
  try {
    const [[totInsc]] = await pool.query(
      "SELECT COUNT(*) AS n FROM inscripciones",
    );
    const [[partActivos]] = await pool.query(
      "SELECT COUNT(*) AS n FROM usuarios WHERE rol = 'participante' AND estado = 'Activo'",
    );
    const [[evActivos]] = await pool.query(
      "SELECT COUNT(*) AS n FROM eventos WHERE estado = 'Activo'",
    );

    const [inscritosPorEvento] = await pool.query(
      `SELECT e.nombre, e.tipo, e.fecha_inicio, e.capacidad,
              (SELECT COUNT(*) FROM inscripciones i WHERE i.evento_id = e.id) AS inscritos,
              (SELECT COUNT(DISTINCT u.empresa)
                 FROM inscripciones i2
                 JOIN usuarios u ON i2.usuario_id = u.id
                WHERE i2.evento_id = e.id
                  AND u.empresa IS NOT NULL AND u.empresa <> '') AS empresas
       FROM eventos e
       ORDER BY inscritos DESC LIMIT 10`,
    );

    // Empresas participantes (global) y ranking
    const [[empresasTotal]] = await pool.query(
      `SELECT COUNT(DISTINCT u.empresa) AS n
       FROM inscripciones i
       JOIN usuarios u ON i.usuario_id = u.id
       WHERE u.empresa IS NOT NULL AND u.empresa <> ''`,
    );
    const [topEmpresas] = await pool.query(
      `SELECT u.empresa AS name, COUNT(*) AS value
       FROM inscripciones i
       JOIN usuarios u ON i.usuario_id = u.id
       WHERE u.empresa IS NOT NULL AND u.empresa <> ''
       GROUP BY u.empresa
       ORDER BY value DESC
       LIMIT 10`,
    );

    const [eventosPorTipo] = await pool.query(
      "SELECT tipo AS name, COUNT(*) AS value FROM eventos GROUP BY tipo",
    );

    const [tendencia] = await pool.query(
      `SELECT DATE_FORMAT(fecha_inscripcion, '%Y-%m') AS ym, COUNT(*) AS inscritos
       FROM inscripciones
       GROUP BY ym ORDER BY ym DESC LIMIT 6`,
    );

    const [[certEmit]] = await pool.query(
      "SELECT COUNT(*) AS n FROM certificados",
    );
    const [[pendientes]] = await pool.query(
      `SELECT COUNT(*) AS n
       FROM inscripciones i
       JOIN eventos e ON i.evento_id = e.id
       LEFT JOIN certificados c ON c.inscripcion_id = i.id
       WHERE c.id IS NULL AND e.fecha_fin < NOW()`,
    );

    // Descargas registradas
    const [[certDescPersonas]] = await pool.query(
      "SELECT COUNT(DISTINCT usuario_id) AS n FROM descargas WHERE tipo = 'certificado'",
    );
    const [[matDescTotal]] = await pool.query(
      "SELECT COUNT(*) AS n FROM descargas WHERE tipo = 'material'",
    );
    const [[matDescPersonas]] = await pool.query(
      "SELECT COUNT(DISTINCT usuario_id) AS n FROM descargas WHERE tipo = 'material'",
    );

    const [tablaCertificados] = await pool.query(
      `SELECT c.id, c.nombre_participante AS participante, e.nombre AS evento,
              c.fecha_generacion, c.tipo,
              (SELECT COUNT(*) FROM descargas d
                 WHERE d.tipo = 'certificado' AND d.referencia_id = c.id) AS descargas
       FROM certificados c
       JOIN eventos e ON c.evento_id = e.id
       ORDER BY c.fecha_generacion DESC LIMIT 10`,
    );

    const [tablaMateriales] = await pool.query(
      `SELECT m.id, m.nombre_original AS material, e.nombre AS evento, m.sesion,
              (SELECT COUNT(*) FROM descargas d
                 WHERE d.tipo = 'material' AND d.referencia_id = m.id) AS descargas
       FROM materiales m
       JOIN eventos e ON m.evento_id = e.id
       WHERE m.nombre_archivo <> ''
       ORDER BY descargas DESC, m.fecha_subida DESC LIMIT 10`,
    );

    res.json({
      resumen: {
        totalInscritos: totInsc.n,
        participantesActivos: partActivos.n,
        eventosActivos: evActivos.n,
        certificadosDescargados: certDescPersonas.n,
        materialesDescargas: matDescTotal.n,
        materialesDescargadosPersonas: matDescPersonas.n,
        empresasParticipantes: empresasTotal.n,
      },
      topEmpresas,
      inscritosPorEvento,
      eventosPorTipo,
      tendencia: tendencia.reverse(),
      estadoCertificados: [
        { name: "Emitidos", value: certEmit.n },
        { name: "Pendientes", value: pendientes.n },
      ],
      tablaCertificados,
      tablaMateriales,
    });
  } catch (error) {
    console.error("Error en reportes stats:", error);
    res.status(500).json({ message: "Error al obtener reportes" });
  }
};
