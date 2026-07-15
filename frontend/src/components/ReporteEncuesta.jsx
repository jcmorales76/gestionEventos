import { useState, useEffect } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { exportarExcel, exportarPDF } from "../utils/exportar";

const COLORES = [
  "#dc2626",
  "#4f46e5",
  "#059669",
  "#f59e0b",
  "#0ea5e9",
  "#8b5cf6",
];

export default function ReporteEncuesta({ eventoId }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/encuestas/reportes/${eventoId}`)
      .then((r) => r.json())
      .then(setData)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [eventoId]);

  if (loading)
    return (
      <p className="text-center text-gray-500 py-8">Cargando resultados...</p>
    );
  if (!data || !data.encuesta)
    return (
      <p className="text-center text-gray-400 py-8">
        Este evento no tiene encuesta configurada.
      </p>
    );
  if (data.totalRespuestas === 0)
    return (
      <div className="text-center py-10">
        <div className="text-5xl mb-3">📊</div>
        <p className="text-gray-600">Aún no hay respuestas para mostrar.</p>
      </div>
    );

  // Aplana el reporte para exportarlo a Excel/PDF
  const filasExport = () => {
    const filas = [];
    data.preguntas.forEach((p, i) => {
      if (p.opciones) {
        p.opciones.forEach((o) =>
          filas.push({
            "#": i + 1,
            Pregunta: p.texto,
            Tipo: p.tipo,
            Respuesta: o.texto,
            Cantidad: o.count,
          }),
        );
      } else if (p.distribucion) {
        p.distribucion.forEach((d) =>
          filas.push({
            "#": i + 1,
            Pregunta: p.texto,
            Tipo: "escala",
            Respuesta: `${d.valor} ⭐`,
            Cantidad: d.count,
          }),
        );
      } else if (p.respuestas) {
        p.respuestas.forEach((r) =>
          filas.push({
            "#": i + 1,
            Pregunta: p.texto,
            Tipo: "abierta",
            Respuesta: r,
            Cantidad: "",
          }),
        );
      }
    });
    return filas;
  };

  const resumenTexto = `Respuestas: ${data.totalRespuestas} · Participación: ${data.participacion}% · Satisfacción: ${data.satisfaccion != null ? data.satisfaccion + "/5" : "N/A"}`;
  const nombreArchivo = `encuesta_${(data.encuesta.titulo || "reporte").replace(/[^a-zA-Z0-9]/g, "_")}`;

  const handleExcel = () => exportarExcel(filasExport(), nombreArchivo, "Encuesta");

  const handlePDF = () =>
    exportarPDF({
      titulo: data.encuesta.titulo || "Reporte de encuesta",
      subtitulo: resumenTexto,
      columnas: ["#", "Pregunta", "Tipo", "Respuesta", "Cantidad"],
      filas: filasExport().map((f) => [
        f["#"],
        f.Pregunta,
        f.Tipo,
        f.Respuesta,
        f.Cantidad,
      ]),
      nombreArchivo,
      orientacion: "landscape",
    });

  return (
    <div className="space-y-6">
      {/* Exportar */}
      <div className="flex justify-end gap-2">
        <button onClick={handleExcel} className="btn-secondary text-sm">
          📊 Exportar Excel
        </button>
        <button onClick={handlePDF} className="btn-secondary text-sm">
          📄 Exportar PDF
        </button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <KPI
          label="Respuestas"
          value={data.totalRespuestas}
          color="from-blue-50 to-indigo-100 text-blue-900"
        />
        <KPI
          label="Participación"
          value={`${data.participacion}%`}
          sub={`${data.totalRespuestas} de ${data.inscritos} inscritos`}
          color="from-green-50 to-emerald-100 text-green-900"
        />
        <KPI
          label="Satisfacción prom."
          value={data.satisfaccion != null ? `${data.satisfaccion} / 5` : "—"}
          color="from-amber-50 to-orange-100 text-amber-900"
        />
      </div>

      {/* Preguntas */}
      {data.preguntas.map((p, i) => (
        <div key={p.id} className="surface p-5">
          <h3 className="font-bold text-gray-900 mb-4">
            {i + 1}. {p.texto}
          </h3>

          {(p.tipo === "opcion_unica" || p.tipo === "opcion_multiple") && (
            <ResponsiveContainer
              width="100%"
              height={Math.max(160, p.opciones.length * 44)}
            >
              <BarChart
                data={p.opciones}
                layout="vertical"
                margin={{ left: 8, right: 24 }}
              >
                <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                <XAxis type="number" allowDecimals={false} />
                <YAxis
                  type="category"
                  dataKey="texto"
                  width={150}
                  tick={{ fontSize: 12 }}
                />
                <Tooltip />
                <Bar dataKey="count" radius={[0, 6, 6, 0]}>
                  {p.opciones.map((o, idx) => (
                    <Cell key={idx} fill={COLORES[idx % COLORES.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}

          {p.tipo === "escala" && (
            <>
              <p className="text-sm text-gray-600 mb-2">
                Promedio: <strong>{p.promedio} / 5</strong>
              </p>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={p.distribucion}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="valor" />
                  <YAxis allowDecimals={false} />
                  <Tooltip />
                  <Bar dataKey="count" fill="#dc2626" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </>
          )}

          {p.tipo === "abierta" &&
            (p.respuestas.length === 0 ? (
              <p className="text-sm text-gray-400">Sin respuestas.</p>
            ) : (
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {p.respuestas.map((r, idx) => (
                  <div
                    key={idx}
                    className="text-sm text-gray-700 bg-gray-50 rounded-lg p-2 border border-gray-100"
                  >
                    “{r}”
                  </div>
                ))}
              </div>
            ))}
        </div>
      ))}
    </div>
  );
}

function KPI({ label, value, sub, color }) {
  return (
    <div
      className={`rounded-xl p-5 border border-black/5 bg-gradient-to-br ${color}`}
    >
      <p className="text-sm font-medium opacity-80">{label}</p>
      <p className="text-3xl font-bold mt-1">{value}</p>
      {sub && <p className="text-xs opacity-70 mt-1">{sub}</p>}
    </div>
  );
}
