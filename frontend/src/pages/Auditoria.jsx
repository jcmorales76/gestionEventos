import { useEffect, useState, useCallback } from "react";
import toast from "react-hot-toast";
import { exportarExcel, exportarPDF } from "../utils/exportar";

// ============================================================================
//  Bitácora de auditoría (solo admin): trazabilidad de acciones de usuarios
// ============================================================================

// Etiquetas legibles por módulo y color por acción.
const MODULO_LABEL = {
  auth: "Acceso",
  eventos: "Eventos",
  usuarios: "Usuarios",
  participantes: "Participantes",
  materiales: "Materiales",
  certificados: "Certificados",
  plantillas: "Plantillas",
  encuestas: "Encuestas",
  inscripciones: "Inscripciones",
  finanzas: "Finanzas",
  config: "Configuración",
  "tipos-evento": "Tipos de evento",
  importacion: "Importación",
  descargas: "Descargas",
};
const labelModulo = (m) => MODULO_LABEL[m] || m;

const ACCION_COLOR = {
  crear: "bg-green-100 text-green-700",
  editar: "bg-blue-100 text-blue-700",
  eliminar: "bg-red-100 text-red-700",
  subir: "bg-purple-100 text-purple-700",
  login: "bg-emerald-100 text-emerald-700",
  login_fallido: "bg-amber-100 text-amber-700",
  login_bloqueado: "bg-orange-100 text-orange-700",
  cuenta_bloqueada: "bg-red-100 text-red-700",
  cambio_password: "bg-indigo-100 text-indigo-700",
  reset_password: "bg-indigo-100 text-indigo-700",
  desbloquear: "bg-teal-100 text-teal-700",
};
const colorAccion = (a) => ACCION_COLOR[a] || "bg-gray-100 text-gray-700";

const LIMIT = 50;

