export default function MisCertificados() {
  const certificados = [
    {
      id: 1,
      evento: "Curso de Liderazgo Ejecutivo",
      fecha: "16 Jun 2026",
      estado: "Disponible",
      descargado: true,
    },
    {
      id: 2,
      evento: "Taller de Negociación Avanzada",
      fecha: "02 Jun 2026",
      estado: "Disponible",
      descargado: false,
    },
    {
      id: 3,
      evento: "Seminario de Innovación Digital",
      fecha: "Pendiente",
      estado: "En proceso",
      descargado: false,
    },
  ];

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
        <h2 className="text-xl font-bold text-gray-900 mb-2">
          Mis Certificados
        </h2>
        <p className="text-sm text-gray-600 mb-6">
          Descarga tus diplomas de culminación.
        </p>

        <div className="space-y-4">
          {certificados.map((cert) => (
            <div
              key={cert.id}
              className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center gap-4 flex-1">
                <div
                  className={`w-12 h-12 rounded-lg flex items-center justify-center text-2xl flex-shrink-0 ${
                    cert.estado === "Disponible"
                      ? "bg-green-100"
                      : "bg-yellow-100"
                  }`}
                >
                  📜
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-gray-900 text-sm truncate">
                    {cert.evento}
                  </h3>
                  <p className="text-xs text-gray-500">{cert.fecha}</p>
                </div>
                <span
                  className={`px-3 py-1 rounded-full text-xs font-medium ${
                    cert.estado === "Disponible"
                      ? "badge-success"
                      : "badge-warning"
                  }`}
                >
                  {cert.estado}
                </span>
              </div>
              <button
                disabled={cert.estado !== "Disponible"}
                className={`ml-4 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  cert.estado === "Disponible"
                    ? cert.descargado
                      ? "bg-green-100 text-green-700"
                      : "btn-primary"
                    : "bg-gray-100 text-gray-400 cursor-not-allowed"
                }`}
              >
                {cert.descargado ? "✓ Descargado" : "Descargar PDF"}
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
