import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { toast } from 'react-hot-toast'
import ModalGeneracion from '../components/ModalGeneracion'

export default function ConfigurarPlantilla() {
  const { eventoId } = useParams()
  const navigate = useNavigate()
  const containerRef = useRef(null)
  
  const [imagen, setImagen] = useState(null)
  const [archivo, setArchivo] = useState(null)
  const [campoActivo, setCampoActivo] = useState('nombre')
  const [cargando, setCargando] = useState(false)
  const [esPlantillaExistente, setEsPlantillaExistente] = useState(false)
  const [mostrarVistaPrevia, setMostrarVistaPrevia] = useState(false)
  const [mostrarModal, setMostrarModal] = useState(false)
  
  // ✅ NUEVO: Campos activos (checkboxes)
  const [camposActivos, setCamposActivos] = useState({
    nombre: 1,
    tema: 0,
    calidad: 1,
    fecha: 0
  })

  const [posiciones, setPosiciones] = useState({
    nombre_x: 50, nombre_y: 45,
    tema_x: 50, tema_y: 55,
    calidad_x: 50, calidad_y: 70,
    fecha_x: 50, fecha_y: 85
  })

  useEffect(() => {
    fetchPlantilla()
  }, [eventoId])

  const fetchPlantilla = async () => {
    try {
      const res = await fetch(`http://localhost:5000/api/plantillas/${eventoId}`)
      if (res.ok) {
        const data = await res.json()
        setPosiciones({
          nombre_x: data.pos_nombre_x, nombre_y: data.pos_nombre_y,
          tema_x: data.pos_tema_x, tema_y: data.pos_tema_y,
          calidad_x: data.pos_calidad_x, calidad_y: data.pos_calidad_y,
          fecha_x: data.pos_fecha_x, fecha_y: data.pos_fecha_y
        })
        // ✅ Cargar estado de campos activos
        setCamposActivos({
          nombre: data.activo_nombre !== undefined ? data.activo_nombre : 1,
          tema: data.activo_tema !== undefined ? data.activo_tema : 0,
          calidad: data.activo_calidad !== undefined ? data.activo_calidad : 1,
          fecha: data.activo_fecha !== undefined ? data.activo_fecha : 0
        })
        setImagen(`http://localhost:5000${data.url_plantilla}`)
        setEsPlantillaExistente(true)
        toast.success('📄 Plantilla existente cargada')
      } else {
        setEsPlantillaExistente(false)
      }
    } catch (error) {
      console.error('Error:', error)
      setEsPlantillaExistente(false)
    }
  }

  const handleFileChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      setArchivo(file)
      setImagen(URL.createObjectURL(file))
    }
  }

  const handleImageClick = (e) => {
    if (!containerRef.current) return
    const rect = containerRef.current.getBoundingClientRect()
    const x = ((e.clientX - rect.left) / rect.width) * 100
    const y = ((e.clientY - rect.top) / rect.height) * 100
    
    setPosiciones({
      ...posiciones,
      [`${campoActivo}_x`]: Math.round(x),
      [`${campoActivo}_y`]: Math.round(y)
    })
    toast.success(`✅ "${campoActivo}" posicionado en ${Math.round(x)}%, ${Math.round(y)}%`)
  }

  const toggleCampo = (campo) => {
    setCamposActivos({
      ...camposActivos,
      [campo]: camposActivos[campo] ? 0 : 1
    })
  }

  const handleGuardar = async () => {
  if (!imagen) {
    toast.error('Sube una imagen primero')
    return
  }

  setCargando(true)
  const formData = new FormData()
  if (archivo) formData.append('imagen', archivo)
  Object.entries(posiciones).forEach(([key, value]) => formData.append(key, value))
  Object.entries(camposActivos).forEach(([key, value]) => formData.append(`activo_${key}`, value))

  try {
    const res = await fetch(`http://localhost:5000/api/plantillas/${eventoId}`, {
      method: 'POST',
      body: formData
    })
    if (res.ok) {
      const mensaje = esPlantillaExistente ? '✅ Plantilla actualizada' : '✅ Plantilla guardada'
      toast.success(mensaje)
      setMostrarModal(true)  // ✅ MOSTRAR MODAL
    } else {
      const data = await res.json()
      toast.error(data.message || 'Error al guardar')
    }
  } catch (error) {
    toast.error('Error de conexión')
  } finally {
    setCargando(false)
  }
}

  const campos = [
    { id: 'nombre', label: 'Nombre del Participante', color: 'bg-red-500' },
    { id: 'tema', label: 'Tema del Evento', color: 'bg-blue-500' },
    { id: 'calidad', label: 'Calidad (Expositor/Participante)', color: 'bg-green-500' },
    { id: 'fecha', label: 'Fecha y Lugar', color: 'bg-purple-500' }
  ]

  {mostrarModal && (
  <ModalGeneracion 
    eventoId={eventoId}
    onClose={() => setMostrarModal(false)}
    onGenerado={() => {
      fetchPlantilla()
    }}
  />
)}

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold text-gray-900">Editor de Plantilla</h1>
            {esPlantillaExistente ? (
              <span className="px-3 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-700">
                📄 Plantilla Existente
              </span>
            ) : (
              <span className="px-3 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-700">
                 Nueva Plantilla
              </span>
            )}
          </div>
          <p className="text-gray-600 mt-1">
            {esPlantillaExistente 
              ? 'Modifica las posiciones y actualiza la plantilla' 
              : 'Sube el diseño y posiciona los campos dinámicos'}
          </p>
        </div>
        <button onClick={() => navigate('/certificados')} className="btn-secondary">
          ← Volver a Certificados
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Panel de Control */}
        <div className="lg:col-span-1 space-y-4">
          <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100">
            <label className="label-input">1. {esPlantillaExistente ? 'Cambiar' : 'Subir'} Diseño</label>
            <input type="file" accept="image/*" onChange={handleFileChange} className="input-field text-sm" />
            <p className="text-xs text-gray-500 mt-1">JPG o PNG (A4 Horizontal recomendado)</p>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100">
            <label className="label-input">2. Seleccionar Campo</label>
            <div className="space-y-2 mt-2">
              {campos.map(campo => (
                <button
                  key={campo.id}
                  onClick={() => setCampoActivo(campo.id)}
                  className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                    campoActivo === campo.id 
                      ? `${campo.color} text-white shadow-md` 
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {campo.label}
                </button>
              ))}
            </div>
          </div>

          {/* ✅ NUEVO: Checkboxes para activar/desactivar campos */}
          <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100">
            <label className="label-input">3. Campos a Mostrar</label>
            <div className="space-y-2 mt-2">
              {campos.map(campo => (
                <label key={campo.id} className="flex items-center gap-2 cursor-pointer p-2 rounded hover:bg-gray-50">
                  <input 
                    type="checkbox" 
                    checked={camposActivos[campo.id] === 1}
                    onChange={() => toggleCampo(campo.id)}
                    className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700">{campo.label}</span>
                </label>
              ))}
            </div>
            <p className="text-xs text-gray-500 mt-2">
              ℹ️ Solo se incluirán los campos marcados en el certificado
            </p>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100">
            <label className="label-input">4. Coordenadas</label>
            <div className="text-xs text-gray-600 space-y-1 mt-2 font-mono">
              <p>X: {posiciones[`${campoActivo}_x`]}%</p>
              <p>Y: {posiciones[`${campoActivo}_y`]}%</p>
            </div>
            
            <div className="mt-4 pt-3 border-t border-gray-200">
              <label className="flex items-center gap-2 cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={mostrarVistaPrevia}
                  onChange={(e) => setMostrarVistaPrevia(e.target.checked)}
                  className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                />
                <span className="text-sm font-medium text-gray-700">Mostrar Vista Previa</span>
              </label>
            </div>
          </div>

          <button 
            onClick={handleGuardar} 
            disabled={cargando}
            className={`w-full py-3 rounded-lg font-semibold text-white transition-all ${
              cargando 
                ? 'bg-gray-400 cursor-not-allowed' 
                : esPlantillaExistente
                ? 'bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 shadow-md'
                : 'bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 shadow-md'
            }`}
          >
            {cargando ? '⏳ Guardando...' : esPlantillaExistente ? '💾 Actualizar Plantilla' : '💾 Guardar Plantilla'}
          </button>
        </div>

        {/* Área de Edición */}
        <div className="lg:col-span-3">
          <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100">
            <div className="mb-2 text-sm text-gray-600">
              <strong>Instrucción:</strong> Selecciona un campo y haz clic sobre la imagen para ubicarlo.
            </div>
            
            {imagen ? (
              <div 
                ref={containerRef}
                onClick={handleImageClick}
                className="relative border-2 border-dashed border-gray-300 rounded-lg overflow-hidden cursor-crosshair bg-gray-50"
                style={{ aspectRatio: '1.414/1' }}
              >
                <img src={imagen} alt="Plantilla" className="w-full h-full object-contain" />
                
                {/* Marcadores de Posición */}
                {campos.map(campo => camposActivos[campo.id] === 1 && (
                  <div
                    key={campo.id}
                    className={`absolute w-4 h-4 rounded-full border-2 border-white shadow-lg transform -translate-x-1/2 -translate-y-1/2 ${
                      campoActivo === campo.id ? `${campo.color} scale-125 z-10` : 'bg-gray-400'
                    }`}
                    style={{
                      left: `${posiciones[`${campo.id}_x`]}%`,
                      top: `${posiciones[`${campo.id}_y`]}%`
                    }}
                    title={campo.label}
                  />
                ))}

                {/* Vista Previa del Texto */}
                {mostrarVistaPrevia && (
                  <div className="absolute inset-0 pointer-events-none">
                    {camposActivos.nombre === 1 && (
                      <div 
                        className="absolute transform -translate-x-1/2 -translate-y-1/2"
                        style={{ left: `${posiciones.nombre_x}%`, top: `${posiciones.nombre_y}%` }}
                      >
                        <p className="text-lg font-bold text-red-700 bg-white/80 px-2 rounded shadow-sm whitespace-nowrap">
                          JUAN CARLOS MORALES
                        </p>
                      </div>
                    )}

                    {camposActivos.tema === 1 && (
                      <div 
                        className="absolute transform -translate-x-1/2 -translate-y-1/2"
                        style={{ left: `${posiciones.tema_x}%`, top: `${posiciones.tema_y}%` }}
                      >
                        <p className="text-xs italic text-blue-700 bg-white/80 px-2 rounded shadow-sm w-64 text-center">
                          "Inteligencia Artificial en Microfinanzas"
                        </p>
                      </div>
                    )}

                    {camposActivos.calidad === 1 && (
                      <div 
                        className="absolute transform -translate-x-1/2 -translate-y-1/2"
                        style={{ left: `${posiciones.calidad_x}%`, top: `${posiciones.calidad_y}%` }}
                      >
                        <p className="text-sm font-bold text-green-700 bg-white/80 px-2 rounded shadow-sm whitespace-nowrap">
                          PARTICIPANTE
                        </p>
                      </div>
                    )}

                    {camposActivos.fecha === 1 && (
                      <div 
                        className="absolute transform -translate-x-1/2 -translate-y-1/2"
                        style={{ left: `${posiciones.fecha_x}%`, top: `${posiciones.fecha_y}%` }}
                      >
                        <p className="text-xs text-gray-700 bg-white/80 px-2 rounded shadow-sm whitespace-nowrap">
                          22, 23 y 24 de abril del 2026
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center justify-center h-96 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                <div className="text-center text-gray-400">
                  <div className="text-4xl mb-2">📄</div>
                  <p>Sube una imagen para comenzar</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}