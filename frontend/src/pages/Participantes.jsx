import { useState, useEffect } from "react";
import { toast } from "react-hot-toast";
import ModalNuevoParticipante from "../components/modals/ModalNuevoParticipante";

export default function Participantes() {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterEvento, setFilterEvento] = useState("Todos");
  const [filterEstado, setFilterEstado] = useState("Todos");
  const [participantes, setParticipantes] = useState([]);
  const [loading, setLoading] = useState(true);

  // Estado para el modal
  const [modalParticipanteOpen, setModalParticipanteOpen] = useState(false);

  // Cargar participantes
  useEffect(() => {
    fetchParticipantes();
  }, []);

  const fetchParticipantes = async () => {
    try {
      setLoading(true);
      const response = await fetch("http://localhost:5000/api/participantes");
      if (!response.ok) throw new Error("Error al cargar participantes");

      const data = await response.json();

      // Formatear datos para la tabla
      const participantesFormateados = data.map((p) => ({
        id: p.id,
        nombre: p.nombre,
        apellido: p.apellido,
        email: p.email,
        dni: p.dni,
        telefono: p.telefono,
        evento: p.evento || "Sin evento",
        fechaInscripcion: new Date(p.fecha_creacion).toLocaleDateString(
          "es-ES",
        ),
        estado: p.estado,
        certificado: false, // Placeholder para futura implementación
        materiales: 0, // Placeholder
        avatar: (
          p.nombre.charAt(0) + (p.apellido?.charAt(0) || "")
        ).toUpperCase(),
      }));

      setParticipantes(participantesFormateados);
    } catch (error) {
      console.error(error);
      toast.error("Error al cargar participantes");
    } finally {
      setLoading(false);
    }
  };

  const participantesFiltrados = participantes.filter((part) => {
    const fullName = `${part.nombre} ${part.apellido}`.toLowerCase();
    const matchSearch =
      fullName.includes(searchTerm.toLowerCase()) ||
      part.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (part.dni && part.dni.includes(searchTerm));
    const matchEvento =
      filterEvento === "Todos" || part.evento === filterEvento;
    const matchEstado =
      filterEstado === "Todos" || part.estado === filterEstado;
    return matchSearch && matchEvento && matchEstado;
  });

  // Crear participante
  const handleNuevoParticipante = async (data) => {
    try {
      const payload = {
        nombre: data.nombre,
        apellido: data.apellido,
        email: data.email,
        dni: data.dni,
        telefono: data.telefono,
        estado: data.estado,
        evento: data.evento, // El nombre del evento seleccionado
      };

      const response = await fetch("http://localhost:5000/api/participantes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        setModalParticipanteOpen(false);
        toast.success("✅ Participante registrado exitosamente");
        fetchParticipantes(); // Recargar lista
      } else {
        const error = await response.json();
        toast.error(error.message || "Error al guardar participante");
      }
    } catch (error) {
      toast.error("Error de conexión");
    }
  };

  // Eliminar
  const handleEliminar = async (id) => {
    if (!window.confirm("¿Eliminar este participante?")) return;
    try {
      const response = await fetch(
        `http://localhost:5000/api/participantes/${id}`,
        {
          method: "DELETE",
        },
      );
      if (response.ok) {
        toast.success("Participante eliminado");
        setParticipantes(participantes.filter((p) => p.id !== id));
      } else {
        toast.error("Error al eliminar");
      }
    } catch (error) {
      toast.error("Error de conexión");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
        <span className="ml-3 text-gray-600">Cargando participantes...</span>
      </div>
    );
  }

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
          <button className="btn-secondary">📥 Importar CSV</button>
          <button
            onClick={() => setModalParticipanteOpen(true)}
            className="btn-primary"
          >
            + Nuevo Participante
          </button>
        </div>
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
            value={filterEvento}
            onChange={(e) => setFilterEvento(e.target.value)}
            className="input-field md:w-64"
          >
            <option>Todos los eventos</option>
            {/* Podrías cargar eventos dinámicamente aquí si quisieras */}
            <option>Sin evento</option>
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
                <th className="table-th">Participante</th>
                <th className="table-th">Correo</th>
                <th className="table-th">Evento</th>
                <th className="table-th">Inscrito</th>
                <th className="table-th">Estado</th>
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
                        <p className="font-medium text-gray-900 text-sm">
                          {part.nombre} {part.apellido}
                        </p>
                        <p className="text-xs text-gray-500">
                          DNI: {part.dni || "-"}
                        </p>
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
                    <span className="text-sm text-gray-600">
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
                    <div className="flex items-center gap-2">
                      <button className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                        ️
                      </button>
                      <button className="p-2 text-purple-600 hover:bg-purple-50 rounded-lg transition-colors">
                        ✏️
                      </button>
                      <button
                        onClick={() => handleEliminar(part.id)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      >
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

      {/* Modal */}
      <ModalNuevoParticipante
        isOpen={modalParticipanteOpen}
        onClose={() => setModalParticipanteOpen(false)}
        onSave={handleNuevoParticipante}
      />
    </div>
  );
}
