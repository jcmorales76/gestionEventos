import { useState } from "react";
import Modal from "../Modal";

export default function ModalImportacionMasiva({ isOpen, onClose, onImport }) {
  const [evento, setEvento] = useState("");
  const [file, setFile] = useState(null);

  const handleImport = () => {
    if (evento && file) {
      onImport({ evento, archivo: file });
      onClose();
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Importación Masiva de Participantes"
      size="lg"
      footer={
        <>
          <button onClick={onClose} className="btn-secondary">
            Cancelar
          </button>
          <button onClick={handleImport} className="btn-primary">
            Importar Participantes
          </button>
        </>
      }
    >
      <div className="space-y-4">
        <p className="text-sm text-gray-600 bg-blue-50 p-3 rounded-lg">
          ℹ️ Importa participantes en masa desde archivos CSV o Excel. Se
          crearán usuarios automáticamente.
        </p>
        <div>
          <label className="label-input">Evento destino *</label>
          <select
            value={evento}
            onChange={(e) => setEvento(e.target.value)}
            className="input-field"
          >
            <option value="">-- Seleccionar evento --</option>
            <option>Curso de Liderazgo</option>
            <option>Seminario de Innovación</option>
          </select>
        </div>
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-red-500 transition-colors cursor-pointer">
          <input
            type="file"
            accept=".csv,.xlsx,.xls"
            onChange={(e) => setFile(e.target.files[0])}
            className="hidden"
            id="file-import"
          />
          <label htmlFor="file-import" className="cursor-pointer">
            <svg
              className="w-10 h-10 mx-auto text-gray-400 mb-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
              />
            </svg>
            <p className="font-medium text-gray-700">
              {file ? file.name : "Haz clic para seleccionar el archivo"}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              Formatos: .csv, .xlsx, .xls | Columnas: nombre, apellido, email,
              dni, telefono
            </p>
          </label>
        </div>
      </div>
    </Modal>
  );
}
