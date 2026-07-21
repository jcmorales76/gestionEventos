// ============================================================================
//  Controlador del módulo de Análisis de Ingresos (Auspicio + Inscritos)
// ----------------------------------------------------------------------------
//  Reglas confirmadas con el cliente:
//   - Inscritos: descuento POR LOTES, NO retroactivo. Cada lote (una acción
//     de inscripción) toma el precio del tramo del total acumulado de la
//     empresa en ese momento. IGV 18% se suma. Se permite override manual.
//   - Cuadro de precios configurable por evento (se siembran tramos por
//     defecto: 1-3=885, 4-6=826, 7+=767).
//   - Híbrido: se pueden sincronizar los inscritos reales del sistema
//     (agrupados por empresa) y además registrar/editar lotes a mano.
//   - Auspicio: monto negociado por patrocinador (categoría + monto + entradas
//     incluidas + estado). Las entradas incluidas son informativas, no suman
//     al ingreso.
//   - "Real/recaudado" = estado 'pagado'. "Comprometido/proyectado" = todo.
// ============================================================================
const pool = require("../config/db");
const {
  precioPorTramo,
  calcularImporteLote,
  desglosarConIgv,
  recalcularCadenaEmpresa,
  redondear2,
  TRAMOS_POR_DEFECTO,
} = require("../utils/finanzasCalc");

const ESTADOS = [
  "registrado",
  "factura_solicitada",
  "factura_enviada",
  "pagado",
];

// --------------------------------------------------------------------------
//  Helpers internos
// --------------------------------------------------------------------------

