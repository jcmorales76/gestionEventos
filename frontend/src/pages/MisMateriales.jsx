import { useState, useEffect, useMemo } from "react";
import { useAuth } from "../contexts/AuthContext";
import { toast } from "react-hot-toast";

export default function MisMateriales() {
  const { user } = useAuth();
  const [materiales, setMateriales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [eventoActivo, setEventoActivo] = useState(null); // evento_id o null

  useEffect(() => {
    if (user?.id) fetchMateriales();
  }, [user]);

  const fetchMateriales = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/participantes/${user.id}/materiales`);
      if (res.ok) setMateriales(await res.json());
    } catch (error) {
      console.error(error);
      toast.error("Error al cargar materiales");
    } finally {
      setLoading(false);
    }
  };

  // Agrupar por evento
  const eventos = useMemo(() => {
    const mapa = new Map();
    for (const m of materiales) {
      if (!mapa.has(m.evento_id)) {
        mapa.set(m.evento_id, {
          evento_id: m.evento_id,
          evento_nombre: m.evento_nombre,
          items: [],
        });
      }
      mapa.get(m.evento_id).items.push(m);
    }
    return Array.from(mapa.values());
  }, [materiales]);

  const eventoSel = eventos.find((e) => e.evento_id === eventoActivo);

  // Materiales del evento seleccionado, agrupados por sesión
  const sesiones = useMemo(() => {
    if (!eventoSel) return [];
    const mapa = new Map();
    for (const m of eventoSel.items) {
      const key = m.sesion || "General";
      if (!mapa.has(key)) mapa.set(key, []);
      mapa.get(key).push(m);
    }
    return Array.from(mapa.entries()).map(([sesion, items]) => ({
      sesion,
      items,
    }));
  }, [eventoSel]);

  const formatoTamano = (bytes) => {
    if (!bytes) return "—";
    const kb = bytes / 1024;
    if (kb < 1024) return `${kb.toFixed(0)} KB`;
    return `${(kb / 1024).toFixed(1)} MB`;
  };

  const iconoTipo = (nombre) => {
    const ext = (nombre || "").split(".").pop().toLowerCase();
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
    f ? new Date(f).toLocaleDateString("es-ES") : "";

  const descargar = async (mat) => {
    // Registra la descarga para las estadísticas (no bloquea si falla)
    try {
      await fetch("/api/descargas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tipo: "material", referenciaId: mat.id }),
      });
    } catch (error) {
      /* silencioso */
    }
    window.open(mat.url_descarga, "_blank");
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
      <div className="surface p-6">
        {/* Encabezado / breadcrumb */}
        <div className="flex items-center gap-2 mb-2 text-sm">
          <button
            onClick={() => setEventoActivo(null)}
            className={`font-semibold ${
              eventoSel
                ? "text-red-600 hover:text-red-700"
                : "text-gray-900 cursor-default"
            }`}
          >
            📁 Mis Materiales
          </button>
          {eventoSel && (
            <>
              <span className="text-gray-400">/</span>
              <span className="text-gray-700 truncate">
                {eventoSel.evento_nombre}
              </span>
            </>
          )}
        </div>
        <p className="text-sm text-gray-600 mb-6">
          {eventoSel
            ? "Archivos del evento, organizados por sesión."
            : "Selecciona un evento para ver sus materiales."}
        </p>

        {/* Vacío */}
        {eventos.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-5xl mb-3">📁</div>
            <p className="text-gray-600">
              Aún no hay materiales disponibles para tus eventos.
            </p>
          </div>
        ) : !eventoSel ? (
          /* NIVEL 1: carpetas por evento */
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {eventos.map((ev) => (
              <button
                key={ev.evento_id}
                onClick={() => setEventoActivo(ev.evento_id)}
                className="flex items-center gap-4 p-4 border border-gray-200 rounded-xl hover:border-red-300 hover:bg-red-50/40 transition-colors text-left"
              >
                <div className="w-12 h-12 rounded-lg bg-red-50 flex items-center justify-center text-2xl flex-shrink-0">
                  📁
                </div>
                <div className="min-w-0">
                  <p className="font-semibold text-gray-900 truncate">
                    {ev.evento_nombre}
                  </p>
                  <p className="text-xs text-gray-500">
                    {ev.items.length} archivo{ev.items.length !== 1 ? "s" : ""}
                  </p>
                </div>
              </button>
            ))}
          </div>
        ) : (
          /* NIVEL 2: archivos del evento, agrupados por sesión */
          <div className="space-y-6">
            <button
              onClick={() => setEventoActivo(null)}
              className="btn-secondary text-sm"
            >
              ← Volver a eventos
            </button>

            {sesiones.map((grupo) => (
              <div key={grupo.sesion}>
                <h3 className="text-sm font-bold text-gray-700 mb-2 flex items-center gap-2">
                  <span>🗂️</span> {grupo.sesion}
                </h3>
                <div className="space-y-3">
                  {grupo.items.map((mat) => (
                    <div
                      key={mat.id}
                      className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-center gap-4 flex-1 min-w-0">
                        <div className="w-12 h-12 rounded-lg flex items-center justify-center text-2xl flex-shrink-0 bg-gray-100">
                          {iconoTipo(mat.nombre_original)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-semibold text-gray-900 text-sm truncate">
                            {mat.nombre_original}
                          </h4>
                          <p className="text-xs text-gray-500">
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
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
