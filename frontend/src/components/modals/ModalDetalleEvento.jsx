import Modal from "../Modal";

export default function ModalDetalleEvento({ isOpen, onClose, evento }) {
  if (!evento) return null;
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
          <button className="btn-primary">Editar Evento</button>
        </>
      }
    >
      <div className="space-y-4">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-lg bg-red-100 flex items-center justify-center text-red-600 text-xl">
            📅
          </div>
          <div>
            <h4 className="font-bold text-lg text-gray-900">{evento.nombre}</h4>
            <span
              className={`badge ${evento.estado === "Activo" ? "badge-success" : "badge-warning"}`}
            >
              {evento.estado}
            </span>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="font-medium text-gray-600">Tipo:</span>{" "}
            <p className="text-gray-900">{evento.tipo}</p>
          </div>
          <div>
            <span className="font-medium text-gray-600">Fecha:</span>{" "}
            <p className="text-gray-900">{evento.fecha}</p>
          </div>
          <div>
            <span className="font-medium text-gray-600">Lugar:</span>{" "}
            <p className="text-gray-900">{evento.lugar}</p>
          </div>
          <div>
            <span className="font-medium text-gray-600">Inscritos:</span>{" "}
            <p className="text-gray-900">
              {evento.inscritos}/{evento.capacidad}
            </p>
          </div>
          <div className="col-span-2">
            <span className="font-medium text-gray-600">Expositor:</span>{" "}
            <p className="text-gray-900">{evento.expositor}</p>
          </div>
          <div className="col-span-2">
            <span className="font-medium text-gray-600">Descripción:</span>{" "}
            <p className="text-gray-700 mt-1">
              {evento.descripcion || "Sin descripción"}
            </p>
          </div>
        </div>
      </div>
    </Modal>
  );
}
