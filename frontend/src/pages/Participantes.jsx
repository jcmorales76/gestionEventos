import { useState } from "react";
import ModalNuevoParticipante from "../components/modals/ModalNuevoParticipante";

export default function Participantes() {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterEvento, setFilterEvento] = useState("Todos");
  const [filterEstado, setFilterEstado] = useState("Todos");

  // Estado para el modal
  const [modalParticipanteOpen, setModalParticipanteOpen] = useState(false);

  const participantes = [
    {
      id: 1,
      nombre: "Carlos",
      apellido: "Mendoza Ruiz",
      email: "carlos.mendoza@email.com",
      dni: "12345678",
      telefono: "+51 987 654 321",
      evento: "Curso de Liderazgo Ejecutivo",
      fechaInscripcion: "15 May 2026",
      estado: "Activo",
      certificado: true,
      materiales: 5,
      avatar: "CM",
    },
    {
      id: 2,
      nombre: "Ana",
      apellido: "Torres Silva",
      email: "ana.torres@email.com",
      dni: "87654321",
      telefono: "+51 912 345 678",
      evento: "Seminario de Innovación Digital",
      fechaInscripcion: "18 May 2026",
      estado: "Activo",
      certificado: false,
      materiales: 3,
      avatar: "AT",
    },
    {
      id: 3,
      nombre: "Roberto",
      apellido: "Díaz Morales",
      email: "roberto.diaz@email.com",
      dni: "45678912",
      telefono: "+51 923 456 789",
      evento: "Taller de Negociación Avanzada",
      fechaInscripcion: "10 May 2026",
      estado: "Activo",
      certificado: true,
      materiales: 4,
      avatar: "RD",
    },
  ];

  const participantesFiltrados = participantes.filter((part) => {
    const fullName = `${part.nombre} ${part.apellido}`.toLowerCase();
    const matchSearch =
      fullName.includes(searchTerm.toLowerCase()) ||
      part.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      part.dni.includes(searchTerm);
    const matchEvento =
      filterEvento === "Todos" || part.evento === filterEvento;
    const matchEstado =
      filterEstado === "Todos" || part.estado === filterEstado;
    return matchSearch && matchEvento && matchEstado;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Gestión de Participantes
          </h1>
          <p className="text-gray-600 mt-1">
            Administra todos los participantes registrados
          </p>
        </div>
        <div className="flex gap-3">
          <button className="btn-secondary">📥 Importar CSV/Excel</button>
          <button
            onClick={() => setModalParticipanteOpen(true)}
            className="btn-primary"
          >
            + Nuevo Participante
          </button>
        </div>
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <input
              type="text"
              placeholder="Buscar por nombre, email o DNI..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all outline-none text-sm"
            />
          </div>
          <select
            value={filterEvento}
            onChange={(e) => setFilterEvento(e.target.value)}
            className="input-field md:w-64"
          >
            <option>Todos los eventos</option>
            <option>Curso de Liderazgo Ejecutivo</option>
            <option>Seminario de Innovación Digital</option>
          </select>
          <select
            value={filterEstado}
            onChange={(e) => setFilterEstado(e.target.value)}
            className="input-field md:w-48"
          >
            <option>Todos los estados</option>
            <option>Activo</option>
            <option>Inactivo</option>
          </select>
        </div>
      </div>

      {/* Tabla */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="table-base">
            <thead className="table-header">
              <tr>
                <th className="table-th">Participante</th>
                <th className="table-th">Correo</th>
                <th className="table-th">Evento</th>
                <th className="table-th">Inscrito</th>
                <th className="table-th">Estado</th>
                <th className="table-th">Cert.</th>
                <th className="table-th">Materiales</th>
                <th className="table-th">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {participantesFiltrados.map((part) => (
                <tr
                  key={part.id}
                  className="hover:bg-gray-50 transition-colors"
                >
                  <td className="table-td">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center text-red-600 font-semibold flex-shrink-0">
                        {part.avatar}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900 text-sm">
                          {part.nombre} {part.apellido}
                        </p>
                        <p className="text-xs text-gray-500">DNI: {part.dni}</p>
                      </div>
                    </div>
                  </td>
                  <td className="table-td">
                    <div>
                      <p className="text-sm text-gray-900">{part.email}</p>
                      <p className="text-xs text-gray-500">{part.telefono}</p>
                    </div>
                  </td>
                  <td className="table-td">
                    <span className="text-sm text-gray-700">{part.evento}</span>
                  </td>
                  <td className="table-td">
                    <span className="text-sm text-gray-600">
                      {part.fechaInscripcion}
                    </span>
                  </td>
                  <td className="table-td">
                    <span
                      className={`badge ${part.estado === "Activo" ? "badge-success" : "badge-danger"}`}
                    >
                      {part.estado}
                    </span>
                  </td>
                  <td className="table-td">
                    {part.certificado ? (
                      <span className="badge badge-success">✓ Emitido</span>
                    ) : (
                      <span className="badge bg-gray-100 text-gray-600">
                        Pendiente
                      </span>
                    )}
                  </td>
                  <td className="table-td">
                    <span className="text-sm font-medium text-gray-900">
                      {part.materiales}
                    </span>
                    <span className="text-xs text-gray-500"> descargados</span>
                  </td>
                  <td className="table-td">
                    <div className="flex items-center gap-2">
                      <button className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                        👁️
                      </button>
                      <button className="p-2 text-purple-600 hover:bg-purple-50 rounded-lg transition-colors">
                        ✏️
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

      {/* MODAL INTEGRADO */}
      <ModalNuevoParticipante
        isOpen={modalParticipanteOpen}
        onClose={() => setModalParticipanteOpen(false)}
        onSave={(data) => {
          console.log("Participante guardado:", data);
          setModalParticipanteOpen(false);
        }}
      />
    </div>
  );
}
