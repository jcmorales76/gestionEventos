import { useState } from "react";
import Modal from "../Modal";

export default function ModalNuevoParticipante({ isOpen, onClose, onSave }) {
  const [form, setForm] = useState({
    nombre: "",
    apellido: "",
    email: "",
    dni: "",
    telefono: "",
    evento: "",
    estado: "Activo",
  });
  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });
  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(form);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Nuevo Participante"
      footer={
        <>
          <button onClick={onClose} className="btn-secondary">
            Cancelar
          </button>
          <button onClick={handleSubmit} className="btn-primary">
            Guardar
          </button>
        </>
      }
    >
      <form className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label-input">Nombre *</label>
            <input
              name="nombre"
              value={form.nombre}
              onChange={handleChange}
              className="input-field"
              required
            />
          </div>
          <div>
            <label className="label-input">Apellido *</label>
            <input
              name="apellido"
              value={form.apellido}
              onChange={handleChange}
              className="input-field"
              required
            />
          </div>
          <div className="col-span-2">
            <label className="label-input">Correo electrónico *</label>
            <input
              type="email"
              name="email"
              value={form.email}
              onChange={handleChange}
              className="input-field"
              required
            />
          </div>
          <div>
            <label className="label-input">DNI / Documento</label>
            <input
              name="dni"
              value={form.dni}
              onChange={handleChange}
              className="input-field"
            />
          </div>
          <div>
            <label className="label-input">Teléfono</label>
            <input
              name="telefono"
              value={form.telefono}
              onChange={handleChange}
              className="input-field"
            />
          </div>
          <div>
            <label className="label-input">Evento</label>
            <select
              name="evento"
              value={form.evento}
              onChange={handleChange}
              className="input-field"
            >
              <option value="">-- Sin evento asignado --</option>
              <option>Curso de Liderazgo</option>
              <option>Seminario de Innovación</option>
            </select>
          </div>
          <div>
            <label className="label-input">Estado</label>
            <select
              name="estado"
              value={form.estado}
              onChange={handleChange}
              className="input-field"
            >
              <option>Activo</option>
              <option>Inactivo</option>
            </select>
          </div>
        </div>
      </form>
    </Modal>
  );
}
