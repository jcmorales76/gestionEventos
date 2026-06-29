import { useState, useEffect } from 'react'
import { toast } from 'react-hot-toast'

export default function ModalGeneracion({ eventoId, onClose, onGenerado }) {
  const [modo, setModo] = useState('masivo')
  const [participantes, setParticipantes] = useState([])
  const [seleccionados, setSeleccionados] = useState([])
  const [cargando, setCargando] = useState(false)

  useEffect(() => {
    fetchInscripciones()
  }, [eventoId])

  const fetchInscripciones = async () => {
    try {
      const res = await fetch(`http://localhost:5000/api/inscripciones/evento/${eventoId}`)
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

  const handleGenerar = async () => {
    if (seleccionados.length === 0) {
      toast.error('Selecciona al menos un participante')
      return
    }

    setCargando(true)
    try {
      if (modo === 'masivo') {
        const res = await fetch(`http://localhost:5000/api/plantillas/generar-masivo/${eventoId}`, {
          method: 'POST'
        })
        const data = await res.json()
        if (res.ok) {
          toast.success(`✅ ${data.certificados.length} certificados generados`)
          if (onGenerado) onGenerado()
          onClose()
        } else {
          toast.error(data.message || 'Error al generar')
        }
      } else {
        const resultados = []
        for (const id of seleccionados) {
          const res = await fetch(`http://localhost:5000/api/plantillas/generar/${id}`, {
            method: 'POST'
          })
          const data = await res.json()
          if (res.ok) {
            resultados.push(data)
          }
        }
        toast.success(`✅ ${resultados.length} certificado(s) generado(s)`)
        if (onGenerado) onGenerado()
        onClose()
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
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <span className="text-3xl">🎉</span>
            ¡Plantilla Guardada!
          </h2>
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
                  <label
                    key={p.id}
                    className="flex items-center gap-3 p-2 rounded hover:bg-gray-50 cursor-pointer"
                  >
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
                    <span className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded">
                      {p.calidad || 'PARTICIPANTE'}
                    </span>
                  </label>
                ))}
              </div>
              <div className="mt-3 text-sm text-gray-600">
                {seleccionados.length} de {participantes.length} seleccionados
              </div>
            </div>
          )}

          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 py-3 px-4 rounded-xl border-2 border-gray-300 text-gray-700 font-semibold hover:bg-gray-50 transition-all"
            >
              Cancelar
            </button>
            <button
              onClick={handleGenerar}
              disabled={cargando}
              className="flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-green-500 to-emerald-600 text-white font-semibold hover:from-green-600 hover:to-emerald-700 transition-all disabled:opacity-50 shadow-md"
            >
              {cargando ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="animate-spin">⏳</span>
                  Generando...
                </span>
              ) : (
                <span>🚀 Generar Certificados</span>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}