/** Formatea una fecha (Date o string) a 'YYYY-MM-DD' local, o null. */
function fmtFecha(d) {
  if (!d) return null;
  const dt = d instanceof Date ? d : new Date(d);
  if (isNaN(dt.getTime())) return null;
  const y = dt.getFullYear();
  const m = String(dt.getMonth() + 1).padStart(2, "0");
  const day = String(dt.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/** Fecha de hoy en 'YYYY-MM-DD' local. */
function hoyISO() {
  return fmtFecha(new Date());
}

/**
 * Lunes (inicio) de la semana ISO que contiene la fecha dada, en 'YYYY-MM-DD'.
 * Se usa para agrupar la proyección de flujo por semana.
 */
function inicioSemana(fechaISO) {
  const d = new Date(fechaISO + "T00:00:00");
  const dow = (d.getDay() + 6) % 7; // 0 = lunes … 6 = domingo
  d.setDate(d.getDate() - dow);
  return fmtFecha(d);
}

/**
 * Determina la fecha de pago real al guardar:
 *  - Si el body la trae explícita, se respeta (fecha o null).
 *  - Si el estado final es 'pagado', se conserva la previa o se pone hoy.
 *  - En cualquier otro estado, se limpia (null).
 */
function resolverFechaPago(estadoFinal, fechaPagoPrevia, fechaPagoBody) {
  if (fechaPagoBody !== undefined) return fechaPagoBody || null;
  if (estadoFinal === "pagado") return fmtFecha(fechaPagoPrevia) || hoyISO();
  return null;
}

/** Nombre legible del usuario autenticado (para el historial). */
function nombreUsuario(req) {
  const u = req.user || {};
  return (
    [u.nombre, u.apellido].filter(Boolean).join(" ") ||
    u.name ||
    u.email ||
    "Sistema"
  );
}

/** Registra un cambio en el historial (auditoría). Nunca rompe el flujo. */
async function log(req, eventoId, entidad, entidadId, accion, detalle, empresa = null) {
  try {
    await pool.query(
      `INSERT INTO finanzas_historial
        (evento_id, entidad, entidad_id, empresa, accion, detalle, usuario_id, usuario_nombre)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        eventoId,
        entidad,
        entidadId,
        empresa,
        accion,
        detalle,
        req.user?.id || null,
        nombreUsuario(req),
      ],
    );
  } catch (e) {
    console.error("No se pudo registrar historial de finanzas:", e.message);
  }
}

/** Config del evento; crea una por defecto si no existe. */
async function obtenerConfig(eventoId) {
  const [rows] = await pool.query(
    "SELECT * FROM finanzas_config WHERE evento_id = ?",
    [eventoId],
  );
  if (rows.length > 0) return rows[0];
  await pool.query(
    "INSERT INTO finanzas_config (evento_id) VALUES (?)",
    [eventoId],
  );
  const [nuevo] = await pool.query(
    "SELECT * FROM finanzas_config WHERE evento_id = ?",
    [eventoId],
  );
  return nuevo[0];
}

/** Tramos del evento; siembra los tramos por defecto si no hay ninguno. */
async function obtenerTramos(eventoId) {
  const [rows] = await pool.query(
    "SELECT id, tramo_min, tramo_max, precio_unitario FROM finanzas_tramos WHERE evento_id = ? ORDER BY tramo_min",
    [eventoId],
  );
  if (rows.length > 0) {
    return rows.map((r) => ({
      ...r,
      precio_unitario: Number(r.precio_unitario),
    }));
  }
  for (const t of TRAMOS_POR_DEFECTO) {
    await pool.query(
      "INSERT INTO finanzas_tramos (evento_id, tramo_min, tramo_max, precio_unitario) VALUES (?, ?, ?, ?)",
      [eventoId, t.tramo_min, t.tramo_max, t.precio_unitario],
    );
  }
  return obtenerTramos(eventoId);
}

/**
 * Recalcula y PERSISTE la cadena de lotes de una empresa (por lotes, no
 * retroactivo). Se llama tras cualquier alta/edición/baja de un lote.
 */
async function recalcularEmpresa(eventoId, empresa, tramos, igv) {
  const [lotes] = await pool.query(
    `SELECT id, cantidad, precio_manual, precio_unitario
       FROM finanzas_lotes
      WHERE evento_id = ? AND empresa = ?
      ORDER BY fecha_creacion, id`,
    [eventoId, empresa],
  );
  const recalculados = recalcularCadenaEmpresa(lotes, tramos, igv);
  for (const l of recalculados) {
    await pool.query(
      "UPDATE finanzas_lotes SET precio_unitario = ?, acumulado_hasta = ? WHERE id = ?",
      [l.precio_unitario, l.acumulado_hasta, l.id],
    );
  }
}

// --------------------------------------------------------------------------
//  Resumen general del evento (todo lo que consume el frontend)
// --------------------------------------------------------------------------
exports.getResumen = async (req, res) => {
  try {
    const { eventoId } = req.params;

    const [[evento]] = await pool.query(
      "SELECT id, nombre FROM eventos WHERE id = ?",
      [eventoId],
    );
    if (!evento) return res.status(404).json({ message: "Evento no encontrado" });

    const config = await obtenerConfig(eventoId);
    const tramos = await obtenerTramos(eventoId);
    const igv = Number(config.igv_porcentaje);

    // ---- Inscritos (lotes agrupados por empresa) ----
    const [lotes] = await pool.query(
      `SELECT id, empresa, cantidad, precio_unitario, precio_manual,
              acumulado_hasta, estado, modalidad, observacion, origen,
              fecha_compromiso, fecha_pago, fecha_creacion
         FROM finanzas_lotes
        WHERE evento_id = ?
        ORDER BY empresa, fecha_creacion, id`,
      [eventoId],
    );

    const empresasMap = new Map();
    let inscritosSubtotal = 0;
    let inscritosIgv = 0;
    let inscritosTotal = 0;
    let inscritosPagado = 0;
    let inscritosCantidad = 0;

    for (const l of lotes) {
      const imp = calcularImporteLote(l.cantidad, l.precio_unitario, igv);
      const lote = {
        ...l,
        precio_unitario: Number(l.precio_unitario),
        precio_manual: !!l.precio_manual,
        fecha_compromiso: fmtFecha(l.fecha_compromiso),
        fecha_pago: fmtFecha(l.fecha_pago),
        subtotal: imp.subtotal,
        igv: imp.igv,
        total: imp.total,
      };
      inscritosSubtotal += imp.subtotal;
      inscritosIgv += imp.igv;
      inscritosTotal += imp.total;
      inscritosCantidad += Number(l.cantidad);
      if (l.estado === "pagado") inscritosPagado += imp.total;

      if (!empresasMap.has(l.empresa)) {
        empresasMap.set(l.empresa, {
          empresa: l.empresa,
          cantidad: 0,
          subtotal: 0,
          igv: 0,
          total: 0,
          pagado: 0,
          lotes: [],
        });
      }
      const emp = empresasMap.get(l.empresa);
      emp.cantidad += Number(l.cantidad);
      emp.subtotal = redondear2(emp.subtotal + imp.subtotal);
      emp.igv = redondear2(emp.igv + imp.igv);
      emp.total = redondear2(emp.total + imp.total);
      if (l.estado === "pagado") emp.pagado = redondear2(emp.pagado + imp.total);
      emp.lotes.push(lote);
    }

    const empresas = [...empresasMap.values()].map((e) => ({
      ...e,
      ticketPromedio: e.cantidad ? redondear2(e.total / e.cantidad) : 0,
    }));

    // ---- Auspicios ----
    const [auspicios] = await pool.query(
      `SELECT id, patrocinador, categoria, monto, incluye_igv, entradas_incluidas,
              costo_entrada, estado, observacion,
              fecha_compromiso, fecha_pago, fecha_creacion
         FROM finanzas_auspicios
        WHERE evento_id = ?
        ORDER BY patrocinador`,
      [eventoId],
    );
    // El monto del auspicio es NETO (sin IGV); se le suma el IGV para el bruto.
    let auspiciosNeto = 0;
    let auspiciosIgv = 0;
    let auspiciosTotal = 0;
    let auspiciosPagado = 0;
    let entradasIncluidas = 0;
    const auspiciosItems = auspicios.map((a) => {
      // El monto puede ser neto o bruto según el flag incluye_igv.
      const imp = desglosarConIgv(Number(a.monto), igv, !!a.incluye_igv);
      auspiciosNeto += imp.neto;
      auspiciosIgv += imp.igv;
      auspiciosTotal += imp.total;
      if (a.estado === "pagado") auspiciosPagado += imp.total;
      entradasIncluidas += Number(a.entradas_incluidas || 0);
      return {
        ...a,
        monto: Number(a.monto), // valor ingresado (neto o bruto)
        incluye_igv: !!a.incluye_igv,
        costo_entrada: Number(a.costo_entrada),
        fecha_compromiso: fmtFecha(a.fecha_compromiso),
        fecha_pago: fmtFecha(a.fecha_pago),
        neto: imp.neto,
        igv: imp.igv,
        total: imp.total, // bruto (con IGV)
      };
    });

    const [categorias] = await pool.query(
      "SELECT id, nombre, monto_referencia, entradas_referencia FROM finanzas_categorias_auspicio WHERE evento_id = ? ORDER BY nombre",
      [eventoId],
    );

    const metaInscritos = Number(config.meta_inscritos);
    const metaAuspicios = Number(config.meta_auspicios);
    const ingresoNeto = redondear2(inscritosSubtotal + auspiciosNeto);
    const ingresoIgv = redondear2(inscritosIgv + auspiciosIgv);
    const ingresoTotal = redondear2(inscritosTotal + auspiciosTotal);
    const metaTotal = redondear2(metaInscritos + metaAuspicios);

    res.json({
      evento,
      config: {
        moneda: config.moneda,
        igv_porcentaje: igv,
        meta_inscritos: metaInscritos,
        meta_auspicios: metaAuspicios,
      },
      tramos,
      categorias,
      inscritos: {
        empresas,
        cantidad: inscritosCantidad,
        subtotal: redondear2(inscritosSubtotal),
        igv: redondear2(inscritosIgv),
        total: redondear2(inscritosTotal),
        pagado: redondear2(inscritosPagado),
        meta: metaInscritos,
        avance: metaInscritos ? redondear2((inscritosTotal / metaInscritos) * 100) : 0,
        ticketPromedio: inscritosCantidad
          ? redondear2(inscritosTotal / inscritosCantidad)
          : 0,
      },
      auspicios: {
        items: auspiciosItems,
        neto: redondear2(auspiciosNeto),
        igv: redondear2(auspiciosIgv),
        total: redondear2(auspiciosTotal),
        pagado: redondear2(auspiciosPagado),
        entradasIncluidas,
        meta: metaAuspicios,
        avance: metaAuspicios ? redondear2((auspiciosTotal / metaAuspicios) * 100) : 0,
      },
      totales: {
        neto: ingresoNeto,
        igv: ingresoIgv,
        ingresoTotal,
        pagado: redondear2(inscritosPagado + auspiciosPagado),
        meta: metaTotal,
        avance: metaTotal ? redondear2((ingresoTotal / metaTotal) * 100) : 0,
        porCategoria: [
          { categoria: "Inscritos", monto: redondear2(inscritosTotal) },
          { categoria: "Auspicio", monto: redondear2(auspiciosTotal) },
        ],
      },
    });
  } catch (error) {
    console.error("Error en resumen de finanzas:", error);
    res.status(500).json({ message: "Error al obtener el análisis de ingresos" });
  }
};

// --------------------------------------------------------------------------
//  Configuración (moneda, IGV, metas)
// --------------------------------------------------------------------------
exports.updateConfig = async (req, res) => {
  try {
    const { eventoId } = req.params;
    const { moneda, igv_porcentaje, meta_inscritos, meta_auspicios } = req.body;
    await obtenerConfig(eventoId); // asegura que exista la fila
    await pool.query(
      `UPDATE finanzas_config
          SET moneda = ?, igv_porcentaje = ?, meta_inscritos = ?, meta_auspicios = ?
        WHERE evento_id = ?`,
      [
        moneda || "USD",
        igv_porcentaje ?? 18,
        meta_inscritos || 0,
        meta_auspicios || 0,
        eventoId,
      ],
    );
    // El IGV pudo cambiar: recalcular todas las empresas para reflejarlo.
    const tramos = await obtenerTramos(eventoId);
    const [emps] = await pool.query(
      "SELECT DISTINCT empresa FROM finanzas_lotes WHERE evento_id = ?",
      [eventoId],
    );
    for (const { empresa } of emps) {
      await recalcularEmpresa(eventoId, empresa, tramos, Number(igv_porcentaje ?? 18));
    }
    await log(req, eventoId, "config", null, "editar", `IGV ${igv_porcentaje}%, metas ${meta_inscritos}/${meta_auspicios}`);
    res.json({ message: "Configuración actualizada" });
  } catch (error) {
    console.error("Error actualizando config de finanzas:", error);
    res.status(500).json({ message: "Error al actualizar la configuración" });
  }
};

// --------------------------------------------------------------------------
//  Cuadro de precios (tramos): reemplazo completo
// --------------------------------------------------------------------------
exports.updateTramos = async (req, res) => {
  try {
    const { eventoId } = req.params;
    const { tramos } = req.body;
    if (!Array.isArray(tramos) || tramos.length === 0) {
      return res.status(400).json({ message: "Define al menos un tramo" });
    }
    await pool.query("DELETE FROM finanzas_tramos WHERE evento_id = ?", [eventoId]);
    for (const t of tramos) {
      const max =
        t.tramo_max === "" || t.tramo_max === null || t.tramo_max === undefined
          ? null
          : Number(t.tramo_max);
      await pool.query(
        "INSERT INTO finanzas_tramos (evento_id, tramo_min, tramo_max, precio_unitario) VALUES (?, ?, ?, ?)",
        [eventoId, Number(t.tramo_min), max, Number(t.precio_unitario)],
      );
    }
    // Recalcular todos los lotes automáticos con el nuevo cuadro.
    const config = await obtenerConfig(eventoId);
    const nuevos = await obtenerTramos(eventoId);
    const [emps] = await pool.query(
      "SELECT DISTINCT empresa FROM finanzas_lotes WHERE evento_id = ?",
      [eventoId],
    );
    for (const { empresa } of emps) {
      await recalcularEmpresa(eventoId, empresa, nuevos, Number(config.igv_porcentaje));
    }
    await log(req, eventoId, "tramo", null, "editar", `${tramos.length} tramos`);
    res.json({ message: "Cuadro de precios actualizado" });
  } catch (error) {
    console.error("Error actualizando tramos:", error);
    res.status(500).json({ message: "Error al actualizar el cuadro de precios" });
  }
};

// --------------------------------------------------------------------------
//  Lotes de inscritos
// --------------------------------------------------------------------------
exports.crearLote = async (req, res) => {
  try {
    const { eventoId } = req.params;
    let { empresa, cantidad, estado, modalidad, observacion, precio_manual, precio_unitario, fecha_compromiso } = req.body;
    empresa = (empresa || "").trim();
    cantidad = parseInt(cantidad, 10);
    if (!empresa) return res.status(400).json({ message: "Indica la empresa" });
    if (!cantidad || cantidad <= 0)
      return res.status(400).json({ message: "La cantidad debe ser mayor a 0" });
    if (estado && !ESTADOS.includes(estado))
      return res.status(400).json({ message: "Estado inválido" });
    const estadoLote = estado || "registrado";
    const fechaPago = estadoLote === "pagado" ? hoyISO() : null;

    const config = await obtenerConfig(eventoId);
    const tramos = await obtenerTramos(eventoId);

    // Acumulado previo de la empresa para determinar el tramo del nuevo lote.
    const [[prev]] = await pool.query(
      "SELECT COALESCE(SUM(cantidad),0) AS acum FROM finanzas_lotes WHERE evento_id = ? AND empresa = ?",
      [eventoId, empresa],
    );
    const nuevoAcumulado = Number(prev.acum) + cantidad;
    const esManual = precio_manual ? 1 : 0;
    const precio = esManual
      ? Number(precio_unitario)
      : precioPorTramo(tramos, nuevoAcumulado);

    const [r] = await pool.query(
      `INSERT INTO finanzas_lotes
        (evento_id, empresa, cantidad, precio_unitario, precio_manual, acumulado_hasta, estado, modalidad, observacion, origen, fecha_compromiso, fecha_pago)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'manual', ?, ?)`,
      [
        eventoId,
        empresa,
        cantidad,
        precio,
        esManual,
        nuevoAcumulado,
        estadoLote,
        modalidad || null,
        observacion || null,
        fecha_compromiso || null,
        fechaPago,
      ],
    );
    // Reasegura la coherencia de la cadena (por si hubo lotes desordenados).
    await recalcularEmpresa(eventoId, empresa, tramos, Number(config.igv_porcentaje));
    await log(req, eventoId, "lote", r.insertId, "crear", `${cantidad} inscrito(s) x ${precio}`, empresa);
    res.status(201).json({ message: "Lote registrado", id: r.insertId });
  } catch (error) {
    console.error("Error creando lote:", error);
    res.status(500).json({ message: "Error al registrar el lote" });
  }
};

exports.editarLote = async (req, res) => {
  try {
    const { id } = req.params;
    const [[lote]] = await pool.query("SELECT * FROM finanzas_lotes WHERE id = ?", [id]);
    if (!lote) return res.status(404).json({ message: "Lote no encontrado" });

    let { cantidad, estado, modalidad, observacion, precio_manual, precio_unitario, fecha_compromiso, fecha_pago } = req.body;
    cantidad = cantidad !== undefined ? parseInt(cantidad, 10) : lote.cantidad;
    if (!cantidad || cantidad <= 0)
      return res.status(400).json({ message: "La cantidad debe ser mayor a 0" });
    if (estado && !ESTADOS.includes(estado))
      return res.status(400).json({ message: "Estado inválido" });

    const esManual = precio_manual !== undefined ? (precio_manual ? 1 : 0) : lote.precio_manual;
    const precio = esManual
      ? Number(precio_unitario ?? lote.precio_unitario)
      : lote.precio_unitario; // el recálculo posterior fija el automático

    const estadoFinal = estado || lote.estado;
    const fechaCompromiso =
      fecha_compromiso !== undefined ? fecha_compromiso || null : lote.fecha_compromiso;
    const fechaPago = resolverFechaPago(estadoFinal, lote.fecha_pago, fecha_pago);

    await pool.query(
      `UPDATE finanzas_lotes
          SET cantidad = ?, estado = ?, modalidad = ?, observacion = ?, precio_manual = ?, precio_unitario = ?, fecha_compromiso = ?, fecha_pago = ?
        WHERE id = ?`,
      [
        cantidad,
        estadoFinal,
        modalidad !== undefined ? modalidad : lote.modalidad,
        observacion !== undefined ? observacion : lote.observacion,
        esManual,
        precio,
        fechaCompromiso,
        fechaPago,
        id,
      ],
    );

    const config = await obtenerConfig(lote.evento_id);
    const tramos = await obtenerTramos(lote.evento_id);
    await recalcularEmpresa(lote.evento_id, lote.empresa, tramos, Number(config.igv_porcentaje));
    await log(req, lote.evento_id, "lote", Number(id), "editar", `cantidad ${cantidad}, estado ${estado || lote.estado}`, lote.empresa);
    res.json({ message: "Lote actualizado" });
  } catch (error) {
    console.error("Error editando lote:", error);
    res.status(500).json({ message: "Error al actualizar el lote" });
  }
};

exports.eliminarLote = async (req, res) => {
  try {
    const { id } = req.params;
    const [[lote]] = await pool.query("SELECT * FROM finanzas_lotes WHERE id = ?", [id]);
    if (!lote) return res.status(404).json({ message: "Lote no encontrado" });
    await pool.query("DELETE FROM finanzas_lotes WHERE id = ?", [id]);
    const config = await obtenerConfig(lote.evento_id);
    const tramos = await obtenerTramos(lote.evento_id);
    await recalcularEmpresa(lote.evento_id, lote.empresa, tramos, Number(config.igv_porcentaje));
    await log(req, lote.evento_id, "lote", Number(id), "eliminar", `${lote.cantidad} inscrito(s)`, lote.empresa);
    res.json({ message: "Lote eliminado" });
  } catch (error) {
    console.error("Error eliminando lote:", error);
    res.status(500).json({ message: "Error al eliminar el lote" });
  }
};

// --------------------------------------------------------------------------
//  Sincronización híbrida: crea lotes desde los inscritos reales del sistema
//  (agrupados por empresa) para la diferencia aún no registrada.
// --------------------------------------------------------------------------
exports.sincronizarInscritos = async (req, res) => {
  try {
    const { eventoId } = req.params;
    const config = await obtenerConfig(eventoId);
    const tramos = await obtenerTramos(eventoId);

    // Conteo real por empresa desde inscripciones (empresa vacía → "Sin empresa").
    const [reales] = await pool.query(
      `SELECT COALESCE(NULLIF(TRIM(u.empresa), ''), 'Sin empresa') AS empresa,
              COUNT(*) AS total
         FROM inscripciones i
         JOIN usuarios u ON i.usuario_id = u.id
        WHERE i.evento_id = ?
        GROUP BY empresa`,
      [eventoId],
    );

    let creados = 0;
    for (const r of reales) {
      const [[prev]] = await pool.query(
        "SELECT COALESCE(SUM(cantidad),0) AS acum FROM finanzas_lotes WHERE evento_id = ? AND empresa = ?",
        [eventoId, r.empresa],
      );
      const yaRegistrados = Number(prev.acum);
      const delta = Number(r.total) - yaRegistrados;
      if (delta <= 0) continue; // ya está cubierto en el ledger

      const nuevoAcumulado = yaRegistrados + delta;
      const precio = precioPorTramo(tramos, nuevoAcumulado);
      await pool.query(
        `INSERT INTO finanzas_lotes
          (evento_id, empresa, cantidad, precio_unitario, precio_manual, acumulado_hasta, estado, origen)
         VALUES (?, ?, ?, ?, 0, ?, 'registrado', 'sync')`,
        [eventoId, r.empresa, delta, precio, nuevoAcumulado],
      );
      await recalcularEmpresa(eventoId, r.empresa, tramos, Number(config.igv_porcentaje));
      creados++;
    }
    await log(req, eventoId, "lote", null, "sincronizar", `${creados} empresa(s) sincronizada(s)`);
    res.json({ message: `Sincronización completa: ${creados} empresa(s) actualizada(s)`, creados });
  } catch (error) {
    console.error("Error sincronizando inscritos:", error);
    res.status(500).json({ message: "Error al sincronizar inscritos" });
  }
};

// --------------------------------------------------------------------------
//  Auspicios
// --------------------------------------------------------------------------
exports.crearAuspicio = async (req, res) => {
  try {
    const { eventoId } = req.params;
    let { patrocinador, categoria, monto, incluye_igv, entradas_incluidas, costo_entrada, estado, observacion, fecha_compromiso } = req.body;
    patrocinador = (patrocinador || "").trim();
    if (!patrocinador) return res.status(400).json({ message: "Indica el patrocinador" });
    if (estado && !ESTADOS.includes(estado))
      return res.status(400).json({ message: "Estado inválido" });
    const estadoAusp = estado || "registrado";
    const fechaPago = estadoAusp === "pagado" ? hoyISO() : null;

    const [r] = await pool.query(
      `INSERT INTO finanzas_auspicios
        (evento_id, patrocinador, categoria, monto, incluye_igv, entradas_incluidas, costo_entrada, estado, observacion, fecha_compromiso, fecha_pago)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        eventoId,
        patrocinador,
        categoria || null,
        Number(monto) || 0,
        incluye_igv ? 1 : 0,
        parseInt(entradas_incluidas, 10) || 0,
        Number(costo_entrada) || 0,
        estadoAusp,
        observacion || null,
        fecha_compromiso || null,
        fechaPago,
      ],
    );
    await log(req, eventoId, "auspicio", r.insertId, "crear", `${patrocinador} (${categoria || "s/categoría"}) ${monto}`);
    res.status(201).json({ message: "Auspicio registrado", id: r.insertId });
  } catch (error) {
    console.error("Error creando auspicio:", error);
    res.status(500).json({ message: "Error al registrar el auspicio" });
  }
};

