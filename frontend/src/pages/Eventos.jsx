import { useState, useEffect } from "react";
import { toast } from "react-hot-toast"; // Importar toast para notificaciones
import ModalNuevoEvento from "../components/modals/ModalNuevoEvento";
import ModalDetalleEvento from "../components/modals/ModalDetalleEvento";

export default function Eventos() {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterTipo, setFilterTipo] = useState("Todos");
  const [filterEstado, setFilterEstado] = useState("Todos");
  const [eventos, setEventos] = useState([]);
  const [loading, setLoading] = useState(true);

  // Estados para modales
  const [modalNuevoOpen, setModalNuevoOpen] = useState(false);
  const [modalDetalleOpen, setModalDetalleOpen] = useState(false);
  const [eventoSeleccionado, setEventoSeleccionado] = useState(null);

  // Cargar eventos al montar el componente
  useEffect(() => {
    fetchEventos();
  }, []);

  const fetchEventos = async () => {
    try {
      setLoading(true);
      const response = await fetch("http://localhost:5000/api/eventos");

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      // Transformar datos de la BD al formato visual del frontend
      const eventosFormateados = data.map((evento) => ({
        id: evento.id,
        nombre: evento.nombre,
        tipo: evento.tipo || "Curso",
        fecha: formatoFecha(evento.fecha_inicio),
        lugar: evento.lugar || "Por definir",
        expositor: evento.expositor || "Por definir",
        inscritos: evento.inscritos || 0,
        capacidad: evento.capacidad || 0,
        estado: evento.estado || "Próximo",
        color: getColorClass(evento.color),
        bgBadge: getBgBadgeClass(evento.tipo),
        barColor: getColorClass(evento.color),
        // Datos completos para el modal
        descripcion: evento.descripcion,
        fecha_inicio: evento.fecha_inicio,
        fecha_fin: evento.fecha_fin,
        hora_inicio: evento.hora_inicio,
        horas_academicas: evento.horas_academicas,
        instructor: evento.instructor,
        colorHex: evento.color,
      }));

      setEventos(eventosFormateados);
    } catch (error) {
      console.error("Error cargando eventos:", error);
      // Si falla la API, no mostramos nada o podrías usar datos de prueba
      setEventos([]);
    } finally {
      setLoading(false);
    }
  };

  // --- Funciones Auxiliares ---

  const formatoFecha = (fechaString) => {
    if (!fechaString) return "Por definir";
    const fecha = new Date(fechaString);
    return fecha.toLocaleDateString("es-ES", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const getColorClass = (color) => {
    const colorMap = {
      "#9333ea": "border-purple-500",
      "#dc2626": "border-red-500",
      "#1e3a8a": "border-blue-900",
      "#f97316": "border-orange-500",
      "#22c55e": "border-green-500",
      "#14b8a6": "border-teal-500",
    };
    return colorMap[color] || "border-red-500";
  };

  const getBgBadgeClass = (tipo) => {
    const map = {
      Curso: "bg-purple-100 text-purple-700",
      Seminario: "bg-red-100 text-red-700",
      Taller: "bg-blue-100 text-blue-700",
      Congreso: "bg-orange-100 text-orange-700",
      "Programa de Alta Dirección": "bg-green-100 text-green-700",
    };
    return map[tipo] || "bg-gray-100 text-gray-700";
  };

  const getEstadoBadge = (estado) => {
    switch (estado) {
      case "Activo":
        return "badge-success";
      case "Próximo":
        return "badge-warning";
      case "Finalizado":
        return "badge-info";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  // --- Filtros ---
  const eventosFiltrados = eventos.filter((evento) => {
    const matchSearch =
      evento.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (evento.expositor &&
        evento.expositor.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchTipo = filterTipo === "Todos" || evento.tipo === filterTipo;
    const matchEstado =
      filterEstado === "Todos" || evento.estado === filterEstado;
    return matchSearch && matchTipo && matchEstado;
  });

  // --- Handlers ---

  const handleVerDetalle = (evento) => {
    setEventoSeleccionado(evento);
    setModalDetalleOpen(true);
  };

  // CREAR EVENTO
  const handleNuevoEvento = async (data) => {
    try {
      const payload = {
        nombre: data.nombre,
        tipo: data.tipo,
        estado: data.estado,
        descripcion: data.descripcion || "",
        fecha_inicio: data.fechaInicio || null,
        fecha_fin: data.fechaFin || null,
        hora_inicio: data.horaInicio || null,
        capacidad: parseInt(data.capacidad) || 0,
        lugar: data.lugar || "",
        expositor: data.expositor || "",
        color: data.color || "#dc2626",
        horas_academicas: parseInt(data.horas) || 0,
        instructor: data.instructor || "",
      };

      const response = await fetch("http://localhost:5000/api/eventos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        // 1. Cerrar modal inmediatamente
        setModalNuevoOpen(false);

        // 2. Mostrar notificación bonita
        toast.success("✅ Evento creado exitosamente");

        // 3. Recargar la lista de eventos
        await fetchEventos();
      } else {
        toast.error(" Error al crear el evento");
      }
    } catch (error) {
      console.error("Error de conexión:", error);
      toast.error("Error de conexión con el servidor");
    }
  };

  // ELIMINAR EVENTO
  const handleEliminar = async (id) => {
    if (
      !window.confirm(
        "¿Estás seguro de eliminar este evento? Esta acción no se puede deshacer.",
      )
    )
      return;

    try {
      const response = await fetch(`http://localhost:5000/api/eventos/${id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        toast.success("Evento eliminado correctamente");
        setEventos(eventos.filter((e) => e.id !== id)); // Actualizar UI localmente
      } else {
        toast.error("Error al eliminar el evento");
      }
    } catch (error) {
      toast.error("Error de conexión al eliminar");
    }
  };

  // --- Renderizado ---

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
        <span className="ml-3 text-gray-600 font-medium">
          Cargando eventos...
        </span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Eventos</h1>
          <p className="text-gray-600 mt-1">
            Crea y administra cursos, seminarios, talleres y más
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
                d="M4 6h16M4 10h16M4 14h16M4 18h16"
              />
            </svg>
            Vista Lista
          </button>
          <button
            className="btn-primary"
            onClick={() => setModalNuevoOpen(true)}
          >
            + Nuevo Evento
          </button>
        </div>
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
              placeholder="Buscar evento..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all outline-none"
            />
          </div>
          <select
            value={filterTipo}
            onChange={(e) => setFilterTipo(e.target.value)}
            className="input-field md:w-48"
          >
            <option>Todos los tipos</option>
            <option>Curso</option>
            <option>Seminario</option>
            <option>Taller</option>
            <option>Congreso</option>
            <option>Programa de Alta Dirección</option>
          </select>
          <select
            value={filterEstado}
            onChange={(e) => setFilterEstado(e.target.value)}
            className="input-field md:w-48"
          >
            <option>Todos los estados</option>
            <option>Activo</option>
            <option>Próximo</option>
            <option>Finalizado</option>
          </select>
        </div>
      </div>

      {/* Grid de Tarjetas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {eventosFiltrados.map((evento) => (
          <div
            key={evento.id}
            className={`bg-white rounded-xl shadow-sm border-t-4 ${evento.color} hover:shadow-lg transition-all duration-300 overflow-hidden group`}
          >
            <div className="p-6">
              <div className="mb-4">
                <span
                  className={`inline-block px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide ${evento.bgBadge}`}
                >
                  {evento.tipo}
                </span>
              </div>

              <h3 className="text-xl font-bold text-gray-900 mb-4 group-hover:text-red-600 transition-colors">
                {evento.nombre}
              </h3>

              <div className="space-y-3 mb-6">
                <div className="flex items-center gap-3 text-gray-600">
                  <svg
                    className="w-5 h-5 text-red-500 flex-shrink-0"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                    />
                  </svg>
                  <span className="text-sm">{evento.fecha}</span>
                </div>
                <div className="flex items-center gap-3 text-gray-600">
                  <svg
                    className="w-5 h-5 text-red-500 flex-shrink-0"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                  </svg>
                  <span className="text-sm">{evento.lugar}</span>
                </div>
                <div className="flex items-center gap-3 text-gray-600">
                  <svg
                    className="w-5 h-5 text-red-500 flex-shrink-0"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                    />
                  </svg>
                  <span className="text-sm">{evento.expositor}</span>
                </div>
              </div>

              <div className="mb-4">
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-gray-600">Ocupación</span>
                  <span className="font-semibold text-gray-900">
                    {evento.inscritos}/{evento.capacidad}
                  </span>
                </div>
                <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className={`h-full ${evento.barColor} rounded-full transition-all duration-500`}
                    style={{
                      width: `${evento.capacidad > 0 ? (evento.inscritos / evento.capacidad) * 100 : 0}%`,
                    }}
                  />
                </div>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                <span
                  className={`px-3 py-1 rounded-full text-xs font-semibold ${getEstadoBadge(evento.estado)}`}
                >
                  {evento.estado}
                </span>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleVerDetalle(evento)}
                    className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
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
                    onClick={() => handleVerDetalle(evento)}
                    className="p-2 text-gray-500 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
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
                    onClick={() => handleEliminar(evento.id)}
                    className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
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
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Mensaje si no hay resultados */}
      {eventosFiltrados.length === 0 && (
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
            No se encontraron eventos
          </h3>
          <p className="text-gray-600">
            Intenta cambiar los filtros de búsqueda o crea un nuevo evento
          </p>
        </div>
      )}

      {/* MODALES INTEGRADOS */}
      <ModalNuevoEvento
        isOpen={modalNuevoOpen}
        onClose={() => setModalNuevoOpen(false)}
        onSave={handleNuevoEvento}
      />
      <ModalDetalleEvento
        isOpen={modalDetalleOpen}
        onClose={() => setModalDetalleOpen(false)}
        evento={eventoSeleccionado}
      />
    </div>
  );
}
