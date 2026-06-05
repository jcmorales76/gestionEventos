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

  useEffect(() => {
    fetchConfig();
    fetchLogo();
  }, []);

  // Sincronizar nombre del sistema cuando se carga config
  useEffect(() => {
    if (config.nombre_sistema) {
      setNombreSistema(config.nombre_sistema.valor || "");
    }
  }, [config.nombre_sistema]);

  const fetchConfig = async () => {
    try {
      const res = await fetch("http://localhost:5000/api/config");
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
      const res = await fetch("http://localhost:5000/api/config/logo");
      const data = await res.json();
      if (data.logoUrl) {
        setLogoPreview(`http://localhost:5000${data.logoUrl}`);
      }
    } catch (error) {
      console.error("Error cargando logo:", error);
    }
  };

  const handleSave = async (clave, valor) => {
    setSaving(true);
    try {
      const res = await fetch(`http://localhost:5000/api/config/${clave}`, {
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
      const res = await fetch("http://localhost:5000/api/config/logo", {
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
    </div>
  );
}