exports.editarAuspicio = async (req, res) => {
  try {
    const { id } = req.params;
    const [[a]] = await pool.query("SELECT * FROM finanzas_auspicios WHERE id = ?", [id]);
    if (!a) return res.status(404).json({ message: "Auspicio no encontrado" });
    const { patrocinador, categoria, monto, incluye_igv, entradas_incluidas, costo_entrada, estado, observacion, fecha_compromiso, fecha_pago } = req.body;
    if (estado && !ESTADOS.includes(estado))
      return res.status(400).json({ message: "Estado inválido" });

    const estadoFinal = estado || a.estado;
    const fechaCompromiso =
      fecha_compromiso !== undefined ? fecha_compromiso || null : a.fecha_compromiso;
    const fechaPago = resolverFechaPago(estadoFinal, a.fecha_pago, fecha_pago);

    await pool.query(
      `UPDATE finanzas_auspicios
          SET patrocinador = ?, categoria = ?, monto = ?, incluye_igv = ?, entradas_incluidas = ?, costo_entrada = ?, estado = ?, observacion = ?, fecha_compromiso = ?, fecha_pago = ?
        WHERE id = ?`,
      [
        patrocinador ?? a.patrocinador,
        categoria !== undefined ? categoria : a.categoria,
        monto !== undefined ? Number(monto) : a.monto,
        incluye_igv !== undefined ? (incluye_igv ? 1 : 0) : a.incluye_igv,
        entradas_incluidas !== undefined ? parseInt(entradas_incluidas, 10) || 0 : a.entradas_incluidas,
        costo_entrada !== undefined ? Number(costo_entrada) : a.costo_entrada,
        estadoFinal,
        observacion !== undefined ? observacion : a.observacion,
        fechaCompromiso,
        fechaPago,
        id,
      ],
    );
    await log(req, a.evento_id, "auspicio", Number(id), "editar", `${patrocinador ?? a.patrocinador}, estado ${estado || a.estado}`);
    res.json({ message: "Auspicio actualizado" });
  } catch (error) {
    console.error("Error editando auspicio:", error);
    res.status(500).json({ message: "Error al actualizar el auspicio" });
  }
};

