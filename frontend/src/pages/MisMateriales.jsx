import { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import { toast } from "react-hot-toast";

export default function MisMateriales() {
  const { user } = useAuth();
  const [materiales, setMateriales] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.id) fetchMateriales();
  }, [user]);

  const fetchMateriales = async () => {
    setLoading(true);
    try {
      const res = await fetch(
        `http://localhost:5000/api/participantes/${user.id}/materiales`,
      );
      if (res.ok) setMateriales(await res.json());
    } catch (error) {
      console.error(error);
      toast.error("Error al cargar materiales");
    } finally {
      setLoading(false);
    }
  };

  const formatoTamano = (bytes) => {
    if (!bytes) return "—";
    const kb = bytes / 1024;
    if (kb < 1024) return `${kb.toFixed(0)} KB`;
    return `${(kb / 1024).toFixed(1)} MB`;
  };

  const extDe = (nombre) => (nombre || "").split(".").pop().toLowerCase();

  const iconoTipo = (nombre) => {
    const ext = extDe(nombre);
    if (ext === "pdf") return "📄";
    if (["ppt", "pptx"].includes(ext)) return "📊";
    if (["doc", "docx"].includes(ext)) return "📝";
    if (["xls", "xlsx"].includes(ext)) return "📈";
    if (["jpg", "jpeg", "png"].includes(ext)) return "🖼️";
    if (["mp4", "avi", "mov"].includes(ext)) return "🎬";
    if (["zip", "rar"].includes(ext)) return "🗜️";
    return "📎";
  };

  const formatoFecha = (f) =>
    f
      ? new Date(f).toLocaleDateString("es-ES", {
          day: "numeric",
          month: "short",
          year: "numeric",
        })
      : "";

  const descargar = (mat) => {
    window.open(`http://localhost:5000${mat.url_descarga}`, "_blank");
    toast.success(`📥 Descargando ${mat.nombre_original}`);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
        <span className="ml-3 text-gray-600">Cargando materiales...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
        <h2 className="text-xl font-bold text-gray-900 mb-2">Mis Materiales</h2>
        <p className="text-sm text-gray-600 mb-6">
          Accede a los documentos y recursos de tus cursos inscritos.
        </p>

        {materiales.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-5xl mb-3">📁</div>
            <p className="text-gray-600">
              Aún no hay materiales disponibles para tus eventos.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {materiales.map((mat) => (
              <div
                key={mat.id}
                className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-4 flex-1 min-w-0">
                  <div className="w-12 h-12 rounded-lg flex items-center justify-center text-2xl flex-shrink-0 bg-gray-100">
                    {iconoTipo(mat.nombre_original)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-900 text-sm truncate">
                      {mat.nombre_original}
                    </h3>
                    <p className="text-xs text-gray-500 truncate">
                      {mat.evento_nombre}
                      {mat.sesion ? ` • ${mat.sesion}` : ""} •{" "}
                      {formatoTamano(mat.tamaño)}
                      {mat.fecha_subida
                        ? ` • ${formatoFecha(mat.fecha_subida)}`
                        : ""}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => descargar(mat)}
                  className="ml-4 btn-primary text-sm flex-shrink-0"
                >
                  Descargar
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
