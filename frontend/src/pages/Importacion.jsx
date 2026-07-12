import { useState, useEffect } from "react";
import { toast } from "react-hot-toast";
import * as XLSX from "xlsx";

export default function Importacion() {
  const [eventos, setEventos] = useState([]);
  const [eventoId, setEventoId] = useState("");
  const [archivo, setArchivo] = useState(null);
  const [filas, setFilas] = useState([]);
  const [errores, setErrores] = useState([]);
  const [cargando, setCargando] = useState(false);
  const [resultado, setResultado] = useState(null);

  useEffect(() => {
    fetchEventos();
  }, []);

  const fetchEventos = async () => {
    try {
      const res = await fetch("/api/eventos");
      if (res.ok) {
        setEventos(await res.json());
      }
    } catch (error) {
      console.error("Error cargando eventos:", error);
    }
  };

  const norm = (v) => (v ?? "").toString().trim();

  // Mapea una fila del archivo aceptando encabezados con distintas variantes
  const mapearFila = (row) => {
    const lower = {};
    Object.keys(row).forEach((k) => {
      lower[k.toLowerCase().trim()] = row[k];
    });
    return {
      nombre: norm(lower.nombre || lower.nombres),
      apellido: norm(lower.apellido || lower.apellidos),
      email: norm(
        lower.email || lower.correo || lower["correo electrónico"],
      ).toLowerCase(),
      dni: norm(lower.dni || lower.documento),
      telefono: norm(lower.telefono || lower["teléfono"] || lower.celular),
    };
  };

  const handleArchivo = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setArchivo(file);
    setResultado(null);

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const data = new Uint8Array(evt.target.result);
        const wb = XLSX.read(data, { type: "array" });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const json = XLSX.utils.sheet_to_json(ws, { defval: "" });
        const mapeadas = json.map(mapearFila);

        const errs = [];
        mapeadas.forEach((r, i) => {
          if (!r.nombre || !r.email) {
            errs.push(`Fila ${i + 2}: falta nombre o email`);
          }
        });

        setFilas(mapeadas);
        setErrores(errs);

        if (mapeadas.length === 0) {
          toast.error("El archivo no contiene registros");
        } else {
          toast.success(`📋 ${mapeadas.length} registro(s) leído(s)`);
        }
      } catch (error) {
        console.error(error);
        toast.error("No se pudo leer el archivo. Verifica el formato.");
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const handleImportar = async () => {
    if (!eventoId) return toast.error("Selecciona un evento destino");
    if (filas.length === 0)
      return toast.error("Sube un archivo con participantes");

    setCargando(true);
    setResultado(null);
    try {
      const res = await fetch("/api/importacion", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ eventoId, participantes: filas }),
      });
      const data = await res.json();
      if (res.ok) {
        setResultado(data.resumen);
        toast.success(data.message);
      } else {
        toast.error(data.message || "Error al importar");
      }
    } catch (error) {
      toast.error("Error de conexión");
    } finally {
      setCargando(false);
    }
  };

  const limpiar = () => {
    setArchivo(null);
    setFilas([]);
    setErrores([]);
    setResultado(null);
  };

  const descargarPlantilla = () => {
    const csv =
      "nombre,apellido,email,dni,telefono\n" +
      "Juan,Pérez,juan.perez@email.com,12345678,999888777\n";
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "plantilla_participantes.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  const filasValidas = filas.filter((r) => r.nombre && r.email).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Inscripción Masiva</h1>
          <p className="text-gray-600 mt-1">
            Importa participantes desde archivos CSV o Excel e inscríbelos en un
            evento
          </p>
        </div>
        <button onClick={descargarPlantilla} className="btn-secondary">
          📄 Descargar plantilla CSV
        </button>
      </div>

      {/* Wizard */}
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
            value={eventoId}
            onChange={(e) => setEventoId(e.target.value)}
            className="input-field md:w-96"
          >
            <option value="">-- Seleccionar evento destino --</option>
            {eventos.map((ev) => (
              <option key={ev.id} value={ev.id}>
                {ev.nombre}
              </option>
            ))}
          </select>
          {eventos.length === 0 && (
            <p className="text-xs text-amber-600 mt-2">
              No hay eventos registrados. Crea un evento primero.
            </p>
          )}
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
                {archivo ? archivo.name : "Haz clic para seleccionar el archivo"}
              </p>
              <p className="text-sm text-gray-500 mt-1">
                Formatos soportados: .csv, .xlsx, .xls
              </p>
              <p className="text-xs text-gray-400 mt-2">
                Columnas requeridas: nombre, apellido, email, dni, telefono
              </p>
            </label>
          </div>
          <p className="text-xs text-gray-500 mt-2">
            ℹ️ A los participantes nuevos se les crea el usuario con su{" "}
            <strong>DNI como contraseña inicial</strong> (o <code>123456</code>{" "}
            si no tiene DNI). Si el participante ya existe, solo se le inscribe en
            el evento.
          </p>
        </div>

        {/* Paso 3: Vista Previa */}
        {filas.length > 0 && (
          <div className="animate-fadeIn">
            <h3 className="text-lg font-bold text-gray-800 mb-3 flex items-center gap-2">
              <span className="w-8 h-8 rounded-full bg-red-600 text-white flex items-center justify-center text-sm">
                3
              </span>
              Previsualizar e Importar
            </h3>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4 text-sm text-blue-800">
              ℹ️ Se leyeron <strong>{filas.length}</strong> registros,{" "}
              <strong>{filasValidas}</strong> válidos.
              {errores.length > 0 && (
                <span className="text-red-600">
                  {" "}
                  {errores.length} con problemas (se omitirán).
                </span>
              )}
            </div>

            {errores.length > 0 && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4 text-sm text-red-700 max-h-32 overflow-y-auto">
                {errores.slice(0, 20).map((e, i) => (
                  <div key={i}>• {e}</div>
                ))}
                {errores.length > 20 && <div>… y {errores.length - 20} más</div>}
              </div>
            )}

            <div className="overflow-x-auto rounded-lg border border-gray-200">
              <table className="table-base">
                <thead className="table-header">
                  <tr>
                    <th className="table-th">#</th>
                    <th className="table-th">Nombre</th>
                    <th className="table-th">Apellido</th>
                    <th className="table-th">Email</th>
                    <th className="table-th">DNI</th>
                    <th className="table-th">Teléfono</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filas.slice(0, 50).map((row, i) => {
                    const invalida = !row.nombre || !row.email;
                    return (
                      <tr
                        key={i}
                        className={invalida ? "bg-red-50" : "hover:bg-gray-50"}
                      >
                        <td className="table-td text-gray-400">{i + 2}</td>
                        <td className="table-td">{row.nombre || "—"}</td>
                        <td className="table-td">{row.apellido || "—"}</td>
                        <td className="table-td">{row.email || "—"}</td>
                        <td className="table-td">{row.dni || "—"}</td>
                        <td className="table-td">{row.telefono || "—"}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            {filas.length > 50 && (
              <p className="text-xs text-gray-500 mt-2">
                Mostrando los primeros 50 de {filas.length} registros. Se
                importarán todos.
              </p>
            )}
          </div>
        )}

        {/* Resultado de la importación */}
        {resultado && (
          <div className="animate-fadeIn bg-green-50 border border-green-200 rounded-xl p-5">
            <h3 className="text-lg font-bold text-green-800 mb-3">
              ✅ Resumen de la importación
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <ResumenItem
                label="Usuarios creados"
                valor={resultado.usuariosCreados}
                color="text-green-700"
              />
              <ResumenItem
                label="Ya existían"
                valor={resultado.usuariosExistentes}
                color="text-blue-700"
              />
              <ResumenItem
                label="Inscripciones nuevas"
                valor={resultado.inscripcionesNuevas}
                color="text-purple-700"
              />
              <ResumenItem
                label="Ya inscritos"
                valor={resultado.yaInscritos}
                color="text-gray-600"
              />
            </div>
            {resultado.errores && resultado.errores.length > 0 && (
              <div className="mt-4 bg-white border border-red-200 rounded-lg p-3 text-sm text-red-700 max-h-32 overflow-y-auto">
                <p className="font-semibold mb-1">
                  {resultado.errores.length} fila(s) con error:
                </p>
                {resultado.errores.map((e, i) => (
                  <div key={i}>• {e}</div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Botones de Acción */}
        <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
          <button onClick={limpiar} className="btn-secondary">
            Limpiar
          </button>
          <button
            onClick={handleImportar}
            disabled={cargando || !eventoId || filasValidas === 0}
            className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {cargando
              ? "Procesando..."
              : `Importar y Crear Usuarios${
                  filasValidas ? ` (${filasValidas})` : ""
                }`}
          </button>
        </div>
      </div>
    </div>
  );
}

function ResumenItem({ label, valor, color }) {
  return (
    <div className="bg-white rounded-lg p-3 border border-gray-100 text-center">
      <p className={`text-2xl font-bold ${color}`}>{valor}</p>
      <p className="text-xs text-gray-600 mt-1">{label}</p>
    </div>
  );
}