exports.eliminarAuspicio = async (req, res) => {
  try {
    const { id } = req.params;
    const [[a]] = await pool.query("SELECT * FROM finanzas_auspicios WHERE id = ?", [id]);
    if (!a) return res.status(404).json({ message: "Auspicio no encontrado" });
    await pool.query("DELETE FROM finanzas_auspicios WHERE id = ?", [id]);
    await log(req, a.evento_id, "auspicio", Number(id), "eliminar", a.patrocinador);
    res.json({ message: "Auspicio eliminado" });
  } catch (error) {
    console.error("Error eliminando auspicio:", error);
    res.status(500).json({ message: "Error al eliminar el auspicio" });
  }
};

// --------------------------------------------------------------------------
//  Categorías de auspicio (sugerencias por evento)
// --------------------------------------------------------------------------
exports.crearCategoria = async (req, res) => {
  try {
    const { eventoId } = req.params;
    let { nombre, monto_referencia, entradas_referencia } = req.body;
    nombre = (nombre || "").trim();
    if (!nombre) return res.status(400).json({ message: "Indica el nombre de la categoría" });
    const [r] = await pool.query(
      "INSERT INTO finanzas_categorias_auspicio (evento_id, nombre, monto_referencia, entradas_referencia) VALUES (?, ?, ?, ?)",
      [eventoId, nombre, monto_referencia ? Number(monto_referencia) : null, entradas_referencia ? parseInt(entradas_referencia, 10) : null],
    );
    await log(req, eventoId, "categoria", r.insertId, "crear", nombre);
    res.status(201).json({ message: "Categoría creada", id: r.insertId });
  } catch (error) {
    console.error("Error creando categoría:", error);
    res.status(500).json({ message: "Error al crear la categoría" });
  }
};

