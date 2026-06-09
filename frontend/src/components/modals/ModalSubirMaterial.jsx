import { useState, useEffect } from "react";
import Modal from "../Modal";

export default function ModalSubirMaterial({
  isOpen,
  onClose,
  eventoId,
  sesiones,
  sesionPreseleccionada,
  onUpload,
}) {
  const [form, setForm] = useState({
    sesion: "",
    descripcion: "",
  });
  const [archivo, setArchivo] = useState(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setForm({
        sesion: sesionPreseleccionada || "",
        descripcion: "",
      });
      setArchivo(null);
    }
  }, [isOpen, sesionPreseleccionada]);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 100 * 1024 * 1024) {
        alert("El archivo es demasiado grande (máximo 100MB)");
        return;
      }
      setArchivo(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!archivo) {
      alert("Selecciona un archivo");
      return;
    }
    if (!form.sesion) {
      alert("Selecciona o crea una sesión");
      return;
    }

    setUploading(true);
    const formData = new FormData();
    formData.append("archivo", archivo);
    formData.append("eventoId", eventoId);
    formData.append("sesion", form.sesion);
    formData.append("descripcion", form.descripcion);

    try {
      const res = await fetch("http://localhost:5000/api/materiales/upload", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (res.ok) {
        onUpload();
        onClose();
      } else {
        alert(data.message || "Error al subir material");
      }
    } catch (error) {
      alert("Error de conexión");
    } finally {
      setUploading(false);
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i];
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Subir Material"
      size="lg"
      footer={
        <>
          <button onClick={onClose} className="btn-secondary">
            Cancelar
          </button>
          <button
            onClick={handleSubmit}
            disabled={uploading || !archivo}
            className="btn-primary disabled:opacity-50"
          >
            {uploading ? "Subiendo..." : "📤 Subir Material"}
          </button>
        </>
      }
    >
      <form className="space-y-4">
        <div>
          <label className="label-input">Sesión *</label>
          <div className="flex gap-2">
            <select
              name="sesion"
              value={form.sesion}
              onChange={handleChange}
              className="input-field flex-1"
              required
            >
              <option value="">-- Seleccionar sesión --</option>
              {sesiones.map((sesion, idx) => (
                <option key={idx} value={sesion}>
                  {sesion}
                </option>
              ))}
            </select>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Si no existe la sesión, créala primero desde el botón "+ Nueva
            Sesión"
          </p>
        </div>

        <div>
          <label className="label-input">Archivo *</label>
          <input
            type="file"
            onChange={handleFileChange}
            className="input-field"
            accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.zip,.rar,.jpg,.jpeg,.png,.mp4,.avi,.mov"
            required
          />
          <p className="text-xs text-gray-500 mt-1">
            Formatos: PDF, Word, Excel, PowerPoint, Texto, ZIP, Imágenes, Videos
            • Máximo 100MB
          </p>
          {archivo && (
            <div className="mt-2 bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-blue-800">
              <strong>Archivo:</strong> {archivo.name}
              <br />
              <strong>Tamaño:</strong> {formatFileSize(archivo.size)}
            </div>
          )}
        </div>

        <div>
          <label className="label-input">Descripción (opcional)</label>
          <textarea
            name="descripcion"
            value={form.descripcion}
            onChange={handleChange}
            className="input-field h-20 resize-none"
            placeholder="Breve descripción del material..."
          />
        </div>
      </form>
    </Modal>
  );
}
