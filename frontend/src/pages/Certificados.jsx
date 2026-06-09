import { useState, useEffect } from "react";
import { toast } from "react-hot-toast";

export default function Certificados() {
  const [eventos, setEventos] = useState([]);
  const [eventoSeleccionado, setEventoSeleccionado] = useState(null);
  const [inscripciones, setInscripciones] = useState([]);
  const [certificados, setCertificados] = useState([]);
  const [loading, setLoading] = useState(false);
  const [generando, setGenerando] = useState(false);

  useEffect(() => {
    fetchEventos();
  }, []);

  useEffect(() => {
    if (eventoSeleccionado) {
      fetchInscripciones();
      fetchCertificados();
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

  const fetchInscripciones = async () => {
    if (!eventoSeleccionado) return;
    setLoading(true);
    try {
      const res = await fetch(
        `http://localhost:5000/api/inscripciones/evento/${eventoSeleccionado}`,
      );
      const data = await res.json();
      setInscripciones(data);
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCertificados = async () => {
    if (!eventoSeleccionado) return;
    try {
      const res = await fetch(
        `http://localhost:5000/api/certificados/evento/${eventoSeleccionado}`,
      );
      const data = await res.json();
      setCertificados(data);
    } catch (error) {
      console.error("Error:", error);
    }
  };

  const handleGenerarMasivo = async () => {
    if (!eventoSeleccionado) return;

    setGenerando(true);
    try {
      const res = await fetch(
        `http://localhost:5000/api/certificados/generar-masivo/${eventoSeleccionado}`,
        {
          method: "POST",
        },
      );

      const data = await res.json();
      if (res.ok) {
        toast.success(`✅ ${data.certificados.length} certificados generados`);
        fetchCertificados();
      } else {
        toast.error(data.message || "Error al generar");
      }
    } catch (error) {
      toast.error("Error de conexión");
    } finally {
      setGenerando(false);
    }
  };

  const handleGenerarIndividual = async (inscripcionId, nombre) => {
    try {
      const res = await fetch(
        `http://localhost:5000/api/certificados/generar/${inscripcionId}`,
        {
          method: "POST",
        },
      );

      const data = await res.json();
      if (res.ok) {
        toast.success(`✅ Certificado de ${nombre} generado`);
        // Descargar automáticamente
        window.open(`http://localhost:5000${data.url}`, "_blank");
        fetchCertificados();
      } else {
        toast.error(data.message || "Error al generar");
      }
    } catch (error) {
      toast.error("Error de conexión");
    }
  };

  const totalInscritos = inscripciones.length;
  const totalCertificados = certificados.length;
  const porcentajeGenerados =
    totalInscritos > 0
      ? Math.round((totalCertificados / totalInscritos) * 100)
      : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Certificados</h1>
          <p className="text-gray-600 mt-1">
            Genera y gestiona certificados de participación
          </p>
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
                  {totalInscritos}
                </span>
                <span className="text-blue-700 ml-1">Inscritos</span>
              </div>
              <div className="bg-green-50 px-4 py-2 rounded-lg">
                <span className="text-green-600 font-semibold">
                  {totalCertificados}
                </span>
                <span className="text-green-700 ml-1">Certificados</span>
              </div>
              <div
                className={`${porcentajeGenerados === 100 ? "bg-green-50" : "bg-orange-50"} px-4 py-2 rounded-lg`}
              >
                <span
                  className={
                    porcentajeGenerados === 100
                      ? "text-green-600 font-semibold"
                      : "text-orange-600 font-semibold"
                  }
                >
                  {porcentajeGenerados}%
                </span>
                <span className="text-gray-700 ml-1">Completado</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Contenido */}
      {!eventoSeleccionado ? (
        <div className="bg-white rounded-xl shadow-sm p-12 border border-gray-100 text-center">
          <div className="text-6xl mb-4">🎓</div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            Selecciona un evento
          </h3>
          <p className="text-gray-600">
            Elige un evento para gestionar sus certificados
          </p>
        </div>
      ) : loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
          <span className="ml-3 text-gray-600">Cargando...</span>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Botón de generación masiva */}
          <div className="bg-gradient-to-r from-red-50 to-orange-50 rounded-xl p-6 border border-red-100">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-gray-900 text-lg">
                  Generación Masiva de Certificados
                </h3>
                <p className="text-gray-600 text-sm mt-1">
                  Genera automáticamente todos los certificados para los{" "}
                  {totalInscritos} inscritos
                </p>
              </div>
              <button
                onClick={handleGenerarMasivo}
                disabled={generando || totalInscritos === 0}
                className="btn-primary disabled:opacity-50 px-6 py-3"
              >
                {generando ? (
                  <>
                    <span className="animate-spin mr-2">⏳</span>
                    Generando...
                  </>
                ) : (
                  <>
                    <span className="mr-2">🎓</span>
                    Generar Todos
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Lista de inscritos */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
              <h3 className="font-bold text-gray-900">
                Participantes Inscritos
              </h3>
            </div>
            <div className="divide-y divide-gray-100">
              {inscripciones.map((inscripcion) => {
                const tieneCertificado = certificados.some(
                  (c) => c.inscripcion_id === inscripcion.id,
                );

                return (
                  <div
                    key={inscripcion.id}
                    className="px-6 py-4 flex items-center justify-between hover:bg-gray-50"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center text-red-600 font-semibold">
                        {(inscripcion.nombre?.charAt(0) || "") +
                          (inscripcion.apellido?.charAt(0) || "")}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">
                          {inscripcion.nombre} {inscripcion.apellido}
                        </p>
                        <p className="text-sm text-gray-500">
                          {inscripcion.email} •
                          <span className="ml-2 px-2 py-0.5 rounded-full text-xs bg-blue-100 text-blue-700">
                            {inscripcion.calidad || "PARTICIPANTE"}
                          </span>
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {tieneCertificado ? (
                        <span className="px-3 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-700">
                          ✅ Certificado Generado
                        </span>
                      ) : (
                        <button
                          onClick={() =>
                            handleGenerarIndividual(
                              inscripcion.id,
                              inscripcion.nombre,
                            )
                          }
                          className="btn-primary text-sm px-4 py-2"
                        >
                          🎓 Generar
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