exports.eliminarCategoria = async (req, res) => {
  try {
    const { id } = req.params;
    const [[c]] = await pool.query("SELECT * FROM finanzas_categorias_auspicio WHERE id = ?", [id]);
    if (!c) return res.status(404).json({ message: "Categoría no encontrada" });
    await pool.query("DELETE FROM finanzas_categorias_auspicio WHERE id = ?", [id]);
    await log(req, c.evento_id, "categoria", Number(id), "eliminar", c.nombre);
    res.json({ message: "Categoría eliminada" });
  } catch (error) {
    console.error("Error eliminando categoría:", error);
    res.status(500).json({ message: "Error al eliminar la categoría" });
  }
};

// --------------------------------------------------------------------------
//  Historial de cambios
// --------------------------------------------------------------------------
exports.getHistorial = async (req, res) => {
  try {
    const { eventoId } = req.params;
    const [rows] = await pool.query(
      `SELECT id, entidad, entidad_id, empresa, accion, detalle, usuario_nombre, fecha
         FROM finanzas_historial
        WHERE evento_id = ?
        ORDER BY fecha DESC, id DESC
        LIMIT 300`,
      [eventoId],
    );
    res.json(rows);
  } catch (error) {
    console.error("Error obteniendo historial:", error);
    res.status(500).json({ message: "Error al obtener el historial" });
  }
};

