import { useState, useEffect } from "react";
import { toast } from "react-hot-toast";
import ModalNuevoUsuario from "../components/modals/ModalNuevoUsuario";
import ModalConfirmacionPersonalizada from "../components/ModalConfirmacionPersonalizada";

export default function Usuarios() {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterRol, setFilterRol] = useState("Todos");
  const [filterEstado, setFilterEstado] = useState("Todos");
  const [usuarios, setUsuarios] = useState([]);
  const [loading, setLoading] = useState(true);

  const [modalUsuarioOpen, setModalUsuarioOpen] = useState(false);
  const [modalEliminarOpen, setModalEliminarOpen] = useState(false);
  const [modalResetOpen, setModalResetOpen] = useState(false);
  const [usuarioSeleccionado, setUsuarioSeleccionado] = useState(null);
  const [usuarioAEliminar, setUsuarioAEliminar] = useState(null);
  const [usuarioAReset, setUsuarioAReset] = useState(null);

  useEffect(() => {
    fetchUsuarios();
  }, []);

  const fetchUsuarios = async () => {
    try {
      setLoading(true);
      const response = await fetch("http://localhost:5000/api/usuarios");
      if (!response.ok) throw new Error("Error al cargar usuarios");

      const data = await response.json();
      setUsuarios(data);
    } catch (error) {
      console.error(error);
      toast.error("Error al cargar usuarios");
    } finally {
      setLoading(false);
    }
  };

  const usuariosFiltrados = usuarios.filter((u) => {
    const fullName = `${u.nombre} ${u.apellido}`.toLowerCase();
    const matchSearch =
      fullName.includes(searchTerm.toLowerCase()) ||
      u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (u.dni && u.dni.includes(searchTerm));
    const matchRol = filterRol === "Todos" || u.rol === filterRol;
    const matchEstado = filterEstado === "Todos" || u.estado === filterEstado;
    return matchSearch && matchRol && matchEstado;
  });

  // Crear / Editar
  const handleGuardarUsuario = async (data) => {
    try {
      const url = data.id
        ? `http://localhost:5000/api/usuarios/${data.id}`
        : "http://localhost:5000/api/usuarios";

      const method = data.id ? "PUT" : "POST";

      const payload = {
        nombre: data.nombre,
        apellido: data.apellido,
        email: data.email,
        rol: data.rol,
        dni: data.dni,
        telefono: data.telefono,
        estado: data.estado,
      };

      // Solo enviar password si se proporcionó uno nuevo
      if (data.password) {
        payload.password = data.password;
      }

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        setModalUsuarioOpen(false);
        toast.success(
          data.id ? "✅ Usuario actualizado" : "✅ Usuario creado exitosamente",
        );
        fetchUsuarios();
      } else {
        const error = await response.json();
        toast.error(error.message || "Error al guardar");
      }
    } catch (error) {
      toast.error("Error de conexión");
    }
  };

  // Eliminar
  const handleEliminarClick = (usuario) => {
    setUsuarioAEliminar(usuario);
    setModalEliminarOpen(true);
  };

  const handleConfirmarEliminar = async () => {
    if (!usuarioAEliminar) return;

    try {
      const response = await fetch(
        `http://localhost:5000/api/usuarios/${usuarioAEliminar.id}`,
        {
          method: "DELETE",
        },
      );

      if (response.ok) {
        toast.success("✅ Usuario eliminado correctamente");
        setUsuarios(usuarios.filter((u) => u.id !== usuarioAEliminar.id));
      } else {
        toast.error("Error al eliminar");
      }
    } catch (error) {
      toast.error("Error de conexión");
    }
  };

  // Reset contraseña
  const handleResetPasswordClick = (usuario) => {
    setUsuarioAReset(usuario);
    setModalResetOpen(true);
  };

  const handleConfirmarReset = async () => {
    if (!usuarioAReset) return;

    try {
      const response = await fetch(
        `http://localhost:5000/api/usuarios/${usuarioAReset.id}/reset-password`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ newPassword: "123456" }),
        },
      );

      if (response.ok) {
        toast.success(`✅ Contraseña de ${usuarioAReset.nombre} reseteada`);
      } else {
        toast.error("Error al resetear contraseña");
      }
    } catch (error) {
      toast.error("Error de conexión");
    }
  };

  const getRolBadge = (rol) => {
    return rol === "admin"
      ? "bg-purple-100 text-purple-700"
      : "bg-blue-100 text-blue-700";
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
        <span className="ml-3 text-gray-600">Cargando usuarios...</span>
      </div>
    );
  }

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
          onClick={() => {
            setUsuarioSeleccionado(null);
            setModalUsuarioOpen(true);
          }}
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
              placeholder="Buscar por nombre, email o DNI..."
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
            <option>admin</option>
            <option>participante</option>
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
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                  Usuario
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                  Contacto
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                  Rol
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                  Estado
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                  Creado
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {usuariosFiltrados.map((u) => (
                <tr key={u.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center text-red-600 font-semibold flex-shrink-0">
                        {(
                          u.nombre.charAt(0) + (u.apellido?.charAt(0) || "")
                        ).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900 text-sm">
                          {u.nombre} {u.apellido}
                        </p>
                        <p className="text-xs text-gray-500">
                          DNI: {u.dni || "-"}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div>
                      <p className="text-sm text-gray-900">{u.email}</p>
                      <p className="text-xs text-gray-500">
                        {u.telefono || "-"}
                      </p>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-semibold ${getRolBadge(u.rol)}`}
                    >
                      {u.rol === "admin" ? "Administrador" : "Participante"}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        u.estado === "Activo"
                          ? "bg-green-100 text-green-700"
                          : "bg-gray-100 text-gray-700"
                      }`}
                    >
                      {u.estado}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {new Date(u.fecha_creacion).toLocaleDateString("es-ES")}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          setUsuarioSeleccionado(u);
                          setModalUsuarioOpen(true);
                        }}
                        className="p-2 text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                        title="Editar"
                      >
                        ✏️
                      </button>
                      <button
                        onClick={() => handleResetPasswordClick(u)}
                        className="p-2 text-orange-600 hover:bg-orange-50 rounded-lg transition-colors"
                        title="Resetear contraseña"
                      >
                        🔑
                      </button>
                      <button
                        onClick={() => handleEliminarClick(u)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Eliminar"
                      >
                        ️
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {usuariosFiltrados.length === 0 && (
        <div className="text-center py-12">
          <svg
            className="w-16 h-16 text-gray-400 mx-auto mb-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <h3 className="text-lg font-medium text-gray-900 mb-1">
            No se encontraron usuarios
          </h3>
          <p className="text-gray-600">
            Intenta cambiar los filtros o crea un nuevo usuario
          </p>
        </div>
      )}

      {/* Modales */}
      <ModalNuevoUsuario
        isOpen={modalUsuarioOpen}
        onClose={() => setModalUsuarioOpen(false)}
        usuario={usuarioSeleccionado}
        onSave={handleGuardarUsuario}
      />

      <ModalConfirmacionPersonalizada
        isOpen={modalEliminarOpen}
        onClose={() => {
          setModalEliminarOpen(false);
          setUsuarioAEliminar(null);
        }}
        onConfirm={handleConfirmarEliminar}
        title="¿Eliminar usuario?"
        message={`¿Estás seguro de eliminar a <strong>${usuarioAEliminar?.nombre} ${usuarioAEliminar?.apellido}</strong>?<br/><br/><span class="text-red-600 font-semibold">Esta acción no se puede deshacer.</span>`}
        confirmText="Eliminar"
        type="danger"
      />

      <ModalConfirmacionPersonalizada
        isOpen={modalResetOpen}
        onClose={() => {
          setModalResetOpen(false);
          setUsuarioAReset(null);
        }}
        onConfirm={handleConfirmarReset}
        title="¿Resetear contraseña?"
        message={`¿Estás seguro de resetear la contraseña de <strong>${usuarioAReset?.nombre} ${usuarioAReset?.apellido}</strong>?<br/><br/>Se establecerá temporalmente en <strong>"123456"</strong>`}
        confirmText="Resetear"
        type="warning"
      />
    </div>
  );
}
