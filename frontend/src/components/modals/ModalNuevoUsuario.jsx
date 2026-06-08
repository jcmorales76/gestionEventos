import { useState, useEffect } from "react";
import Modal from "../Modal";

export default function ModalNuevoUsuario({
  isOpen,
  onClose,
  usuario,
  onSave,
}) {
  const [form, setForm] = useState({
    nombre: "",
    apellido: "",
    email: "",
    password: "",
    rol: "admin",
    dni: "",
    telefono: "",
    estado: "Activo",
  });

  // Cargar datos si es edición
  useEffect(() => {
    if (isOpen) {
      if (usuario) {
        // Modo edición
        setForm({
          nombre: usuario.nombre || "",
          apellido: usuario.apellido || "",
          email: usuario.email || "",
          password: "", // No precargar password
          rol: usuario.rol || "admin",
          dni: usuario.dni || "",
          telefono: usuario.telefono || "",
          estado: usuario.estado || "Activo",
        });
      } else {
        // Modo creación
        setForm({
          nombre: "",
          apellido: "",
          email: "",
          password: "",
          rol: "admin",
          dni: "",
          telefono: "",
          estado: "Activo",
        });
      }
    }
  }, [isOpen, usuario]);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // Solo enviar password si se ingresó uno nuevo (o si es creación)
    const dataToSend = { ...form, id: usuario?.id };
    if (usuario && !form.password) {
      delete dataToSend.password;
    }
    onSave(dataToSend);
  };

  const isEdit = !!usuario;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEdit ? "Editar Usuario" : "Nuevo Usuario"}
      size="lg"
      footer={
        <>
          <button onClick={onClose} className="btn-secondary">
            Cancelar
          </button>
          <button onClick={handleSubmit} className="btn-primary">
            {isEdit ? "Guardar Cambios" : "Crear Usuario"}
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
            <label className="label-input">
              {isEdit ? "Nueva Contraseña (opcional)" : "Contraseña *"}
            </label>
            <input
              type="password"
              name="password"
              value={form.password}
              onChange={handleChange}
              className="input-field"
              placeholder={
                isEdit ? "Dejar vacío para no cambiar" : "Mínimo 6 caracteres"
              }
              required={!isEdit}
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
              <option value="admin">Administrador</option>
              <option value="participante">Participante</option>
            </select>
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
          <div className="col-span-2">
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