// --------------------------------------------------------------------------
//  Proyección de flujo (por semana): comprometido vs recaudado
// --------------------------------------------------------------------------
exports.getProyeccion = async (req, res) => {
  try {
    const { eventoId } = req.params;
    const config = await obtenerConfig(eventoId);
    const igv = Number(config.igv_porcentaje);

    // Reunir todos los ingresos (inscritos + auspicios) con su total bruto.
    const [lotes] = await pool.query(
      `SELECT empresa, cantidad, precio_unitario, estado, fecha_compromiso, fecha_pago
         FROM finanzas_lotes WHERE evento_id = ?`,
      [eventoId],
    );
    const [auspicios] = await pool.query(
      `SELECT patrocinador, monto, incluye_igv, estado, fecha_compromiso, fecha_pago
         FROM finanzas_auspicios WHERE evento_id = ?`,
      [eventoId],
    );

    const ingresos = [
      ...lotes.map((l) => ({
        tipo: "Inscritos",
        descripcion: l.empresa,
        total: calcularImporteLote(l.cantidad, l.precio_unitario, igv).total,
        estado: l.estado,
        fecha_compromiso: fmtFecha(l.fecha_compromiso),
        fecha_pago: fmtFecha(l.fecha_pago),
      })),
      ...auspicios.map((a) => ({
        tipo: "Auspicio",
        descripcion: a.patrocinador,
        total: desglosarConIgv(Number(a.monto), igv, !!a.incluye_igv).total,
        estado: a.estado,
        fecha_compromiso: fmtFecha(a.fecha_compromiso),
        fecha_pago: fmtFecha(a.fecha_pago),
      })),
    ];

    // Agrupar por semana (lunes): comprometido por fecha_compromiso,
    // pagado por fecha_pago.
    const semanasMap = new Map();
    const bucket = (clave) => {
      if (!semanasMap.has(clave))
        semanasMap.set(clave, { semana: clave, comprometido: 0, pagado: 0 });
      return semanasMap.get(clave);
    };

    let totalComprometido = 0;
    let totalPagado = 0;
    let sinFechaComprometido = 0;
    let sinFechaCount = 0;

    for (const ing of ingresos) {
      totalComprometido += ing.total;
      if (ing.fecha_compromiso) {
        bucket(inicioSemana(ing.fecha_compromiso)).comprometido += ing.total;
      } else {
        sinFechaComprometido += ing.total;
        sinFechaCount++;
      }
      if (ing.estado === "pagado") {
        totalPagado += ing.total;
        const fp = ing.fecha_pago || ing.fecha_compromiso;
        if (fp) bucket(inicioSemana(fp)).pagado += ing.total;
      }
    }

    // Ordenar por semana y calcular acumulados.
    const semanas = [...semanasMap.values()]
      .sort((a, b) => (a.semana < b.semana ? -1 : 1))
      .map((s) => ({
        ...s,
        comprometido: redondear2(s.comprometido),
        pagado: redondear2(s.pagado),
      }));
    let accC = 0;
    let accP = 0;
    for (const s of semanas) {
      accC = redondear2(accC + s.comprometido);
      accP = redondear2(accP + s.pagado);
      s.comprometidoAcum = accC;
      s.pagadoAcum = accP;
    }

    res.json({
      moneda: config.moneda,
      semanas,
      resumen: {
        totalComprometido: redondear2(totalComprometido),
        totalPagado: redondear2(totalPagado),
        totalPendiente: redondear2(totalComprometido - totalPagado),
        sinFechaComprometido: redondear2(sinFechaComprometido),
        sinFechaCount,
      },
    });
  } catch (error) {
    console.error("Error en proyección de finanzas:", error);
    res.status(500).json({ message: "Error al obtener la proyección" });
  }
};
