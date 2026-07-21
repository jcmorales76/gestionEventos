import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
  AreaChart,
  Area,
} from "recharts";
import { exportarExcel, exportarPDF } from "../utils/exportar";
import ModalConfirmacionPersonalizada from "../components/ModalConfirmacionPersonalizada";

// ============================================================================
//  Análisis de Ingresos por evento (Auspicio + Inscritos)
//  - Inscritos: lotes por empresa con descuento por tramos (no retroactivo).
//  - Auspicios: monto negociado por patrocinador.
//  - Metas, avance, proyectado vs recaudado (pagado), historial y exportación.
// ============================================================================

const COLORES = ["#3b82f6", "#8b5cf6", "#10b981", "#f59e0b", "#ef4444", "#06b6d4", "#ec4899"];
const ESTADOS = [
  { valor: "registrado", label: "Registrado" },
  { valor: "factura_solicitada", label: "Factura solicitada" },
  { valor: "factura_enviada", label: "Factura enviada" },
  { valor: "pagado", label: "Pagado" },
];
const ESTADO_COLOR = {
  registrado: "bg-gray-100 text-gray-700",
  factura_solicitada: "bg-amber-100 text-amber-700",
  factura_enviada: "bg-blue-100 text-blue-700",
  pagado: "bg-green-100 text-green-700",
};

const money = (n, moneda = "USD") =>
  new Intl.NumberFormat("es-PE", {
    style: "currency",
    currency: moneda || "USD",
    minimumFractionDigits: 2,
  }).format(Number(n) || 0);

