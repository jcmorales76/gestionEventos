import { useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
} from "recharts";

export default function Reportes() {
  // Datos para gráficos
  const dataInscritosEvento = [
    { nombre: "Liderazgo", inscritos: 45 },
    { nombre: "Innovación", inscritos: 120 },
    { nombre: "Negociación", inscritos: 18 },
    { nombre: "Finanzas", inscritos: 85 },
    { nombre: "MBA", inscritos: 25 },
  ];

  const dataEventosTipo = [
    { name: "Curso", value: 12, color: "#3b82f6" },
    { name: "Seminario", value: 8, color: "#8b5cf6" },
    { name: "Taller", value: 15, color: "#10b981" },
    { name: "Congreso", value: 5, color: "#f59e0b" },
    { name: "MBA", value: 3, color: "#ef4444" },
  ];

  const dataTendencia = [
    { mes: "Ene", inscritos: 120 },
    { mes: "Feb", inscritos: 145 },
    { mes: "Mar", inscritos: 132 },
    { mes: "Abr", inscritos: 168 },
    { mes: "May", inscritos: 195 },
    { mes: "Jun", inscritos: 210 },
  ];

  const dataCertificados = [
    { name: "Emitidos", value: 215, color: "#10b981" },
    { name: "Pendientes", value: 85, color: "#f59e0b" },
    { name: "Rechazados", value: 12, color: "#ef4444" },
  ];

  // Tablas
  const tableInscritos = [
    {
      evento: "Curso de Liderazgo Ejecutivo",
      tipo: "Curso",
      fecha: "15 Jun 2026",
      inscritos: 45,
      ocupacion: "90%",
    },
    {
      evento: "Seminario de Innovación Digital",
      tipo: "Seminario",
      fecha: "22 Jun 2026",
      inscritos: 120,
      ocupacion: "80%",
    },
    {
      evento: "Taller de Negociación Avanzada",
      tipo: "Taller",
      fecha: "01 Jun 2026",
      inscritos: 18,
      ocupacion: "90%",
    },
    {
      evento: "Congreso Internacional de Finanzas",
      tipo: "Congreso",
      fecha: "05 Ago 2026",
      inscritos: 85,
      ocupacion: "42%",
    },
  ];

  const tableCertificados = [
    {
      participante: "Carlos Mendoza",
      evento: "Curso de Liderazgo",
      fecha: "16 Jun 2026",
      estado: "Descargado",
    },
    {
      participante: "Ana Torres",
      evento: "Seminario de Innovación",
      fecha: "23 Jun 2026",
      estado: "Pendiente",
    },
    {
      participante: "Roberto Díaz",
      evento: "Taller de Negociación",
      fecha: "02 Jun 2026",
      estado: "Descargado",
    },
    {
      participante: "María González",
      evento: "Congreso de Finanzas",
      fecha: "06 Ago 2026",
      estado: "No generado",
    },
  ];

  const tableMateriales = [
    {
      material: "Guía de Liderazgo 2026.pdf",
      evento: "Curso de Liderazgo",
      tipo: "PDF",
      descargas: 45,
    },
    {
      material: "Innovación Digital.pptx",
      evento: "Seminario de Innovación",
      tipo: "Presentación",
      descargas: 32,
    },
    {
      material: "Finanzas Corporativas.docx",
      evento: "Congreso de Finanzas",
      tipo: "Documento",
      descargas: 56,
    },
    {
      material: "Excel Avanzado - Macros.xlsm",
      evento: "Taller de Excel",
      tipo: "Documento",
      descargas: 41,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Reportes y Análisis
          </h1>
          <p className="text-gray-600 mt-1">
            Información detallada sobre inscripciones, certificados y materiales
          </p>
        </div>
        <button className="btn-primary">📥 Exportar Excel</button>
      </div>

      {/* Resumen General */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl shadow-sm p-5 border border-gray-100 flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-gray-600 uppercase tracking-wide">
              Total Inscritos
            </p>
            <p className="text-3xl font-bold text-gray-900 mt-1">348</p>
          </div>
          <div className="w-12 h-12 rounded-lg bg-blue-100 flex items-center justify-center text-blue-600 text-xl">
            👥
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-5 border border-gray-100 flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-gray-600 uppercase tracking-wide">
              Participantes Activos
            </p>
            <p className="text-3xl font-bold text-gray-900 mt-1">312</p>
          </div>
          <div className="w-12 h-12 rounded-lg bg-green-100 flex items-center justify-center text-green-600 text-xl">
            ✅
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-5 border border-gray-100 flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-gray-600 uppercase tracking-wide">
              Eventos Activos
            </p>
            <p className="text-3xl font-bold text-gray-900 mt-1">12</p>
          </div>
          <div className="w-12 h-12 rounded-lg bg-purple-100 flex items-center justify-center text-purple-600 text-xl">
            📅
          </div>
        </div>
      </div>

      {/* Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Inscritos por Evento */}
        <div className="bg-white rounded-xl shadow-sm p-5 border border-gray-100">
          <h3 className="text-base font-bold text-gray-900 mb-4">
            Inscritos por Evento
          </h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={dataInscritosEvento}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="nombre" fontSize={12} />
              <YAxis fontSize={12} />
              <Tooltip />
              <Bar dataKey="inscritos" fill="#dc2626" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Eventos por Tipo */}
        <div className="bg-white rounded-xl shadow-sm p-5 border border-gray-100">
          <h3 className="text-base font-bold text-gray-900 mb-4">
            Eventos por Tipo
          </h3>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={dataEventosTipo}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={80}
                paddingAngle={4}
                dataKey="value"
              >
                {dataEventosTipo.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
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
        </div>

        {/* Tendencia de Inscripciones */}
        <div className="bg-white rounded-xl shadow-sm p-5 border border-gray-100">
          <h3 className="text-base font-bold text-gray-900 mb-4">
            Tendencia de Inscripciones
          </h3>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={dataTendencia}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="mes" fontSize={12} />
              <YAxis fontSize={12} />
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
        </div>

        {/* Estado de Certificados */}
        <div className="bg-white rounded-xl shadow-sm p-5 border border-gray-100">
          <h3 className="text-base font-bold text-gray-900 mb-4">
            Estado de Certificados
          </h3>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={dataCertificados}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={80}
                paddingAngle={4}
                dataKey="value"
              >
                {dataCertificados.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
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
        </div>
      </div>

      {/* Tablas de Reportes */}
      <div className="space-y-6">
        {/* Inscritos por Evento */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-4 border-b border-gray-100">
            <h3 className="text-base font-bold text-gray-900">
              Detalle de Inscritos por Evento
            </h3>
          </div>
          <div className="overflow-x-auto">
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
                {tableInscritos.map((row, i) => (
                  <tr key={i} className="hover:bg-gray-50">
                    <td className="table-td font-medium text-gray-900">
                      {row.evento}
                    </td>
                    <td className="table-td">{row.tipo}</td>
                    <td className="table-td">{row.fecha}</td>
                    <td className="table-td font-semibold">{row.inscritos}</td>
                    <td className="table-td">
                      <div className="flex items-center gap-2">
                        <div className="w-24 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-blue-500 rounded-full"
                            style={{ width: row.ocupacion }}
                          ></div>
                        </div>
                        <span className="text-xs text-gray-600">
                          {row.ocupacion}
                        </span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Descargas de Certificados */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-4 border-b border-gray-100">
            <h3 className="text-base font-bold text-gray-900">
              Descargas de Certificados
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="table-base">
              <thead className="table-header">
                <tr>
                  <th className="table-th">Participante</th>
                  <th className="table-th">Evento</th>
                  <th className="table-th">Fecha descarga</th>
                  <th className="table-th">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {tableCertificados.map((row, i) => (
                  <tr key={i} className="hover:bg-gray-50">
                    <td className="table-td font-medium text-gray-900">
                      {row.participante}
                    </td>
                    <td className="table-td">{row.evento}</td>
                    <td className="table-td">{row.fecha}</td>
                    <td className="table-td">
                      <span
                        className={`badge ${row.estado === "Descargado" ? "badge-success" : row.estado === "Pendiente" ? "badge-warning" : "badge-danger"}`}
                      >
                        {row.estado}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Descarga de Materiales */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-4 border-b border-gray-100">
            <h3 className="text-base font-bold text-gray-900">
              Descarga de Materiales
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="table-base">
              <thead className="table-header">
                <tr>
                  <th className="table-th">Material</th>
                  <th className="table-th">Evento</th>
                  <th className="table-th">Tipo</th>
                  <th className="table-th">Descargas</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {tableMateriales.map((row, i) => (
                  <tr key={i} className="hover:bg-gray-50">
                    <td className="table-td font-medium text-gray-900">
                      {row.material}
                    </td>
                    <td className="table-td">{row.evento}</td>
                    <td className="table-td">{row.tipo}</td>
                    <td className="table-td font-semibold">{row.descargas}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
