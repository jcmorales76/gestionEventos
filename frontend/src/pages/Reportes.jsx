import { useState, useEffect } from "react";
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
  LineChart,
  Line,
  Legend,
} from "recharts";

const COLORES = ["#3b82f6", "#8b5cf6", "#10b981", "#f59e0b", "#ef4444", "#06b6d4"];
const MESES = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];
const labelMes = (ym) =>
  ym ? MESES[parseInt(ym.split("-")[1], 10) - 1] || ym : "";

export default function Reportes() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/stats/reportes")
      .then((r) => r.json())
      .then(setData)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading || !data) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
        <span className="ml-3 text-gray-600">Cargando reportes...</span>
      </div>
    );
  }

  const inscritosPorEvento = data.inscritosPorEvento.map((e) => ({
    nombre: e.nombre.length > 18 ? e.nombre.slice(0, 18) + "…" : e.nombre,
    inscritos: e.inscritos,
  }));
  const eventosPorTipo = data.eventosPorTipo.map((e, i) => ({
    ...e,
    color: COLORES[i % COLORES.length],
  }));
  const tendencia = data.tendencia.map((m) => ({
    mes: labelMes(m.ym),
    inscritos: m.inscritos,
  }));
  const estadoCertificados = data.estadoCertificados.map((e, i) => ({
    ...e,
    color: i === 0 ? "#10b981" : "#f59e0b",
  }));

  const fmtFecha = (f) =>
    f ? new Date(f).toLocaleDateString("es-ES") : "—";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Reportes y Análisis</h1>
        <p className="text-gray-600 mt-1">
          Información en tiempo real sobre inscripciones, certificados y
          materiales
        </p>
      </div>

      {/* Resumen */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <ResumenCard
          label="Total Inscritos"
          value={data.resumen.totalInscritos}
          icon="👥"
          color="bg-blue-100 text-blue-600"
        />
        <ResumenCard
          label="Participantes Activos"
          value={data.resumen.participantesActivos}
          icon="✅"
          color="bg-green-100 text-green-600"
        />
        <ResumenCard
          label="Eventos Activos"
          value={data.resumen.eventosActivos}
          icon="📅"
          color="bg-purple-100 text-purple-600"
        />
        <ResumenCard
          label="Descargaron su certificado"
          value={data.resumen.certificadosDescargados}
          icon="📥"
          color="bg-red-100 text-red-600"
        />
        <ResumenCard
          label="Descargas de materiales"
          value={data.resumen.materialesDescargas}
          icon="📂"
          color="bg-amber-100 text-amber-600"
        />
      </div>

      {/* Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartCard title="Inscritos por Evento">
          {inscritosPorEvento.length === 0 ? (
            <Vacio />
          ) : (
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={inscritosPorEvento}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="nombre" fontSize={11} />
                <YAxis fontSize={12} allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="inscritos" fill="#dc2626" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </ChartCard>

        <ChartCard title="Eventos por Tipo">
          {eventosPorTipo.length === 0 ? (
            <Vacio />
          ) : (
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={eventosPorTipo}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {eventosPorTipo.map((entry, index) => (
                    <Cell key={index} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend
                  verticalAlign="bottom"
                  height={36}
                  iconSize={10}
                  wrapperStyle={{ fontSize: "12px" }}
                />
              </PieChart>
            </ResponsiveContainer>
          )}
        </ChartCard>

        <ChartCard title="Tendencia de Inscripciones">
          {tendencia.length === 0 ? (
            <Vacio />
          ) : (
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={tendencia}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="mes" fontSize={12} />
                <YAxis fontSize={12} allowDecimals={false} />
                <Tooltip />
                <Line
                  type="monotone"
                  dataKey="inscritos"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  dot={{ r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </ChartCard>

        <ChartCard title="Estado de Certificados">
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={estadoCertificados}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={80}
                paddingAngle={4}
                dataKey="value"
              >
                {estadoCertificados.map((entry, index) => (
                  <Cell key={index} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
              <Legend
                verticalAlign="bottom"
                height={36}
                iconSize={10}
                wrapperStyle={{ fontSize: "12px" }}
              />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* Tablas */}
      <div className="space-y-6">
        {/* Inscritos por evento */}
        <TablaCard title="Detalle de Inscritos por Evento">
          <table className="table-base">
            <thead className="table-header">
              <tr>
                <th className="table-th">Evento</th>
                <th className="table-th">Tipo</th>
                <th className="table-th">Fecha</th>
                <th className="table-th">Inscritos</th>
                <th className="table-th">% Ocupación</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {data.inscritosPorEvento.map((row, i) => {
                const ocup = row.capacidad
                  ? Math.round((row.inscritos / row.capacidad) * 100)
                  : 0;
                return (
                  <tr key={i} className="hover:bg-gray-50">
                    <td className="table-td font-medium text-gray-900">
                      {row.nombre}
                    </td>
                    <td className="table-td">{row.tipo}</td>
                    <td className="table-td">{fmtFecha(row.fecha_inicio)}</td>
                    <td className="table-td font-semibold">{row.inscritos}</td>
                    <td className="table-td">
                      <div className="flex items-center gap-2">
                        <div className="w-24 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-blue-500 rounded-full"
                            style={{ width: `${ocup}%` }}
                          ></div>
                        </div>
                        <span className="text-xs text-gray-600">{ocup}%</span>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </TablaCard>

        {/* Certificados generados */}
        <TablaCard title="Certificados Generados (recientes)">
          <table className="table-base">
            <thead className="table-header">
              <tr>
                <th className="table-th">Participante</th>
                <th className="table-th">Evento</th>
                <th className="table-th">Calidad</th>
                <th className="table-th">Fecha</th>
                <th className="table-th">Descargas</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {data.tablaCertificados.length === 0 ? (
                <tr>
                  <td colSpan={5} className="table-td text-center text-gray-400">
                    Sin certificados generados
                  </td>
                </tr>
              ) : (
                data.tablaCertificados.map((row, i) => (
                  <tr key={i} className="hover:bg-gray-50">
                    <td className="table-td font-medium text-gray-900">
                      {row.participante}
                    </td>
                    <td className="table-td">{row.evento}</td>
                    <td className="table-td">{row.tipo}</td>
                    <td className="table-td">{fmtFecha(row.fecha_generacion)}</td>
                    <td className="table-td">
                      {row.descargas > 0 ? (
                        <span className="badge badge-success">
                          ✓ {row.descargas}
                        </span>
                      ) : (
                        <span className="text-xs text-gray-400">
                          No descargado
                        </span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </TablaCard>

        {/* Materiales */}
        <TablaCard title="Materiales Subidos (recientes)">
          <table className="table-base">
            <thead className="table-header">
              <tr>
                <th className="table-th">Material</th>
                <th className="table-th">Evento</th>
                <th className="table-th">Sesión</th>
                <th className="table-th">Descargas</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {data.tablaMateriales.length === 0 ? (
                <tr>
                  <td colSpan={4} className="table-td text-center text-gray-400">
                    Sin materiales
                  </td>
                </tr>
              ) : (
                data.tablaMateriales.map((row, i) => (
                  <tr key={i} className="hover:bg-gray-50">
                    <td className="table-td font-medium text-gray-900">
                      {row.material}
                    </td>
                    <td className="table-td">{row.evento}</td>
                    <td className="table-td">{row.sesion}</td>
                    <td className="table-td font-semibold">
                      {row.descargas || 0}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </TablaCard>
      </div>
    </div>
  );
}

function ResumenCard({ label, value, icon, color }) {
  return (
    <div className="bg-white rounded-xl shadow-sm p-5 border border-gray-100 flex items-center justify-between">
      <div>
        <p className="text-xs font-medium text-gray-600 uppercase tracking-wide">
          {label}
        </p>
        <p className="text-3xl font-bold text-gray-900 mt-1">{value}</p>
      </div>
      <div
        className={`w-12 h-12 rounded-lg flex items-center justify-center text-xl ${color}`}
      >
        {icon}
      </div>
    </div>
  );
}

function ChartCard({ title, children }) {
  return (
    <div className="bg-white rounded-xl shadow-sm p-5 border border-gray-100">
      <h3 className="text-base font-bold text-gray-900 mb-4">{title}</h3>
      {children}
    </div>
  );
}

function TablaCard({ title, children }) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="p-4 border-b border-gray-100">
        <h3 className="text-base font-bold text-gray-900">{title}</h3>
      </div>
      <div className="overflow-x-auto">{children}</div>
    </div>
  );
}

function Vacio() {
  return <p className="text-center text-gray-400 py-20">Sin datos</p>;
}