export default function Finanzas() {
  const [eventos, setEventos] = useState([]);
  const [eventoId, setEventoId] = useState("");
  const [data, setData] = useState(null);
  const [historial, setHistorial] = useState([]);
  const [proyeccion, setProyeccion] = useState(null);
  const [loading, setLoading] = useState(false);
  const [tab, setTab] = useState("resumen");
  // Confirmación estándar del app (reemplaza window.confirm)
  const [confirm, setConfirm] = useState({ isOpen: false });
  const pedirConfirmacion = ({ title, message, type = "danger", onConfirm }) =>
    setConfirm({ isOpen: true, title, message, type, onConfirm });
  const cerrarConfirm = () => setConfirm({ isOpen: false });

  // Cargar eventos para el selector
  useEffect(() => {
    fetch("/api/eventos")
      .then((r) => r.json())
      .then((evs) => {
        setEventos(evs);
        if (evs.length && !eventoId) setEventoId(String(evs[0].id));
      })
      .catch(() => toast.error("No se pudieron cargar los eventos"));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const cargarResumen = async () => {
    if (!eventoId) return;
    setLoading(true);
    try {
      const r = await fetch(`/api/finanzas/evento/${eventoId}/resumen`);
      if (!r.ok) throw new Error();
      setData(await r.json());
    } catch {
      toast.error("Error al cargar el análisis de ingresos");
      setData(null);
    } finally {
      setLoading(false);
    }
  };

  const cargarHistorial = async () => {
    if (!eventoId) return;
    try {
      const r = await fetch(`/api/finanzas/evento/${eventoId}/historial`);
      setHistorial(await r.json());
    } catch {
      /* silencioso */
    }
  };

  const cargarProyeccion = async () => {
    if (!eventoId) return;
    try {
      const r = await fetch(`/api/finanzas/evento/${eventoId}/proyeccion`);
      setProyeccion(await r.json());
    } catch {
      /* silencioso */
    }
  };

  useEffect(() => {
    cargarResumen();
    cargarHistorial();
    cargarProyeccion();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [eventoId]);

  const moneda = data?.config?.moneda || "USD";

  // ---- Acciones API (recargan el resumen al terminar) ----
  const api = async (url, opciones, okMsg) => {
    try {
      const r = await fetch(url, {
        headers: { "Content-Type": "application/json" },
        ...opciones,
      });
      const body = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(body.message || "Error");
      if (okMsg) toast.success(body.message || okMsg);
      await cargarResumen();
      await cargarHistorial();
      await cargarProyeccion();
      return true;
    } catch (e) {
      toast.error(e.message || "Error en la operación");
      return false;
    }
  };

  const sincronizar = () =>
    api(
      `/api/finanzas/evento/${eventoId}/sync-inscritos`,
      { method: "POST" },
      "Sincronización completa",
    );

  return (
    <div className="space-y-6">
      {/* Header + selector de evento */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Análisis de Ingresos</h1>
          <p className="text-gray-600 mt-1">
            Auspicios e inscritos por empresa, con descuentos por tramos y metas
          </p>
        </div>
        <div className="w-full sm:w-80">
          <label className="block text-xs font-semibold text-gray-500 mb-1">
            Evento
          </label>
          <select
            value={eventoId}
            onChange={(e) => setEventoId(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 bg-white"
          >
            {eventos.map((e) => (
              <option key={e.id} value={e.id}>
                {e.nombre}
              </option>
            ))}
          </select>
        </div>
      </div>

      {loading && (
        <div className="flex items-center justify-center h-40">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-red-600"></div>
        </div>
      )}

      {!loading && data && (
        <>
          {/* KPIs */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <KpiCard
              label="Ingreso total bruto (proyectado)"
              value={money(data.totales.ingresoTotal, moneda)}
              sub={`Neto ${money(data.totales.neto, moneda)} + IGV ${money(data.totales.igv, moneda)}`}
              icon="💰"
              color="bg-emerald-100 text-emerald-700"
            />
            <KpiCard
              label="Recaudado (pagado)"
              value={money(data.totales.pagado, moneda)}
              sub={`Meta ${money(data.totales.meta, moneda)} · ${data.totales.avance}%`}
              icon="✅"
              color="bg-green-100 text-green-700"
            />
            <KpiCard
              label="Inscritos (bruto)"
              value={money(data.inscritos.total, moneda)}
              sub={`${data.inscritos.cantidad} pers. · Neto ${money(data.inscritos.subtotal, moneda)} + IGV ${money(data.inscritos.igv, moneda)}`}
              icon="👥"
              color="bg-blue-100 text-blue-700"
            />
            <KpiCard
              label="Auspicios (bruto)"
              value={money(data.auspicios.total, moneda)}
              sub={`${data.auspicios.items.length} patroc. · Neto ${money(data.auspicios.neto, moneda)} + IGV ${money(data.auspicios.igv, moneda)}`}
              icon="🤝"
              color="bg-purple-100 text-purple-700"
            />
          </div>

          {/* Pestañas */}
          <div className="flex flex-wrap gap-2 border-b border-gray-200">
            {[
              ["resumen", "Resumen"],
              ["inscritos", "Inscritos"],
              ["auspicios", "Auspicios"],
              ["proyeccion", "Proyección"],
              ["config", "Configuración"],
              ["historial", "Historial"],
            ].map(([id, label]) => (
              <button
                key={id}
                onClick={() => setTab(id)}
                className={`px-4 py-2 text-sm font-medium rounded-t-lg -mb-px border-b-2 transition-colors ${
                  tab === id
                    ? "border-red-600 text-red-600"
                    : "border-transparent text-gray-500 hover:text-gray-800"
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          {tab === "resumen" && <TabResumen data={data} moneda={moneda} />}
          {tab === "inscritos" && (
            <TabInscritos
              data={data}
              moneda={moneda}
              eventoId={eventoId}
              api={api}
              sincronizar={sincronizar}
              pedirConfirmacion={pedirConfirmacion}
            />
          )}
          {tab === "auspicios" && (
            <TabAuspicios
              data={data}
              moneda={moneda}
              eventoId={eventoId}
              api={api}
              pedirConfirmacion={pedirConfirmacion}
            />
          )}
          {tab === "proyeccion" && (
            <TabProyeccion proyeccion={proyeccion} moneda={moneda} />
          )}
          {tab === "config" && (
            <TabConfig data={data} eventoId={eventoId} api={api} />
          )}
          {tab === "historial" && <TabHistorial historial={historial} />}
        </>
      )}

      <ModalConfirmacionPersonalizada
        isOpen={confirm.isOpen}
        onClose={cerrarConfirm}
        onConfirm={confirm.onConfirm || (() => {})}
        title={confirm.title}
        message={confirm.message}
        type={confirm.type}
        confirmText="Eliminar"
      />
    </div>
  );
}

// --------------------------------------------------------------------------
//  Resumen: gráficos
// --------------------------------------------------------------------------
function TabResumen({ data, moneda }) {
  const porCategoria = data.totales.porCategoria.filter((c) => c.monto > 0);
  const porEmpresa = [...data.inscritos.empresas]
    .sort((a, b) => b.total - a.total)
    .slice(0, 10)
    .map((e) => ({
      nombre: e.empresa.length > 22 ? e.empresa.slice(0, 22) + "…" : e.empresa,
      total: e.total,
    }));

  const desglose = [
    {
      cat: "Inscritos",
      neto: data.inscritos.subtotal,
      igv: data.inscritos.igv,
      total: data.inscritos.total,
    },
    {
      cat: "Auspicios",
      neto: data.auspicios.neto,
      igv: data.auspicios.igv,
      total: data.auspicios.total,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Desglose de impuestos (neto / IGV / bruto) */}
      <Card titulo="Desglose de ingresos e impuestos">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-gray-500 text-xs uppercase border-b border-gray-100">
              <tr>
                <th className="px-3 py-2 text-left">Categoría</th>
                <th className="px-3 py-2 text-right">Neto (sin IGV)</th>
                <th className="px-3 py-2 text-right">IGV</th>
                <th className="px-3 py-2 text-right">Total bruto</th>
              </tr>
            </thead>
            <tbody>
              {desglose.map((d) => (
                <tr key={d.cat} className="border-b border-gray-50">
                  <td className="px-3 py-2 font-medium text-gray-800">{d.cat}</td>
                  <td className="px-3 py-2 text-right">{money(d.neto, moneda)}</td>
                  <td className="px-3 py-2 text-right text-amber-600">{money(d.igv, moneda)}</td>
                  <td className="px-3 py-2 text-right font-semibold">{money(d.total, moneda)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t-2 border-gray-200 font-bold">
                <td className="px-3 py-2">Total</td>
                <td className="px-3 py-2 text-right">{money(data.totales.neto, moneda)}</td>
                <td className="px-3 py-2 text-right text-amber-600">{money(data.totales.igv, moneda)}</td>
                <td className="px-3 py-2 text-right">{money(data.totales.ingresoTotal, moneda)}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Card titulo="Ingresos por categoría">
        <ResponsiveContainer width="100%" height={280}>
          <PieChart>
            <Pie
              data={porCategoria}
              dataKey="monto"
              nameKey="categoria"
              cx="50%"
              cy="50%"
              outerRadius={100}
              label={(e) => `${e.categoria}: ${money(e.monto, moneda)}`}
            >
              {porCategoria.map((_, i) => (
                <Cell key={i} fill={COLORES[i % COLORES.length]} />
              ))}
            </Pie>
            <Tooltip formatter={(v) => money(v, moneda)} />
          </PieChart>
        </ResponsiveContainer>
      </Card>

      <Card titulo="Top 10 empresas por ingreso (inscritos)">
        {porEmpresa.length === 0 ? (
          <Vacio texto="Aún no hay inscritos registrados" />
        ) : (
          <ResponsiveContainer width="100%" height={Math.max(280, porEmpresa.length * 34)}>
            <BarChart data={porEmpresa} layout="vertical" margin={{ left: 10, right: 12 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" tickFormatter={(v) => money(v, moneda)} tick={{ fontSize: 10 }} />
              <YAxis
                type="category"
                dataKey="nombre"
                width={150}
                interval={0}
                tick={{ fontSize: 10 }}
              />
              <Tooltip formatter={(v) => money(v, moneda)} />
              <Bar dataKey="total" fill="#3b82f6" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </Card>

      <Card titulo="Avance vs meta">
        <div className="space-y-4 py-2">
          <Barra label="Inscritos" valor={data.inscritos.total} meta={data.inscritos.meta} moneda={moneda} color="#3b82f6" />
          <Barra label="Auspicios" valor={data.auspicios.total} meta={data.auspicios.meta} moneda={moneda} color="#8b5cf6" />
          <Barra label="Total" valor={data.totales.ingresoTotal} meta={data.totales.meta} moneda={moneda} color="#10b981" />
        </div>
      </Card>

      <Card titulo="Proyectado vs recaudado">
        <ResponsiveContainer width="100%" height={280}>
          <BarChart
            data={[
              { nombre: "Inscritos", Proyectado: data.inscritos.total, Recaudado: data.inscritos.pagado },
              { nombre: "Auspicios", Proyectado: data.auspicios.total, Recaudado: data.auspicios.pagado },
            ]}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="nombre" />
            <YAxis tickFormatter={(v) => money(v, moneda)} />
            <Tooltip formatter={(v) => money(v, moneda)} />
            <Legend />
            <Bar dataKey="Proyectado" fill="#93c5fd" radius={[4, 4, 0, 0]} />
            <Bar dataKey="Recaudado" fill="#10b981" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </Card>
      </div>
    </div>
  );
}

// --------------------------------------------------------------------------
//  Inscritos: empresas, lotes y alta
// --------------------------------------------------------------------------
function TabInscritos({ data, moneda, eventoId, api, sincronizar, pedirConfirmacion }) {
  const empresas = data.inscritos.empresas;
  const [editando, setEditando] = useState(null); // lote en edición
  const [form, setForm] = useState({
    empresa: "",
    cantidad: "",
    estado: "registrado",
    modalidad: "",
    observacion: "",
    precio_manual: false,
    precio_unitario: "",
    fecha_compromiso: "",
  });
  const [expandida, setExpandida] = useState(null);

  const empresasExistentes = useMemo(
    () => [...new Set(empresas.map((e) => e.empresa))],
    [empresas],
  );

  const agregarLote = async (e) => {
    e.preventDefault();
    const ok = await api(
      `/api/finanzas/evento/${eventoId}/lotes`,
      { method: "POST", body: JSON.stringify(form) },
      "Lote registrado",
    );
    if (ok)
      setForm({
        empresa: "",
        cantidad: "",
        estado: "registrado",
        modalidad: "",
        observacion: "",
        precio_manual: false,
        precio_unitario: "",
        fecha_compromiso: "",
      });
  };

  const cambiarEstadoLote = (loteId, estado) =>
    api(`/api/finanzas/lotes/${loteId}`, {
      method: "PUT",
      body: JSON.stringify({ estado }),
    });

  const eliminarLote = (emp, l) =>
    pedirConfirmacion({
      title: "Eliminar lote",
      message: `¿Eliminar el lote de <b>${l.cantidad}</b> inscrito(s) de <b>${emp.empresa}</b>? Se recalcularán los tramos de la empresa.`,
      type: "danger",
      onConfirm: () =>
        api(`/api/finanzas/lotes/${l.id}`, { method: "DELETE" }, "Lote eliminado"),
    });

  const guardarEdicion = async (payload) => {
    const ok = await api(
      `/api/finanzas/lotes/${editando.id}`,
      { method: "PUT", body: JSON.stringify(payload) },
      "Lote actualizado",
    );
    if (ok) setEditando(null);
  };

  const exportar = (tipo) => {
    const filas = empresas.flatMap((emp) =>
      emp.lotes.map((l) => ({
        Empresa: emp.empresa,
        Cantidad: l.cantidad,
        "Precio unit.": l.precio_unitario,
        Manual: l.precio_manual ? "Sí" : "No",
        "Acum.": l.acumulado_hasta,
        Subtotal: l.subtotal,
        IGV: l.igv,
        Total: l.total,
        Estado: l.estado,
      })),
    );
    if (tipo === "excel") {
      exportarExcel(filas, `inscritos_evento_${eventoId}`, "Inscritos");
    } else {
      exportarPDF({
        titulo: "Inscritos por empresa",
        subtitulo: data.evento.nombre,
        columnas: ["Empresa", "Cant.", "P.Unit", "Subtotal", "IGV", "Total", "Estado"],
        filas: filas.map((f) => [
          f.Empresa,
          f.Cantidad,
          money(f["Precio unit."], moneda),
          money(f.Subtotal, moneda),
          money(f.IGV, moneda),
          money(f.Total, moneda),
          f.Estado,
        ]),
        nombreArchivo: `inscritos_evento_${eventoId}`,
        orientacion: "landscape",
      });
    }
  };

  return (
    <div className="space-y-5">
      {/* Alta de lote */}
      <Card titulo="Registrar lote de inscritos">
        <form onSubmit={agregarLote} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <input
            list="empresas-list"
            required
            placeholder="Empresa"
            value={form.empresa}
            onChange={(e) => setForm({ ...form, empresa: e.target.value })}
            className="input-field"
          />
          <datalist id="empresas-list">
            {empresasExistentes.map((e) => (
              <option key={e} value={e} />
            ))}
          </datalist>
          <input
            type="number"
            min="1"
            required
            placeholder="Cantidad"
            value={form.cantidad}
            onChange={(e) => setForm({ ...form, cantidad: e.target.value })}
            className="input-field"
          />
          <select
            value={form.estado}
            onChange={(e) => setForm({ ...form, estado: e.target.value })}
            className="input-field"
          >
            {ESTADOS.map((s) => (
              <option key={s.valor} value={s.valor}>
                {s.label}
              </option>
            ))}
          </select>
          <input
            placeholder="Modalidad (opcional)"
            value={form.modalidad}
            onChange={(e) => setForm({ ...form, modalidad: e.target.value })}
            className="input-field"
          />
          <label className="block">
            <span className="block text-[11px] text-gray-500 mb-0.5">Fecha compromiso de pago</span>
            <input
              type="date"
              value={form.fecha_compromiso}
              onChange={(e) => setForm({ ...form, fecha_compromiso: e.target.value })}
              className="input-field"
            />
          </label>
          <label className="flex items-center gap-2 text-sm text-gray-600">
            <input
              type="checkbox"
              checked={form.precio_manual}
              onChange={(e) => setForm({ ...form, precio_manual: e.target.checked })}
            />
            Tarifa negociada (override)
          </label>
          {form.precio_manual && (
            <input
              type="number"
              step="0.01"
              min="0"
              placeholder="Precio unitario"
              value={form.precio_unitario}
              onChange={(e) => setForm({ ...form, precio_unitario: e.target.value })}
              className="input-field"
            />
          )}
          <input
            placeholder="Observación (opcional)"
            value={form.observacion}
            onChange={(e) => setForm({ ...form, observacion: e.target.value })}
            className="input-field lg:col-span-2"
          />
          <button className="btn-primary sm:col-span-2 lg:col-span-1">Agregar lote</button>
        </form>
        <p className="text-xs text-gray-500 mt-2">
          Sin override, el precio sale del tramo del total acumulado de la empresa
          (no se recalculan lotes anteriores).
        </p>
      </Card>

      {/* Barra de acciones */}
      <div className="flex flex-wrap gap-2">
        <button onClick={sincronizar} className="btn-secondary">
          🔄 Sincronizar inscritos reales
        </button>
        <button onClick={() => exportar("excel")} className="btn-secondary">
          📊 Excel
        </button>
        <button onClick={() => exportar("pdf")} className="btn-secondary">
          📄 PDF
        </button>
      </div>

      {/* Tabla por empresa */}
      {empresas.length === 0 ? (
        <Vacio texto="No hay inscritos registrados. Agrega un lote o sincroniza los inscritos reales." />
      ) : (
        <div className="space-y-3">
          {empresas.map((emp) => (
            <div key={emp.empresa} className="bg-white rounded-xl shadow-sm border border-gray-100">
              <button
                onClick={() => setExpandida(expandida === emp.empresa ? null : emp.empresa)}
                className="w-full flex items-center justify-between px-4 py-3 text-left"
              >
                <div>
                  <p className="font-semibold text-gray-900">{emp.empresa}</p>
                  <p className="text-xs text-gray-500">
                    {emp.cantidad} inscrito(s) · ticket {money(emp.ticketPromedio, moneda)}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-gray-900">{money(emp.total, moneda)}</p>
                  <p className="text-xs text-gray-500">
                    Neto {money(emp.subtotal, moneda)} + IGV {money(emp.igv, moneda)}
                  </p>
                  <p className="text-xs text-gray-400">
                    {expandida === emp.empresa ? "▲" : "▼"} {emp.lotes.length} lote(s)
                  </p>
                </div>
              </button>

              {expandida === emp.empresa && (
                <div className="overflow-x-auto border-t border-gray-100">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 text-gray-500 text-xs uppercase">
                      <tr>
                        <th className="px-3 py-2 text-left">Cant.</th>
                        <th className="px-3 py-2 text-right">P. Unit. (neto)</th>
                        <th className="px-3 py-2 text-center">Acum.</th>
                        <th className="px-3 py-2 text-right">Subtotal</th>
                        <th className="px-3 py-2 text-right">IGV</th>
                        <th className="px-3 py-2 text-right">Total bruto</th>
                        <th className="px-3 py-2 text-center">Compromiso</th>
                        <th className="px-3 py-2 text-center">Estado</th>
                        <th className="px-3 py-2 text-center">Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {emp.lotes.map((l) => (
                        <tr key={l.id} className="border-t border-gray-50">
                          <td className="px-3 py-2">
                            {l.cantidad}
                            {l.origen === "sync" && (
                              <span className="ml-1 text-[10px] text-blue-500">(sync)</span>
                            )}
                          </td>
                          <td className="px-3 py-2 text-right">
                            {money(l.precio_unitario, moneda)}
                            {l.precio_manual && (
                              <span className="ml-1 text-[10px] text-amber-600">manual</span>
                            )}
                          </td>
                          <td className="px-3 py-2 text-center">{l.acumulado_hasta}</td>
                          <td className="px-3 py-2 text-right">{money(l.subtotal, moneda)}</td>
                          <td className="px-3 py-2 text-right text-amber-600">{money(l.igv, moneda)}</td>
                          <td className="px-3 py-2 text-right font-medium">
                            {money(l.total, moneda)}
                          </td>
                          <td className="px-3 py-2 text-center text-xs text-gray-500">
                            {l.fecha_compromiso || "—"}
                            {l.fecha_pago && (
                              <span className="block text-[10px] text-green-600">
                                pago {l.fecha_pago}
                              </span>
                            )}
                          </td>
                          <td className="px-3 py-2 text-center">
                            <select
                              value={l.estado}
                              onChange={(e) => cambiarEstadoLote(l.id, e.target.value)}
                              className={`text-xs rounded-full px-2 py-1 border-0 ${ESTADO_COLOR[l.estado]}`}
                            >
                              {ESTADOS.map((s) => (
                                <option key={s.valor} value={s.valor}>
                                  {s.label}
                                </option>
                              ))}
                            </select>
                          </td>
                          <td className="px-3 py-2 text-center whitespace-nowrap">
                            <button
                              onClick={() => setEditando({ ...l, empresa: emp.empresa })}
                              className="text-blue-600 hover:text-blue-800 text-xs mr-3"
                            >
                              Editar
                            </button>
                            <button
                              onClick={() => eliminarLote(emp, l)}
                              className="text-red-500 hover:text-red-700 text-xs"
                            >
                              Eliminar
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {editando && (
        <ModalEditarLote
          lote={editando}
          moneda={moneda}
          onClose={() => setEditando(null)}
          onGuardar={guardarEdicion}
        />
      )}
    </div>
  );
}

// --------------------------------------------------------------------------
//  Auspicios
// --------------------------------------------------------------------------
function TabAuspicios({ data, moneda, eventoId, api, pedirConfirmacion }) {
  const items = data.auspicios.items;
  const categorias = data.categorias || [];
  const [editando, setEditando] = useState(null);
  const [form, setForm] = useState({
    patrocinador: "",
    categoria: "",
    monto: "",
    incluye_igv: false,
    entradas_incluidas: "",
    costo_entrada: "",
    estado: "registrado",
    observacion: "",
    fecha_compromiso: "",
  });

  const agregar = async (e) => {
    e.preventDefault();
    const ok = await api(
      `/api/finanzas/evento/${eventoId}/auspicios`,
      { method: "POST", body: JSON.stringify(form) },
      "Auspicio registrado",
    );
    if (ok)
      setForm({
        patrocinador: "",
        categoria: "",
        monto: "",
        incluye_igv: false,
        entradas_incluidas: "",
        costo_entrada: "",
        estado: "registrado",
        observacion: "",
        fecha_compromiso: "",
      });
  };

  const toggleIncluyeIgv = (id, incluye_igv) =>
    api(`/api/finanzas/auspicios/${id}`, {
      method: "PUT",
      body: JSON.stringify({ incluye_igv }),
    });

  const cambiarEstado = (id, estado) =>
    api(`/api/finanzas/auspicios/${id}`, {
      method: "PUT",
      body: JSON.stringify({ estado }),
    });

  const eliminar = (a) =>
    pedirConfirmacion({
      title: "Eliminar auspicio",
      message: `¿Eliminar el auspicio de <b>${a.patrocinador}</b>?`,
      type: "danger",
      onConfirm: () =>
        api(`/api/finanzas/auspicios/${a.id}`, { method: "DELETE" }, "Auspicio eliminado"),
    });

  const guardarEdicion = async (payload) => {
    const ok = await api(
      `/api/finanzas/auspicios/${editando.id}`,
      { method: "PUT", body: JSON.stringify(payload) },
      "Auspicio actualizado",
    );
    if (ok) setEditando(null);
  };

  const exportar = (tipo) => {
    const filas = items.map((a) => ({
      Patrocinador: a.patrocinador,
      Categoría: a.categoria || "",
      "Monto neto": a.neto,
      IGV: a.igv,
      "Total bruto": a.total,
      "Entradas incl.": a.entradas_incluidas,
      Estado: a.estado,
    }));
    if (tipo === "excel") {
      exportarExcel(filas, `auspicios_evento_${eventoId}`, "Auspicios");
    } else {
      exportarPDF({
        titulo: "Auspicios",
        subtitulo: data.evento.nombre,
        columnas: ["Patrocinador", "Categoría", "Neto", "IGV", "Total", "Entradas", "Estado"],
        filas: items.map((a) => [
          a.patrocinador,
          a.categoria || "—",
          money(a.monto, moneda),
          money(a.igv, moneda),
          money(a.total, moneda),
          a.entradas_incluidas,
          a.estado,
        ]),
        nombreArchivo: `auspicios_evento_${eventoId}`,
        orientacion: "landscape",
      });
    }
  };

  return (
    <div className="space-y-5">
      <Card titulo="Registrar auspicio">
        <form onSubmit={agregar} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <input
            required
            placeholder="Patrocinador"
            value={form.patrocinador}
            onChange={(e) => setForm({ ...form, patrocinador: e.target.value })}
            className="input-field"
          />
          <input
            list="cat-list"
            placeholder="Categoría"
            value={form.categoria}
            onChange={(e) => setForm({ ...form, categoria: e.target.value })}
            className="input-field"
          />
          <datalist id="cat-list">
            {categorias.map((c) => (
              <option key={c.id} value={c.nombre} />
            ))}
          </datalist>
          <input
            type="number"
            step="0.01"
            min="0"
            required
            placeholder="Monto"
            value={form.monto}
            onChange={(e) => setForm({ ...form, monto: e.target.value })}
            className="input-field"
          />
          <label className="flex items-center gap-2 text-sm text-gray-600">
            <input
              type="checkbox"
              checked={form.incluye_igv}
              onChange={(e) => setForm({ ...form, incluye_igv: e.target.checked })}
            />
            El monto incluye IGV
          </label>
          <select
            value={form.estado}
            onChange={(e) => setForm({ ...form, estado: e.target.value })}
            className="input-field"
          >
            {ESTADOS.map((s) => (
              <option key={s.valor} value={s.valor}>
                {s.label}
              </option>
            ))}
          </select>
          <input
            type="number"
            min="0"
            placeholder="Entradas incluidas"
            value={form.entradas_incluidas}
            onChange={(e) => setForm({ ...form, entradas_incluidas: e.target.value })}
            className="input-field"
          />
          <input
            type="number"
            step="0.01"
            min="0"
            placeholder="Costo entrada (ref.)"
            value={form.costo_entrada}
            onChange={(e) => setForm({ ...form, costo_entrada: e.target.value })}
            className="input-field"
          />
          <label className="block">
            <span className="block text-[11px] text-gray-500 mb-0.5">Fecha compromiso de pago</span>
            <input
              type="date"
              value={form.fecha_compromiso}
              onChange={(e) => setForm({ ...form, fecha_compromiso: e.target.value })}
              className="input-field"
            />
          </label>
          <input
            placeholder="Observación (opcional)"
            value={form.observacion}
            onChange={(e) => setForm({ ...form, observacion: e.target.value })}
            className="input-field"
          />
          <button className="btn-primary">Agregar auspicio</button>
        </form>
      </Card>

      <div className="flex flex-wrap gap-2">
        <button onClick={() => exportar("excel")} className="btn-secondary">
          📊 Excel
        </button>
        <button onClick={() => exportar("pdf")} className="btn-secondary">
          📄 PDF
        </button>
      </div>

      {items.length === 0 ? (
        <Vacio texto="No hay auspicios registrados" />
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-500 text-xs uppercase">
              <tr>
                <th className="px-4 py-3 text-left">Patrocinador</th>
                <th className="px-4 py-3 text-left">Categoría</th>
                <th className="px-4 py-3 text-right">Monto (neto)</th>
                <th className="px-4 py-3 text-right">IGV</th>
                <th className="px-4 py-3 text-right">Total bruto</th>
                <th className="px-4 py-3 text-center">Entradas</th>
                <th className="px-4 py-3 text-center">Compromiso</th>
                <th className="px-4 py-3 text-center">Estado</th>
                <th className="px-4 py-3 text-center">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {items.map((a) => (
                <tr key={a.id} className="border-t border-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-900">{a.patrocinador}</td>
                  <td className="px-4 py-3">{a.categoria || "—"}</td>
                  <td className="px-4 py-3 text-right">
                    {money(a.neto, moneda)}
                    <label
                      className="flex items-center justify-end gap-1 text-[10px] text-gray-400 mt-0.5 cursor-pointer"
                      title="Si el monto ingresado ya incluye IGV"
                    >
                      <input
                        type="checkbox"
                        checked={a.incluye_igv}
                        onChange={(e) => toggleIncluyeIgv(a.id, e.target.checked)}
                      />
                      monto c/IGV
                    </label>
                  </td>
                  <td className="px-4 py-3 text-right text-amber-600">{money(a.igv, moneda)}</td>
                  <td className="px-4 py-3 text-right font-medium">{money(a.total, moneda)}</td>
                  <td className="px-4 py-3 text-center">{a.entradas_incluidas}</td>
                  <td className="px-4 py-3 text-center text-xs text-gray-500">
                    {a.fecha_compromiso || "—"}
                    {a.fecha_pago && (
                      <span className="block text-[10px] text-green-600">pago {a.fecha_pago}</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <select
                      value={a.estado}
                      onChange={(e) => cambiarEstado(a.id, e.target.value)}
                      className={`text-xs rounded-full px-2 py-1 border-0 ${ESTADO_COLOR[a.estado]}`}
                    >
                      {ESTADOS.map((s) => (
                        <option key={s.valor} value={s.valor}>
                          {s.label}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="px-4 py-3 text-center whitespace-nowrap">
                    <button
                      onClick={() => setEditando(a)}
                      className="text-blue-600 hover:text-blue-800 text-xs mr-3"
                    >
                      Editar
                    </button>
                    <button
                      onClick={() => eliminar(a)}
                      className="text-red-500 hover:text-red-700 text-xs"
                    >
                      Eliminar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t-2 border-gray-200 font-semibold">
                <td className="px-4 py-3" colSpan={2}>
                  Total auspicios
                </td>
                <td className="px-4 py-3 text-right">{money(data.auspicios.neto, moneda)}</td>
                <td className="px-4 py-3 text-right text-amber-600">{money(data.auspicios.igv, moneda)}</td>
                <td className="px-4 py-3 text-right">{money(data.auspicios.total, moneda)}</td>
                <td className="px-4 py-3 text-center">{data.auspicios.entradasIncluidas}</td>
                <td colSpan={3}></td>
              </tr>
            </tfoot>
          </table>
        </div>
      )}

      {editando && (
        <ModalEditarAuspicio
          auspicio={editando}
          categorias={categorias}
          onClose={() => setEditando(null)}
          onGuardar={guardarEdicion}
        />
      )}
    </div>
  );
}

// --------------------------------------------------------------------------
//  Proyección de flujo (semanal)
// --------------------------------------------------------------------------
function TabProyeccion({ proyeccion, moneda }) {
  if (!proyeccion) {
    return (
      <div className="flex items-center justify-center h-40">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-red-600"></div>
      </div>
    );
  }

  const { semanas = [], resumen = {} } = proyeccion;
  const mon = proyeccion.moneda || moneda;
  const labelSemana = (s) => {
    // 'YYYY-MM-DD' → 'dd/mm'
    const [, m, d] = s.split("-");
    return `${d}/${m}`;
  };
  const chartData = semanas.map((s) => ({
    semana: labelSemana(s.semana),
    Comprometido: s.comprometidoAcum,
    Recaudado: s.pagadoAcum,
  }));

  return (
    <div className="space-y-5">
      {/* Resumen */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          label="Comprometido total"
          value={money(resumen.totalComprometido, mon)}
          sub="Si todos cumplen su compromiso"
          icon="📅"
          color="bg-blue-100 text-blue-700"
        />
        <KpiCard
          label="Recaudado"
          value={money(resumen.totalPagado, mon)}
          sub="Marcados como pagado"
          icon="✅"
          color="bg-green-100 text-green-700"
        />
        <KpiCard
          label="Pendiente"
          value={money(resumen.totalPendiente, mon)}
          sub="Comprometido aún no pagado"
          icon="⏳"
          color="bg-amber-100 text-amber-700"
        />
        <KpiCard
          label="Sin fecha"
          value={money(resumen.sinFechaComprometido, mon)}
          sub={`${resumen.sinFechaCount || 0} ingreso(s) sin compromiso`}
          icon="❓"
          color="bg-gray-100 text-gray-600"
        />
      </div>

      <Card titulo="Proyección acumulada por semana (comprometido vs recaudado)">
        {chartData.length === 0 ? (
          <Vacio texto="Aún no hay ingresos con fecha de compromiso. Asigna fechas para proyectar." />
        ) : (
          <ResponsiveContainer width="100%" height={320}>
            <AreaChart data={chartData} margin={{ left: 10, right: 12 }}>
              <defs>
                <linearGradient id="gC" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="gR" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="semana" tick={{ fontSize: 11 }} />
              <YAxis tickFormatter={(v) => money(v, mon)} tick={{ fontSize: 10 }} width={90} />
              <Tooltip formatter={(v) => money(v, mon)} />
              <Legend />
              <Area
                type="monotone"
                dataKey="Comprometido"
                stroke="#3b82f6"
                fill="url(#gC)"
                strokeWidth={2}
              />
              <Area
                type="monotone"
                dataKey="Recaudado"
                stroke="#10b981"
                fill="url(#gR)"
                strokeWidth={2}
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </Card>

      {semanas.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-500 text-xs uppercase">
              <tr>
                <th className="px-4 py-3 text-left">Semana (desde)</th>
                <th className="px-4 py-3 text-right">Comprometido</th>
                <th className="px-4 py-3 text-right">Acum. comprometido</th>
                <th className="px-4 py-3 text-right">Recaudado</th>
                <th className="px-4 py-3 text-right">Acum. recaudado</th>
              </tr>
            </thead>
            <tbody>
              {semanas.map((s) => (
                <tr key={s.semana} className="border-t border-gray-50">
                  <td className="px-4 py-2">{s.semana}</td>
                  <td className="px-4 py-2 text-right">{money(s.comprometido, mon)}</td>
                  <td className="px-4 py-2 text-right font-medium">{money(s.comprometidoAcum, mon)}</td>
                  <td className="px-4 py-2 text-right text-green-700">{money(s.pagado, mon)}</td>
                  <td className="px-4 py-2 text-right font-medium text-green-700">{money(s.pagadoAcum, mon)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// --------------------------------------------------------------------------
//  Configuración: moneda, IGV, metas y cuadro de precios
// --------------------------------------------------------------------------
function TabConfig({ data, eventoId, api }) {
  const [cfg, setCfg] = useState({
    moneda: data.config.moneda,
    igv_porcentaje: data.config.igv_porcentaje,
    meta_inscritos: data.config.meta_inscritos,
    meta_auspicios: data.config.meta_auspicios,
  });
  const [tramos, setTramos] = useState(
    data.tramos.map((t) => ({
      tramo_min: t.tramo_min,
      tramo_max: t.tramo_max ?? "",
      precio_unitario: t.precio_unitario,
    })),
  );
  const igvPct = Number(cfg.igv_porcentaje) || 0;

  const guardarConfig = () =>
    api(
      `/api/finanzas/evento/${eventoId}/config`,
      { method: "PUT", body: JSON.stringify(cfg) },
      "Configuración guardada",
    );

  const guardarTramos = () =>
    api(
      `/api/finanzas/evento/${eventoId}/tramos`,
      { method: "PUT", body: JSON.stringify({ tramos }) },
      "Cuadro de precios guardado",
    );

  const setTramo = (i, campo, val) =>
    setTramos(tramos.map((t, j) => (j === i ? { ...t, [campo]: val } : t)));
  const addTramo = () =>
    setTramos([...tramos, { tramo_min: "", tramo_max: "", precio_unitario: "" }]);
  const delTramo = (i) => setTramos(tramos.filter((_, j) => j !== i));

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Card titulo="Configuración general">
        <div className="space-y-3">
          <Campo label="Moneda">
            <select
              value={cfg.moneda}
              onChange={(e) => setCfg({ ...cfg, moneda: e.target.value })}
              className="input-field"
            >
              <option value="USD">USD (dólares)</option>
              <option value="PEN">PEN (soles)</option>
            </select>
          </Campo>
          <Campo label="IGV (%)">
            <input
              type="number"
              step="0.01"
              value={cfg.igv_porcentaje}
              onChange={(e) => setCfg({ ...cfg, igv_porcentaje: e.target.value })}
              className="input-field"
            />
          </Campo>
          <Campo label="Meta inscritos">
            <input
              type="number"
              step="0.01"
              value={cfg.meta_inscritos}
              onChange={(e) => setCfg({ ...cfg, meta_inscritos: e.target.value })}
              className="input-field"
            />
          </Campo>
          <Campo label="Meta auspicios">
            <input
              type="number"
              step="0.01"
              value={cfg.meta_auspicios}
              onChange={(e) => setCfg({ ...cfg, meta_auspicios: e.target.value })}
              className="input-field"
            />
          </Campo>
          <button onClick={guardarConfig} className="btn-primary w-full">
            Guardar configuración
          </button>
        </div>
      </Card>

      <Card titulo="Cuadro de precios por tramo (base sin IGV)">
        <div className="space-y-2">
          <div className="grid grid-cols-12 gap-2 text-xs text-gray-500 font-semibold">
            <span className="col-span-2">Desde</span>
            <span className="col-span-2">Hasta</span>
            <span className="col-span-3">Precio (neto)</span>
            <span className="col-span-3 text-right pr-1">c/IGV {igvPct}%</span>
            <span className="col-span-2"></span>
          </div>
          {tramos.map((t, i) => (
            <div key={i} className="grid grid-cols-12 gap-2 items-center">
              <input
                type="number"
                min="1"
                value={t.tramo_min}
                onChange={(e) => setTramo(i, "tramo_min", e.target.value)}
                className="input-field col-span-2"
              />
              <input
                type="number"
                placeholder="∞"
                value={t.tramo_max}
                onChange={(e) => setTramo(i, "tramo_max", e.target.value)}
                className="input-field col-span-2"
              />
              <input
                type="number"
                step="0.01"
                value={t.precio_unitario}
                onChange={(e) => setTramo(i, "precio_unitario", e.target.value)}
                className="input-field col-span-3"
              />
              <span className="col-span-3 text-right pr-1 text-sm font-medium text-gray-700">
                {money(
                  (Number(t.precio_unitario) || 0) * (1 + igvPct / 100),
                  cfg.moneda,
                )}
              </span>
              <button
                onClick={() => delTramo(i)}
                className="col-span-2 text-red-500 text-xs hover:text-red-700"
              >
                Quitar
              </button>
            </div>
          ))}
          <div className="flex gap-2 pt-2">
            <button onClick={addTramo} className="btn-secondary flex-1">
              + Tramo
            </button>
            <button onClick={guardarTramos} className="btn-primary flex-1">
              Guardar cuadro
            </button>
          </div>
          <p className="text-xs text-gray-500">
            "Hasta" vacío = "a más". Al guardar se recalculan los lotes automáticos.
          </p>
        </div>
      </Card>
    </div>
  );
}

// --------------------------------------------------------------------------
//  Historial
// --------------------------------------------------------------------------
function TabHistorial({ historial }) {
  const fmt = (f) => (f ? new Date(f).toLocaleString("es-PE") : "—");
  if (!historial.length) return <Vacio texto="Sin movimientos registrados" />;
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-x-auto">
      <table className="w-full text-sm">
        <thead className="bg-gray-50 text-gray-500 text-xs uppercase">
          <tr>
            <th className="px-4 py-3 text-left">Fecha</th>
            <th className="px-4 py-3 text-left">Entidad</th>
            <th className="px-4 py-3 text-left">Acción</th>
            <th className="px-4 py-3 text-left">Empresa</th>
            <th className="px-4 py-3 text-left">Detalle</th>
            <th className="px-4 py-3 text-left">Usuario</th>
          </tr>
        </thead>
        <tbody>
          {historial.map((h) => (
            <tr key={h.id} className="border-t border-gray-50">
              <td className="px-4 py-2 whitespace-nowrap text-gray-500">{fmt(h.fecha)}</td>
              <td className="px-4 py-2 capitalize">{h.entidad}</td>
              <td className="px-4 py-2 capitalize">{h.accion}</td>
              <td className="px-4 py-2">{h.empresa || "—"}</td>
              <td className="px-4 py-2 text-gray-600">{h.detalle || "—"}</td>
              <td className="px-4 py-2">{h.usuario_nombre || "—"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// --------------------------------------------------------------------------
//  Modales de edición
// --------------------------------------------------------------------------
function ModalShell({ titulo, onClose, children }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-fadeIn">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <h3 className="text-lg font-bold text-gray-900">{titulo}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl leading-none">
            ×
          </button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
}

function ModalEditarLote({ lote, moneda, onClose, onGuardar }) {
  const [f, setF] = useState({
    cantidad: lote.cantidad,
    estado: lote.estado,
    modalidad: lote.modalidad || "",
    observacion: lote.observacion || "",
    precio_manual: !!lote.precio_manual,
    precio_unitario: lote.precio_unitario,
    fecha_compromiso: lote.fecha_compromiso || "",
    fecha_pago: lote.fecha_pago || "",
  });

  const submit = (e) => {
    e.preventDefault();
    onGuardar(f);
  };

  return (
    <ModalShell titulo={`Editar lote · ${lote.empresa}`} onClose={onClose}>
      <form onSubmit={submit} className="space-y-3">
        <Campo label="Cantidad">
          <input
            type="number"
            min="1"
            required
            value={f.cantidad}
            onChange={(e) => setF({ ...f, cantidad: e.target.value })}
            className="input-field"
          />
        </Campo>
        <Campo label="Estado">
          <select
            value={f.estado}
            onChange={(e) => setF({ ...f, estado: e.target.value })}
            className="input-field"
          >
            {ESTADOS.map((s) => (
              <option key={s.valor} value={s.valor}>
                {s.label}
              </option>
            ))}
          </select>
        </Campo>
        <Campo label="Modalidad">
          <input
            value={f.modalidad}
            onChange={(e) => setF({ ...f, modalidad: e.target.value })}
            className="input-field"
          />
        </Campo>
        <div className="grid grid-cols-2 gap-3">
          <Campo label="Fecha compromiso de pago">
            <input
              type="date"
              value={f.fecha_compromiso}
              onChange={(e) => setF({ ...f, fecha_compromiso: e.target.value })}
              className="input-field"
            />
          </Campo>
          {f.estado === "pagado" && (
            <Campo label="Fecha de pago real">
              <input
                type="date"
                value={f.fecha_pago}
                onChange={(e) => setF({ ...f, fecha_pago: e.target.value })}
                className="input-field"
              />
            </Campo>
          )}
        </div>
        <Campo label="Observación">
          <input
            value={f.observacion}
            onChange={(e) => setF({ ...f, observacion: e.target.value })}
            className="input-field"
          />
        </Campo>
        <label className="flex items-center gap-2 text-sm text-gray-600">
          <input
            type="checkbox"
            checked={f.precio_manual}
            onChange={(e) => setF({ ...f, precio_manual: e.target.checked })}
          />
          Tarifa negociada (override)
        </label>
        {f.precio_manual ? (
          <Campo label="Precio unitario (neto)">
            <input
              type="number"
              step="0.01"
              min="0"
              value={f.precio_unitario}
              onChange={(e) => setF({ ...f, precio_unitario: e.target.value })}
              className="input-field"
            />
          </Campo>
        ) : (
          <p className="text-xs text-gray-500">
            Sin override, el precio se recalcula automáticamente por el tramo del acumulado.
          </p>
        )}
        <div className="flex justify-end gap-3 pt-2">
          <button type="button" onClick={onClose} className="btn-secondary">
            Cancelar
          </button>
          <button type="submit" className="btn-primary">
            Guardar cambios
          </button>
        </div>
      </form>
    </ModalShell>
  );
}

function ModalEditarAuspicio({ auspicio, categorias, onClose, onGuardar }) {
  const [f, setF] = useState({
    patrocinador: auspicio.patrocinador,
    categoria: auspicio.categoria || "",
    monto: auspicio.monto,
    incluye_igv: !!auspicio.incluye_igv,
    entradas_incluidas: auspicio.entradas_incluidas,
    costo_entrada: auspicio.costo_entrada,
    estado: auspicio.estado,
    observacion: auspicio.observacion || "",
    fecha_compromiso: auspicio.fecha_compromiso || "",
    fecha_pago: auspicio.fecha_pago || "",
  });

  const submit = (e) => {
    e.preventDefault();
    onGuardar(f);
  };

  return (
    <ModalShell titulo="Editar auspicio" onClose={onClose}>
      <form onSubmit={submit} className="space-y-3">
        <Campo label="Patrocinador">
          <input
            required
            value={f.patrocinador}
            onChange={(e) => setF({ ...f, patrocinador: e.target.value })}
            className="input-field"
          />
        </Campo>
        <Campo label="Categoría">
          <input
            list="cat-list-edit"
            value={f.categoria}
            onChange={(e) => setF({ ...f, categoria: e.target.value })}
            className="input-field"
          />
          <datalist id="cat-list-edit">
            {categorias.map((c) => (
              <option key={c.id} value={c.nombre} />
            ))}
          </datalist>
        </Campo>
        <Campo label="Monto">
          <input
            type="number"
            step="0.01"
            min="0"
            required
            value={f.monto}
            onChange={(e) => setF({ ...f, monto: e.target.value })}
            className="input-field"
          />
        </Campo>
        <label className="flex items-center gap-2 text-sm text-gray-600">
          <input
            type="checkbox"
            checked={f.incluye_igv}
            onChange={(e) => setF({ ...f, incluye_igv: e.target.checked })}
          />
          El monto incluye IGV
        </label>
        <div className="grid grid-cols-2 gap-3">
          <Campo label="Entradas incluidas">
            <input
              type="number"
              min="0"
              value={f.entradas_incluidas}
              onChange={(e) => setF({ ...f, entradas_incluidas: e.target.value })}
              className="input-field"
            />
          </Campo>
          <Campo label="Costo entrada (ref.)">
            <input
              type="number"
              step="0.01"
              min="0"
              value={f.costo_entrada}
              onChange={(e) => setF({ ...f, costo_entrada: e.target.value })}
              className="input-field"
            />
          </Campo>
        </div>
        <Campo label="Estado">
          <select
            value={f.estado}
            onChange={(e) => setF({ ...f, estado: e.target.value })}
            className="input-field"
          >
            {ESTADOS.map((s) => (
              <option key={s.valor} value={s.valor}>
                {s.label}
              </option>
            ))}
          </select>
        </Campo>
        <div className="grid grid-cols-2 gap-3">
          <Campo label="Fecha compromiso de pago">
            <input
              type="date"
              value={f.fecha_compromiso}
              onChange={(e) => setF({ ...f, fecha_compromiso: e.target.value })}
              className="input-field"
            />
          </Campo>
          {f.estado === "pagado" && (
            <Campo label="Fecha de pago real">
              <input
                type="date"
                value={f.fecha_pago}
                onChange={(e) => setF({ ...f, fecha_pago: e.target.value })}
                className="input-field"
              />
            </Campo>
          )}
        </div>
        <Campo label="Observación">
          <input
            value={f.observacion}
            onChange={(e) => setF({ ...f, observacion: e.target.value })}
            className="input-field"
          />
        </Campo>
        <div className="flex justify-end gap-3 pt-2">
          <button type="button" onClick={onClose} className="btn-secondary">
            Cancelar
          </button>
          <button type="submit" className="btn-primary">
            Guardar cambios
          </button>
        </div>
      </form>
    </ModalShell>
  );
}

// --------------------------------------------------------------------------
//  Componentes auxiliares
// --------------------------------------------------------------------------
function KpiCard({ label, value, sub, icon, color }) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
      <div className="flex items-center justify-between">
        <span className={`w-10 h-10 rounded-lg flex items-center justify-center text-lg ${color}`}>
          {icon}
        </span>
      </div>
      <p className="text-xs text-gray-500 mt-3">{label}</p>
      <p className="text-xl font-bold text-gray-900">{value}</p>
      {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
    </div>
  );
}

function Card({ titulo, children }) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
      <h3 className="font-semibold text-gray-800 mb-3">{titulo}</h3>
      {children}
    </div>
  );
}

function Campo({ label, children }) {
  return (
    <label className="block">
      <span className="block text-xs font-semibold text-gray-500 mb-1">{label}</span>
      {children}
    </label>
  );
}

function Barra({ label, valor, meta, moneda, color }) {
  const pct = meta > 0 ? Math.min(100, Math.round((valor / meta) * 100)) : 0;
  return (
    <div>
      <div className="flex justify-between text-sm mb-1">
        <span className="text-gray-600">{label}</span>
        <span className="text-gray-900 font-medium">
          {money(valor, moneda)} {meta > 0 && <span className="text-gray-400">/ {money(meta, moneda)} ({pct}%)</span>}
        </span>
      </div>
      <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
        <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: color }} />
      </div>
    </div>
  );
}

function Vacio({ texto }) {
  return (
    <div className="bg-white rounded-xl border border-dashed border-gray-200 p-8 text-center text-gray-400">
      {texto}
    </div>
  );
}
