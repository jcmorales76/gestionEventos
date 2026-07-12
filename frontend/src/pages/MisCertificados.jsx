import { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import { toast } from "react-hot-toast";
import ModalResponderEncuesta from "../components/ModalResponderEncuesta";

export default function MisCertificados() {
  const { user } = useAuth();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [generando, setGenerando] = useState(null); // inscripcion_id en curso
  const [encuestaEventoId, setEncuestaEventoId] = useState(null);

  useEffect(() => {
    if (user?.id) fetchItems();
  }, [user]);

  const fetchItems = async () => {
    setLoading(true);
    try {
      const res = await fetch(
        `/api/certificados/mis/${user.id}`,
      );
      if (res.ok) setItems(await res.json());
    } catch (error) {
      toast.error("Error al cargar certificados");
    } finally {
      setLoading(false);
    }
  };

  const abrirPdf = (url) => window.open(`${url}`, "_blank");

  const handleDescargar = (item) => {
    abrirPdf(item.url_pdf);
    toast.success(`📥 Descargando certificado de ${item.evento_nombre}`);
  };

  const handleObtener = async (item) => {
    setGenerando(item.inscripcion_id);
    try {
      const res = await fetch(
        `/api/certificados/participante/generar/${item.inscripcion_id}`,
        { method: "POST" },
      );
      const data = await res.json();
      if (res.ok) {
        toast.success("🎓 Certificado generado");
        abrirPdf(data.url);
        fetchItems();
      } else {
        toast.error(data.message || "No se pudo generar el certificado");
      }
    } catch (error) {
      toast.error("Error de conexión");
    } finally {
      setGenerando(null);
    }
  };

  const estaFinalizado = (item) =>
    !item.fecha_fin || new Date(item.fecha_fin) <= new Date();

  const disponibles = items.filter(
    (i) =>
      estaFinalizado(i) && (!i.requiere_encuesta || i.encuesta_respondida),
  ).length;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
        <span className="ml-3 text-gray-600">Cargando certificados...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Mis Certificados</h1>
        <p className="text-gray-600 mt-1">
          Obtén y descarga los certificados de tus eventos finalizados.
        </p>
      </div>

      {/* Estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-gradient-to-br from-green-50 to-emerald-100 rounded-xl p-6 border border-green-200">
          <p className="text-sm text-green-700 font-medium">Disponibles</p>
          <p className="text-3xl font-bold text-green-900 mt-1">{disponibles}</p>
        </div>
        <div className="bg-gradient-to-br from-blue-50 to-indigo-100 rounded-xl p-6 border border-blue-200">
          <p className="text-sm text-blue-700 font-medium">Eventos inscritos</p>
          <p className="text-3xl font-bold text-blue-900 mt-1">{items.length}</p>
        </div>
        <div className="bg-gradient-to-br from-purple-50 to-pink-100 rounded-xl p-6 border border-purple-200">
          <p className="text-sm text-purple-700 font-medium">Horas académicas</p>
          <p className="text-3xl font-bold text-purple-900 mt-1">
            {items.reduce((acc, i) => acc + (i.horas_academicas || 0), 0)}
          </p>
        </div>
      </div>

      {items.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm p-12 border border-gray-100 text-center">
          <div className="text-6xl mb-4">📜</div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            Aún no tienes certificados
          </h3>
          <p className="text-gray-600">
            Los certificados aparecen aquí cuando finalizan tus eventos.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {items.map((item) => (
            <div
              key={item.inscripcion_id}
              className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-lg transition-shadow"
            >
              <div className="bg-gradient-to-r from-red-50 to-orange-50 px-6 py-4 border-b border-gray-200">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-red-100 flex items-center justify-center">
                    <span className="text-2xl">🎓</span>
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-bold text-gray-900 truncate">
                      {item.evento_nombre}
                    </h3>
                    <p className="text-sm text-gray-600">{item.tipo}</p>
                  </div>
                </div>
              </div>

              <div className="p-6">
                <div className="space-y-2 text-sm text-gray-600">
                  <p>
                    📅 Finaliza:{" "}
                    {item.fecha_fin
                      ? new Date(item.fecha_fin).toLocaleDateString("es-ES")
                      : "—"}
                  </p>
                  <p>⏱️ {item.horas_academicas || 0} horas académicas</p>
                </div>

                {/* Estado / acciones */}
                <div className="mt-6">
                  {!estaFinalizado(item) ? (
                    <div className="px-4 py-3 rounded-lg bg-gray-100 text-gray-500 text-sm text-center">
                      🔒 Disponible al finalizar el evento (
                      {new Date(item.fecha_fin).toLocaleDateString("es-ES")})
                    </div>
                  ) : item.requiere_encuesta && !item.encuesta_respondida ? (
                    <div className="space-y-2">
                      <div className="px-3 py-2 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 text-xs text-center">
                        📝 Responde la encuesta de satisfacción para desbloquear
                        tu certificado.
                      </div>
                      <button
                        onClick={() => setEncuestaEventoId(item.evento_id)}
                        className="w-full px-4 py-2 rounded-lg font-semibold text-white bg-amber-500 hover:bg-amber-600 transition-colors"
                      >
                        Responder encuesta
                      </button>
                    </div>
                  ) : item.tiene_certificado ? (
                    <button
                      onClick={() => handleDescargar(item)}
                      className="w-full btn-primary flex items-center justify-center gap-2"
                    >
                      ⬇️ Descargar Certificado PDF
                    </button>
                  ) : item.tiene_plantilla ? (
                    <button
                      onClick={() => handleObtener(item)}
                      disabled={generando === item.inscripcion_id}
                      className="w-full btn-primary flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                      {generando === item.inscripcion_id
                        ? "Generando..."
                        : "🎓 Obtener Certificado"}
                    </button>
                  ) : (
                    <div className="px-4 py-3 rounded-lg bg-gray-100 text-gray-500 text-xs text-center">
                      El certificado aún no está disponible (el organizador no ha
                      configurado la plantilla).
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {encuestaEventoId && (
        <ModalResponderEncuesta
          eventoId={encuestaEventoId}
          usuarioId={user.id}
          onClose={() => setEncuestaEventoId(null)}
          onCompletada={fetchItems}
        />
      )}
    </div>
  );
}
