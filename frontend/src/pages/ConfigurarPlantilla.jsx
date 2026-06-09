import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { toast } from "react-hot-toast";

export default function ConfigurarPlantilla() {
  const { eventoId } = useParams();
  const navigate = useNavigate();
  const containerRef = useRef(null);

  const [imagen, setImagen] = useState(null);
  const [archivo, setArchivo] = useState(null);
  const [campoActivo, setCampoActivo] = useState("nombre");
  const [cargando, setCargando] = useState(false);

  // Coordenadas en porcentaje (0-100)
  const [posiciones, setPosiciones] = useState({
    nombre_x: 50,
    nombre_y: 45,
    tema_x: 50,
    tema_y: 55,
    calidad_x: 50,
    calidad_y: 70,
    fecha_x: 50,
    fecha_y: 85,
  });

  useEffect(() => {
    fetchPlantilla();
  }, [eventoId]);

  const fetchPlantilla = async () => {
    try {
      const res = await fetch(
        `http://localhost:5000/api/plantillas/${eventoId}`,
      );
      if (res.ok) {
        const data = await res.json();
        setPosiciones({
          nombre_x: data.pos_nombre_x,
          nombre_y: data.pos_nombre_y,
          tema_x: data.pos_tema_x,
          tema_y: data.pos_tema_y,
          calidad_x: data.pos_calidad_x,
          calidad_y: data.pos_calidad_y,
          fecha_x: data.pos_fecha_x,
          fecha_y: data.pos_fecha_y,
        });
        setImagen(`http://localhost:5000${data.url_plantilla}`);
      }
    } catch (error) {
      console.error("Error:", error);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setArchivo(file);
      setImagen(URL.createObjectURL(file));
    }
  };

  const handleImageClick = (e) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;

    setPosiciones({
      ...posiciones,
      [`${campoActivo}_x`]: Math.round(x),
      [`${campoActivo}_y`]: Math.round(y),
    });
    toast.success(`Posición de "${campoActivo}" actualizada`);
  };

  const handleGuardar = async () => {
    if (!archivo && !imagen) {
      toast.error("Sube una imagen primero");
      return;
    }

    setCargando(true);
    const formData = new FormData();
    if (archivo) formData.append("imagen", archivo);
    Object.entries(posiciones).forEach(([key, value]) =>
      formData.append(key, value),
    );

    try {
      const res = await fetch(
        `http://localhost:5000/api/plantillas/${eventoId}`,
        {
          method: "POST",
          body: formData,
        },
      );
      if (res.ok) {
        toast.success("✅ Plantilla guardada correctamente");
        navigate("/certificados");
      } else {
        toast.error("Error al guardar");
      }
    } catch (error) {
      toast.error("Error de conexión");
    } finally {
      setCargando(false);
    }
  };

  const campos = [
    { id: "nombre", label: "Nombre del Participante", color: "bg-red-500" },
    { id: "tema", label: "Tema del Evento", color: "bg-blue-500" },
    {
      id: "calidad",
      label: "Calidad (Expositor/Participante)",
      color: "bg-green-500",
    },
    { id: "fecha", label: "Fecha y Lugar", color: "bg-purple-500" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Editor de Plantilla
          </h1>
          <p className="text-gray-600 mt-1">
            Sube el diseño y haz clic para posicionar los campos
          </p>
        </div>
        <button
          onClick={() => navigate("/certificados")}
          className="btn-secondary"
        >
          ← Volver a Certificados
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Panel de Control */}
        <div className="lg:col-span-1 space-y-4">
          <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100">
            <label className="label-input">1. Subir Diseño</label>
            <input
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="input-field text-sm"
            />
            <p className="text-xs text-gray-500 mt-1">
              JPG o PNG (A4 Horizontal recomendado)
            </p>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100">
            <label className="label-input">2. Seleccionar Campo</label>
            <div className="space-y-2 mt-2">
              {campos.map((campo) => (
                <button
                  key={campo.id}
                  onClick={() => setCampoActivo(campo.id)}
                  className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                    campoActivo === campo.id
                      ? `${campo.color} text-white shadow-md`
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  {campo.label}
                </button>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100">
            <label className="label-input">3. Coordenadas Actuales</label>
            <div className="text-xs text-gray-600 space-y-1 mt-2 font-mono">
              <p>X: {posiciones[`${campoActivo}_x`]}%</p>
              <p>Y: {posiciones[`${campoActivo}_y`]}%</p>
            </div>
          </div>

          <button
            onClick={handleGuardar}
            disabled={cargando}
            className="w-full btn-primary py-3"
          >
            {cargando ? "Guardando..." : "💾 Guardar Plantilla"}
          </button>
        </div>

        {/* Área de Edición */}
        <div className="lg:col-span-3">
          <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100">
            <div className="mb-2 text-sm text-gray-600">
              <strong>Instrucción:</strong> Selecciona un campo a la izquierda y
              haz clic sobre la imagen para ubicarlo.
            </div>

            {imagen ? (
              <div
                ref={containerRef}
                onClick={handleImageClick}
                className="relative border-2 border-dashed border-gray-300 rounded-lg overflow-hidden cursor-crosshair bg-gray-50"
                style={{ aspectRatio: "1.414/1" }} // Proporción A4 horizontal
              >
                <img
                  src={imagen}
                  alt="Plantilla"
                  className="w-full h-full object-contain"
                />

                {/* Marcadores */}
                {campos.map((campo) => (
                  <div
                    key={campo.id}
                    className={`absolute w-4 h-4 rounded-full border-2 border-white shadow-lg transform -translate-x-1/2 -translate-y-1/2 ${
                      campoActivo === campo.id
                        ? `${campo.color} scale-125 z-10`
                        : "bg-gray-400"
                    }`}
                    style={{
                      left: `${posiciones[`${campo.id}_x`]}%`,
                      top: `${posiciones[`${campo.id}_y`]}%`,
                    }}
                    title={campo.label}
                  />
                ))}
              </div>
            ) : (
              <div className="flex items-center justify-center h-96 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                <div className="text-center text-gray-400">
                  <div className="text-4xl mb-2">️</div>
                  <p>Sube una imagen para comenzar</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
