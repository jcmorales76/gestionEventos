import { useState, useEffect } from "react";
import { toast } from "react-hot-toast";

export default function Configuracion() {
  const [config, setConfig] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Estados para el logo
  const [logoFile, setLogoFile] = useState(null);
  const [logoPreview, setLogoPreview] = useState(null);
  const [uploading, setUploading] = useState(false);

  // Estado para nombre del sistema (con botón de guardar)
  const [nombreSistema, setNombreSistema] = useState("");

  // Prueba de correo (SMTP)
  const [testEmailTo, setTestEmailTo] = useState("");
  const [enviandoTest, setEnviandoTest] = useState(false);

  // Tipos de evento
  const [tiposEvento, setTiposEvento] = useState([]);
  const [nuevoTipo, setNuevoTipo] = useState("");
  const [editTipoId, setEditTipoId] = useState(null);
  const [editTipoNombre, setEditTipoNombre] = useState("");

  const fetchTiposEvento = async () => {
    try {
      const res = await fetch("/api/tipos-evento");
      if (res.ok) setTiposEvento(await res.json());
    } catch (error) {
      console.error(error);
    }
  };

  const agregarTipo = async () => {
    if (!nuevoTipo.trim()) return toast.error("Escribe un nombre");
    try {
      const res = await fetch("/api/tipos-evento", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nombre: nuevoTipo.trim() }),
      });
      const data = await res.json();
      if (res.ok) {
        setNuevoTipo("");
        toast.success("✅ Tipo agregado");
        fetchTiposEvento();
      } else {
        toast.error(data.message || "Error al agregar");
      }
    } catch (error) {
      toast.error("Error de conexión");
    }
  };

  const guardarEdicionTipo = async (id) => {
    if (!editTipoNombre.trim()) return toast.error("El nombre no puede estar vacío");
    try {
      const res = await fetch(`/api/tipos-evento/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nombre: editTipoNombre.trim() }),
      });
      const data = await res.json();
      if (res.ok) {
        setEditTipoId(null);
        toast.success("✅ Tipo actualizado");
        fetchTiposEvento();
      } else {
        toast.error(data.message || "Error al actualizar");
      }
    } catch (error) {
      toast.error("Error de conexión");
    }
  };

  const eliminarTipo = async (id) => {
    try {
      const res = await fetch(`/api/tipos-evento/${id}`, { method: "DELETE" });
      if (res.ok) {
        toast.success("Tipo eliminado");
        fetchTiposEvento();
      } else {
        toast.error("Error al eliminar");
      }
    } catch (error) {
      toast.error("Error de conexión");
    }
  };

  const handleTestEmail = async () => {
    if (!testEmailTo) {
      toast.error("Escribe un correo destino");
      return;
    }
    setEnviandoTest(true);
    try {
      const res = await fetch("/api/config/test-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ to: testEmailTo }),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success("✅ " + (data.message || "Correo enviado"));
      } else {
        toast.error(data.message || "No se pudo enviar");
      }
    } catch (error) {
      toast.error("Error de conexión");
    } finally {
      setEnviandoTest(false);
    }
  };

  useEffect(() => {
    fetchConfig();
    fetchLogo();
    fetchTiposEvento();
  }, []);

  // Sincronizar nombre del sistema cuando se carga config
  useEffect(() => {
    if (config.nombre_sistema) {
      setNombreSistema(config.nombre_sistema.valor || "");
    }
  }, [config.nombre_sistema]);

  const fetchConfig = async () => {
    try {
      const res = await fetch("/api/config");
      const data = await res.json();
      setConfig(data);
    } catch (error) {
      toast.error("Error al cargar configuración");
    } finally {
      setLoading(false);
    }
  };

  const fetchLogo = async () => {
    try {
      const res = await fetch("/api/config/logo");
      const data = await res.json();
      if (data.logoUrl) {
        setLogoPreview(`${data.logoUrl}`);
      }
    } catch (error) {
      console.error("Error cargando logo:", error);
    }
  };

  const handleSave = async (clave, valor) => {
    setSaving(true);
    try {
      const res = await fetch(`/api/config/${clave}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ valor: valor || "" }),
      });
      if (res.ok) {
        toast.success("✅ Configuración actualizada");
        // Recargar configuración para actualizar el estado local
        await fetchConfig();
      } else {
        const errorData = await res.json();
        toast.error(errorData.message || "Error al guardar");
      }
    } catch (error) {
      toast.error("Error de conexión");
    } finally {
      setSaving(false);
    }
  };

  const handleLogoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validar tamaño (5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast.error("El archivo es demasiado grande (máximo 5MB)");
        return;
      }

      setLogoFile(file);
      setLogoPreview(URL.createObjectURL(file));
    }
  };

  const handleUploadLogo = async () => {
    if (!logoFile) {
      toast.error("Selecciona un archivo primero");
      return;
    }

    setUploading(true);
    const formData = new FormData();
    formData.append("logo", logoFile);

    try {
      const res = await fetch("/api/config/logo", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (res.ok) {
        toast.success("✅ Logo actualizado exitosamente");
        setLogoFile(null);
        fetchLogo();
      } else {
        toast.error(data.message || "Error al subir logo");
      }
    } catch (error) {
      toast.error("Error de conexión al subir logo");
    } finally {
      setUploading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
        <span className="ml-3 text-gray-600">Cargando configuración...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">
          Configuración General
        </h1>
        <p className="text-gray-600 mt-1">
          Administra las reglas y parámetros del sistema
        </p>
      </div>

      {/* Personalización de Marca */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
          🎨 Personalización de Marca
        </h2>

        <div className="flex flex-col md:flex-row gap-8 items-start">
          {/* Vista previa */}
          <div className="flex-1">
            <label className="font-semibold text-gray-900 block mb-2">
              Logo Actual
            </label>
            <div className="bg-gray-50 rounded-lg p-6 border-2 border-dashed border-gray-200 flex items-center justify-center h-40">
              {logoPreview ? (
                <img
                  src={logoPreview}
                  alt="Logo del sistema"
                  className="max-h-32 max-w-full object-contain rounded-lg"
                />
              ) : (
                <div className="text-center text-gray-400">
                  <svg
                    className="w-16 h-16 mx-auto mb-2"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                    />
                  </svg>
                  <p className="text-sm">Sin logo personalizado</p>
                </div>
              )}
            </div>
            <p className="text-sm text-gray-500 mt-2">
              Dimensiones recomendadas: 200x60px (PNG o JPG)
            </p>
          </div>

          {/* Input de archivo */}
          <div className="flex-1 space-y-4">
            <div>
              <label className="font-semibold text-gray-900 block mb-2">
                Subir Nuevo Logo
              </label>
              <input
                type="file"
                accept="image/png,image/jpeg,image/jpg,image/gif"
                onChange={handleLogoChange}
                className="input-field"
              />
              <p className="text-xs text-gray-500 mt-1">
                Formatos: PNG, JPG, GIF • Máximo 5MB
              </p>
            </div>

            <button
              onClick={handleUploadLogo}
              disabled={uploading || !logoFile}
              className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {uploading ? "Subiendo..." : "📤 Subir Logo"}
            </button>

            {logoFile && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-blue-800">
                <strong>Archivo seleccionado:</strong> {logoFile.name}
                <br />
                <strong>Tamaño:</strong> {(logoFile.size / 1024).toFixed(2)} KB
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Seguridad y Accesos */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
          🔒 Seguridad y Accesos
        </h2>

        <div className="space-y-6">
          {/* Días de expiración */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-gray-100">
            <div>
              <label className="font-semibold text-gray-900 block">
                Días de expiración de contraseña
              </label>
              <p className="text-sm text-gray-500 mt-1">
                Tiempo máximo antes de obligar al usuario a cambiar su clave.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <input
                type="number"
                defaultValue={config.password_expiry_days?.valor || 60}
                onBlur={(e) =>
                  handleSave("password_expiry_days", e.target.value)
                }
                className="input-field w-24 text-center"
              />
              <span className="text-gray-600 text-sm">días</span>
            </div>
          </div>

          {/* Max intentos login */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-gray-100">
            <div>
              <label className="font-semibold text-gray-900 block">
                Máximo intentos de login fallidos
              </label>
              <p className="text-sm text-gray-500 mt-1">
                Bloqueo temporal de cuenta tras X intentos incorrectos.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <input
                type="number"
                defaultValue={config.max_intentos_login?.valor || 5}
                onBlur={(e) => handleSave("max_intentos_login", e.target.value)}
                className="input-field w-24 text-center"
              />
              <span className="text-gray-600 text-sm">intentos</span>
            </div>
          </div>
        </div>
      </div>

      {/* Preferencias del Sistema */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
          ⚙️ Preferencias del Sistema
        </h2>

        <div className="space-y-6">
          {/* Nombre del sistema - CON BOTÓN DE GUARDAR */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-gray-100">
            <div className="flex-1">
              <label className="font-semibold text-gray-900 block">
                Nombre del Sistema
              </label>
              <p className="text-sm text-gray-500 mt-1">
                Aparece en el header y correos. Deja vacío para ocultar.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <input
                type="text"
                value={nombreSistema}
                onChange={(e) => setNombreSistema(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    handleSave("nombre_sistema", nombreSistema);
                  }
                }}
                className="input-field md:w-96"
                placeholder="Ej: Mi Empresa"
              />
              <button
                onClick={() => handleSave("nombre_sistema", nombreSistema)}
                disabled={saving}
                className="btn-primary px-4 py-2 whitespace-nowrap disabled:opacity-50"
              >
                {saving ? "Guardando..." : "Guardar"}
              </button>
            </div>
          </div>

          {/* Vista por defecto */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex-1">
              <label className="font-semibold text-gray-900 block">
                Vista por defecto en Eventos
              </label>
              <p className="text-sm text-gray-500 mt-1">
                Cómo se mostrarán los eventos al entrar al módulo.
              </p>
            </div>
            <select
              defaultValue={config.vista_defecto_eventos?.valor || "tarjetas"}
              onBlur={(e) =>
                handleSave("vista_defecto_eventos", e.target.value)
              }
              className="input-field md:w-48"
            >
              <option value="tarjetas">Tarjetas (Grid)</option>
              <option value="lista">Lista (Tabla)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Correo (SMTP) */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h2 className="text-xl font-bold text-gray-800 mb-2 flex items-center gap-2">
          ✉️ Correo (SMTP)
        </h2>
        <p className="text-sm text-gray-500 mb-4">
          El envío de correos se configura con variables de entorno en el
          hosting (SMTP_HOST, SMTP_USER, SMTP_PASS...). Usa esta prueba para
          verificar que funcione.
        </p>
        <div className="flex flex-col md:flex-row md:items-end gap-3">
          <div className="flex-1">
            <label className="label-input">Enviar correo de prueba a:</label>
            <input
              type="email"
              value={testEmailTo}
              onChange={(e) => setTestEmailTo(e.target.value)}
              placeholder="tucorreo@ejemplo.com"
              className="input-field md:w-96"
            />
          </div>
          <button
            onClick={handleTestEmail}
            disabled={enviandoTest}
            className="btn-primary disabled:opacity-50"
          >
            {enviandoTest ? "Enviando..." : "Enviar prueba"}
          </button>
        </div>
      </div>

      {/* Tipos de Evento */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h2 className="text-xl font-bold text-gray-800 mb-2 flex items-center gap-2">
          🏷️ Tipos de Evento
        </h2>
        <p className="text-sm text-gray-500 mb-4">
          Administra los tipos disponibles al crear o editar eventos (seminario,
          taller, charla, congreso…).
        </p>

        <div className="flex flex-col sm:flex-row gap-2 mb-4">
          <input
            value={nuevoTipo}
            onChange={(e) => setNuevoTipo(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && agregarTipo()}
            placeholder="Nuevo tipo (ej. Conferencia)"
            className="input-field sm:w-72"
          />
          <button onClick={agregarTipo} className="btn-primary">
            + Agregar
          </button>
        </div>

        <div className="flex flex-wrap gap-2">
          {tiposEvento.length === 0 && (
            <p className="text-sm text-gray-400">No hay tipos aún.</p>
          )}
          {tiposEvento.map((t) =>
            editTipoId === t.id ? (
              <div
                key={t.id}
                className="flex items-center gap-1 bg-gray-50 border border-gray-200 rounded-lg px-2 py-1"
              >
                <input
                  value={editTipoNombre}
                  onChange={(e) => setEditTipoNombre(e.target.value)}
                  onKeyDown={(e) =>
                    e.key === "Enter" && guardarEdicionTipo(t.id)
                  }
                  className="input-field w-40"
                  autoFocus
                />
                <button
                  onClick={() => guardarEdicionTipo(t.id)}
                  className="text-green-600 hover:text-green-700 px-1"
                  title="Guardar"
                >
                  ✓
                </button>
                <button
                  onClick={() => setEditTipoId(null)}
                  className="text-gray-400 hover:text-gray-600 px-1"
                  title="Cancelar"
                >
                  ✕
                </button>
              </div>
            ) : (
              <div
                key={t.id}
                className="flex items-center gap-2 bg-gray-100 rounded-lg px-3 py-1.5"
              >
                <span className="text-sm text-gray-700">{t.nombre}</span>
                <button
                  onClick={() => {
                    setEditTipoId(t.id);
                    setEditTipoNombre(t.nombre);
                  }}
                  className="text-purple-500 hover:text-purple-700 text-xs"
                  title="Editar"
                >
                  ✏️
                </button>
                <button
                  onClick={() => eliminarTipo(t.id)}
                  className="text-red-500 hover:text-red-700 text-xs"
                  title="Eliminar"
                >
                  🗑️
                </button>
              </div>
            ),
          )}
        </div>
      </div>
    </div>
  );
}
