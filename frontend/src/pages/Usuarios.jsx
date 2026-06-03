import { useState } from "react";

export default function Usuarios() {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterRol, setFilterRol] = useState("Todos");
  const [filterEstado, setFilterEstado] = useState("Todos");

  const usuarios = [
    {
      id: 1,
      nombre: "Carlos",
      apellido: "Mendoza",
      email: "admin@fepcmac.com",
      rol: "Administrador",
      estado: "Activo",
      creado: "01 Ene 2026",
      ultimoAcceso: "Hace 5 min",
      avatar: "CM",
    },
    {
      id: 2,
      nombre: "Ana",
      apellido: "Torres",
      email: "ana.torres@email.com",
      rol: "Participante",
      estado: "Activo",
      creado: "15 May 2026",
      ultimoAcceso: "Hace 2 horas",
      avatar: "AT",
    },
    {
      id: 3,
      nombre: "Roberto",
      apellido: "Díaz",
      email: "roberto.diaz@email.com",
      rol: "Participante",
      estado: "Inactivo",
      creado: "10 May 2026",
      ultimoAcceso: "Hace 5 días",
      avatar: "RD",
    },
    {
      id: 4,
      nombre: "María",
      apellido: "González",
      email: "maria.gonzalez@email.com",
      rol: "Participante",
      estado: "Activo",
      creado: "20 May 2026",
      ultimoAcceso: "Ayer",
      avatar: "MG",
    },
    {
      id: 5,
      nombre: "Luis",
      apellido: "Fernández",
      email: "luis.fernandez@email.com",
      rol: "Administrador",
      estado: "Activo",
      creado: "02 Feb 2026",
      ultimoAcceso: "Hace 1 hora",
      avatar: "LF",
    },
  ];

  const usuariosFiltrados = usuarios.filter((user) => {
    const fullName = `${user.nombre} ${user.apellido}`.toLowerCase();
    const matchSearch =
      fullName.includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchRol = filterRol === "Todos" || user.rol === filterRol;
    const matchEstado =
      filterEstado === "Todos" || user.estado === filterEstado;
    return matchSearch && matchRol && matchEstado;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Gestión de Usuarios
          </h1>
          <p className="text-gray-600 mt-1">
            Administra administradores y participantes del sistema
          </p>
        </div>
        <button className="btn-primary">+ Nuevo Usuario</button>
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
              placeholder="Buscar por nombre o correo..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all outline-none text-sm"
            />
          </div>
          <select
            value={filterRol}
            onChange={(e) => setFilterRol(e.target.value)}
            className="input-field md:w-48"
          >
            <option>Todos los roles</option>
            <option>Administrador</option>
            <option>Participante</option>
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

      {/* Tabla */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="table-base">
            <thead className="table-header">
              <tr>
                <th className="table-th">Usuario</th>
                <th className="table-th">Rol</th>
                <th className="table-th">Estado</th>
                <th className="table-th">Creado</th>
                <th className="table-th">Último Acceso</th>
                <th className="table-th">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {usuariosFiltrados.map((user) => (
                <tr
                  key={user.id}
                  className="hover:bg-gray-50 transition-colors"
                >
                  <td className="table-td">
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold flex-shrink-0 ${user.rol === "Administrador" ? "bg-purple-100 text-purple-600" : "bg-red-100 text-red-600"}`}
                      >
                        {user.avatar}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900 text-sm">
                          {user.nombre} {user.apellido}
                        </p>
                        <p className="text-xs text-gray-500">{user.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="table-td">
                    <span
                      className={`badge ${user.rol === "Administrador" ? "bg-purple-100 text-purple-700" : "bg-blue-100 text-blue-700"}`}
                    >
                      {user.rol}
                    </span>
                  </td>
                  <td className="table-td">
                    <span
                      className={`badge ${user.estado === "Activo" ? "badge-success" : "badge-danger"}`}
                    >
                      {user.estado}
                    </span>
                  </td>
                  <td className="table-td">
                    <span className="text-sm text-gray-600">{user.creado}</span>
                  </td>
                  <td className="table-td">
                    <span className="text-sm text-gray-600">
                      {user.ultimoAcceso}
                    </span>
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
      </div>
    </div>
  );
}
