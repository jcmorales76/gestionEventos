import { useState } from "react";
import ModalSubirMaterial from "../components/modals/ModalSubirMaterial"; // <--- IMPORTANTE

export default function Materiales() {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterEvento, setFilterEvento] = useState("Todos");
  const [filterTipo, setFilterTipo] = useState("Todos");

  // Estado para controlar el Modal
  const [modalSubirOpen, setModalSubirOpen] = useState(false);

  const materiales = [
    {
      id: 1,
      nombre: "Guía de Liderazgo 2026.pdf",
      evento: "Curso de Liderazgo Ejecutivo",
      tipo: "PDF",
      descargas: 45,
      tamaño: "2.4 MB",
      fecha: "10 May 2026",
    },
    {
      id: 2,
      nombre: "Innovación Digital.pptx",
      evento: "Seminario de Innovación Digital",
      tipo: "Presentación",
      descargas: 32,
      tamaño: "15.8 MB",
      fecha: "12 May 2026",
    },
    {
      id: 3,
      nombre: "Negociación Avanzada.mp4",
      evento: "Taller de Negociación Avanzada",
      tipo: "Video",
      descargas: 28,
      tamaño: "145 MB",
      fecha: "08 May 2026",
    },
    {
      id: 4,
      nombre: "Finanzas Corporativas.docx",
      evento: "Congreso Internacional de Finanzas",
      tipo: "Documento",
      descargas: 56,
      tamaño: "1.2 MB",
      fecha: "15 May 2026",
    },
  ];

  const materialesFiltrados = materiales.filter((mat) => {
    const matchSearch =
      mat.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      mat.evento.toLowerCase().includes(searchTerm.toLowerCase());
    const matchEvento = filterEvento === "Todos" || mat.evento === filterEvento;
    const matchTipo = filterTipo === "Todos" || mat.tipo === filterTipo;
    return matchSearch && matchEvento && matchTipo;
  });

  const getTipoIcon = (tipo) => {
    switch (tipo) {
      case "PDF":
        return "📄";
      case "Video":
        return "🎥";
      case "Presentación":
        return "📊";
      case "Documento":
        return "📝";
      default:
        return "📦";
    }
  };

  const getTipoColor = (tipo) => {
    switch (tipo) {
      case "PDF":
        return "bg-red-100 text-red-700";
      case "Video":
        return "bg-purple-100 text-purple-700";
      case "Presentación":
        return "bg-blue-100 text-blue-700";
      case "Documento":
        return "bg-gray-100 text-gray-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Materiales de Eventos
          </h1>
          <p className="text-gray-600 mt-1">
            Gestiona documentos, presentaciones y recursos por evento
          </p>
        </div>
        {/* Botón que ahora abre el modal */}
        <button onClick={() => setModalSubirOpen(true)} className="btn-primary">
          + Subir Material
        </button>
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <input
              type="text"
              placeholder="Buscar material..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all outline-none text-sm"
            />
          </div>
          <select
            value={filterEvento}
            onChange={(e) => setFilterEvento(e.target.value)}
            className="input-field md:w-48"
          >
            <option>Todos los eventos</option>
            <option>Curso de Liderazgo</option>
            <option>Seminario de Innovación</option>
          </select>
          <select
            value={filterTipo}
            onChange={(e) => setFilterTipo(e.target.value)}
            className="input-field md:w-48"
          >
            <option>Todos los tipos</option>
            <option>PDF</option>
            <option>Video</option>
            <option>Presentación</option>
            <option>Documento</option>
          </select>
        </div>
      </div>

      {/* Tabla */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="table-base">
            <thead className="table-header">
              <tr>
                <th className="table-th">Material</th>
                <th className="table-th">Evento Asociado</th>
                <th className="table-th">Tipo</th>
                <th className="table-th">Tamaño</th>
                <th className="table-th">Descargas</th>
                <th className="table-th">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {materialesFiltrados.map((mat) => (
                <tr key={mat.id} className="hover:bg-gray-50 transition-colors">
                  <td className="table-td">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center text-xl flex-shrink-0">
                        {getTipoIcon(mat.tipo)}
                      </div>
                      <span className="font-medium text-gray-900 text-sm">
                        {mat.nombre}
                      </span>
                    </div>
                  </td>
                  <td className="table-td">
                    <span className="text-sm text-gray-700">{mat.evento}</span>
                  </td>
                  <td className="table-td">
                    <span className={`badge ${getTipoColor(mat.tipo)}`}>
                      {mat.tipo}
                    </span>
                  </td>
                  <td className="table-td">
                    <span className="text-sm text-gray-600">{mat.tamaño}</span>
                  </td>
                  <td className="table-td">
                    <span className="text-sm font-medium text-gray-900">
                      {mat.descargas}
                    </span>
                  </td>
                  <td className="table-td">
                    <div className="flex items-center gap-2">
                      <button className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                        ⬇️
                      </button>
                      <button className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                        🗑️
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* INTEGRACIÓN DEL MODAL AL FINAL DEL COMPONENTE */}
      <ModalSubirMaterial
        isOpen={modalSubirOpen}
        onClose={() => setModalSubirOpen(false)}
        onSave={(data) => {
          console.log("Material subido:", data);
          setModalSubirOpen(false);
        }}
      />
    </div>
  );
}
