import { useState, useEffect } from "react";
import { toast } from "react-hot-toast";
import Modal from "../Modal";
import ModalInscribirParticipantes from "./ModalInscribirParticipantes";
import { exportarExcel, exportarPDF } from "../../utils/exportar";

export default function ModalDetalleEvento({ isOpen, onClose, evento, onEdit, onCambio }) {
  const [inscritos, setInscritos] = useState([]);
  const [modalInscribir, setModalInscribir] = useState(false);

  useEffect(() => {
    if (isOpen && evento?.id) fetchInscritos();
  }, [isOpen, evento?.id]);

  const fetchInscritos = async () => {
    try {
      const res = await fetch(`/api/inscripciones/evento/${evento.id}`);
      if (res.ok) setInscritos(await res.json());
    } catch (error) {
      console.error(error);
    }
  };

  const quitarInscripcion = async (id) => {
    try {
      const res = await fetch(`/api/inscripciones/${id}`, { method: "DELETE" });
      if (res.ok) {
        toast.success("Inscripción quitada");
        fetchInscritos();
        if (onCambio) onCambio();
      } else {
        toast.error("No se pudo quitar (¿tiene certificado?)");
      }
    } catch (error) {
      toast.error("Error de conexión");
    }
  };

  if (!evento) return null;

  const formatoFecha = (f) =>
    f
      ? new Date(f).toLocaleDateString("es-ES", {
          day: "2-digit",
          month: "short",
          year: "numeric",
        })
      : "No definida";

  const getEstadoBadge = (estado) =>
    estado === "Activo"
      ? "badge-success"
      : estado === "Próximo"
        ? "badge-warning"
        : estado === "Finalizado"
          ? "badge-info"
          : "bg-gray-100 text-gray-700";

  // ---- Exportar lista de inscritos ----
  const filasExport = () =>
    inscritos.map((i, idx) => ({
      "#": idx + 1,
      Nombre: i.nombre,
      Apellido: i.apellido,
      DNI: i.dni || "",
      Correo: i.email,
      Empresa: i.empresa || "",
      Calidad: i.calidad || "Participante",
      Inscrito: i.fecha_inscripcion
        ? new Date(i.fecha_inscripcion).toLocaleDateString("es-ES")
        : "",
    }));

  const nombreArchivo = `inscritos_${(evento?.nombre || "evento").replace(/[^a-zA-Z0-9]/g, "_")}`;

  const handleExcel = () => {
    if (inscritos.length === 0) return toast.error("No hay inscritos que exportar");
    exportarExcel(filasExport(), nombreArchivo, "Inscritos");
  };

  const handlePDF = () => {
    if (inscritos.length === 0) return toast.error("No hay inscritos que exportar");
    exportarPDF({
      titulo: `Inscritos · ${evento.nombre}`,
      subtitulo: `Total: ${inscritos.length} · Capacidad: ${evento.capacidad || 0}`,
      columnas: [
        "#",
        "Nombre",
        "Apellido",
        "DNI",
        "Correo",
        "Empresa",
        "Calidad",
        "Inscrito",
      ],
      filas: filasExport().map((f) => [
        f["#"],
        f.Nombre,
        f.Apellido,
        f.DNI,
        f.Correo,
        f.Empresa,
        f.Calidad,
        f.Inscrito,
      ]),
      nombreArchivo,
      orientacion: "landscape",
    });
  };

  const calidadColor = (c) => {
    const v = (c || "").toLowerCase();
    if (v.includes("expositor")) return "bg-purple-100 text-purple-700";
    if (v.includes("organizador")) return "bg-blue-100 text-blue-700";
    if (v.includes("auspiciador")) return "bg-amber-100 text-amber-700";
    return "bg-gray-100 text-gray-700";
  };

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        title="Detalle del Evento"
        size="lg"
        footer={
          <>
            <button onClick={onClose} className="btn-secondary">
              Cerrar
            </button>
            <button onClick={onEdit} className="btn-primary">
              Editar Evento
            </button>
          </>
        }
      >
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-red-100 flex items-center justify-center text-2xl flex-shrink-0">
              📅
            </div>
            <div className="flex-1">
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                {evento.nombre}
              </h3>
              <span className={`badge ${getEstadoBadge(evento.estado)}`}>
                {evento.estado}
              </span>
            </div>
          </div>

          {/* Info */}
          <div className="grid grid-cols-2 gap-4 text-sm">
            <Campo label="Tipo" valor={evento.tipo} />
            <Campo label="Fecha" valor={formatoFecha(evento.fecha_inicio)} />
            <Campo label="Lugar" valor={evento.lugar || "No definido"} />
            <Campo
              label="Capacidad"
              valor={`${inscritos.length}/${evento.capacidad || 0}`}
            />
            <Campo
              label="Empresas"
              valor={`🏢 ${
                new Set(
                  inscritos.map((i) => (i.empresa || "").trim()).filter(Boolean),
                ).size
              }`}
            />
            <div className="col-span-2">
              <Campo
                label="Descripción"
                valor={evento.descripcion || "Sin descripción"}
              />
            </div>
          </div>

          {/* Participantes inscritos */}
          <div className="pt-4 border-t border-gray-100">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
              <h4 className="font-bold text-gray-900">
                Participantes inscritos ({inscritos.length})
              </h4>
              <div className="flex items-center gap-2 flex-wrap">
                <button
                  onClick={handleExcel}
                  className="btn-secondary text-sm"
                  title="Exportar a Excel"
                >
                  📊 Excel
                </button>
                <button
                  onClick={handlePDF}
                  className="btn-secondary text-sm"
                  title="Exportar a PDF"
                >
                  📄 PDF
                </button>
                <button
                  onClick={() => setModalInscribir(true)}
                  className="btn-primary text-sm"
                >
                  + Inscribir
                </button>
              </div>
            </div>

            {inscritos.length === 0 ? (
              <p className="text-sm text-gray-400 py-4 text-center">
                Aún no hay inscritos. Usa el botón para agregarlos.
              </p>
            ) : (
              <div className="border border-gray-200 rounded-lg max-h-64 overflow-y-auto divide-y divide-gray-100">
                {inscritos.map((i) => (
                  <div
                    key={i.id}
                    className="flex items-center justify-between p-3 hover:bg-gray-50"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {i.nombre} {i.apellido}
                      </p>
                      <p className="text-xs text-gray-500 truncate">
                        {i.email}
                        {i.empresa ? ` · ${i.empresa}` : ""}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full font-medium ${calidadColor(i.calidad)}`}
                      >
                        {i.calidad || "Participante"}
                      </span>
                      <button
                        onClick={() => quitarInscripcion(i.id)}
                        className="text-gray-400 hover:text-red-600 p-1"
                        title="Quitar inscripción"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </Modal>

      {modalInscribir && (
        <ModalInscribirParticipantes
          isOpen={modalInscribir}
          onClose={() => setModalInscribir(false)}
          eventoId={evento.id}
          eventoNombre={evento.nombre}
          onInscrito={() => {
            fetchInscritos();
            if (onCambio) onCambio();
          }}
        />
      )}
    </>
  );
}

function Campo({ label, valor }) {
  return (
    <div>
      <span className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
        {label}
      </span>
      <p className="text-gray-900 font-medium">{valor}</p>
    </div>
  );
}
