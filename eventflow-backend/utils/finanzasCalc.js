// ============================================================================
//  Cálculos del módulo de Análisis de Ingresos (Auspicio + Inscritos)
// ----------------------------------------------------------------------------
//  Funciones PURAS (sin BD) para poder probarlas de forma aislada.
//  Reglas confirmadas con el cliente:
//   - Descuento POR LOTES, NO retroactivo: cada lote (una acción de
//     inscripción) toma el precio del TRAMO del total ACUMULADO de la
//     empresa en ese momento. Los lotes anteriores NO cambian de precio.
//       Ej: empresa inscribe 3 → 3 x $885 ; luego 3 más → 3 x $826.
//   - El precio del cuadro es SIN IGV; el IGV (18% por defecto) se SUMA.
//   - Se permite override manual del precio unitario por lote.
// ============================================================================

/** Redondea a 2 decimales evitando errores de coma flotante. */
function redondear2(n) {
  return Math.round((Number(n) + Number.EPSILON) * 100) / 100;
}

/**
 * Devuelve el precio unitario del tramo que corresponde a una cantidad
 * acumulada. Un tramo es { tramo_min, tramo_max, precio_unitario }, donde
 * tramo_max === null significa "de tramo_min a más".
 *
 * @param {Array} tramos  Cuadro de precios del evento.
 * @param {number} acumulado  Total acumulado de inscritos de la empresa.
 * @returns {number} precio unitario (0 si no hay tramo aplicable).
 */
function precioPorTramo(tramos, acumulado) {
  if (!Array.isArray(tramos) || tramos.length === 0 || acumulado <= 0) return 0;

  // Orden ascendente por mínimo para una búsqueda predecible.
  const ordenados = [...tramos].sort((a, b) => a.tramo_min - b.tramo_min);

  for (const t of ordenados) {
    const min = Number(t.tramo_min);
    const max = t.tramo_max === null || t.tramo_max === undefined
      ? Infinity
      : Number(t.tramo_max);
    if (acumulado >= min && acumulado <= max) return Number(t.precio_unitario);
  }

  // Si excede todos los máximos definidos, usa el tramo superior (mayor mínimo).
  return Number(ordenados[ordenados.length - 1].precio_unitario);
}

/**
 * Calcula los importes de un lote.
 * @param {number} cantidad
 * @param {number} precioUnitario  (sin IGV)
 * @param {number} igvPorcentaje   (ej. 18)
 * @returns {{subtotal:number, igv:number, total:number}}
 */
function calcularImporteLote(cantidad, precioUnitario, igvPorcentaje = 18) {
  const subtotal = redondear2(Number(cantidad) * Number(precioUnitario));
  const igv = redondear2(subtotal * (Number(igvPorcentaje) / 100));
  const total = redondear2(subtotal + igv);
  return { subtotal, igv, total };
}

/**
 * Recalcula la CADENA de lotes de una empresa en orden cronológico.
 * Reproduce la regla "por lotes, no retroactivo": cada lote se valora con el
 * tramo del acumulado hasta ese lote (incluido). Los lotes con override
 * conservan su precio manual pero igual avanzan el acumulado.
 *
 * @param {Array} lotes  Lotes de UNA empresa, en orden (más antiguo primero).
 *                       Cada uno: { cantidad, precio_manual, precio_unitario }.
 * @param {Array} tramos  Cuadro de precios del evento.
 * @param {number} igvPorcentaje
 * @returns {Array} lotes con { acumulado_hasta, precio_unitario, subtotal, igv, total }.
 */
function recalcularCadenaEmpresa(lotes, tramos, igvPorcentaje = 18) {
  let acumulado = 0;
  return lotes.map((lote) => {
    const cantidad = Number(lote.cantidad) || 0;
    acumulado += cantidad;

    const esManual = lote.precio_manual === 1 || lote.precio_manual === true;
    const precioUnitario = esManual
      ? Number(lote.precio_unitario)
      : precioPorTramo(tramos, acumulado);

    const { subtotal, igv, total } = calcularImporteLote(
      cantidad,
      precioUnitario,
      igvPorcentaje,
    );

    return {
      ...lote,
      acumulado_hasta: acumulado,
      precio_unitario: precioUnitario,
      subtotal,
      igv,
      total,
    };
  });
}

/**
 * Desglosa un monto en neto / IGV / total (bruto) según si el monto ingresado
 * ya incluye el IGV o no. Se usa en auspicios (monto negociado).
 *   - incluyeIgv = false: el monto es NETO → total = monto + IGV.
 *   - incluyeIgv = true:  el monto es BRUTO → neto = monto / (1 + tasa).
 * @returns {{neto:number, igv:number, total:number}}
 */
function desglosarConIgv(monto, igvPorcentaje = 18, incluyeIgv = false) {
  const m = Number(monto) || 0;
  const tasa = Number(igvPorcentaje) / 100;
  if (incluyeIgv) {
    const neto = redondear2(m / (1 + tasa));
    return { neto, igv: redondear2(m - neto), total: redondear2(m) };
  }
  const igv = redondear2(m * tasa);
  return { neto: redondear2(m), igv, total: redondear2(m + igv) };
}

/** Cuadro de precios por defecto (según la imagen del cliente, sin IGV). */
const TRAMOS_POR_DEFECTO = [
  { tramo_min: 1, tramo_max: 3, precio_unitario: 885 },
  { tramo_min: 4, tramo_max: 6, precio_unitario: 826 },
  { tramo_min: 7, tramo_max: null, precio_unitario: 767 },
];

module.exports = {
  redondear2,
  precioPorTramo,
  calcularImporteLote,
  desglosarConIgv,
  recalcularCadenaEmpresa,
  TRAMOS_POR_DEFECTO,
};
