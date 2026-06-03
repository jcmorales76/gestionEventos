import { useAuth } from "../contexts/AuthContext";
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

export default function Dashboard() {
  const { user } = useAuth();

  // Datos para gráfico de dona - Eventos por Tipo
  const eventosPorTipo = [
    { name: "Curso", value: 12, color: "#ef4444" },
    { name: "Seminario", value: 8, color: "#8b5cf6" },
    { name: "Taller", value: 15, color: "#1e3a8a" },
    { name: "Congreso", value: 5, color: "#22c55e" },
    { name: "Programa de Alta Dirección", value: 3, color: "#f59e0b" },
  ];

  // Datos para gráfico de barras - Inscripciones por Mes
  const inscripcionesPorMes = [
    { mes: "Ene", inscritos: 12 },
    { mes: "Feb", inscritos: 19 },
    { mes: "Mar", inscritos: 8 },
    { mes: "Abr", inscritos: 25 },
    { mes: "May", inscritos: 22 },
    { mes: "Jun", inscritos: 30 },
  ];

  // Datos para gráfico de línea - Tendencia
  const tendenciaInscripciones = [
    { semana: "Sem 1", inscritos: 45 },
    { semana: "Sem 2", inscrit: 52 },
    { semana: "Sem 3", inscritos: 48 },
    { semana: "Sem 4", inscritos: 65 },
  ];

  const stats = [
    {
      label: "Total Inscritos",
      value: "348",
      icon: "👥",
      color: "bg-blue-500",
      bgLight: "bg-blue-50",
      textColor: "text-blue-600",
      change: "+12%",
      changeType: "positive",
    },
    {
      label: "Eventos Activos",
      value: "12",
      icon: "📅",
      color: "bg-purple-500",
      bgLight: "bg-purple-50",
      textColor: "text-purple-600",
      change: "+3",
      changeType: "positive",
    },
    {
      label: "Certificados Emitidos",
      value: "215",
      icon: "📜",
      color: "bg-green-500",
      bgLight: "bg-green-50",
      textColor: "text-green-600",
      change: "+28",
      changeType: "positive",
    },
    {
      label: "Materiales Descargados",
      value: "892",
      icon: "📁",
      color: "bg-orange-500",
      bgLight: "bg-orange-50",
      textColor: "text-orange-600",
      change: "+15%",
      changeType: "positive",
    },
  ];

  const proximosEventos = [
    {
      id: 1,
      nombre: "Taller de Liderazgo",
      tipo: "Taller",
      fecha: "15 Jun 2026",
      inscritos: 45,
      capacidad: 50,
      estado: "Activo",
      color: "bg-red-500",
    },
    {
      id: 2,
      nombre: "Seminario de Innovación",
      tipo: "Seminario",
      fecha: "22 Jun 2026",
      inscritos: 120,
      capacidad: 150,
      estado: "Activo",
      color: "bg-purple-500",
    },
    {
      id: 3,
      nombre: "Congreso Anual FEPCMAC",
      tipo: "Congreso",
      fecha: "10 Jul 2026",
      inscritos: 280,
      capacidad: 300,
      estado: "Próximo",
      color: "bg-blue-500",
    },
    {
      id: 4,
      nombre: "Curso de Gestión Empresarial",
      tipo: "Curso",
      fecha: "25 Jul 2026",
      inscritos: 75,
      capacidad: 100,
      estado: "Próximo",
      color: "bg-green-500",
    },
  ];

  const getEstadoClass = (estado) => {
    switch (estado) {
      case "Activo":
        return "badge-success";
      case "Próximo":
        return "badge-warning";
      case "Finalizado":
        return "badge-info";
      default:
        return "badge-secondary";
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600 mt-1">Bienvenido, {user?.name}</p>
        </div>
        <div className="flex gap-3">
          <button className="btn-secondary">📊 Exportar Reporte</button>
          <button className="btn-primary">+ Nuevo Evento</button>
        </div>
      </div>

      {/* Stats Grid - Mejorado */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <div
            key={index}
            className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 hover:shadow-md transition-shadow"
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-600 mb-1">
                  {stat.label}
                </p>
                <p className="text-3xl font-bold text-gray-900 mb-2">
                  {stat.value}
                </p>
                <div className="flex items-center gap-1">
                  <span
                    className={`text-xs font-semibold ${stat.changeType === "positive" ? "text-green-600" : "text-red-600"}`}
                  >
                    {stat.change}
                  </span>
                  <span className="text-xs text-gray-500">vs mes anterior</span>
                </div>
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
        {/* Eventos por Tipo - Gráfico de Dona */}
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <div className="mb-6">
            <h2 className="text-xl font-bold text-gray-900">
              Eventos por Tipo
            </h2>
            <p className="text-sm text-gray-600">Distribución de categorías</p>
          </div>
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
        </div>

        {/* Inscripciones por Mes - Gráfico de Barras */}
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <div className="mb-6">
            <h2 className="text-xl font-bold text-gray-900">
              Inscripciones por Mes
            </h2>
            <p className="text-sm text-gray-600">Últimos 6 meses</p>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={inscripcionesPorMes}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="mes" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="inscritos" fill="#dc2626" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Próximos Eventos - Mejorado */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="p-6 border-b border-gray-100 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-gray-900">
              Próximos Eventos
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              Eventos programados y su estado
            </p>
          </div>
          <button className="text-red-600 hover:text-red-700 font-medium text-sm">
            Ver todos →
          </button>
        </div>
        <div className="divide-y divide-gray-100">
          {proximosEventos.map((evento) => (
            <div
              key={evento.id}
              className="p-6 hover:bg-gray-50 transition-colors"
            >
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div className="flex items-start gap-4 flex-1">
                  <div
                    className={`${evento.color} w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0`}
                  >
                    <span className="text-white text-xl">📅</span>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-1">
                      <h3 className="font-semibold text-gray-900 text-lg">
                        {evento.nombre}
                      </h3>
                      <span
                        className={`badge ${getEstadoClass(evento.estado)}`}
                      >
                        {evento.estado}
                      </span>
                    </div>
                    <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
                      <span className="flex items-center gap-1">
                        📆 {evento.fecha}
                      </span>
                      <span className="flex items-center gap-1">
                        📊 {evento.tipo}
                      </span>
                      <div className="flex items-center gap-2">
                        <div className="w-32 h-2 bg-gray-200 rounded-full overflow-hidden">
                          <div
                            className={`h-full ${evento.color} rounded-full`}
                            style={{
                              width: `${(evento.inscritos / evento.capacidad) * 100}%`,
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
                <div className="flex items-center gap-2">
                  <button className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                    Ver detalles
                  </button>
                  <button className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors">
                    Gestionar
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Actividad Reciente */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <h3 className="text-lg font-bold text-gray-900 mb-4">
            Actividad Reciente
          </h3>
          <div className="space-y-4">
            {[
              {
                action: "Nueva inscripción",
                target: "Taller de Liderazgo",
                time: "Hace 5 min",
                icon: "👤",
              },
              {
                action: "Certificado generado",
                target: "María González",
                time: "Hace 15 min",
                icon: "📜",
              },
              {
                action: "Material subido",
                target: "Presentación PDF",
                time: "Hace 1 hora",
                icon: "📁",
              },
              {
                action: "Evento creado",
                target: "Seminario de Innovación",
                time: "Hace 2 horas",
                icon: "📅",
              },
            ].map((item, index) => (
              <div
                key={index}
                className="flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div className="text-2xl">{item.icon}</div>
                <div className="flex-1">
                  <p className="font-medium text-gray-900">{item.action}</p>
                  <p className="text-sm text-gray-600">{item.target}</p>
                </div>
                <span className="text-xs text-gray-500">{item.time}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <h3 className="text-lg font-bold text-gray-900 mb-4">
            Certificados Pendientes
          </h3>
          <div className="space-y-4">
            {[
              {
                name: "Carlos Mendoza",
                event: "Curso de Liderazgo",
                date: "10 Jun 2026",
              },
              {
                name: "Ana Rodríguez",
                event: "Taller de Innovación",
                date: "12 Jun 2026",
              },
              {
                name: "Luis Torres",
                event: "Seminario Empresarial",
                date: "15 Jun 2026",
              },
              {
                name: "Patricia Silva",
                event: "Congreso Anual",
                date: "18 Jun 2026",
              },
            ].map((cert, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center text-purple-600 font-semibold">
                    {cert.name.charAt(0)}
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{cert.name}</p>
                    <p className="text-sm text-gray-600">{cert.event}</p>
                  </div>
                </div>
                <button className="px-3 py-1 text-sm font-medium text-red-600 bg-red-50 rounded-lg hover:bg-red-100 transition-colors">
                  Generar
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
