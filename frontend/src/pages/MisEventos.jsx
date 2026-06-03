export default function MisEventos() {
  // Datos simulados del participante
  const misCursos = [
    {
      id: 1,
      nombre: "Curso de Liderazgo Ejecutivo",
      fecha: "15 Jun 2026",
      estado: "Activo",
      progreso: 75,
    },
    {
      id: 2,
      nombre: "Seminario de Innovación Digital",
      fecha: "22 Jun 2026",
      estado: "Pendiente",
      progreso: 0,
    },
    {
      id: 3,
      nombre: "Taller de Negociación",
      fecha: "01 Jun 2026",
      estado: "Finalizado",
      progreso: 100,
    },
  ];

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
        <h2 className="text-xl font-bold text-gray-900 mb-2">
          Mis Cursos Inscritos
        </h2>
        <p className="text-sm text-gray-600 mb-6">
          Revisa tu progreso y los eventos próximos.
        </p>

        <div className="space-y-4">
          {misCursos.map((curso) => (
            <div
              key={curso.id}
              className="flex flex-col md:flex-row md:items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <div className="flex-1 mb-4 md:mb-0">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-semibold text-gray-900">
                    {curso.nombre}
                  </h3>
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full ${
                      curso.estado === "Activo"
                        ? "bg-green-100 text-green-700"
                        : curso.estado === "Pendiente"
                          ? "bg-yellow-100 text-yellow-700"
                          : "bg-gray-100 text-gray-600"
                    }`}
                  >
                    {curso.estado}
                  </span>
                </div>
                <p className="text-sm text-gray-500"> Fecha: {curso.fecha}</p>
              </div>

              <div className="w-full md:w-48">
                <div className="flex justify-between text-xs mb-1">
                  <span>Progreso</span>
                  <span className="font-bold">{curso.progreso}%</span>
                </div>
                <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${curso.progreso === 100 ? "bg-green-500" : "bg-red-600"}`}
                    style={{ width: `${curso.progreso}%` }}
                  ></div>
                </div>
              </div>

              <div className="mt-4 md:mt-0 md:ml-4 flex gap-2">
                {curso.estado === "Finalizado" ? (
                  <button className="btn-primary text-xs">
                    Ver Certificado
                  </button>
                ) : (
                  <button className="btn-primary text-xs">
                    Ingresar al Aula
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
