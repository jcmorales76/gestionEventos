export default function MisMateriales() {
  const materiales = [
    {
      id: 1,
      nombre: "Guía de Liderazgo 2026.pdf",
      evento: "Curso de Liderazgo Ejecutivo",
      tipo: "PDF",
      tamaño: "2.4 MB",
      fecha: "10 May 2026",
      descargado: true,
    },
    {
      id: 2,
      nombre: "Innovación Digital.pptx",
      evento: "Seminario de Innovación Digital",
      tipo: "Presentación",
      tamaño: "15.8 MB",
      fecha: "12 May 2026",
      descargado: false,
    },
    {
      id: 3,
      nombre: "Finanzas Corporativas.docx",
      evento: "Congreso Internacional de Finanzas",
      tipo: "Documento",
      tamaño: "1.2 MB",
      fecha: "15 May 2026",
      descargado: true,
    },
  ];

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
        <h2 className="text-xl font-bold text-gray-900 mb-2">Mis Materiales</h2>
        <p className="text-sm text-gray-600 mb-6">
          Accede a los documentos y recursos de tus cursos inscritos.
        </p>

        <div className="space-y-4">
          {materiales.map((mat) => (
            <div
              key={mat.id}
              className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center gap-4 flex-1">
                <div
                  className={`w-12 h-12 rounded-lg flex items-center justify-center text-2xl flex-shrink-0 ${
                    mat.tipo === "PDF"
                      ? "bg-red-100"
                      : mat.tipo === "Presentación"
                        ? "bg-blue-100"
                        : "bg-gray-100"
                  }`}
                >
                  {mat.tipo === "PDF"
                    ? "📄"
                    : mat.tipo === "Presentación"
                      ? "📊"
                      : "📝"}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-gray-900 text-sm truncate">
                    {mat.nombre}
                  </h3>
                  <p className="text-xs text-gray-500">
                    {mat.evento} • {mat.tamaño} • {mat.fecha}
                  </p>
                </div>
              </div>
              <button
                className={`ml-4 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  mat.descargado
                    ? "bg-green-100 text-green-700 hover:bg-green-200"
                    : "btn-primary"
                }`}
              >
                {mat.descargado ? "✓ Descargado" : "Descargar"}
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