export default function Auditoria() {
  const [filtros, setFiltros] = useState({ modulos: [], acciones: [], usuarios: [] });
  const [f, setF] = useState({
    usuario_id: "",
    modulo: "",
    accion: "",
    desde: "",
    hasta: "",
    q: "",
  });
  const [data, setData] = useState(null);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);

  // Cargar valores de los desplegables
  useEffect(() => {
    fetch("/api/auditoria/filtros")
      .then((r) => r.json())
      .then(setFiltros)
      .catch(() => {});
  }, []);

  const cargar = useCallback(
    async (pagina = 1) => {
      setLoading(true);
      try {
        const qs = new URLSearchParams({ page: pagina, limit: LIMIT });
        Object.entries(f).forEach(([k, v]) => v && qs.append(k, v));
        const r = await fetch(`/api/auditoria?${qs.toString()}`);
        if (!r.ok) throw new Error();
        setData(await r.json());
        setPage(pagina);
      } catch {
        toast.error("Error al cargar la auditoría");
      } finally {
        setLoading(false);
      }
    },
    [f],
  );

  useEffect(() => {
    cargar(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const buscar = () => cargar(1);
  const limpiar = () => {
    setF({ usuario_id: "", modulo: "", accion: "", desde: "", hasta: "", q: "" });
    setTimeout(() => cargar(1), 0);
  };

  const fmt = (x) => (x ? new Date(x).toLocaleString("es-PE") : "—");

  const exportar = (tipo) => {
    const rows = data?.rows || [];
    if (rows.length === 0) return toast.error("No hay registros para exportar");
    const filas = rows.map((r) => ({
      Fecha: fmt(r.fecha),
      Usuario: r.usuario_nombre || "—",
      Rol: r.rol || "—",
      Acción: r.accion,
      Módulo: labelModulo(r.modulo),
      Descripción: r.descripcion || "",
      Entidad: r.entidad_id ?? "",
      IP: r.ip || "",
    }));
    if (tipo === "excel") {
      exportarExcel(filas, "auditoria", "Auditoría");
    } else {
      exportarPDF({
        titulo: "Bitácora de auditoría",
        subtitulo: `Página ${data.page} de ${data.paginas} · ${data.total} registro(s)`,
        columnas: ["Fecha", "Usuario", "Acción", "Módulo", "Descripción", "IP"],
        filas: rows.map((r) => [
          fmt(r.fecha),
          r.usuario_nombre || "—",
          r.accion,
          labelModulo(r.modulo),
          r.descripcion || "",
          r.ip || "",
        ]),
        nombreArchivo: "auditoria",
        orientacion: "landscape",
      });
    }
  };

  const paginas = data?.paginas || 1;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Auditoría</h1>
        <p className="text-gray-600 mt-1">
          Trazabilidad de acciones de los usuarios en todo el sistema
        </p>
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3">
          <Select
            label="Usuario"
            value={f.usuario_id}
            onChange={(v) => setF({ ...f, usuario_id: v })}
            options={[
              { value: "", label: "Todos" },
              ...filtros.usuarios.map((u) => ({ value: u.id, label: u.nombre || `#${u.id}` })),
            ]}
          />
          <Select
            label="Módulo"
            value={f.modulo}
            onChange={(v) => setF({ ...f, modulo: v })}
            options={[
              { value: "", label: "Todos" },
              ...filtros.modulos.map((m) => ({ value: m, label: labelModulo(m) })),
            ]}
          />
          <Select
            label="Acción"
            value={f.accion}
            onChange={(v) => setF({ ...f, accion: v })}
            options={[
              { value: "", label: "Todas" },
              ...filtros.acciones.map((a) => ({ value: a, label: a })),
            ]}
          />
          <Campo label="Desde">
            <input
              type="date"
              value={f.desde}
              onChange={(e) => setF({ ...f, desde: e.target.value })}
              className="input-field"
            />
          </Campo>
          <Campo label="Hasta">
            <input
              type="date"
              value={f.hasta}
              onChange={(e) => setF({ ...f, hasta: e.target.value })}
              className="input-field"
            />
          </Campo>
          <Campo label="Buscar texto">
            <input
              placeholder="Descripción, usuario, ruta…"
              value={f.q}
              onChange={(e) => setF({ ...f, q: e.target.value })}
              onKeyDown={(e) => e.key === "Enter" && buscar()}
              className="input-field"
            />
          </Campo>
        </div>
        <div className="flex flex-wrap gap-2 mt-3">
          <button onClick={buscar} className="btn-primary">
            Buscar
          </button>
          <button onClick={limpiar} className="btn-secondary">
            Limpiar
          </button>
          <div className="flex-1" />
          <button onClick={() => exportar("excel")} className="btn-secondary">
            📊 Excel
          </button>
          <button onClick={() => exportar("pdf")} className="btn-secondary">
            📄 PDF
          </button>
        </div>
      </div>

      {/* Tabla */}
      {loading ? (
        <div className="flex items-center justify-center h-40">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-red-600"></div>
        </div>
      ) : !data || data.rows.length === 0 ? (
        <div className="bg-white rounded-xl border border-dashed border-gray-200 p-8 text-center text-gray-400">
          Sin registros para los filtros seleccionados
        </div>
      ) : (
        <>
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-gray-500 text-xs uppercase">
                <tr>
                  <th className="px-4 py-3 text-left whitespace-nowrap">Fecha</th>
                  <th className="px-4 py-3 text-left">Usuario</th>
                  <th className="px-4 py-3 text-left">Acción</th>
                  <th className="px-4 py-3 text-left">Módulo</th>
                  <th className="px-4 py-3 text-left">Descripción</th>
                  <th className="px-4 py-3 text-left">IP</th>
                </tr>
              </thead>
              <tbody>
                {data.rows.map((r) => (
                  <tr key={r.id} className="border-t border-gray-50 hover:bg-gray-50/50">
                    <td className="px-4 py-2 whitespace-nowrap text-gray-500">{fmt(r.fecha)}</td>
                    <td className="px-4 py-2">
                      <span className="font-medium text-gray-800">{r.usuario_nombre || "—"}</span>
                      {r.rol && <span className="block text-[11px] text-gray-400">{r.rol}</span>}
                    </td>
                    <td className="px-4 py-2">
                      <span className={`text-xs rounded-full px-2 py-1 ${colorAccion(r.accion)}`}>
                        {r.accion}
                      </span>
                    </td>
                    <td className="px-4 py-2">{labelModulo(r.modulo)}</td>
                    <td className="px-4 py-2 text-gray-700">{r.descripcion || "—"}</td>
                    <td className="px-4 py-2 text-gray-400 text-xs">{r.ip || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Paginación */}
          <div className="flex items-center justify-between text-sm text-gray-600">
            <span>
              {data.total} registro(s) · página {data.page} de {paginas}
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => cargar(page - 1)}
                disabled={page <= 1}
                className="btn-secondary disabled:opacity-40"
              >
                ← Anterior
              </button>
              <button
                onClick={() => cargar(page + 1)}
                disabled={page >= paginas}
                className="btn-secondary disabled:opacity-40"
              >
                Siguiente →
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function Campo({ label, children }) {
  return (
    <label className="block">
      <span className="block text-xs font-semibold text-gray-500 mb-1">{label}</span>
      {children}
    </label>
  );
}

function Select({ label, value, onChange, options }) {
  return (
    <Campo label={label}>
      <select value={value} onChange={(e) => onChange(e.target.value)} className="input-field">
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </Campo>
  );
}
