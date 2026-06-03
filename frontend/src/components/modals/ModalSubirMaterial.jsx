import { useState } from "react";
import Modal from "../Modal";

export default function ModalSubirMaterial({ isOpen, onClose, onSave }) {
  const [form, setForm] = useState({
    evento: "",
    nombre: "",
    tipo: "PDF",
    descripcion: "",
    archivo: null,
  });
  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });
  const handleFile = (e) => setForm({ ...form, archivo: e.target.files[0] });
  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(form);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Subir Material"
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
          <div className="col-span-2">
            <label className="label-input">Evento *</label>
            <select
              name="evento"
              value={form.evento}
              onChange={handleChange}
              className="input-field"
              required
            >
              <option value="">-- Seleccionar evento --</option>
              <option>Curso de Liderazgo</option>
              <option>Seminario de Innovación</option>
            </select>
          </div>
          <div className="col-span-2">
            <label className="label-input">Nombre del Material *</label>
            <input
              name="nombre"
              value={form.nombre}
              onChange={handleChange}
              className="input-field"
              required
            />
          </div>
          <div>
            <label className="label-input">Tipo</label>
            <select
              name="tipo"
              value={form.tipo}
              onChange={handleChange}
              className="input-field"
            >
              <option>PDF</option>
              <option>Presentación</option>
              <option>Video</option>
              <option>Documento</option>
              <option>Otro</option>
            </select>
          </div>
          <div>
            <label className="label-input">Descripción</label>
            <input
              name="descripcion"
              value={form.descripcion}
              onChange={handleChange}
              className="input-field"
            />
          </div>
          <div className="col-span-2">
            <label className="label-input">Archivo</label>
            <input type="file" onChange={handleFile} className="input-field" />
          </div>
        </div>
      </form>
    </Modal>
  );
}
