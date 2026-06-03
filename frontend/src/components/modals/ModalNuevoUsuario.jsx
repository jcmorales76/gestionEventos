import { useState } from "react";
import Modal from "../Modal";

export default function ModalNuevoUsuario({ isOpen, onClose, onSave }) {
  const [form, setForm] = useState({
    nombre: "",
    apellido: "",
    email: "",
    password: "",
    rol: "Participante",
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
      title="Nuevo Usuario"
      footer={
        <>
          <button onClick={onClose} className="btn-secondary">
            Cancelar
          </button>
          <button onClick={handleSubmit} className="btn-primary">
            Crear Usuario
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
            <label className="label-input">Apellido</label>
            <input
              name="apellido"
              value={form.apellido}
              onChange={handleChange}
              className="input-field"
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
          <div className="col-span-2">
            <label className="label-input">Contraseña *</label>
            <input
              type="password"
              name="password"
              value={form.password}
              onChange={handleChange}
              className="input-field"
              required
            />
          </div>
          <div>
            <label className="label-input">Rol *</label>
            <select
              name="rol"
              value={form.rol}
              onChange={handleChange}
              className="input-field"
            >
              <option>Administrador</option>
              <option>Participante</option>
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
