import Modal from "../Modal";

export default function ModalDetalleEvento({
  isOpen,
  onClose,
  evento,
  onEdit,
}) {
  if (!evento) return null;

  const formatoFecha = (fechaString) => {
    if (!fechaString) return "No definida";
    const fecha = new Date(fechaString);
    return fecha.toLocaleDateString("es-ES", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const getEstadoBadge = (estado) => {
    switch (estado) {
      case "Activo":
        return "badge-success";
      case "Próximo":
        return "badge-warning";
      case "Finalizado":
        return "badge-info";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Detalle del Evento"
      size="md"
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
        {/* Header con icono y título */}
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

        {/* Información en grid */}
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
              Tipo
            </span>
            <p className="text-gray-900 font-medium">{evento.tipo}</p>
          </div>
          <div>
            <span className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
              Fecha
            </span>
            <p className="text-gray-900">{formatoFecha(evento.fecha_inicio)}</p>
          </div>
          <div>
            <span className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
              Lugar
            </span>
            <p className="text-gray-900">{evento.lugar || "No definido"}</p>
          </div>
          <div>
            <span className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
              Inscritos
            </span>
            <p className="text-gray-900 font-semibold">
              {evento.inscritos || 0}/{evento.capacidad || 0}
            </p>
          </div>
          <div className="col-span-2">
            <span className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
              Expositor
            </span>
            <p className="text-gray-900">{evento.expositor || "No definido"}</p>
          </div>
          <div className="col-span-2">
            <span className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
              Descripción
            </span>
            <p className="text-gray-700 mt-1 leading-relaxed">
              {evento.descripcion || "Sin descripción"}
            </p>
          </div>
          {evento.horas_academicas && (
            <div>
              <span className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                Horas Académicas
              </span>
              <p className="text-gray-900">{evento.horas_academicas} horas</p>
            </div>
          )}
          {evento.instructor && (
            <div>
              <span className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                Instructor/Organizador
              </span>
              <p className="text-gray-900">{evento.instructor}</p>
            </div>
          )}
        </div>

        {/* Barra de ocupación */}
        <div className="pt-4 border-t border-gray-100">
          <div className="flex justify-between text-sm mb-2">
            <span className="text-gray-600 font-medium">Ocupación</span>
            <span className="font-semibold text-gray-900">
              {evento.inscritos || 0}/{evento.capacidad || 0}
            </span>
          </div>
          <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-red-600 rounded-full transition-all duration-500"
              style={{
                width: `${evento.capacidad > 0 ? ((evento.inscritos || 0) / evento.capacidad) * 100 : 0}%`,
              }}
            />
          </div>
        </div>
      </div>
    </Modal>
  );
}
