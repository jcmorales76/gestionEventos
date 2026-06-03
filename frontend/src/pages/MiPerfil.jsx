import { useAuth } from "../contexts/AuthContext";
import { useState } from "react";

export default function MiPerfil() {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    nombre: user?.name || "Juan Carlos",
    email: user?.email || "admin@fepcmac.com",
    telefono: "+51 987 654 321",
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
        <h2 className="text-xl font-bold text-gray-900 mb-6">Mi Perfil</h2>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nombre Completo
              </label>
              <input
                name="nombre"
                value={formData.nombre}
                onChange={handleChange}
                className="input-field"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Teléfono
              </label>
              <input
                name="telefono"
                value={formData.telefono}
                onChange={handleChange}
                className="input-field"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Correo Electrónico
            </label>
            <input
              name="email"
              value={formData.email}
              onChange={handleChange}
              className="input-field bg-gray-50 cursor-not-allowed"
              disabled
            />
          </div>

          <div className="pt-4 border-t border-gray-100 mt-6">
            <h3 className="text-sm font-bold text-gray-900 mb-4">
              Cambiar Contraseña
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <input
                type="password"
                placeholder="Nueva contraseña"
                className="input-field"
              />
              <input
                type="password"
                placeholder="Confirmar contraseña"
                className="input-field"
              />
            </div>
          </div>

          <div className="flex justify-end mt-6">
            <button className="btn-primary">Guardar Cambios</button>
          </div>
        </div>
      </div>
    </div>
  );
}
