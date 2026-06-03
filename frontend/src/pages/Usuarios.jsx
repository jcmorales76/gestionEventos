import { useState } from "react";
import ModalNuevoUsuario from "../components/modals/ModalNuevoUsuario";

export default function Usuarios() {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterRol, setFilterRol] = useState("Todos");
  const [filterEstado, setFilterEstado] = useState("Todos");

  // Estado para el modal
  const [modalUsuarioOpen, setModalUsuarioOpen] = useState(false);

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
        <button
          onClick={() => setModalUsuarioOpen(true)}
          className="btn-primary"
        >
          + Nuevo Usuario
        </button>
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
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
                <th className="table-th">Correo</th>
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
                    <span className="text-sm text-gray-900">{user.email}</span>
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
                      <button className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                        👁️
                      </button>
                      <button className="p-2 text-purple-600 hover:bg-purple-50 rounded-lg transition-colors">
                        ✏️
                      </button>
                      <button className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                        🗑️
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL INTEGRADO */}
      <ModalNuevoUsuario
        isOpen={modalUsuarioOpen}
        onClose={() => setModalUsuarioOpen(false)}
        onSave={(data) => {
          console.log("Usuario guardado:", data);
          setModalUsuarioOpen(false);
        }}
      />
    </div>
  );
}
