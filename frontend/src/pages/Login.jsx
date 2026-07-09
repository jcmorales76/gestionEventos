import { useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const usuario = await login(email, password);
      // 🔒 Si la contraseña expiró, forzar el cambio antes de entrar
      if (usuario?.passwordExpired) {
        toast("Tu contraseña ha expirado. Debes cambiarla.", { icon: "🔒" });
        navigate("/cambiar-password");
        return;
      }
      toast.success("¡Bienvenido a FEPCMAC!");
      // Redirigir según el rol
      if (usuario?.rol === "participante") {
        navigate("/portal");
      } else {
        navigate("/dashboard");
      }
    } catch (error) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-10">
      <div className="max-w-md w-full">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 rounded-2xl bg-brand-gradient flex items-center justify-center mx-auto mb-4 shadow-glow">
            <span className="text-white text-4xl font-bold font-heading">F</span>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2 font-heading text-gradient">
            FEPCMAC
          </h1>
          <p className="text-gray-600">Gestión de Eventos</p>
        </div>

        {/* Formulario */}
        <div className="bg-white rounded-2xl shadow-card border border-secondary-100 overflow-hidden">
          <div className="h-1.5 bg-brand-gradient" />
          <div className="p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center font-heading">
            Iniciar Sesión
          </h2>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Correo electrónico
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all"
                placeholder="admin@fepcmac.com"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Contraseña
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all"
                placeholder="••••••••"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-brand-gradient text-white font-semibold py-3 rounded-xl transition-all duration-200 shadow-sm hover:shadow-glow hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Ingresando..." : "Ingresar"}
            </button>
          </form>

          {/* Credenciales de prueba */}
          <div className="mt-6 p-4 bg-secondary-50 rounded-xl border border-secondary-100">
            <p className="text-xs text-gray-600 font-medium mb-2">
              Credenciales de prueba:
            </p>
            <p className="text-xs text-gray-500">Email: admin@fepcmac.com</p>
            <p className="text-xs text-gray-500">Contraseña: 123456</p>
          </div>
          </div>
        </div>
      </div>
    </div>
  );
}
