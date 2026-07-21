// ============================================================================
//  Controlador de la bitácora de auditoría (solo admin)
// ============================================================================
const pool = require("../config/db");

/**
 * Listado paginado con filtros:
 *   ?page=1&limit=50&usuario_id=&modulo=&accion=&desde=&hasta=&q=
 */
exports.getAuditoria = async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(200, Math.max(1, parseInt(req.query.limit, 10) || 50));
    const offset = (page - 1) * limit;

    const where = [];
    const params = [];
    if (req.query.usuario_id) {
      where.push("usuario_id = ?");
      params.push(req.query.usuario_id);
    }
    if (req.query.modulo) {
      where.push("modulo = ?");
      params.push(req.query.modulo);
    }
    if (req.query.accion) {
      where.push("accion = ?");
      params.push(req.query.accion);
    }
    if (req.query.desde) {
      where.push("fecha >= ?");
      params.push(req.query.desde + " 00:00:00");
    }
    if (req.query.hasta) {
      where.push("fecha <= ?");
      params.push(req.query.hasta + " 23:59:59");
    }
    if (req.query.q) {
      where.push("(descripcion LIKE ? OR usuario_nombre LIKE ? OR ruta LIKE ?)");
      const like = `%${req.query.q}%`;
      params.push(like, like, like);
    }
    const whereSql = where.length ? `WHERE ${where.join(" AND ")}` : "";

    const [[{ total }]] = await pool.query(
      `SELECT COUNT(*) AS total FROM auditoria ${whereSql}`,
      params,
    );
    const [rows] = await pool.query(
      `SELECT id, usuario_id, usuario_nombre, rol, accion, modulo, entidad_id,
              descripcion, ip, metodo, ruta, fecha
         FROM auditoria ${whereSql}
        ORDER BY fecha DESC, id DESC
        LIMIT ? OFFSET ?`,
      [...params, limit, offset],
    );

    res.json({ rows, total, page, limit, paginas: Math.ceil(total / limit) });
  } catch (error) {
    console.error("Error obteniendo auditoría:", error);
    res.status(500).json({ message: "Error al obtener la auditoría" });
  }
};

/** Valores para poblar los desplegables de filtros. */
exports.getFiltros = async (req, res) => {
  try {
    const [modulos] = await pool.query(
      "SELECT DISTINCT modulo FROM auditoria ORDER BY modulo",
    );
    const [acciones] = await pool.query(
      "SELECT DISTINCT accion FROM auditoria ORDER BY accion",
    );
    const [usuarios] = await pool.query(
      `SELECT id, TRIM(CONCAT(COALESCE(nombre,''),' ',COALESCE(apellido,''))) AS nombre
         FROM usuarios ORDER BY nombre`,
    );
    res.json({
      modulos: modulos.map((m) => m.modulo),
      acciones: acciones.map((a) => a.accion),
      usuarios,
    });
  } catch (error) {
    console.error("Error obteniendo filtros de auditoría:", error);
    res.status(500).json({ message: "Error al obtener los filtros" });
  }
};
