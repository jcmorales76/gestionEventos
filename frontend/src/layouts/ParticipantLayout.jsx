import { Outlet, Navigate, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { useEffect, useState } from "react";

export default function ParticipantLayout() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [activeMenu, setActiveMenu] = useState("mis-eventos");

  // ✅ NUEVO: Estados para logo y configuración
  const [systemLogo, setSystemLogo] = useState(null);
  const [systemName, setSystemName] = useState("FEPCMAC");

  // Si no hay usuario, mandar al login
  if (!user) return <Navigate to="/login" replace />;

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
    } else if (path.includes("/certificados")) {
      setActiveMenu("mis-certificados");
    } else {
      setActiveMenu("mis-eventos");
    }
  }, [location.pathname]);

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
    <div className="flex h-screen overflow-hidden bg-gray-50">
      {/* Sidebar Participante */}
      <aside className="w-64 bg-slate-900 text-white flex-shrink-0 flex flex-col">
        {/* Logo - ✅ MEJORADO: Logo dinámico */}
        <div className="p-6 flex items-center gap-3 border-b border-slate-800">
          {systemLogo ? (
            <img
              src={systemLogo}
              alt="Logo"
              className="h-10 w-auto object-contain rounded-lg"
            />
          ) : (
            <div className="w-8 h-8 bg-red-600 rounded-lg flex items-center justify-center font-bold">
              F
            </div>
          )}
          <div className="min-w-0">
            <span className="font-bold text-lg block leading-tight truncate">
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
              className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all text-sm ${
                activeMenu === item.id
                  ? "bg-red-600 text-white shadow-md"
                  : "text-slate-300 hover:bg-slate-800 hover:text-white"
              }`}
            >
              <span className="text-lg">{item.icon}</span>
              {item.label}
            </a>
          ))}
        </nav>

        {/* Usuario */}
        <div className="p-4 border-t border-slate-800">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center text-xs font-bold">
              {user?.name?.charAt(0)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{user?.name}</p>
              <p className="text-xs text-slate-500 truncate">{user?.email}</p>
            </div>
          </div>
          <button
            onClick={logout}
            className="w-full py-2 text-xs text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
          >
            Cerrar Sesión
          </button>
        </div>
      </aside>

      {/* Contenido Principal */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header Simple */}
        <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6">
          <h2 className="text-lg font-semibold text-gray-800">
            {menuItems.find((m) => m.id === activeMenu)?.label || "Bienvenido"}
          </h2>
        </header>

        <main className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
