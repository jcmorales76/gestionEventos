// ============================================================================
//  Bitácora de auditoría global (trazabilidad de acciones de usuarios)
// ----------------------------------------------------------------------------
//  Enfoque HÍBRIDO:
//   - registrarAuditoria(): registro explícito con descripción legible.
//   - auditoriaAuto: middleware que captura automáticamente TODA mutación
//     exitosa (POST/PUT/PATCH/DELETE) que no haya sido auditada a mano.
//  Se guarda solo descripción + IP (sin diff de campos ni datos sensibles).
// ============================================================================
const pool = require("../config/db");

/** IP de origen (respeta proxy/cPanel vía X-Forwarded-For). */
function getIp(req) {
  const xf = req?.headers?.["x-forwarded-for"];
  if (xf) return String(xf).split(",")[0].trim();
  return req?.ip || req?.socket?.remoteAddress || null;
}

/** Nombre legible del usuario. */
function nombreUsuario(u = {}) {
  return (
    [u.nombre, u.apellido].filter(Boolean).join(" ") ||
    u.name ||
    u.email ||
    null
  );
}

/** Módulo a partir de la ruta: /api/eventos/5 → 'eventos'. */
function inferirModulo(ruta) {
  const parts = String(ruta || "").split("?")[0].split("/").filter(Boolean);
  // parts = ['api','eventos','5']
  return parts[1] || "otros";
}

/** Id numérico final de la ruta, si existe. */
function inferirEntidadId(ruta) {
  const parts = String(ruta || "").split("?")[0].split("/").filter(Boolean);
  const last = parts[parts.length - 1];
  return /^\d+$/.test(last) ? Number(last) : null;
}

/** Acción a partir del método HTTP y el módulo. */
function inferirAccion(metodo, modulo) {
  if (metodo === "POST") {
    if (["materiales", "importacion"].includes(modulo)) return "subir";
    return "crear";
  }
  if (metodo === "PUT" || metodo === "PATCH") return "editar";
  if (metodo === "DELETE") return "eliminar";
  return "accion";
}

/**
 * Registra una entrada de auditoría. Marca req._auditado para que el
 * middleware automático no la duplique. Nunca interrumpe el flujo.
 * opts: { accion, modulo, entidad_id, descripcion, usuario_id, usuario_nombre, rol, ip, metodo, ruta }
 */
async function registrarAuditoria(req, opts = {}) {
  try {
    if (req) req._auditado = true;
    const u = req?.user || {};
    await pool.query(
      `INSERT INTO auditoria
        (usuario_id, usuario_nombre, rol, accion, modulo, entidad_id, descripcion, ip, metodo, ruta)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        opts.usuario_id ?? u.id ?? null,
        opts.usuario_nombre ?? nombreUsuario(u),
        opts.rol ?? u.rol ?? null,
        opts.accion || "accion",
        opts.modulo || "otros",
        opts.entidad_id ?? null,
        opts.descripcion ?? null,
        opts.ip ?? getIp(req),
        opts.metodo ?? req?.method ?? null,
        opts.ruta ?? (req?.originalUrl || "").split("?")[0] ?? null,
      ],
    );
  } catch (e) {
    console.error("No se pudo registrar auditoría:", e.message);
  }
}

/**
 * Middleware: captura automáticamente las mutaciones exitosas que no fueron
 * registradas explícitamente por su controlador.
 */
function auditoriaAuto(req, res, next) {
  if (!["POST", "PUT", "PATCH", "DELETE"].includes(req.method)) return next();

  res.on("finish", () => {
    try {
      if (req._auditado) return; // ya lo registró el controlador
      if (res.statusCode >= 400) return; // solo acciones exitosas
      const ruta = (req.originalUrl || "").split("?")[0];
      const modulo = inferirModulo(ruta);
      if (modulo === "auditoria") return; // no auditar el propio módulo
      const accion = inferirAccion(req.method, modulo);
      registrarAuditoria(req, {
        accion,
        modulo,
        entidad_id: inferirEntidadId(ruta),
        descripcion: `${accion} en ${modulo}`,
        ruta,
      });
    } catch {
      /* nunca romper la respuesta */
    }
  });

  next();
}

module.exports = { registrarAuditoria, auditoriaAuto, getIp };
