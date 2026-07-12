import { createContext, useContext, useState, useEffect } from "react";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Verificar si hay sesión al cargar
  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const token = localStorage.getItem("eventflow_token");
      const userData = localStorage.getItem("eventflow_user");

      if (token && userData) {
        // Opcional: Aquí podrías validar el token con el backend
        setUser(JSON.parse(userData));
      }
    } catch (error) {
      console.error("Error verificando autenticación:", error);
      localStorage.removeItem("eventflow_token");
      localStorage.removeItem("eventflow_user");
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Error al iniciar sesión");
      }

      // Guardar token y usuario
      localStorage.setItem("eventflow_token", data.token);
      localStorage.setItem("eventflow_user", JSON.stringify(data.user));

      setUser(data.user);

      // El redirect por contraseña expirada lo maneja Login.jsx / las guardas
      // de los layouts, según data.user.passwordExpired.

      return data.user;
    } catch (error) {
      console.error("Error en login:", error);
      throw error;
    }
  };

  const logout = () => {
    localStorage.removeItem("eventflow_token");
    localStorage.removeItem("eventflow_user");
    setUser(null);
  };

  // Actualiza el usuario en memoria y en localStorage (p. ej. tras editar perfil)
  const updateUser = (updates) => {
    setUser((prev) => {
      const merged = { ...prev, ...updates };
      localStorage.setItem("eventflow_user", JSON.stringify(merged));
      return merged;
    });
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loading, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
};

// ✅ Hook personalizado - IMPORTANTE EXPORTARLO
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth debe ser usado dentro de un AuthProvider");
  }
  return context;
};
