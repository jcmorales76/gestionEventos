import { useState, useEffect } from "react";
import Modal from "../Modal";

export default function ModalEditarEvento({ isOpen, onClose, evento, onSave }) {
  const [form, setForm] = useState({
    nombre: "",
    tipo: "Curso",
    estado: "Próximo",
    descripcion: "",
    fechaInicio: "",
    fechaFin: "",
    horaInicio: "",
    capacidad: "",
    lugar: "",
    expositor: "",
    color: "#dc2626",
    horas: "",
    instructor: "",
  });

  // Función para formatear fecha (extraer solo YYYY-MM-DD)
  const formatDate = (dateString) => {
    if (!dateString) return "";
    // Si es un objeto Date o string ISO, extraer solo la parte de la fecha
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return "";
    return date.toISOString().split("T")[0]; // YYYY-MM-DD
  };

  // Función para formatear hora (extraer solo HH:MM)
  const formatTime = (timeString) => {
    if (!timeString) return "";
    // Si viene con segundos (HH:MM:SS), quitar los segundos
    return timeString.substring(0, 5);
  };

  // Cargar datos del evento cuando se abre el modal
  useEffect(() => {
    if (isOpen && evento) {
      setForm({
        nombre: evento.nombre || "",
        tipo: evento.tipo || "Curso",
        estado: evento.estado || "Próximo",
        descripcion: evento.descripcion || "",
        fechaInicio: formatDate(evento.fecha_inicio),
        fechaFin: formatDate(evento.fecha_fin),
        horaInicio: formatTime(evento.hora_inicio),
        capacidad: evento.capacidad || "",
        lugar: evento.lugar || "",
        expositor: evento.expositor || "",
        color: evento.colorHex || evento.color || "#dc2626",
        horas: evento.horas_academicas || "",
        instructor: evento.instructor || "",
      });
    }
  }, [isOpen, evento]);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({ ...form, id: evento?.id });
  };

  if (!evento) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Editar Evento"
      size="lg"
      footer={
        <>
          <button onClick={onClose} className="btn-secondary">
            Cancelar
          </button>
          <button onClick={handleSubmit} className="btn-primary">
            Guardar Cambios
          </button>
        </>
      }
    >
      <form className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2">
            <label className="label-input">Nombre del Evento *</label>
            <input
              name="nombre"
              value={form.nombre}
              onChange={handleChange}
              className="input-field"
              required
            />
          </div>
          <div>
            <label className="label-input">Tipo de Evento *</label>
            <select
              name="tipo"
              value={form.tipo}
              onChange={handleChange}
              className="input-field"
            >
              <option>Curso</option>
              <option>Seminario</option>
              <option>Taller</option>
              <option>Congreso</option>
              <option>Programa de Alta Dirección</option>
              <option>Conferencia</option>
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
              <option>Próximo</option>
              <option>Activo</option>
              <option>Finalizado</option>
            </select>
          </div>
          <div className="col-span-2">
            <label className="label-input">Descripción</label>
            <textarea
              name="descripcion"
              value={form.descripcion}
              onChange={handleChange}
              className="input-field h-20 resize-none"
            />
          </div>
          <div>
            <label className="label-input">Fecha de Inicio *</label>
            <input
              type="date"
              name="fechaInicio"
              value={form.fechaInicio}
              onChange={handleChange}
              className="input-field"
              required
            />
          </div>
          <div>
            <label className="label-input">Fecha de Fin</label>
            <input
              type="date"
              name="fechaFin"
              value={form.fechaFin}
              onChange={handleChange}
              className="input-field"
            />
          </div>
          <div>
            <label className="label-input">Hora de Inicio</label>
            <input
              type="time"
              name="horaInicio"
              value={form.horaInicio}
              onChange={handleChange}
              className="input-field"
            />
          </div>
          <div>
            <label className="label-input">Capacidad Máxima</label>
            <input
              type="number"
              name="capacidad"
              value={form.capacidad}
              onChange={handleChange}
              className="input-field"
            />
          </div>
          <div>
            <label className="label-input">Lugar / Modalidad</label>
            <input
              name="lugar"
              value={form.lugar}
              onChange={handleChange}
              className="input-field"
            />
          </div>
          <div>
            <label className="label-input">Expositor / Ponente</label>
            <input
              name="expositor"
              value={form.expositor}
              onChange={handleChange}
              className="input-field"
            />
          </div>
          <div>
            <label className="label-input">Color del evento</label>
            <input
              type="color"
              name="color"
              value={form.color}
              onChange={handleChange}
              className="input-field h-10 p-1"
            />
          </div>
          <div>
            <label className="label-input">Horas académicas / Créditos</label>
            <input
              type="number"
              name="horas"
              value={form.horas}
              onChange={handleChange}
              className="input-field"
            />
          </div>
          <div>
            <label className="label-input">Instructor / Organizador</label>
            <input
              name="instructor"
              value={form.instructor}
              onChange={handleChange}
              className="input-field"
            />
          </div>
        </div>
      </form>
    </Modal>
  );
}
