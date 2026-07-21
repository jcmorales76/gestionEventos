// ============================================================================
//  Pruebas del cálculo de ingresos (sin framework, corre con: node)
//    node tests/finanzas.test.js   ó   npm test
//  Verifica la regla "por lotes, no retroactivo" y el IGV.
// ============================================================================
const assert = require("assert");
const {
  precioPorTramo,
  calcularImporteLote,
  desglosarConIgv,
  recalcularCadenaEmpresa,
  redondear2,
  TRAMOS_POR_DEFECTO,
} = require("../utils/finanzasCalc");

let ok = 0;
function test(nombre, fn) {
  try {
    fn();
    ok++;
    console.log(`  ✅ ${nombre}`);
  } catch (e) {
    console.error(`  ❌ ${nombre}\n     ${e.message}`);
    process.exitCode = 1;
  }
}

const T = TRAMOS_POR_DEFECTO;

console.log("precioPorTramo");
test("1 persona → tramo 1-3 = 885", () => assert.strictEqual(precioPorTramo(T, 1), 885));
test("3 personas → tramo 1-3 = 885", () => assert.strictEqual(precioPorTramo(T, 3), 885));
test("4 personas → tramo 4-6 = 826", () => assert.strictEqual(precioPorTramo(T, 4), 826));
test("6 personas → tramo 4-6 = 826", () => assert.strictEqual(precioPorTramo(T, 6), 826));
test("7 personas → tramo 7+ = 767", () => assert.strictEqual(precioPorTramo(T, 7), 767));
test("50 personas → tramo 7+ = 767", () => assert.strictEqual(precioPorTramo(T, 50), 767));
test("0 personas → 0", () => assert.strictEqual(precioPorTramo(T, 0), 0));

console.log("calcularImporteLote (IGV 18%)");
test("3 x 885 + IGV", () => {
  const r = calcularImporteLote(3, 885, 18);
  assert.strictEqual(r.subtotal, 2655);
  assert.strictEqual(r.igv, 477.9);
  assert.strictEqual(r.total, 3132.9);
});
test("1 x 885 + IGV = 1044.30", () => {
  const r = calcularImporteLote(1, 885, 18);
  assert.strictEqual(r.total, 1044.3);
});

console.log("desglosarConIgv (auspicios)");
test("monto NETO 10000 → +IGV = 11800", () => {
  const r = desglosarConIgv(10000, 18, false);
  assert.strictEqual(r.neto, 10000);
  assert.strictEqual(r.igv, 1800);
  assert.strictEqual(r.total, 11800);
});
test("monto BRUTO 11800 (incluye IGV) → neto 10000", () => {
  const r = desglosarConIgv(11800, 18, true);
  assert.strictEqual(r.neto, 10000);
  assert.strictEqual(r.igv, 1800);
  assert.strictEqual(r.total, 11800);
});

console.log("recalcularCadenaEmpresa (por lotes, NO retroactivo)");
test("Ejemplo cliente 1: 3 luego 3 → 885 y 826 (no cambia el primero)", () => {
  const lotes = [
    { cantidad: 3, precio_manual: 0 },
    { cantidad: 3, precio_manual: 0 },
  ];
  const r = recalcularCadenaEmpresa(lotes, T, 18);
  assert.strictEqual(r[0].precio_unitario, 885);
  assert.strictEqual(r[0].acumulado_hasta, 3);
  assert.strictEqual(r[1].precio_unitario, 826); // el 2° lote sí usa el tramo del acumulado (6)
  assert.strictEqual(r[1].acumulado_hasta, 6);
  // Total base = 3*885 + 3*826 = 5133
  assert.strictEqual(r[0].subtotal + r[1].subtotal, 5133);
});
test("Ejemplo cliente 2: 2 luego 2 → los 2 nuevos toman tramo del total (4) = 826", () => {
  const lotes = [
    { cantidad: 2, precio_manual: 0 },
    { cantidad: 2, precio_manual: 0 },
  ];
  const r = recalcularCadenaEmpresa(lotes, T, 18);
  assert.strictEqual(r[0].precio_unitario, 885); // 2 ≤ 3
  assert.strictEqual(r[1].acumulado_hasta, 4);
  assert.strictEqual(r[1].precio_unitario, 826); // acumulado 4 → tramo 4-6
});
test("Override manual: respeta el precio pero avanza el acumulado", () => {
  const lotes = [
    { cantidad: 3, precio_manual: 1, precio_unitario: 700 }, // tarifa negociada
    { cantidad: 3, precio_manual: 0 },
  ];
  const r = recalcularCadenaEmpresa(lotes, T, 18);
  assert.strictEqual(r[0].precio_unitario, 700); // conserva override
  assert.strictEqual(r[1].acumulado_hasta, 6);
  assert.strictEqual(r[1].precio_unitario, 826); // el 2° sigue automático por tramo
});
test("Un lote grande de 7 → tramo 7+ = 767", () => {
  const r = recalcularCadenaEmpresa([{ cantidad: 7, precio_manual: 0 }], T, 18);
  assert.strictEqual(r[0].precio_unitario, 767);
  assert.strictEqual(r[0].acumulado_hasta, 7);
});

console.log("redondear2");
test("0.1 + 0.2 = 0.3", () => assert.strictEqual(redondear2(0.1 + 0.2), 0.3));

console.log(`\n${process.exitCode ? "⚠️  Con fallos" : "🎉 Todas las pruebas pasaron"} (${ok} OK)`);
