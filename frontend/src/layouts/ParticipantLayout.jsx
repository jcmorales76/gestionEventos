import { Outlet, Navigate, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { useEffect, useState } from "react";
import UserMenu from "../components/UserMenu";

export default function ParticipantLayout() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [activeMenu, setActiveMenu] = useState("mis-eventos");

  // ✅ NUEVO: Estados para logo y configuración
  const [systemLogo, setSystemLogo] = useState(null);
  const [systemName, setSystemName] = useState("FEPCMAC");

  // ✅ NUEVO: Cargar logo y nombre del sistema
  useEffect(() => {
    const fetchSystemConfig = async () => {
      try {
        const logoRes = await fetch("http://localhost:5000/api/config/logo");
        const logoData = await logoRes.json();
        if (logoData.logoUrl) {
          setSystemLogo(`http://localhost:5000${logoData.logoUrl}`);
        }

        const configRes = await fetch("http://localhost:5000/api/config");
        const configData = await configRes.json();
        if (configData.nombre_sistema?.valor) {
          setSystemName(configData.nombre_sistema.valor);
        }
      } catch (error) {
        console.error("Error cargando configuración:", error);
      }
    };

    fetchSystemConfig();
  }, []);

  // Sincronizar el menú activo con la ruta actual
  useEffect(() => {
    const path = location.pathname;
    if (path.includes("/perfil")) {
      setActiveMenu("mi-perfil");
    } else if (path.includes("/materiales")) {
      setActiveMenu("mis-materiales");
    } else if (path.includes("/encuestas")) {
      setActiveMenu("mis-encuestas");
    } else if (path.includes("/certificados")) {
      setActiveMenu("mis-certificados");
    } else {
      setActiveMenu("mis-eventos");
    }
  }, [location.pathname]);

  // Guardas DESPUÉS de los hooks (nunca antes, o se rompe el orden de hooks)
  if (!user) return <Navigate to="/login" replace />;
  // 🔒 Contraseña expirada: forzar cambio antes de cualquier otra cosa
  if (user.passwordExpired)
    return <Navigate to="/cambiar-password" replace />;
  // 🔒 El área de administración no se mezcla con el portal del alumno
  if (user.rol === "admin") return <Navigate to="/dashboard" replace />;

  const nombreCompleto =
    [user?.nombre, user?.apellido].filter(Boolean).join(" ") ||
    user?.name ||
    user?.email ||
    "Participante";

  // Menú de navegación lateral para el participante
  const menuItems = [
    { id: "mis-eventos", label: "Mis Eventos", icon: "📅", path: "/portal" },
    {
      id: "mis-materiales",
      label: "Mis Materiales",
      icon: "📁",
      path: "/portal/materiales",
    },
    {
      id: "mis-encuestas",
      label: "Mis Encuestas",
      icon: "📝",
      path: "/portal/encuestas",
    },
    {
      id: "mis-certificados",
      label: "Mis Certificados",
      icon: "🎓",
      path: "/portal/certificados",
    },
    { id: "mi-perfil", label: "Mi Perfil", icon: "👤", path: "/portal/perfil" },
  ];

  const handleMenuClick = (path) => {
    navigate(path);
  };

  return (
    <div className="flex h-screen overflow-hidden bg-transparent">
      {/* Sidebar Participante */}
      <aside className="w-64 bg-slate-900 text-white flex-shrink-0 flex flex-col bg-gradient-to-b from-white/[0.05] to-black/30 relative">
        {/* Acento superior de marca */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-brand-gradient" />

        {/* Logo */}
        <div className="p-6 flex items-center gap-3 border-b border-white/10">
          {systemLogo ? (
            <img
              src={systemLogo}
              alt="Logo"
              className="h-10 w-auto object-contain rounded-lg"
            />
          ) : (
            <div className="w-10 h-10 bg-brand-gradient rounded-xl flex items-center justify-center font-bold shadow-glow">
              F
            </div>
          )}
          <div className="min-w-0">
            <span className="font-heading font-bold text-lg block leading-tight truncate">
              {systemName}
            </span>
            <span className="text-xs text-slate-400 block">Portal Alumno</span>
          </div>
        </div>

        {/* Menú */}
        <nav className="flex-1 py-6 px-3 space-y-1">
          {menuItems.map((item) => (
            <a
              key={item.id}
              href="#"
              onClick={(e) => {
                e.preventDefault();
                handleMenuClick(item.path);
              }}
              className={`flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all text-sm font-medium ${
                activeMenu === item.id
                  ? "bg-brand-gradient text-white shadow-glow"
                  : "text-slate-300 hover:bg-white/10 hover:text-white"
              }`}
            >
              <span className="text-lg">{item.icon}</span>
              {item.label}
            </a>
          ))}
        </nav>

        {/* Usuario */}
        <div className="p-4 border-t border-white/10">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-full bg-brand-gradient ring-2 ring-white/20 flex items-center justify-center text-sm font-bold">
              {nombreCompleto.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{nombreCompleto}</p>
              <p className="text-xs text-slate-500 truncate">{user?.email}</p>
            </div>
          </div>
          <button
            onClick={logout}
            className="w-full py-2 text-xs font-semibold text-slate-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
          >
            Cerrar Sesión
          </button>
        </div>
      </aside>

      {/* Contenido Principal */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="h-16 glass flex items-center justify-between px-6 relative z-40">
          <h2 className="text-lg font-bold text-secondary-800 font-heading">
            {menuItems.find((m) => m.id === activeMenu)?.label || "Bienvenido"}
          </h2>
          <UserMenu profilePath="/portal/perfil" />
        </header>

        <main className="flex-1 overflow-y-auto p-6 animate-enter">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
