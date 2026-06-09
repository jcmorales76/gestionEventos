import { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import { toast } from "react-hot-toast";

export default function MisCertificados() {
  const { user } = useAuth();
  const [certificados, setCertificados] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.id) {
      fetchCertificados();
    }
  }, [user]);

  const fetchCertificados = async () => {
    if (!user?.id) return;

    setLoading(true);
    try {
      const res = await fetch(
        `http://localhost:5000/api/certificados/participante/${user.id}`,
      );
      const data = await res.json();
      setCertificados(data);
    } catch (error) {
      console.error("Error:", error);
      toast.error("Error al cargar certificados");
    } finally {
      setLoading(false);
    }
  };

  const handleDescargar = (certificado) => {
    window.open(`http://localhost:5000${certificado.url_pdf}`, "_blank");
    toast.success(`📥 Descargando certificado de ${certificado.evento_nombre}`);
  };

  const certificadosDisponibles = certificados.length;
  const certificadosPendientes = 0; // Se calcula desde el backend

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Mis Certificados</h1>
        <p className="text-gray-600 mt-1">
          Descarga tus certificados de los eventos en los que has participado
        </p>
      </div>

      {/* Estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-gradient-to-br from-green-50 to-emerald-100 rounded-xl p-6 border border-green-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-green-700 font-medium">
                Certificados Disponibles
              </p>
              <p className="text-3xl font-bold text-green-900 mt-1">
                {certificadosDisponibles}
              </p>
            </div>
            <div className="w-12 h-12 rounded-full bg-green-500 flex items-center justify-center">
              <span className="text-2xl">🎓</span>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-blue-50 to-indigo-100 rounded-xl p-6 border border-blue-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-blue-700 font-medium">
                Eventos Completados
              </p>
              <p className="text-3xl font-bold text-blue-900 mt-1">
                {certificadosDisponibles}
              </p>
            </div>
            <div className="w-12 h-12 rounded-full bg-blue-500 flex items-center justify-center">
              <span className="text-2xl">✅</span>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-purple-50 to-pink-100 rounded-xl p-6 border border-purple-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-purple-700 font-medium">
                Horas Académicas
              </p>
              <p className="text-3xl font-bold text-purple-900 mt-1">
                {certificados.reduce(
                  (acc, cert) => acc + (cert.horas_academicas || 24),
                  0,
                )}
              </p>
            </div>
            <div className="w-12 h-12 rounded-full bg-purple-500 flex items-center justify-center">
              <span className="text-2xl">⏱️</span>
            </div>
          </div>
        </div>
      </div>

      {/* Contenido */}
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
          <span className="ml-3 text-gray-600">Cargando certificados...</span>
        </div>
      ) : certificados.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm p-12 border border-gray-100 text-center">
          <div className="text-6xl mb-4">📜</div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            Aún no tienes certificados disponibles
          </h3>
          <p className="text-gray-600 max-w-md mx-auto">
            Los certificados se generan automáticamente después de que finaliza
            el evento. ¡Sigue participando en nuestros eventos!
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {certificados.map((certificado) => (
            <div
              key={certificado.id}
              className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-lg transition-shadow"
            >
              {/* Header del certificado */}
              <div className="bg-gradient-to-r from-red-50 to-orange-50 px-6 py-4 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-red-100 flex items-center justify-center">
                      <span className="text-2xl">🎓</span>
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-900">
                        {certificado.evento_nombre}
                      </h3>
                      <p className="text-sm text-gray-600">
                        {certificado.tipo}
                      </p>
                    </div>
                  </div>
                  <span className="px-3 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-700">
                    {certificado.tipo_certificado ||
                      certificado.tipo ||
                      "PARTICIPANTE"}
                  </span>
                </div>
              </div>

              {/* Contenido del certificado */}
              <div className="p-6">
                <div className="space-y-3">
                  <div className="flex items-center gap-3 text-sm text-gray-600">
                    <svg
                      className="w-5 h-5 text-red-500"
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
                    <span className="font-medium">
                      {certificado.nombre_participante}
                    </span>
                  </div>

                  <div className="flex items-center gap-3 text-sm text-gray-600">
                    <svg
                      className="w-5 h-5 text-red-500"
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
                    <span>
                      {certificado.fecha_fin
                        ? new Date(certificado.fecha_fin).toLocaleDateString(
                            "es-ES",
                            {
                              day: "numeric",
                              month: "long",
                              year: "numeric",
                            },
                          )
                        : "Fecha por definir"}
                    </span>
                  </div>

                  <div className="flex items-center gap-3 text-sm text-gray-600">
                    <svg
                      className="w-5 h-5 text-red-500"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                    <span>
                      {certificado.horas_academicas || 24} horas académicas
                    </span>
                  </div>
                </div>

                {/* Botón de descarga */}
                <button
                  onClick={() => handleDescargar(certificado)}
                  className="w-full mt-6 btn-primary flex items-center justify-center gap-2"
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
                  Descargar Certificado PDF
                </button>
              </div>

              {/* Footer */}
              <div className="px-6 py-3 bg-gray-50 border-t border-gray-200">
                <p className="text-xs text-gray-500 text-center">
                  Generado el{" "}
                  {new Date(certificado.fecha_generacion).toLocaleDateString(
                    "es-ES",
                  )}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
