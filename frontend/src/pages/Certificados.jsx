import { useState } from "react";

export default function Certificados() {
  const [selectedEvento, setSelectedEvento] = useState("");
  const [config, setConfig] = useState({
    nombrePosY: 50,
    nombreFontSize: 32,
    nombreColor: "#000000",
  });
  const [previewName, setPreviewName] = useState("Juan Pérez");
  const [generando, setGenerando] = useState(false);

  const eventos = [
    { id: 1, nombre: "Curso de Liderazgo Ejecutivo" },
    { id: 2, nombre: "Seminario de Innovación Digital" },
    { id: 3, nombre: "Taller de Negociación Avanzada" },
    { id: 4, nombre: "Congreso Internacional de Finanzas" },
  ];

  const handleConfigChange = (field, value) => {
    setConfig((prev) => ({ ...prev, [field]: value }));
  };

  const handleGenerar = () => {
    setGenerando(true);
    setTimeout(() => {
      setGenerando(false);
      alert("Certificados generados exitosamente");
    }, 1500);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">
          Diplomas y Certificados
        </h1>
        <p className="text-gray-600 mt-1">
          Gestiona y genera certificados de culminación por evento
        </p>
      </div>

      {/* Configuración y Preview */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Configuración de Certificado */}
        <div className="bg-white rounded-xl shadow-sm p-5 border border-gray-100">
          <h2 className="text-lg font-bold text-gray-900 mb-4">
            Configuración de Certificado
          </h2>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Seleccionar Evento
              </label>
              <select
                value={selectedEvento}
                onChange={(e) => setSelectedEvento(e.target.value)}
                className="input-field"
              >
                <option value="">-- Seleccionar evento --</option>
                {eventos.map((ev) => (
                  <option key={ev.id} value={ev.id}>
                    {ev.nombre}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Plantilla de Certificado
              </label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-red-500 transition-colors cursor-pointer">
                <svg
                  className="w-8 h-8 mx-auto text-gray-400 mb-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
                <p className="text-sm text-gray-600">
                  Haz clic o arrastra la imagen de la plantilla
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  PNG, JPG — Se usará como fondo del certificado
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Posición Y del nombre (%)
                </label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={config.nombrePosY}
                  onChange={(e) =>
                    handleConfigChange("nombrePosY", e.target.value)
                  }
                  className="input-field"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tamaño de fuente
                </label>
                <input
                  type="number"
                  min="12"
                  max="72"
                  value={config.nombreFontSize}
                  onChange={(e) =>
                    handleConfigChange("nombreFontSize", e.target.value)
                  }
                  className="input-field"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Color del nombre
              </label>
              <input
                type="color"
                value={config.nombreColor}
                onChange={(e) =>
                  handleConfigChange("nombreColor", e.target.value)
                }
                className="w-full h-10 rounded-lg border border-gray-300 cursor-pointer"
              />
            </div>

            <button className="btn-primary w-full">
              Guardar Configuración
            </button>
          </div>
        </div>

        {/* Vista Previa */}
        <div className="bg-white rounded-xl shadow-sm p-5 border border-gray-100">
          <h2 className="text-lg font-bold text-gray-900 mb-4">
            Vista Previa del Certificado
          </h2>

          <div className="border border-gray-200 rounded-lg p-4 bg-gray-50 h-64 flex items-center justify-center">
            {selectedEvento ? (
              <div className="relative w-full h-full bg-white rounded-lg shadow-sm overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
                  <span className="text-gray-400 text-sm">
                    Plantilla del certificado
                  </span>
                </div>
                <div
                  className="absolute left-0 right-0 text-center font-bold"
                  style={{
                    top: `${config.nombrePosY}%`,
                    fontSize: `${config.nombreFontSize}px`,
                    color: config.nombreColor,
                  }}
                >
                  {previewName}
                </div>
                <div className="absolute bottom-2 right-2 text-xs text-gray-500">
                  Vista previa
                </div>
              </div>
            ) : (
              <div className="text-center text-gray-500">
                <svg
                  className="w-12 h-12 mx-auto mb-2 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
                <p className="text-sm">
                  Configura un evento y sube la plantilla para ver la vista
                  previa
                </p>
              </div>
            )}
          </div>

          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nombre de prueba
            </label>
            <input
              type="text"
              value={previewName}
              onChange={(e) => setPreviewName(e.target.value)}
              className="input-field"
              placeholder="Escribe un nombre para probar"
            />
          </div>
        </div>
      </div>

      {/* Generar Certificados */}
      <div className="bg-white rounded-xl shadow-sm p-5 border border-gray-100">
        <h2 className="text-lg font-bold text-gray-900 mb-4">
          Generar Certificados
        </h2>

        <div className="flex flex-col md:flex-row gap-4 items-end">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Evento
            </label>
            <select className="input-field">
              <option value="">-- Seleccionar evento --</option>
              {eventos.map((ev) => (
                <option key={ev.id} value={ev.id}>
                  {ev.nombre}
                </option>
              ))}
            </select>
          </div>
          <button
            onClick={handleGenerar}
            disabled={generando}
            className="btn-primary whitespace-nowrap"
          >
            {generando ? "Generando..." : "Generar Seleccionados"}
          </button>
          <button
            onClick={handleGenerar}
            disabled={generando}
            className="btn-secondary whitespace-nowrap"
          >
            {generando ? "Generando..." : "Generar Todos"}
          </button>
        </div>
      </div>
    </div>
  );
}
