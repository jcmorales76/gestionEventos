import { useState, useEffect } from "react";
import { toast } from "react-hot-toast";
import Modal from "../Modal";

const FORM_VACIO = {
  nombre: "",
  apellido: "",
  email: "",
  dni: "",
  telefono: "",
  empresa: "",
  evento: "",
  estado: "Activo",
};

export default function ModalNuevoParticipante({
  isOpen,
  onClose,
  onSave,
  participante = null,
}) {
  const esEdicion = Boolean(participante);
  const [form, setForm] = useState(FORM_VACIO);

  // Prellenar el formulario al abrir el modal
  useEffect(() => {
    if (isOpen) {
      if (participante) {
        setForm({
          nombre: participante.nombre || "",
          apellido: participante.apellido || "",
          email: participante.email || "",
          dni: participante.dni || "",
          telefono: participante.telefono || "",
          empresa: participante.empresa || "",
          evento: participante.evento || "",
          estado: participante.estado || "Activo",
        });
      } else {
        setForm(FORM_VACIO);
      }
    }
  }, [isOpen, participante]);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const faltan = [];
    if (!form.nombre.trim()) faltan.push("Nombre");
    if (!form.apellido.trim()) faltan.push("Apellido");
    if (!form.email.trim()) faltan.push("Correo");
    if (!form.dni.trim()) faltan.push("DNI");
    if (!form.telefono.trim()) faltan.push("Teléfono");
    if (faltan.length) {
      return toast.error("Campos obligatorios: " + faltan.join(", "));
    }
    onSave(form);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={esEdicion ? "Editar Participante" : "Nuevo Participante"}
      footer={
        <>
          <button onClick={onClose} className="btn-secondary">
            Cancelar
          </button>
          <button onClick={handleSubmit} className="btn-primary">
            {esEdicion ? "Actualizar" : "Guardar"}
          </button>
        </>
      }
    >
      <form className="space-y-4" onSubmit={handleSubmit}>
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
            <label className="label-input">DNI / Documento *</label>
            <input
              name="dni"
              value={form.dni}
              onChange={handleChange}
              className="input-field"
              required
            />
          </div>
          <div>
            <label className="label-input">Teléfono *</label>
            <input
              name="telefono"
              value={form.telefono}
              onChange={handleChange}
              className="input-field"
              required
            />
          </div>
          <div className="col-span-2">
            <label className="label-input">Empresa</label>
            <input
              name="empresa"
              value={form.empresa}
              onChange={handleChange}
              className="input-field"
              placeholder="Nombre de la empresa"
            />
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
