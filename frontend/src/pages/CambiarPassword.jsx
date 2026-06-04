import { useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { toast } from "react-hot-toast";

export default function CambiarPassword() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ actual: "", nueva: "", confirmar: "" });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.nueva !== form.confirmar)
      return toast.error("Las contraseñas no coinciden");
    if (form.nueva.length < 6) return toast.error("Mínimo 6 caracteres");

    setLoading(true);
    try {
      const res = await fetch(
        "http://localhost:5000/api/auth/change-password",
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userId: user.id,
            currentPassword: form.actual,
            newPassword: form.nueva,
          }),
        },
      );

      const data = await res.json();
      if (!res.ok) throw new Error(data.message);

      // Actualizar usuario en contexto
      const updatedUser = { ...user, passwordExpired: false };
      localStorage.setItem("eventflow_user", JSON.stringify(updatedUser));

      toast.success("✅ Contraseña actualizada. Redirigiendo...");
      setTimeout(() => navigate("/dashboard"), 1500);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="bg-white p-8 rounded-2xl shadow-lg max-w-md w-full">
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            🔒
          </div>
          <h2 className="text-2xl font-bold text-gray-900">
            Cambiar Contraseña
          </h2>
          <p className="text-gray-500 text-sm mt-1">
            Tu contraseña ha expirado por seguridad
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="label-input">Contraseña Actual</label>
            <input
              type="password"
              required
              className="input-field"
              value={form.actual}
              onChange={(e) => setForm({ ...form, actual: e.target.value })}
            />
          </div>
          <div>
            <label className="label-input">Nueva Contraseña</label>
            <input
              type="password"
              required
              className="input-field"
              value={form.nueva}
              onChange={(e) => setForm({ ...form, nueva: e.target.value })}
            />
          </div>
          <div>
            <label className="label-input">Confirmar Nueva Contraseña</label>
            <input
              type="password"
              required
              className="input-field"
              value={form.confirmar}
              onChange={(e) => setForm({ ...form, confirmar: e.target.value })}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full mt-4"
          >
            {loading ? "Procesando..." : "Actualizar Contraseña"}
          </button>
        </form>
      </div>
    </div>
  );
}
