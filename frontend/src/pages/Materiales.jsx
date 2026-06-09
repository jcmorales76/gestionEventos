import { useState, useEffect } from "react";
import { toast } from "react-hot-toast";
import ModalSubirMaterial from "../components/modals/ModalSubirMaterial";
import ModalNuevaSesion from "../components/modals/ModalNuevaSesion";
import ModalConfirmacionPersonalizada from "../components/ModalConfirmacionPersonalizada";

export default function Materiales() {
  const [eventos, setEventos] = useState([]);
  const [eventoSeleccionado, setEventoSeleccionado] = useState(null);
  const [materialesPorSesion, setMaterialesPorSesion] = useState({});
  const [sesiones, setSesiones] = useState([]);
  const [loading, setLoading] = useState(false);

  // ✅ Nuevo estado para controlar qué sesiones están expandidas
  const [sesionesExpandidas, setSesionesExpandidas] = useState({});

  const [modalSubirOpen, setModalSubirOpen] = useState(false);
  const [modalSesionOpen, setModalSesionOpen] = useState(false);
  const [modalEliminarOpen, setModalEliminarOpen] = useState(false);
  const [materialAEliminar, setMaterialAEliminar] = useState(null);
  const [sesionPreseleccionada, setSesionPreseleccionada] = useState("");

  useEffect(() => {
    fetchEventos();
  }, []);

  useEffect(() => {
    if (eventoSeleccionado) {
      fetchMateriales();
      fetchSesiones();
    }
  }, [eventoSeleccionado]);

  const fetchEventos = async () => {
    try {
      const res = await fetch("http://localhost:5000/api/eventos");
      const data = await res.json();
      setEventos(data);
    } catch (error) {
      toast.error("Error al cargar eventos");
    }
  };

  const fetchMateriales = async () => {
    if (!eventoSeleccionado) return;
    setLoading(true);
    try {
      const res = await fetch(
        `http://localhost:5000/api/materiales/evento/${eventoSeleccionado}`,
      );
      const data = await res.json();
      setMaterialesPorSesion(data);
    } catch (error) {
      toast.error("Error al cargar materiales");
    } finally {
      setLoading(false);
    }
  };

  const fetchSesiones = async () => {
    if (!eventoSeleccionado) return;
    try {
      const res = await fetch(
        `http://localhost:5000/api/materiales/evento/${eventoSeleccionado}/sesiones`,
      );
      const data = await res.json();
      setSesiones(data);
    } catch (error) {
      console.error("Error al cargar sesiones:", error);
    }
  };

  const handleEliminarClick = (material) => {
    setMaterialAEliminar(material);
    setModalEliminarOpen(true);
  };

  const handleConfirmarEliminar = async () => {
    if (!materialAEliminar) return;

    try {
      const res = await fetch(
        `http://localhost:5000/api/materiales/${materialAEliminar.id}`,
        {
          method: "DELETE",
        },
      );

      if (res.ok) {
        toast.success("✅ Material eliminado");
        fetchMateriales();
      } else {
        toast.error("Error al eliminar");
      }
    } catch (error) {
      toast.error("Error de conexión");
    }
  };

  const handleSubirMaterial = (sesion = "") => {
    setSesionPreseleccionada(sesion);
    setModalSubirOpen(true);
  };

  const handleSesionCreada = () => {
    fetchSesiones();
    fetchMateriales();
  };

  // ✅ Función para alternar la expansión de una sesión
  const toggleSesion = (sesion) => {
    setSesionesExpandidas((prev) => ({
      ...prev,
      [sesion]: !prev[sesion],
    }));
  };

  const getFileIcon = (tipo) => {
    if (!tipo) return "📄";
    if (tipo.includes("pdf")) return "📕";
    if (tipo.includes("word") || tipo.includes("document")) return "📘";
    if (tipo.includes("excel") || tipo.includes("spreadsheet")) return "";
    if (tipo.includes("powerpoint") || tipo.includes("presentation")) return "";
    if (tipo.includes("video")) return "🎥";
    if (tipo.includes("image")) return "🖼️";
    if (tipo.includes("zip") || tipo.includes("rar")) return "🗜️";
    return "";
  };

  const formatFileSize = (bytes) => {
    if (!bytes || bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i];
  };

  const totalMateriales = Object.values(materialesPorSesion)
    .flat()
    .filter((m) => m.nombre_original).length;
  const totalSesiones = Object.keys(materialesPorSesion).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Materiales</h1>
          <p className="text-gray-600 mt-1">
            Gestiona archivos y recursos por evento y sesión
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => setModalSesionOpen(true)}
            disabled={!eventoSeleccionado}
            className="btn-secondary disabled:opacity-50 disabled:cursor-not-allowed"
          >
            📁 Nueva Sesión
          </button>
          <button
            onClick={() => handleSubirMaterial()}
            disabled={!eventoSeleccionado}
            className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
          >
            📤 Subir Material
          </button>
        </div>
      </div>

      {/* Selector de Evento */}
      <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100">
        <div className="flex flex-col md:flex-row gap-4 items-end">
          <div className="flex-1">
            <label className="label-input">Seleccionar Evento *</label>
            <select
              value={eventoSeleccionado || ""}
              onChange={(e) =>
                setEventoSeleccionado(
                  e.target.value ? parseInt(e.target.value) : null,
                )
              }
              className="input-field"
            >
              <option value="">-- Seleccionar evento --</option>
              {eventos.map((evento) => (
                <option key={evento.id} value={evento.id}>
                  {evento.nombre} ({evento.tipo})
                </option>
              ))}
            </select>
          </div>
          {eventoSeleccionado && (
            <div className="flex gap-4 text-sm">
              <div className="bg-blue-50 px-4 py-2 rounded-lg">
                <span className="text-blue-600 font-semibold">
                  {totalSesiones}
                </span>
                <span className="text-blue-700 ml-1">Sesiones</span>
              </div>
              <div className="bg-green-50 px-4 py-2 rounded-lg">
                <span className="text-green-600 font-semibold">
                  {totalMateriales}
                </span>
                <span className="text-green-700 ml-1">Archivos</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Contenido */}
      {!eventoSeleccionado ? (
        <div className="bg-white rounded-xl shadow-sm p-12 border border-gray-100 text-center">
          <div className="text-6xl mb-4">📂</div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            Selecciona un evento
          </h3>
          <p className="text-gray-600">
            Elige un evento para ver y gestionar sus materiales
          </p>
        </div>
      ) : loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
          <span className="ml-3 text-gray-600">Cargando materiales...</span>
        </div>
      ) : totalSesiones === 0 ? (
        <div className="bg-white rounded-xl shadow-sm p-12 border border-gray-100 text-center">
          <div className="text-6xl mb-4">📁</div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            No hay sesiones creadas
          </h3>
          <p className="text-gray-600 mb-4">
            Crea la primera sesión para comenzar a subir materiales
          </p>
          <button
            onClick={() => setModalSesionOpen(true)}
            className="btn-primary"
          >
            📁 Crear Primera Sesión
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {Object.entries(materialesPorSesion).map(([sesion, materiales]) => {
            const archivosValidos = materiales.filter((m) => m.nombre_original);
            const estaExpandida = sesionesExpandidas[sesion];

            return (
              <div
                key={sesion}
                className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden"
              >
                {/* ✅ Header de Sesión - CLICABLE para expandir/colapsar */}
                <button
                  onClick={() => toggleSesion(sesion)}
                  className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors text-left"
                >
                  <div className="flex items-center gap-3 flex-1">
                    <div className="w-10 h-10 rounded-lg bg-red-100 flex items-center justify-center">
                      <span className="text-xl">📁</span>
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-900">{sesion}</h3>
                      <p className="text-sm text-gray-600">
                        {archivosValidos.length}{" "}
                        {archivosValidos.length === 1 ? "archivo" : "archivos"}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <button
                      onClick={(e) => {
                        e.stopPropagation(); // Evitar que se cierre la persiana al subir archivo
                        handleSubirMaterial(sesion);
                      }}
                      className="btn-primary text-sm px-4 py-2"
                    >
                      + Subir Archivo
                    </button>
                    {/* ✅ Flecha indicadora */}
                    <svg
                      className={`w-5 h-5 text-gray-500 transition-transform duration-200 ${estaExpandida ? "rotate-180" : ""}`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 9l-7 7-7-7"
                      />
                    </svg>
                  </div>
                </button>

                {/* ✅ Lista de Archivos - Solo visible si está expandida */}
                {estaExpandida && archivosValidos.length > 0 && (
                  <div className="border-t border-gray-100 bg-gray-50/50">
                    {archivosValidos.map((material) => (
                      <div
                        key={material.id}
                        className="px-6 py-4 pl-20 hover:bg-gray-100/50 transition-colors flex items-center justify-between"
                      >
                        <div className="flex items-center gap-4 flex-1 min-w-0">
                          <div className="text-3xl flex-shrink-0">
                            {getFileIcon(material.tipo_archivo)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-gray-900 truncate">
                              {material.nombre_original}
                            </p>
                            <div className="flex items-center gap-3 text-sm text-gray-500 mt-1">
                              <span>{formatFileSize(material.tamaño)}</span>
                              {material.descripcion && (
                                <>
                                  <span>•</span>
                                  <span className="truncate">
                                    {material.descripcion}
                                  </span>
                                </>
                              )}
                              <span>•</span>
                              <span>
                                {new Date(
                                  material.fecha_subida,
                                ).toLocaleDateString("es-ES")}
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 ml-4">
                          <a
                            href={`http://localhost:5000${material.url_descarga}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Descargar"
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
                                d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                              />
                            </svg>
                          </a>
                          <button
                            onClick={() => handleEliminarClick(material)}
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
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Modales */}
      <ModalSubirMaterial
        isOpen={modalSubirOpen}
        onClose={() => setModalSubirOpen(false)}
        eventoId={eventoSeleccionado}
        sesiones={sesiones}
        sesionPreseleccionada={sesionPreseleccionada}
        onUpload={fetchMateriales}
      />

      <ModalNuevaSesion
        isOpen={modalSesionOpen}
        onClose={() => setModalSesionOpen(false)}
        eventoId={eventoSeleccionado}
        onCrear={handleSesionCreada}
      />

      <ModalConfirmacionPersonalizada
        isOpen={modalEliminarOpen}
        onClose={() => {
          setModalEliminarOpen(false);
          setMaterialAEliminar(null);
        }}
        onConfirm={handleConfirmarEliminar}
        title="¿Eliminar material?"
        message={`¿Estás seguro de eliminar <strong>"${materialAEliminar?.nombre_original}"</strong>?<br/><br/><span style="color: #dc2626; font-weight: 600;">Esta acción no se puede deshacer.</span>`}
        confirmText="Eliminar"
        type="danger"
      />
    </div>
  );
}
