import { createContext, useState, useContext, useEffect } from "react";

const ThemeContext = createContext(null);

export const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState(() => {
    const saved = localStorage.getItem("fepcmac_theme");
    return saved
      ? JSON.parse(saved)
      : {
          primaryColor: "#dc2626", // Rojo FEPCMAC por defecto
          sidebarBg: "#0f172a", // Azul oscuro/Negro
          borderRadius: "10px",
        };
  });

  useEffect(() => {
    // Aplicar variables CSS al documento
    const root = document.documentElement;
    root.style.setProperty("--brand-primary", theme.primaryColor);
    root.style.setProperty("--bg-sidebar", theme.sidebarBg);
    root.style.setProperty("--radius-md", theme.borderRadius);

    // Guardar cambios
    localStorage.setItem("fepcmac_theme", JSON.stringify(theme));
  }, [theme]);

  const updateTheme = (newTheme) => {
    setTheme((prev) => ({ ...prev, ...newTheme }));
  };

  return (
    <ThemeContext.Provider value={{ theme, updateTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
