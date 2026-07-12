import { useState, useEffect } from "react";
import { toast } from "react-hot-toast";
import Modal from "./Modal";

export default function ModalResponderEncuesta({
  eventoId,
  usuarioId,
  onClose,
  onCompletada,
}) {
  const [titulo, setTitulo] = useState("Encuesta de satisfacción");
  const [descripcion, setDescripcion] = useState("");
  const [preguntas, setPreguntas] = useState([]);
  const [respuestas, setRespuestas] = useState({});
  const [cargando, setCargando] = useState(true);
  const [enviando, setEnviando] = useState(false);

  useEffect(() => {
    cargar();
  }, [eventoId]);

  const cargar = async () => {
    setCargando(true);
    try {
      const res = await fetch(
        `/api/encuestas/evento/${eventoId}`,
      );
      const data = await res.json();
      setTitulo(data.encuesta?.titulo || "Encuesta de satisfacción");
      setDescripcion(data.encuesta?.descripcion || "");
      setPreguntas(data.preguntas || []);
    } catch (error) {
      toast.error("Error al cargar la encuesta");
    } finally {
      setCargando(false);
    }
  };

  const setValor = (preguntaId, valor) =>
    setRespuestas((prev) => ({ ...prev, [preguntaId]: { valor } }));

  const setOpcionUnica = (preguntaId, opcionId) =>
    setRespuestas((prev) => ({ ...prev, [preguntaId]: { opcionIds: [opcionId] } }));

  const toggleOpcionMultiple = (preguntaId, opcionId) =>
    setRespuestas((prev) => {
      const actuales = prev[preguntaId]?.opcionIds || [];
      const nuevas = actuales.includes(opcionId)
        ? actuales.filter((x) => x !== opcionId)
        : [...actuales, opcionId];
      return { ...prev, [preguntaId]: { opcionIds: nuevas } };
    });

  const enviar = async () => {
    // Validar que todas las preguntas tengan respuesta
    for (const p of preguntas) {
      const r = respuestas[p.id];
      const vacia =
        !r ||
        (p.tipo === "abierta" && !(r.valor || "").trim()) ||
        (p.tipo === "escala" && !r.valor) ||
        (p.tipo === "opcion_unica" && !(r.opcionIds && r.opcionIds.length)) ||
        (p.tipo === "opcion_multiple" && !(r.opcionIds && r.opcionIds.length));
      if (vacia) return toast.error("Responde todas las preguntas");
    }

    const payload = {
      eventoId,
      usuarioId,
      respuestas: preguntas.map((p) => ({
        preguntaId: p.id,
        tipo: p.tipo,
        opcionIds: respuestas[p.id]?.opcionIds || [],
        valor: respuestas[p.id]?.valor ?? "",
      })),
    };

    setEnviando(true);
    try {
      const res = await fetch("/api/encuestas/responder", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success(data.message || "¡Gracias por responder!");
        if (onCompletada) onCompletada();
        onClose();
      } else {
        toast.error(data.message || "Error al enviar");
      }
    } catch (error) {
      toast.error("Error de conexión");
    } finally {
      setEnviando(false);
    }
  };

  return (
    <Modal
      isOpen={true}
      onClose={onClose}
      title={titulo}
      size="lg"
      footer={
        <>
          <button onClick={onClose} className="btn-secondary">
            Cancelar
          </button>
          <button
            onClick={enviar}
            disabled={enviando || cargando || preguntas.length === 0}
            className="btn-primary disabled:opacity-50"
          >
            {enviando ? "Enviando..." : "Enviar respuestas"}
          </button>
        </>
      }
    >
      {cargando ? (
        <div className="text-center text-gray-500 py-8">
          Cargando encuesta...
        </div>
      ) : preguntas.length === 0 ? (
        <div className="text-center text-gray-500 py-8">
          Esta encuesta aún no tiene preguntas.
        </div>
      ) : (
        <div className="space-y-6">
          {descripcion && (
            <p className="text-sm text-gray-600 bg-blue-50 p-3 rounded-lg">
              {descripcion}
            </p>
          )}

          {preguntas.map((p, i) => (
            <div key={p.id} className="border-b border-gray-100 pb-4">
              <p className="font-medium text-gray-900 mb-3">
                {i + 1}. {p.texto}
              </p>

              {p.tipo === "abierta" && (
                <textarea
                  className="input-field"
                  rows={3}
                  value={respuestas[p.id]?.valor || ""}
                  onChange={(e) => setValor(p.id, e.target.value)}
                  placeholder="Escribe tu respuesta..."
                />
              )}

              {p.tipo === "escala" && (
                <div className="flex items-center gap-2">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <button
                      key={n}
                      type="button"
                      onClick={() => setValor(p.id, String(n))}
                      className={`w-11 h-11 rounded-lg border font-semibold transition-colors ${
                        respuestas[p.id]?.valor === String(n)
                          ? "bg-red-600 text-white border-red-600"
                          : "border-gray-300 text-gray-600 hover:border-red-400"
                      }`}
                    >
                      {n}
                    </button>
                  ))}
                  <span className="text-xs text-gray-400 ml-2">
                    1 = muy insatisfecho · 5 = muy satisfecho
                  </span>
                </div>
              )}

              {p.tipo === "opcion_unica" && (
                <div className="space-y-2">
                  {p.opciones.map((o) => (
                    <label
                      key={o.id}
                      className="flex items-center gap-3 cursor-pointer p-2 rounded-lg hover:bg-gray-50"
                    >
                      <input
                        type="radio"
                        name={`p_${p.id}`}
                        checked={respuestas[p.id]?.opcionIds?.[0] === o.id}
                        onChange={() => setOpcionUnica(p.id, o.id)}
                        className="w-4 h-4 text-red-600"
                      />
                      <span className="text-sm text-gray-700">{o.texto}</span>
                    </label>
                  ))}
                </div>
              )}

              {p.tipo === "opcion_multiple" && (
                <div className="space-y-2">
                  {p.opciones.map((o) => (
                    <label
                      key={o.id}
                      className="flex items-center gap-3 cursor-pointer p-2 rounded-lg hover:bg-gray-50"
                    >
                      <input
                        type="checkbox"
                        checked={
                          respuestas[p.id]?.opcionIds?.includes(o.id) || false
                        }
                        onChange={() => toggleOpcionMultiple(p.id, o.id)}
                        className="w-4 h-4 text-red-600 rounded"
                      />
                      <span className="text-sm text-gray-700">{o.texto}</span>
                    </label>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </Modal>
  );
}
