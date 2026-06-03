import { useState } from "react";

export default function Importacion() {
  const [evento, setEvento] = useState("");
  const [archivo, setArchivo] = useState(null);
  const [vistaPrevia, setVistaPrevia] = useState([]);
  const [cargando, setCargando] = useState(false);

  const eventos = [
    { id: 1, nombre: "Curso de Liderazgo Ejecutivo" },
    { id: 2, nombre: "Seminario de Innovación Digital" },
    { id: 3, nombre: "Taller de Negociación Avanzada" },
  ];

  const handleArchivo = (e) => {
    const file = e.target.files[0];
    setArchivo(file);

    // Simulación de vista previa al "cargar" archivo
    if (file) {
      setVistaPrevia([
        {
          nombre: "Juan",
          apellido: "Pérez",
          email: "juan.perez@email.com",
          dni: "12345678",
          telefono: "999888777",
        },
        {
          nombre: "María",
          apellido: "García",
          email: "maria.garcia@email.com",
          dni: "87654321",
          telefono: "999777666",
        },
        {
          nombre: "Carlos",
          apellido: "López",
          email: "carlos.lopez@email.com",
          dni: "11223344",
          telefono: "999666555",
        },
      ]);
    }
  };

  const handleImportar = () => {
    if (!evento || !archivo) return;
    setCargando(true);

    setTimeout(() => {
      setCargando(false);
      setVistaPrevia([]);
      setArchivo(null);
      setEvento("");
      alert(
        "¡Importación exitosa! Se han creado los usuarios y asignado al evento.",
      );
    }, 2000);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Inscripción Masiva</h1>
        <p className="text-gray-600 mt-1">
          Importa participantes desde archivos CSV o Excel
        </p>
      </div>

      {/* Pasos del Wizard */}
      <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 space-y-8">
        {/* Paso 1 */}
        <div>
          <h3 className="text-lg font-bold text-gray-800 mb-3 flex items-center gap-2">
            <span className="w-8 h-8 rounded-full bg-red-600 text-white flex items-center justify-center text-sm">
              1
            </span>
            Seleccionar Evento
          </h3>
          <select
            value={evento}
            onChange={(e) => setEvento(e.target.value)}
            className="input-field md:w-96"
          >
            <option value="">-- Seleccionar evento destino --</option>
            {eventos.map((ev) => (
              <option key={ev.id} value={ev.id}>
                {ev.nombre}
              </option>
            ))}
          </select>
        </div>

        {/* Paso 2 */}
        <div>
          <h3 className="text-lg font-bold text-gray-800 mb-3 flex items-center gap-2">
            <span className="w-8 h-8 rounded-full bg-red-600 text-white flex items-center justify-center text-sm">
              2
            </span>
            Subir Archivo
          </h3>
          <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center hover:border-red-500 transition-colors bg-gray-50">
            <input
              type="file"
              id="file-upload"
              className="hidden"
              accept=".csv,.xlsx,.xls"
              onChange={handleArchivo}
            />
            <label htmlFor="file-upload" className="cursor-pointer block">
              <svg
                className="w-12 h-12 mx-auto text-gray-400 mb-3"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                />
              </svg>
              <p className="text-lg font-medium text-gray-700">
                {archivo
                  ? archivo.name
                  : "Haz clic para seleccionar el archivo"}
              </p>
              <p className="text-sm text-gray-500 mt-1">
                Formatos soportados: .csv, .xlsx, .xls
              </p>
              <p className="text-xs text-gray-400 mt-2">
                Columnas requeridas: nombre, apellido, email, dni, telefono
              </p>
            </label>
          </div>
        </div>

        {/* Paso 3: Vista Previa (Condicional) */}
        {vistaPrevia.length > 0 && (
          <div className="animate-fadeIn">
            <h3 className="text-lg font-bold text-gray-800 mb-3 flex items-center gap-2">
              <span className="w-8 h-8 rounded-full bg-red-600 text-white flex items-center justify-center text-sm">
                3
              </span>
              Previsualizar e Importar
            </h3>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4 text-sm text-blue-800">
              ℹ️ Se encontraron <strong>{vistaPrevia.length}</strong> registros
              válidos. Revisa que los datos sean correctos.
            </div>

            <div className="overflow-x-auto rounded-lg border border-gray-200">
              <table className="table-base">
                <thead className="table-header">
                  <tr>
                    <th className="table-th">Nombre</th>
                    <th className="table-th">Apellido</th>
                    <th className="table-th">Email</th>
                    <th className="table-th">DNI</th>
                    <th className="table-th">Teléfono</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {vistaPrevia.map((row, i) => (
                    <tr key={i} className="hover:bg-gray-50">
                      <td className="table-td">{row.nombre}</td>
                      <td className="table-td">{row.apellido}</td>
                      <td className="table-td">{row.email}</td>
                      <td className="table-td">{row.dni}</td>
                      <td className="table-td">{row.telefono}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Botones de Acción */}
        <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
          <button
            onClick={() => {
              setVistaPrevia([]);
              setArchivo(null);
            }}
            className="btn-secondary"
          >
            Cancelar
          </button>
          <button
            onClick={handleImportar}
            disabled={cargando || !evento || !archivo}
            className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {cargando ? "Procesando..." : "Importar y Crear Usuarios"}
          </button>
        </div>
      </div>
    </div>
  );
}
