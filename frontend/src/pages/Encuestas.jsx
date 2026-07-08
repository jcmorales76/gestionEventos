import { useState, useEffect } from "react";
import { toast } from "react-hot-toast";

const TIPOS = [
  { valor: "abierta", label: "Abierta (texto libre)", icon: "📝" },
  { valor: "opcion_unica", label: "Opción única", icon: "🔘" },
  { valor: "opcion_multiple", label: "Opción múltiple", icon: "☑️" },
  { valor: "escala", label: "Escala 1 a 5", icon: "⭐" },
];

const preguntaVacia = () => ({
  texto: "",
  tipo: "abierta",
  opciones: [],
});

export default function Encuestas() {
  const [eventos, setEventos] = useState([]);
  const [eventoId, setEventoId] = useState("");
  const [titulo, setTitulo] = useState("Encuesta de satisfacción");
  const [descripcion, setDescripcion] = useState("");
  const [requiereEncuesta, setRequiereEncuesta] = useState(false);
  const [preguntas, setPreguntas] = useState([]);
  const [cargando, setCargando] = useState(false);
  const [guardando, setGuardando] = useState(false);

  useEffect(() => {
    fetch("http://localhost:5000/api/eventos")
      .then((r) => r.json())
      .then(setEventos)
      .catch(() => toast.error("Error al cargar eventos"));
  }, []);

  useEffect(() => {
    if (eventoId) cargarEncuesta(eventoId);
  }, [eventoId]);

  const cargarEncuesta = async (id) => {
    setCargando(true);
    try {
      const res = await fetch(
        `http://localhost:5000/api/encuestas/evento/${id}`,
      );
      const data = await res.json();
      setTitulo(data.encuesta?.titulo || "Encuesta de satisfacción");
      setDescripcion(data.encuesta?.descripcion || "");
      setRequiereEncuesta(!!data.requiere_encuesta);
      setPreguntas(
        (data.preguntas || []).map((p) => ({
          texto: p.texto,
          tipo: p.tipo,
          opciones: (p.opciones || []).map((o) => o.texto),
        })),
      );
    } catch (error) {
      toast.error("Error al cargar la encuesta");
    } finally {
      setCargando(false);
    }
  };

  // ---- Manejo de preguntas ----
  const addPregunta = () => setPreguntas([...preguntas, preguntaVacia()]);

  const removePregunta = (i) =>
    setPreguntas(preguntas.filter((_, idx) => idx !== i));

  const updatePregunta = (i, campo, valor) => {
    setPreguntas(
      preguntas.map((p, idx) => {
        if (idx !== i) return p;
        const actualizada = { ...p, [campo]: valor };
        // Si cambia a tipo con opciones y no tiene, sembrar 2
        if (
          campo === "tipo" &&
          (valor === "opcion_unica" || valor === "opcion_multiple") &&
          actualizada.opciones.length === 0
        ) {
          actualizada.opciones = ["", ""];
        }
        return actualizada;
      }),
    );
  };

  const addOpcion = (i) =>
    setPreguntas(
      preguntas.map((p, idx) =>
        idx === i ? { ...p, opciones: [...p.opciones, ""] } : p,
      ),
    );

  const updateOpcion = (i, j, valor) =>
    setPreguntas(
      preguntas.map((p, idx) =>
        idx === i
          ? { ...p, opciones: p.opciones.map((o, oj) => (oj === j ? valor : o)) }
          : p,
      ),
    );

  const removeOpcion = (i, j) =>
    setPreguntas(
      preguntas.map((p, idx) =>
        idx === i
          ? { ...p, opciones: p.opciones.filter((_, oj) => oj !== j) }
          : p,
      ),
    );

  const guardar = async () => {
    if (!eventoId) return toast.error("Selecciona un evento");
    if (preguntas.length === 0)
      return toast.error("Agrega al menos una pregunta");
    for (const p of preguntas) {
      if (!p.texto.trim())
        return toast.error("Todas las preguntas deben tener texto");
      if (
        (p.tipo === "opcion_unica" || p.tipo === "opcion_multiple") &&
        p.opciones.filter((o) => o.trim()).length < 2
      )
        return toast.error(`"${p.texto}" necesita al menos 2 opciones`);
    }

    setGuardando(true);
    try {
      const res = await fetch("http://localhost:5000/api/encuestas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          eventoId,
          titulo,
          descripcion,
          requiere_encuesta: requiereEncuesta,
          preguntas: preguntas.map((p) => ({
            texto: p.texto,
            tipo: p.tipo,
            opciones: p.opciones,
          })),
        }),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success("✅ Encuesta guardada");
      } else {
        toast.error(data.message || "Error al guardar");
      }
    } catch (error) {
      toast.error("Error de conexión");
    } finally {
      setGuardando(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">
          Encuestas de Satisfacción
        </h1>
        <p className="text-gray-600 mt-1">
          Crea la encuesta de cada evento y decide si es obligatoria para
          descargar el certificado.
        </p>
      </div>

      {/* Selección de evento */}
      <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100">
        <label className="label-input">Evento</label>
        <select
          value={eventoId}
          onChange={(e) => setEventoId(e.target.value)}
          className="input-field md:w-96"
        >
          <option value="">-- Selecciona un evento --</option>
          {eventos.map((ev) => (
            <option key={ev.id} value={ev.id}>
              {ev.nombre}
            </option>
          ))}
        </select>
      </div>

      {cargando && (
        <div className="text-center text-gray-500 py-8">Cargando encuesta...</div>
      )}

      {eventoId && !cargando && (
        <>
          {/* Datos de la encuesta */}
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 space-y-4">
            <div>
              <label className="label-input">Título de la encuesta</label>
              <input
                value={titulo}
                onChange={(e) => setTitulo(e.target.value)}
                className="input-field"
              />
            </div>
            <div>
              <label className="label-input">Descripción (opcional)</label>
              <textarea
                value={descripcion}
                onChange={(e) => setDescripcion(e.target.value)}
                className="input-field"
                rows={2}
              />
            </div>
            <label className="flex items-center gap-3 cursor-pointer bg-amber-50 border border-amber-200 rounded-lg p-3">
              <input
                type="checkbox"
                checked={requiereEncuesta}
                onChange={(e) => setRequiereEncuesta(e.target.checked)}
                className="w-5 h-5 text-red-600 rounded focus:ring-red-500"
              />
              <span className="text-sm text-amber-800">
                <strong>Obligatoria:</strong> el participante debe responder esta
                encuesta antes de poder descargar su certificado.
              </span>
            </label>
          </div>

          {/* Preguntas */}
          <div className="space-y-4">
            {preguntas.map((p, i) => (
              <div
                key={i}
                className="bg-white rounded-xl shadow-sm p-5 border border-gray-100"
              >
                <div className="flex items-start justify-between gap-3 mb-3">
                  <span className="w-7 h-7 rounded-full bg-red-600 text-white flex items-center justify-center text-sm flex-shrink-0">
                    {i + 1}
                  </span>
                  <button
                    onClick={() => removePregunta(i)}
                    className="text-red-500 hover:bg-red-50 rounded-lg p-1 text-sm"
                    title="Eliminar pregunta"
                  >
                    🗑️
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div className="md:col-span-2">
                    <label className="label-input">Pregunta</label>
                    <input
                      value={p.texto}
                      onChange={(e) => updatePregunta(i, "texto", e.target.value)}
                      className="input-field"
                      placeholder="Escribe la pregunta..."
                    />
                  </div>
                  <div>
                    <label className="label-input">Tipo</label>
                    <select
                      value={p.tipo}
                      onChange={(e) => updatePregunta(i, "tipo", e.target.value)}
                      className="input-field"
                    >
                      {TIPOS.map((t) => (
                        <option key={t.valor} value={t.valor}>
                          {t.icon} {t.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Opciones para tipos de selección */}
                {(p.tipo === "opcion_unica" ||
                  p.tipo === "opcion_multiple") && (
                  <div className="mt-4 pl-2 border-l-2 border-gray-100 space-y-2">
                    {p.opciones.map((o, j) => (
                      <div key={j} className="flex items-center gap-2">
                        <span className="text-gray-400 text-sm">
                          {p.tipo === "opcion_unica" ? "🔘" : "☑️"}
                        </span>
                        <input
                          value={o}
                          onChange={(e) => updateOpcion(i, j, e.target.value)}
                          className="input-field flex-1"
                          placeholder={`Opción ${j + 1}`}
                        />
                        <button
                          onClick={() => removeOpcion(i, j)}
                          className="text-red-500 hover:bg-red-50 rounded p-1 text-xs"
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                    <button
                      onClick={() => addOpcion(i)}
                      className="text-sm text-red-600 hover:text-red-800 font-medium"
                    >
                      + Agregar opción
                    </button>
                  </div>
                )}

                {p.tipo === "escala" && (
                  <div className="mt-4 flex items-center gap-2 text-gray-500">
                    {[1, 2, 3, 4, 5].map((n) => (
                      <span
                        key={n}
                        className="w-9 h-9 rounded-lg border border-gray-200 flex items-center justify-center text-sm"
                      >
                        {n}
                      </span>
                    ))}
                    <span className="text-xs text-gray-400 ml-2">
                      (1 = muy insatisfecho, 5 = muy satisfecho)
                    </span>
                  </div>
                )}

                {p.tipo === "abierta" && (
                  <div className="mt-4">
                    <div className="input-field bg-gray-50 text-gray-400 text-sm">
                      Respuesta de texto libre...
                    </div>
                  </div>
                )}
              </div>
            ))}

            <button
              onClick={addPregunta}
              className="w-full py-3 border-2 border-dashed border-gray-300 rounded-xl text-gray-600 hover:border-red-400 hover:text-red-600 transition-colors font-medium"
            >
              + Agregar pregunta
            </button>
          </div>

          {/* Guardar */}
          <div className="flex justify-end gap-3 pt-2">
            <button
              onClick={guardar}
              disabled={guardando}
              className="btn-primary disabled:opacity-50"
            >
              {guardando ? "Guardando..." : "💾 Guardar Encuesta"}
            </button>
          </div>
        </>
      )}
    </div>
  );
}
