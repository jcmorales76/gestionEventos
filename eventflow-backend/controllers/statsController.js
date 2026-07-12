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
              (SELECT COUNT(*) FROM inscripciones i WHERE i.evento_id = e.id) AS inscritos
       FROM eventos e
       ORDER BY inscritos DESC LIMIT 10`,
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

    const [tablaCertificados] = await pool.query(
      `SELECT c.nombre_participante AS participante, e.nombre AS evento,
              c.fecha_generacion, c.tipo
       FROM certificados c
       JOIN eventos e ON c.evento_id = e.id
       ORDER BY c.fecha_generacion DESC LIMIT 10`,
    );

    const [tablaMateriales] = await pool.query(
      `SELECT m.nombre_original AS material, e.nombre AS evento, m.sesion
       FROM materiales m
       JOIN eventos e ON m.evento_id = e.id
       WHERE m.nombre_archivo <> ''
       ORDER BY m.fecha_subida DESC LIMIT 10`,
    );

    res.json({
      resumen: {
        totalInscritos: totInsc.n,
        participantesActivos: partActivos.n,
        eventosActivos: evActivos.n,
      },
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
