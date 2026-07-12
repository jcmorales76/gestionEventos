import { useState, useEffect } from 'react'
import { toast } from 'react-hot-toast'

export default function ModalGeneracion({ eventoId, onClose, onGenerado }) {
  const [modo, setModo] = useState('masivo')
  const [participantes, setParticipantes] = useState([])
  const [seleccionados, setSeleccionados] = useState([])
  const [cargando, setCargando] = useState(false)
  const [progreso, setProgreso] = useState({ actual: 0, total: 0 })

  useEffect(() => {
    fetchInscripciones()
  }, [eventoId])

  const fetchInscripciones = async () => {
    try {
      const res = await fetch(`/api/inscripciones/evento/${eventoId}`)
      if (res.ok) {
        const data = await res.json()
        setParticipantes(data)
        setSeleccionados(data.map(p => p.id))
      }
    } catch (error) {
      console.error('Error:', error)
    }
  }

  const toggleParticipante = (id) => {
    setSeleccionados(prev => 
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    )
  }

  const toggleTodos = () => {
    if (seleccionados.length === participantes.length) {
      setSeleccionados([])
    } else {
      setSeleccionados(participantes.map(p => p.id))
    }
  }

  const descargarPDF = (url) => {
    // Abre el PDF en una nueva pestaña para descargar
    window.open(`${url}`, '_blank')
  }

  const handleGenerar = async () => {
    setCargando(true)

    try {
      if (modo === 'masivo') {
        // Una sola petición: el backend genera todos los certificados del evento.
        setProgreso({ actual: 0, total: participantes.length })
        const res = await fetch(`/api/plantillas/generar-masivo/${eventoId}`, {
          method: 'POST'
        })
        const data = await res.json()

        if (res.ok && data.certificados && data.certificados.length > 0) {
          setProgreso({ actual: data.certificados.length, total: participantes.length })
          toast.success(`✅ ${data.certificados.length} certificado(s) generado(s). Disponibles en el perfil de cada participante.`)
          if (onGenerado) onGenerado()
          onClose()
        } else {
          toast.error(data.message || 'No se pudo generar ningún certificado')
        }
        return
      }

      // Modo individual: genera solo los participantes seleccionados.
      if (seleccionados.length === 0) {
        toast.error('Selecciona al menos un participante')
        return
      }

      const total = seleccionados.length
      setProgreso({ actual: 0, total })
      const pdfsGenerados = []

      for (let i = 0; i < seleccionados.length; i++) {
        const id = seleccionados[i]
        const res = await fetch(`/api/plantillas/generar/${id}`, {
          method: 'POST'
        })
        const data = await res.json()

        if (res.ok) {
          pdfsGenerados.push(data)
          descargarPDF(data.url)
        }

        setProgreso({ actual: i + 1, total })
      }

      if (pdfsGenerados.length > 0) {
        toast.success(`✅ ${pdfsGenerados.length} certificado(s) generado(s) y descargado(s)`)
        if (onGenerado) onGenerado()
        onClose()
      } else {
        toast.error('No se pudo generar ningún certificado')
      }
    } catch (error) {
      toast.error('Error de conexión')
    } finally {
      setCargando(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="bg-gradient-to-r from-green-500 to-emerald-600 p-6 rounded-t-2xl">
          <h2 className="text-2xl font-bold text-white">¡Plantilla Guardada!</h2>
          <p className="text-green-100 mt-1">¿Qué deseas hacer ahora?</p>
        </div>

        <div className="p-6 space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <button
              onClick={() => setModo('masivo')}
              className={`p-4 rounded-xl border-2 transition-all ${
                modo === 'masivo' 
                  ? 'border-green-500 bg-green-50 shadow-md' 
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="text-3xl mb-2">🎓</div>
              <div className="font-bold text-gray-900">Generar Todos</div>
              <div className="text-sm text-gray-600">{participantes.length} participantes</div>
            </button>

            <button
              onClick={() => setModo('individual')}
              className={`p-4 rounded-xl border-2 transition-all ${
                modo === 'individual' 
                  ? 'border-blue-500 bg-blue-50 shadow-md' 
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="text-3xl mb-2">👤</div>
              <div className="font-bold text-gray-900">Individual</div>
              <div className="text-sm text-gray-600">Seleccionar participantes</div>
            </button>
          </div>

          {modo === 'individual' && (
            <div className="border border-gray-200 rounded-xl p-4">
              <div className="flex justify-between items-center mb-3">
                <h3 className="font-semibold text-gray-900">Seleccionar participantes</h3>
                <button
                  onClick={toggleTodos}
                  className="text-sm text-blue-600 hover:text-blue-800"
                >
                  {seleccionados.length === participantes.length ? 'Deseleccionar todos' : 'Seleccionar todos'}
                </button>
              </div>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {participantes.map(p => (
                  <label key={p.id} className="flex items-center gap-3 p-2 rounded hover:bg-gray-50 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={seleccionados.includes(p.id)}
                      onChange={() => toggleParticipante(p.id)}
                      className="w-4 h-4 text-blue-600 rounded"
                    />
                    <div className="flex-1">
                      <div className="font-medium text-gray-900">{p.nombre} {p.apellido}</div>
                      <div className="text-xs text-gray-500">{p.email}</div>
                    </div>
                  </label>
                ))}
              </div>
            </div>
          )}

          {cargando && (
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
              <div className="flex items-center gap-3">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
                <div className="flex-1">
                  <div className="font-semibold text-blue-900">Generando certificados...</div>
                  <div className="text-sm text-blue-700">
                    {progreso.actual} de {progreso.total} completados
                  </div>
                  <div className="mt-2 bg-blue-200 rounded-full h-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full transition-all"
                      style={{ width: `${(progreso.actual / progreso.total) * 100}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="flex gap-3">
            <button 
              onClick={onClose} 
              disabled={cargando}
              className="flex-1 py-3 px-4 rounded-xl border-2 border-gray-300 text-gray-700 font-semibold hover:bg-gray-50 disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              onClick={handleGenerar}
              disabled={cargando}
              className="flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-green-500 to-emerald-600 text-white font-semibold hover:from-green-600 hover:to-emerald-700 disabled:opacity-50"
            >
              {cargando ? 'Generando...' : '🚀 Generar Certificados'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}