import { useState, useEffect } from "react";
import { toast } from "react-hot-toast";
import Modal from "../Modal";

export default function ModalNuevaSesion({
  isOpen,
  onClose,
  eventoId,
  onCrear,
}) {
  const [sesion, setSesion] = useState("");
  const [creando, setCreando] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setSesion("");
    }
  }, [isOpen]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!sesion.trim()) {
      toast.error("Ingresa el nombre de la sesión");
      return;
    }

    setCreando(true);
    try {
      const res = await fetch(
        "http://localhost:5000/api/materiales/crear-sesion",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ eventoId, sesion: sesion.trim() }),
        },
      );

      const data = await res.json();
      if (res.ok) {
        // ✅ Toast de éxito con el estilo de la línea gráfica
        toast.success(`✅ Sesión "${sesion.trim()}" creada exitosamente`);
        onCrear();
        onClose();
      } else {
        toast.error(data.message || "Error al crear sesión");
      }
    } catch (error) {
      toast.error("Error de conexión al crear sesión");
    } finally {
      setCreando(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Nueva Sesión"
      size="md"
      footer={
        <>
          <button onClick={onClose} className="btn-secondary">
            Cancelar
          </button>
          <button
            onClick={handleSubmit}
            disabled={creando}
            className="btn-primary disabled:opacity-50"
          >
            {creando ? "Creando..." : "✅ Crear Sesión"}
          </button>
        </>
      }
    >
      <form className="space-y-4">
        <div>
          <label className="label-input">Nombre de la Sesión *</label>
          <input
            type="text"
            value={sesion}
            onChange={(e) => setSesion(e.target.value)}
            className="input-field"
            placeholder="Ej: Sesión 01, Módulo 1, Clase Introductoria"
            required
          />
          <p className="text-xs text-gray-500 mt-1">
            Ejemplos: "Sesión 01", "Módulo 1: Introducción", "Clase 1 -
            Conceptos Básicos"
          </p>
        </div>
      </form>
    </Modal>
  );
}
