import { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import { toast } from "react-hot-toast";

export default function MisEventos() {
  const { user } = useAuth();
  const [eventos, setEventos] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.id) fetchEventos();
  }, [user]);

  const fetchEventos = async () => {
    setLoading(true);
    try {
      const res = await fetch(
        `http://localhost:5000/api/participantes/${user.id}/eventos`,
      );
      if (res.ok) setEventos(await res.json());
    } catch (error) {
      console.error(error);
      toast.error("Error al cargar tus eventos");
    } finally {
      setLoading(false);
    }
  };

  const estadoEvento = (ev) => {
    const ahora = new Date();
    const inicio = ev.fecha_inicio ? new Date(ev.fecha_inicio) : null;
    const fin = ev.fecha_fin ? new Date(ev.fecha_fin) : null;
    if (fin && fin < ahora)
      return { label: "Finalizado", clase: "bg-gray-100 text-gray-600" };
    if (inicio && inicio > ahora)
      return { label: "Próximo", clase: "bg-yellow-100 text-yellow-700" };
    return { label: "En curso", clase: "bg-green-100 text-green-700" };
  };

  const formatoFecha = (f) =>
    f
      ? new Date(f).toLocaleDateString("es-ES", {
          day: "numeric",
          month: "short",
          year: "numeric",
        })
      : "—";

  const finalizados = eventos.filter(
    (e) => e.fecha_fin && new Date(e.fecha_fin) < new Date(),
  ).length;
  const enCurso = eventos.length - finalizados;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
        <span className="ml-3 text-gray-600">Cargando tus eventos...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-gradient-to-br from-red-50 to-orange-100 rounded-xl p-6 border border-red-200">
          <p className="text-sm text-red-700 font-medium">Cursos / Talleres</p>
          <p className="text-3xl font-bold text-red-900 mt-1">
            {eventos.length}
          </p>
        </div>
        <div className="bg-gradient-to-br from-green-50 to-emerald-100 rounded-xl p-6 border border-green-200">
          <p className="text-sm text-green-700 font-medium">Finalizados</p>
          <p className="text-3xl font-bold text-green-900 mt-1">
            {finalizados}
          </p>
        </div>
        <div className="bg-gradient-to-br from-blue-50 to-indigo-100 rounded-xl p-6 border border-blue-200">
          <p className="text-sm text-blue-700 font-medium">En curso / Próximos</p>
          <p className="text-3xl font-bold text-blue-900 mt-1">{enCurso}</p>
        </div>
      </div>

      {/* Lista */}
      <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
        <h2 className="text-xl font-bold text-gray-900 mb-2">
          Mis Cursos Inscritos
        </h2>
        <p className="text-sm text-gray-600 mb-6">
          Revisa tu progreso y los eventos en los que estás inscrito.
        </p>

        {eventos.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-5xl mb-3">📅</div>
            <p className="text-gray-600">
              Aún no estás inscrito en ningún evento.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {eventos.map((curso) => {
              const estado = estadoEvento(curso);
              const progreso = curso.progreso || 0;
              return (
                <div
                  key={curso.inscripcion_id}
                  className="flex flex-col md:flex-row md:items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="flex-1 mb-4 md:mb-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <h3 className="font-semibold text-gray-900">
                        {curso.nombre}
                      </h3>
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full ${estado.clase}`}
                      >
                        {estado.label}
                      </span>
                      {curso.tipo && (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                          {curso.tipo}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-500">
                      📅 {formatoFecha(curso.fecha_inicio)} —{" "}
                      {formatoFecha(curso.fecha_fin)}
                      {curso.lugar ? ` • 📍 ${curso.lugar}` : ""}
                    </p>
                  </div>

                  <div className="w-full md:w-48">
                    <div className="flex justify-between text-xs mb-1">
                      <span>Progreso</span>
                      <span className="font-bold">{progreso}%</span>
                    </div>
                    <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${
                          progreso === 100 ? "bg-green-500" : "bg-red-600"
                        }`}
                        style={{ width: `${progreso}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
