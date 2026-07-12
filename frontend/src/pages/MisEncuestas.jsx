import { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import { toast } from "react-hot-toast";
import ModalResponderEncuesta from "../components/ModalResponderEncuesta";

export default function MisEncuestas() {
  const { user } = useAuth();
  const [encuestas, setEncuestas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [eventoActivo, setEventoActivo] = useState(null);

  useEffect(() => {
    if (user?.id) fetchEncuestas();
  }, [user]);

  const fetchEncuestas = async () => {
    setLoading(true);
    try {
      const res = await fetch(
        `/api/encuestas/participante/${user.id}`,
      );
      if (res.ok) setEncuestas(await res.json());
    } catch (error) {
      toast.error("Error al cargar tus encuestas");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
        <span className="ml-3 text-gray-600">Cargando encuestas...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
        <h2 className="text-xl font-bold text-gray-900 mb-2">Mis Encuestas</h2>
        <p className="text-sm text-gray-600 mb-6">
          Responde las encuestas de satisfacción de tus eventos.
        </p>

        {encuestas.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-5xl mb-3">📝</div>
            <p className="text-gray-600">
              No tienes encuestas pendientes por ahora.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {encuestas.map((enc) => (
              <div
                key={enc.encuesta_id}
                className="flex flex-col md:flex-row md:items-center justify-between p-4 border border-gray-200 rounded-lg"
              >
                <div className="flex-1 mb-3 md:mb-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-semibold text-gray-900">
                      {enc.evento_nombre}
                    </h3>
                    {enc.respondida ? (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-green-100 text-green-700">
                        ✓ Respondida
                      </span>
                    ) : (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-amber-100 text-amber-700">
                        Pendiente
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-500 mt-1">{enc.titulo}</p>
                </div>

                {enc.respondida ? (
                  <span className="text-sm text-gray-400">
                    ¡Gracias por responder!
                  </span>
                ) : (
                  <button
                    onClick={() => setEventoActivo(enc.evento_id)}
                    className="btn-primary text-sm"
                  >
                    Responder
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {eventoActivo && (
        <ModalResponderEncuesta
          eventoId={eventoActivo}
          usuarioId={user.id}
          onClose={() => setEventoActivo(null)}
          onCompletada={fetchEncuestas}
        />
      )}
    </div>
  );
}
