import { createContext, useState, useContext, useEffect } from "react";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Verificar si hay sesión guardada (simulado)
    const storedUser = localStorage.getItem("fepcmac_user");
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
    setLoading(false);
  }, []);

  const login = async (email, password) => {
    // SIMULACIÓN DE LOGIN (Se conectará al Backend luego)
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        if (email === "admin@fepcmac.com" && password === "123456") {
          const userData = {
            id: 1,
            name: "Administrador FEPCMAC",
            email: email,
            role: "admin",
          };
          setUser(userData);
          localStorage.setItem("fepcmac_user", JSON.stringify(userData));
          resolve(userData);
        } else {
          reject(new Error("Credenciales inválidas"));
        }
      }, 500);
    });
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem("fepcmac_user");
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
