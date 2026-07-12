import { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

const COLORES = ["#ef4444", "#8b5cf6", "#1e3a8a", "#22c55e", "#f59e0b", "#06b6d4"];
const MESES = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];

const labelMes = (ym) => {
  if (!ym) return "";
  const [, m] = ym.split("-");
  return MESES[parseInt(m, 10) - 1] || ym;
};

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/stats/dashboard")
      .then((r) => r.json())
      .then(setData)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading || !data) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
        <span className="ml-3 text-gray-600">Cargando dashboard...</span>
      </div>
    );
  }

  const stats = [
    { label: "Total Inscritos", value: data.stats.totalInscritos, icon: "👥", bgLight: "bg-blue-50", textColor: "text-blue-600" },
    { label: "Eventos Activos", value: data.stats.eventosActivos, icon: "📅", bgLight: "bg-purple-50", textColor: "text-purple-600" },
    { label: "Certificados Emitidos", value: data.stats.certificadosEmitidos, icon: "📜", bgLight: "bg-green-50", textColor: "text-green-600" },
    { label: "Materiales", value: data.stats.materiales, icon: "📁", bgLight: "bg-orange-50", textColor: "text-orange-600" },
  ];

  const eventosPorTipo = data.eventosPorTipo.map((e, i) => ({
    ...e,
    color: COLORES[i % COLORES.length],
  }));
  const inscripcionesPorMes = data.inscripcionesPorMes.map((m) => ({
    mes: labelMes(m.ym),
    inscritos: m.inscritos,
  }));

  const getEstadoBadge = (estado) =>
    estado === "Activo"
      ? "bg-green-100 text-green-700"
      : estado === "Próximo"
        ? "bg-yellow-100 text-yellow-700"
        : "bg-blue-100 text-blue-700";

  const nombre = user?.nombre || user?.name || "Administrador";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600 mt-1">Bienvenido, {nombre}</p>
        </div>
        <button className="btn-primary" onClick={() => navigate("/eventos")}>
          + Nuevo Evento
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <div
            key={index}
            className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 hover:shadow-md transition-shadow"
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">
                  {stat.label}
                </p>
                <p className="text-3xl font-bold text-gray-900">{stat.value}</p>
              </div>
              <div
                className={`${stat.bgLight} ${stat.textColor} w-14 h-14 rounded-xl flex items-center justify-center text-3xl`}
              >
                {stat.icon}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <div className="mb-6">
            <h2 className="text-xl font-bold text-gray-900">Eventos por Tipo</h2>
            <p className="text-sm text-gray-600">Distribución de categorías</p>
          </div>
          {eventosPorTipo.length === 0 ? (
            <p className="text-center text-gray-400 py-20">Sin datos</p>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={eventosPorTipo}
                  cx="50%"
                  cy="50%"
                  innerRadius={80}
                  outerRadius={120}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {eventosPorTipo.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend verticalAlign="bottom" height={36} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <div className="mb-6">
            <h2 className="text-xl font-bold text-gray-900">
              Inscripciones por Mes
            </h2>
            <p className="text-sm text-gray-600">Últimos meses</p>
          </div>
          {inscripcionesPorMes.length === 0 ? (
            <p className="text-center text-gray-400 py-20">Sin datos</p>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={inscripcionesPorMes}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="mes" />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="inscritos" fill="#dc2626" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Próximos Eventos */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="p-6 border-b border-gray-100 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Próximos Eventos</h2>
            <p className="text-sm text-gray-600 mt-1">
              Eventos programados y su ocupación
            </p>
          </div>
          <button
            onClick={() => navigate("/eventos")}
            className="text-red-600 hover:text-red-700 font-medium text-sm"
          >
            Ver todos →
          </button>
        </div>
        {data.proximosEventos.length === 0 ? (
          <p className="p-6 text-center text-gray-400">
            No hay eventos próximos.
          </p>
        ) : (
          <div className="divide-y divide-gray-100">
            {data.proximosEventos.map((evento) => (
              <div key={evento.id} className="p-6 hover:bg-gray-50 transition-colors">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  <div className="flex items-start gap-4 flex-1">
                    <div
                      className="w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0"
                      style={{ backgroundColor: evento.color || "#dc2626" }}
                    >
                      <span className="text-white text-xl">📅</span>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-1 flex-wrap">
                        <h3 className="font-semibold text-gray-900 text-lg">
                          {evento.nombre}
                        </h3>
                        <span
                          className={`px-2 py-0.5 rounded-full text-xs font-semibold ${getEstadoBadge(evento.estado)}`}
                        >
                          {evento.estado}
                        </span>
                      </div>
                      <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
                        <span>
                          📆{" "}
                          {new Date(evento.fecha_inicio).toLocaleDateString(
                            "es-ES",
                          )}
                        </span>
                        <span>📊 {evento.tipo}</span>
                        <div className="flex items-center gap-2">
                          <div className="w-32 h-2 bg-gray-200 rounded-full overflow-hidden">
                            <div
                              className="h-full rounded-full"
                              style={{
                                width: `${evento.capacidad > 0 ? (evento.inscritos / evento.capacidad) * 100 : 0}%`,
                                backgroundColor: evento.color || "#dc2626",
                              }}
                            />
                          </div>
                          <span className="font-medium">
                            {evento.inscritos}/{evento.capacidad} inscritos
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
