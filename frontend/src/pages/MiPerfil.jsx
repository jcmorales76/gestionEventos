import { useAuth } from "../contexts/AuthContext";
import { useState } from "react";
import { toast } from "react-hot-toast";

export default function MiPerfil() {
  const { user, updateUser } = useAuth();

  const [form, setForm] = useState({
    nombre: user?.nombre || "",
    apellido: user?.apellido || "",
    telefono: user?.telefono || "",
    dni: user?.dni || "",
  });
  const [pwd, setPwd] = useState({ actual: "", nueva: "", confirmar: "" });
  const [savingPerfil, setSavingPerfil] = useState(false);
  const [savingPwd, setSavingPwd] = useState(false);
  const [subiendoFoto, setSubiendoFoto] = useState(false);

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });
  const handlePwdChange = (e) =>
    setPwd({ ...pwd, [e.target.name]: e.target.value });

  const handleFoto = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setSubiendoFoto(true);
    const fd = new FormData();
    fd.append("foto", file);
    try {
      const res = await fetch(
        `http://localhost:5000/api/usuarios/${user.id}/foto`,
        { method: "POST", body: fd },
      );
      const data = await res.json();
      if (res.ok) {
        updateUser({ foto_url: data.foto_url });
        toast.success("✅ Foto actualizada");
      } else {
        toast.error(data.message || "Error al subir la foto");
      }
    } catch (error) {
      toast.error("Error de conexión");
    } finally {
      setSubiendoFoto(false);
    }
  };

  const guardarPerfil = async () => {
    if (!form.nombre || !form.apellido) {
      return toast.error("Nombre y apellido son obligatorios");
    }
    setSavingPerfil(true);
    try {
      const res = await fetch(
        `http://localhost:5000/api/participantes/${user.id}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            nombre: form.nombre,
            apellido: form.apellido,
            email: user.email,
            dni: form.dni,
            telefono: form.telefono,
            estado: user.estado || "Activo",
          }),
        },
      );
      const data = await res.json();
      if (res.ok) {
        updateUser({
          nombre: form.nombre,
          apellido: form.apellido,
          dni: form.dni,
          telefono: form.telefono,
        });
        toast.success("✅ Perfil actualizado");
      } else {
        toast.error(data.message || "Error al actualizar el perfil");
      }
    } catch (error) {
      toast.error("Error de conexión");
    } finally {
      setSavingPerfil(false);
    }
  };

  const cambiarPassword = async () => {
    if (!pwd.actual || !pwd.nueva)
      return toast.error("Completa la contraseña actual y la nueva");
    if (pwd.nueva.length < 4)
      return toast.error("La nueva contraseña es demasiado corta");
    if (pwd.nueva !== pwd.confirmar)
      return toast.error("Las contraseñas nuevas no coinciden");

    setSavingPwd(true);
    try {
      const res = await fetch(
        "http://localhost:5000/api/auth/change-password",
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userId: user.id,
            currentPassword: pwd.actual,
            newPassword: pwd.nueva,
          }),
        },
      );
      const data = await res.json();
      if (res.ok) {
        toast.success("✅ Contraseña actualizada");
        setPwd({ actual: "", nueva: "", confirmar: "" });
      } else {
        toast.error(data.message || "Error al cambiar la contraseña");
      }
    } catch (error) {
      toast.error("Error de conexión");
    } finally {
      setSavingPwd(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Datos personales */}
      <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
        <h2 className="text-xl font-bold text-gray-900 mb-6">Mi Perfil</h2>

        {/* Foto de perfil */}
        <div className="flex items-center gap-4 mb-6">
          {user?.foto_url ? (
            <img
              src={`http://localhost:5000${user.foto_url}`}
              alt="Foto de perfil"
              className="w-20 h-20 rounded-full object-cover ring-4 ring-primary-500/15"
            />
          ) : (
            <div className="w-20 h-20 rounded-full bg-brand-gradient flex items-center justify-center text-white text-2xl font-bold ring-4 ring-primary-500/15">
              {(form.nombre || user?.email || "U").charAt(0).toUpperCase()}
            </div>
          )}
          <div>
            <label className="btn-secondary cursor-pointer inline-flex">
              {subiendoFoto ? "Subiendo..." : "📷 Cambiar foto"}
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFoto}
                disabled={subiendoFoto}
              />
            </label>
            <p className="text-xs text-gray-400 mt-1">JPG o PNG · máx 5MB</p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="label-input">Nombre *</label>
              <input
                name="nombre"
                value={form.nombre}
                onChange={handleChange}
                className="input-field"
              />
            </div>
            <div>
              <label className="label-input">Apellido *</label>
              <input
                name="apellido"
                value={form.apellido}
                onChange={handleChange}
                className="input-field"
              />
            </div>
            <div>
              <label className="label-input">DNI / Documento</label>
              <input
                name="dni"
                value={form.dni}
                onChange={handleChange}
                className="input-field"
              />
            </div>
            <div>
              <label className="label-input">Teléfono</label>
              <input
                name="telefono"
                value={form.telefono}
                onChange={handleChange}
                className="input-field"
              />
            </div>
          </div>

          <div>
            <label className="label-input">Correo Electrónico</label>
            <input
              value={user?.email || ""}
              className="input-field bg-gray-50 cursor-not-allowed"
              disabled
            />
            <p className="text-xs text-gray-400 mt-1">
              El correo no se puede modificar.
            </p>
          </div>

          <div className="flex justify-end">
            <button
              onClick={guardarPerfil}
              disabled={savingPerfil}
              className="btn-primary disabled:opacity-50"
            >
              {savingPerfil ? "Guardando..." : "Guardar Cambios"}
            </button>
          </div>
        </div>
      </div>

      {/* Cambiar contraseña */}
      <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
        <h3 className="text-lg font-bold text-gray-900 mb-4">
          Cambiar Contraseña
        </h3>
        <div className="space-y-4">
          <div>
            <label className="label-input">Contraseña actual</label>
            <input
              type="password"
              name="actual"
              value={pwd.actual}
              onChange={handlePwdChange}
              className="input-field"
              placeholder="••••••••"
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="label-input">Nueva contraseña</label>
              <input
                type="password"
                name="nueva"
                value={pwd.nueva}
                onChange={handlePwdChange}
                className="input-field"
                placeholder="••••••••"
              />
            </div>
            <div>
              <label className="label-input">Confirmar nueva contraseña</label>
              <input
                type="password"
                name="confirmar"
                value={pwd.confirmar}
                onChange={handlePwdChange}
                className="input-field"
                placeholder="••••••••"
              />
            </div>
          </div>
          <div className="flex justify-end">
            <button
              onClick={cambiarPassword}
              disabled={savingPwd}
              className="btn-primary disabled:opacity-50"
            >
              {savingPwd ? "Actualizando..." : "Actualizar Contraseña"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
