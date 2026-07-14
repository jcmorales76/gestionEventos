import { useState, useEffect, useMemo } from "react";
import { toast } from "react-hot-toast";
import * as XLSX from "xlsx";
import Modal from "../Modal";

const CALIDADES = ["Participante", "Expositor", "Organizador", "Auspiciador"];

export default function ModalInscribirParticipantes({
  isOpen,
  onClose,
  eventoId,
  eventoNombre,
  onInscrito,
}) {
  const [modo, setModo] = useState("individual");
  const [calidad, setCalidad] = useState("Participante");
  const [enviando, setEnviando] = useState(false);

  // Individual
  const [participantes, setParticipantes] = useState([]);
  const [inscritosIds, setInscritosIds] = useState(new Set());
  const [seleccionados, setSeleccionados] = useState(new Set());
  const [busqueda, setBusqueda] = useState("");

  // Masivo
  const [archivo, setArchivo] = useState(null);
  const [filas, setFilas] = useState([]);

  useEffect(() => {
    if (isOpen && eventoId) {
      cargar();
      setSeleccionados(new Set());
      setBusqueda("");
      setArchivo(null);
      setFilas([]);
      setModo("individual");
      setCalidad("Participante");
    }
  }, [isOpen, eventoId]);

  const cargar = async () => {
    try {
      const [pRes, iRes] = await Promise.all([
        fetch("/api/participantes"),
        fetch(`/api/inscripciones/evento/${eventoId}`),
      ]);
      const parts = pRes.ok ? await pRes.json() : [];
      const insc = iRes.ok ? await iRes.json() : [];
      setParticipantes(parts);
      setInscritosIds(new Set(insc.map((x) => x.usuario_id)));
    } catch (error) {
      toast.error("Error al cargar participantes");
    }
  };

  const listaFiltrada = useMemo(() => {
    const q = busqueda.toLowerCase();
    return participantes.filter((p) => {
      const full = `${p.nombre} ${p.apellido} ${p.email} ${p.dni || ""}`.toLowerCase();
      return full.includes(q);
    });
  }, [participantes, busqueda]);

  const toggle = (id) => {
    setSeleccionados((prev) => {
      const n = new Set(prev);
      n.has(id) ? n.delete(id) : n.add(id);
      return n;
    });
  };

  const inscribirIndividual = async () => {
    if (seleccionados.size === 0)
      return toast.error("Selecciona al menos un participante");
    setEnviando(true);
    try {
      const res = await fetch("/api/inscripciones/masiva", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          eventoId,
          usuarioIds: [...seleccionados],
          calidad,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success("✅ " + data.message);
        if (onInscrito) onInscrito();
        onClose();
      } else {
        toast.error(data.message || "Error al inscribir");
      }
    } catch (error) {
      toast.error("Error de conexión");
    } finally {
      setEnviando(false);
    }
  };

  // ---- Masivo ----
  const norm = (v) => (v ?? "").toString().trim();
  const mapearFila = (row) => {
    const lower = {};
    Object.keys(row).forEach((k) => (lower[k.toLowerCase().trim()] = row[k]));
    return {
      nombre: norm(lower.nombre || lower.nombres),
      apellido: norm(lower.apellido || lower.apellidos),
      email: norm(lower.email || lower.correo).toLowerCase(),
      dni: norm(lower.dni || lower.documento),
      telefono: norm(lower.telefono || lower.celular),
      empresa: norm(lower.empresa),
    };
  };

  const handleArchivo = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setArchivo(file);
    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const wb = XLSX.read(new Uint8Array(evt.target.result), {
          type: "array",
        });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const json = XLSX.utils.sheet_to_json(ws, { defval: "" });
        setFilas(json.map(mapearFila).filter((r) => r.nombre && r.email));
        toast.success(`📋 ${json.length} fila(s) leída(s)`);
      } catch (err) {
        toast.error("No se pudo leer el archivo");
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const importarMasivo = async () => {
    if (filas.length === 0) return toast.error("Sube un archivo válido");
    setEnviando(true);
    try {
      const res = await fetch("/api/importacion", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ eventoId, participantes: filas, calidad }),
      });
      const data = await res.json();
      if (res.ok) {
        const r = data.resumen;
        toast.success(
          `✅ ${r.inscripcionesNuevas} inscritos (${r.usuariosCreados} nuevos, ${r.correosEnviados} correos)`,
        );
        if (onInscrito) onInscrito();
        onClose();
      } else {
        toast.error(data.message || "Error al importar");
      }
    } catch (error) {
      toast.error("Error de conexión");
    } finally {
      setEnviando(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Inscribir participantes${eventoNombre ? " · " + eventoNombre : ""}`}
      size="lg"
      footer={
        <>
          <button onClick={onClose} className="btn-secondary">
            Cancelar
          </button>
          {modo === "individual" ? (
            <button
              onClick={inscribirIndividual}
              disabled={enviando}
              className="btn-primary disabled:opacity-50"
            >
              {enviando ? "Inscribiendo..." : `Inscribir (${seleccionados.size})`}
            </button>
          ) : (
            <button
              onClick={importarMasivo}
              disabled={enviando || filas.length === 0}
              className="btn-primary disabled:opacity-50"
            >
              {enviando ? "Procesando..." : `Importar e inscribir (${filas.length})`}
            </button>
          )}
        </>
      }
    >
      <div className="space-y-4">
        {/* Pestañas */}
        <div className="flex gap-2">
          <button
            onClick={() => setModo("individual")}
            className={`flex-1 py-2 rounded-lg text-sm font-medium border ${
              modo === "individual"
                ? "bg-red-600 text-white border-red-600"
                : "bg-white text-gray-600 border-gray-200"
            }`}
          >
            👤 Uno por uno
          </button>
          <button
            onClick={() => setModo("masivo")}
            className={`flex-1 py-2 rounded-lg text-sm font-medium border ${
              modo === "masivo"
                ? "bg-red-600 text-white border-red-600"
                : "bg-white text-gray-600 border-gray-200"
            }`}
          >
            📥 Masivo (CSV/Excel)
          </button>
        </div>

        {/* Calidad (compartida) */}
        <div>
          <label className="label-input">Calidad de la inscripción</label>
          <select
            value={calidad}
            onChange={(e) => setCalidad(e.target.value)}
            className="input-field sm:w-64"
          >
            {CALIDADES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>

        {modo === "individual" ? (
          <div>
            <input
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              placeholder="Buscar por nombre, email o DNI..."
              className="input-field mb-3"
            />
            <div className="border border-gray-200 rounded-lg max-h-72 overflow-y-auto divide-y divide-gray-100">
              {listaFiltrada.length === 0 && (
                <p className="text-sm text-gray-400 p-4 text-center">
                  No hay participantes.
                </p>
              )}
              {listaFiltrada.map((p) => {
                const yaInscrito = inscritosIds.has(p.id);
                return (
                  <label
                    key={p.id}
                    className={`flex items-center gap-3 p-3 ${
                      yaInscrito
                        ? "opacity-50"
                        : "hover:bg-gray-50 cursor-pointer"
                    }`}
                  >
                    <input
                      type="checkbox"
                      disabled={yaInscrito}
                      checked={yaInscrito || seleccionados.has(p.id)}
                      onChange={() => toggle(p.id)}
                      className="w-4 h-4 text-red-600 rounded"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {p.nombre} {p.apellido}
                      </p>
                      <p className="text-xs text-gray-500 truncate">
                        {p.email}
                        {p.empresa ? ` · ${p.empresa}` : ""}
                      </p>
                    </div>
                    {yaInscrito && (
                      <span className="text-xs text-green-600 font-medium">
                        Ya inscrito
                      </span>
                    )}
                  </label>
                );
              })}
            </div>
          </div>
        ) : (
          <div>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center bg-gray-50">
              <input
                type="file"
                id="insc-file"
                className="hidden"
                accept=".csv,.xlsx,.xls"
                onChange={handleArchivo}
              />
              <label htmlFor="insc-file" className="cursor-pointer block">
                <div className="text-3xl mb-2">📥</div>
                <p className="text-sm font-medium text-gray-700">
                  {archivo ? archivo.name : "Haz clic para subir CSV o Excel"}
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  Columnas: nombre, apellido, email, dni, telefono, empresa
                </p>
              </label>
            </div>
            {filas.length > 0 && (
              <p className="text-sm text-blue-700 bg-blue-50 rounded-lg p-2 mt-3">
                {filas.length} registro(s) válido(s). Si el email ya existe, solo
                se inscribe; si no, se crea el usuario y se le envía su acceso.
              </p>
            )}
          </div>
        )}
      </div>
    </Modal>
  );
}
