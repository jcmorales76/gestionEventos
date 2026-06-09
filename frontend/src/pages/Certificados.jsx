import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-hot-toast";

export default function Certificados() {
  const navigate = useNavigate();
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

      const inscripcionesArray = Array.isArray(data) ? data : [];
      setInscripciones(inscripcionesArray);
    } catch (error) {
      console.error("Error cargando inscripciones:", error);
      setInscripciones([]);
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

      const certificadosArray = Array.isArray(data) ? data : [];
      setCertificados(certificadosArray);
    } catch (error) {
      console.error("Error cargando certificados:", error);
      setCertificados([]);
    }
  };

  const handleGenerarMasivo = async () => {
    if (!eventoSeleccionado) return;

    if (inscripciones.length === 0) {
      toast.error("No hay participantes inscritos");
      return;
    }

    const confirmacion = window.confirm(
      `¿Generar certificados para los ${inscripciones.length} participantes?`,
    );

    if (!confirmacion) return;

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
          {/* Botón de configuración de plantilla y generación masiva */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <button
              onClick={() =>
                navigate(`/certificados/configurar/${eventoSeleccionado}`)
              }
              className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white px-6 py-4 rounded-xl shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-3"
            >
              <span className="text-2xl">🎨</span>
              <div className="text-left">
                <p className="font-bold">Configurar Plantilla</p>
                <p className="text-sm opacity-90">
                  Personaliza el diseño del certificado
                </p>
              </div>
            </button>

            <button
              onClick={handleGenerarMasivo}
              disabled={generando || totalInscritos === 0}
              className="bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600 text-white px-6 py-4 rounded-xl shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {generando ? (
                <>
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
                  <div className="text-left">
                    <p className="font-bold">Generando...</p>
                    <p className="text-sm opacity-90">Por favor espera</p>
                  </div>
                </>
              ) : (
                <>
                  <span className="text-2xl">🎓</span>
                  <div className="text-left">
                    <p className="font-bold">Generar Todos los Certificados</p>
                    <p className="text-sm opacity-90">
                      Para {totalInscritos} participantes
                    </p>
                  </div>
                </>
              )}
            </button>
          </div>

          {/* Lista de inscritos */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 bg-gray-50 flex items-center justify-between">
              <h3 className="font-bold text-gray-900">
                Participantes Inscritos
              </h3>
              <span className="text-sm text-gray-600">
                {totalInscritos} personas
              </span>
            </div>
            <div className="divide-y divide-gray-100">
              {inscripciones.length === 0 ? (
                <div className="px-6 py-12 text-center text-gray-500">
                  <p>No hay participantes inscritos en este evento</p>
                </div>
              ) : (
                inscripciones.map((inscripcion) => {
                  const tieneCertificado = certificados.some(
                    (c) => c.inscripcion_id === inscripcion.id,
                  );

                  return (
                    <div
                      key={inscripcion.id}
                      className="px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-center gap-4 flex-1 min-w-0">
                        <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center text-red-600 font-semibold flex-shrink-0">
                          {(inscripcion.nombre?.charAt(0) || "") +
                            (inscripcion.apellido?.charAt(0) || "")}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-gray-900 truncate">
                            {inscripcion.nombre} {inscripcion.apellido}
                          </p>
                          <div className="flex items-center gap-3 text-sm text-gray-500 mt-1">
                            <span className="truncate">
                              {inscripcion.email}
                            </span>
                            <span>•</span>
                            <span className="px-2 py-0.5 rounded-full text-xs bg-blue-100 text-blue-700 font-medium">
                              {inscripcion.calidad || "PARTICIPANTE"}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 ml-4">
                        {tieneCertificado ? (
                          <div className="flex items-center gap-2">
                            <span className="px-3 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-700 flex items-center gap-1">
                              <svg
                                className="w-4 h-4"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M5 13l4 4L19 7"
                                />
                              </svg>
                              Generado
                            </span>
                            <button
                              onClick={() => {
                                const cert = certificados.find(
                                  (c) => c.inscripcion_id === inscripcion.id,
                                );
                                if (cert)
                                  window.open(
                                    `http://localhost:5000${cert.url_pdf}`,
                                    "_blank",
                                  );
                              }}
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
                            </button>
                          </div>
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
                })
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
