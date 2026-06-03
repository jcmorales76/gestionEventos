import { useState } from "react";

export default function Participantes() {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterEvento, setFilterEvento] = useState("Todos");
  const [filterEstado, setFilterEstado] = useState("Todos");

  const participantes = [
    {
      id: 1,
      nombre: "Carlos",
      apellido: "Mendoza Ruiz",
      email: "carlos.mendoza@email.com",
      dni: "12345678",
      telefono: "+51 987 654 321",
      evento: "Curso de Liderazgo Ejecutivo",
      fechaInscripcion: "15 May 2026",
      estado: "Activo",
      certificado: true,
      materiales: 5,
      avatar: "CM",
    },
    {
      id: 2,
      nombre: "Ana",
      apellido: "Torres Silva",
      email: "ana.torres@email.com",
      dni: "87654321",
      telefono: "+51 912 345 678",
      evento: "Seminario de Innovación Digital",
      fechaInscripcion: "18 May 2026",
      estado: "Activo",
      certificado: false,
      materiales: 3,
      avatar: "AT",
    },
    {
      id: 3,
      nombre: "Roberto",
      apellido: "Díaz Morales",
      email: "roberto.diaz@email.com",
      dni: "45678912",
      telefono: "+51 923 456 789",
      evento: "Taller de Negociación Avanzada",
      fechaInscripcion: "10 May 2026",
      estado: "Activo",
      certificado: true,
      materiales: 4,
      avatar: "RD",
    },
    {
      id: 4,
      nombre: "María",
      apellido: "González Pérez",
      email: "maria.gonzalez@email.com",
      dni: "78912345",
      telefono: "+51 934 567 890",
      evento: "Congreso Internacional de Finanzas",
      fechaInscripcion: "20 May 2026",
      estado: "Inactivo",
      certificado: false,
      materiales: 0,
      avatar: "MG",
    },
    {
      id: 5,
      nombre: "Luis",
      apellido: "Fernández Castro",
      email: "luis.fernandez@email.com",
      dni: "32165498",
      telefono: "+51 945 678 901",
      evento: "Curso de Liderazgo Ejecutivo",
      fechaInscripcion: "12 May 2026",
      estado: "Activo",
      certificado: true,
      materiales: 5,
      avatar: "LF",
    },
    {
      id: 6,
      nombre: "Patricia",
      apellido: "Ramírez López",
      email: "patricia.ramirez@email.com",
      dni: "65498732",
      telefono: "+51 956 789 012",
      evento: "Programa Alta Dirección MBA",
      fechaInscripcion: "22 May 2026",
      estado: "Activo",
      certificado: false,
      materiales: 2,
      avatar: "PR",
    },
  ];

  const participantesFiltrados = participantes.filter((part) => {
    const fullName = `${part.nombre} ${part.apellido}`.toLowerCase();
    const matchSearch =
      fullName.includes(searchTerm.toLowerCase()) ||
      part.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      part.dni.includes(searchTerm);
    const matchEvento =
      filterEvento === "Todos" || part.evento === filterEvento;
    const matchEstado =
      filterEstado === "Todos" || part.estado === filterEstado;
    return matchSearch && matchEvento && matchEstado;
  });

  const stats = [
    {
      label: "Total Participantes",
      value: "348",
      icon: "👥",
      color: "bg-blue-500",
      change: "+12%",
    },
    {
      label: "Activos",
      value: "312",
      icon: "✅",
      color: "bg-green-500",
      change: "+8%",
    },
    {
      label: "Certificados Emitidos",
      value: "215",
      icon: "📜",
      color: "bg-purple-500",
      change: "+15%",
    },
    {
      label: "Materiales Descargados",
      value: "1,247",
      icon: "📁",
      color: "bg-orange-500",
      change: "+22%",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Gestión de Participantes
          </h1>
          <p className="text-gray-600 mt-1">
            Administra todos los participantes registrados
          </p>
        </div>
        <div className="flex gap-3">
          <button className="btn-secondary">
            <svg
              className="w-5 h-5 inline mr-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"
              />
            </svg>
            Importar CSV/Excel
          </button>
          <button className="btn-primary">+ Nuevo Participante</button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <div
            key={index}
            className="bg-white rounded-xl shadow-sm p-6 border border-gray-100"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">
                  {stat.label}
                </p>
                <p className="text-3xl font-bold text-gray-900">{stat.value}</p>
                <p className="text-xs text-green-600 mt-1 font-medium">
                  {stat.change} vs mes anterior
                </p>
              </div>
              <div
                className={`${stat.color} w-12 h-12 rounded-lg flex items-center justify-center text-2xl`}
              >
                {stat.icon}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <svg
              className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
            <input
              type="text"
              placeholder="Buscar por nombre, email o DNI..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all outline-none"
            />
          </div>
          <select
            value={filterEvento}
            onChange={(e) => setFilterEvento(e.target.value)}
            className="input-field md:w-64"
          >
            <option>Todos los eventos</option>
            <option>Curso de Liderazgo Ejecutivo</option>
            <option>Seminario de Innovación Digital</option>
            <option>Taller de Negociación Avanzada</option>
            <option>Congreso Internacional de Finanzas</option>
            <option>Programa Alta Dirección MBA</option>
          </select>
          <select
            value={filterEstado}
            onChange={(e) => setFilterEstado(e.target.value)}
            className="input-field md:w-48"
          >
            <option>Todos los estados</option>
            <option>Activo</option>
            <option>Inactivo</option>
          </select>
        </div>
      </div>

      {/* Tabla de Participantes */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="table-base">
            <thead className="table-header">
              <tr>
                <th className="table-th">Participante</th>
                <th className="table-th">Correo</th>
                <th className="table-th">Evento</th>
                <th className="table-th">Inscrito</th>
                <th className="table-th">Estado</th>
                <th className="table-th">Cert.</th>
                <th className="table-th">Materiales</th>
                <th className="table-th">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {participantesFiltrados.map((part) => (
                <tr
                  key={part.id}
                  className="hover:bg-gray-50 transition-colors"
                >
                  <td className="table-td">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center text-red-600 font-semibold flex-shrink-0">
                        {part.avatar}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">
                          {part.nombre} {part.apellido}
                        </p>
                        <p className="text-xs text-gray-500">DNI: {part.dni}</p>
                      </div>
                    </div>
                  </td>
                  <td className="table-td">
                    <div>
                      <p className="text-sm text-gray-900">{part.email}</p>
                      <p className="text-xs text-gray-500">{part.telefono}</p>
                    </div>
                  </td>
                  <td className="table-td">
                    <span className="text-sm text-gray-700">{part.evento}</span>
                  </td>
                  <td className="table-td">
                    <span className="text-sm text-gray-700">
                      {part.fechaInscripcion}
                    </span>
                  </td>
                  <td className="table-td">
                    <span
                      className={`badge ${part.estado === "Activo" ? "badge-success" : "badge-danger"}`}
                    >
                      {part.estado}
                    </span>
                  </td>
                  <td className="table-td">
                    {part.certificado ? (
                      <span className="badge badge-success">✓ Emitido</span>
                    ) : (
                      <span className="badge bg-gray-100 text-gray-600">
                        Pendiente
                      </span>
                    )}
                  </td>
                  <td className="table-td">
                    <span className="text-sm font-medium text-gray-900">
                      {part.materiales}
                    </span>
                    <span className="text-xs text-gray-500"> descargados</span>
                  </td>
                  <td className="table-td">
                    <div className="flex items-center gap-2">
                      <button
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="Ver detalles"
                      >
                        <svg
                          className="w-5 h-5"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                          />
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                          />
                        </svg>
                      </button>
                      <button
                        className="p-2 text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                        title="Editar"
                      >
                        <svg
                          className="w-5 h-5"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                          />
                        </svg>
                      </button>
                      <button
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Eliminar"
                      >
                        <svg
                          className="w-5 h-5"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                          />
                        </svg>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Paginación */}
        <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
          <p className="text-sm text-gray-600">
            Mostrando <span className="font-medium">1</span> a{" "}
            <span className="font-medium">{participantesFiltrados.length}</span>{" "}
            de <span className="font-medium">{participantes.length}</span>{" "}
            participantes
          </p>
          <div className="flex gap-2">
            <button
              className="px-3 py-1 border border-gray-300 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-50"
              disabled
            >
              Anterior
            </button>
            <button
              className="px-3 py-1 border border-gray-300 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-50"
              disabled
            >
              Siguiente
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
