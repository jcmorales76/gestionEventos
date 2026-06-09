import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  Outlet,
  Link,
  useLocation,
} from "react-router-dom";
import { useEffect, useState } from "react";
import { useAuth } from "./contexts/AuthContext";
import { useTheme } from "./contexts/ThemeContext";
import { Toaster } from "react-hot-toast";

// Importar TODAS las páginas
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Eventos from "./pages/Eventos";
import Participantes from "./pages/Participantes";
import Materiales from "./pages/Materiales";
import Certificados from "./pages/Certificados"; // ✅ Panel Admin
import Usuarios from "./pages/Usuarios";
import Reportes from "./pages/Reportes";
import Importacion from "./pages/Importacion";
import Configuracion from "./pages/Configuracion";
import MisCertificados from "./pages/MisCertificados"; // ✅ Portal Participante (AGREGADO)
import ConfigurarPlantilla from "./pages/ConfigurarPlantilla";

import ModalConfirmacionPersonalizada from "./components/ModalConfirmacionPersonalizada";

// Layouts y Portal Participante
import ParticipantLayout from "./layouts/ParticipantLayout";
import MisEventos from "./pages/MisEventos";
import MisMateriales from "./pages/MisMateriales";
import MiPerfil from "./pages/MiPerfil";

// Layout Privado para Admin
const PrivateLayout = () => {
  const { user, logout } = useAuth();
  const { theme } = useTheme();
  const location = useLocation();
  const [systemLogo, setSystemLogo] = useState(null);
  const [config, setConfig] = useState(null);

  if (!user) return <Navigate to="/login" replace />;

  // Cargar logo y configuración del sistema
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
        setConfig(configData);
      } catch (error) {
        console.error("Error cargando configuración:", error);
      }
    };

    fetchSystemConfig();
  }, []);

  const menuItems = [
    { path: "/dashboard", label: "Dashboard", icon: "📊" },
    { path: "/eventos", label: "Eventos", icon: "📅" },
    { path: "/participantes", label: "Participantes", icon: "👥" },
    { path: "/materiales", label: "Materiales", icon: "📁" },
    { path: "/certificados", label: "Certificados", icon: "📜" },
    { path: "/usuarios", label: "Usuarios", icon: "👤" },
    { path: "/reportes", label: "Reportes", icon: "📈" },
    { path: "/importacion", label: "Importación Masiva", icon: "📥" },
    { path: "/configuracion", label: "Configuración", icon: "⚙️" },
  ];

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      {/* Sidebar - SIEMPRE VISIBLE */}
      <aside
        style={{ backgroundColor: theme.sidebarBg || "#0f172a" }}
        className="w-64 flex-shrink-0 flex flex-col text-white transition-all duration-300"
      >
        {/* Logo */}
        <div className="p-4 flex items-center gap-3 border-b border-white/10">
          {systemLogo ? (
            <img
              src={systemLogo}
              alt="Logo"
              className="h-10 w-auto object-contain rounded-lg"
            />
          ) : (
            <div className="w-10 h-10 rounded-lg bg-red-600 flex items-center justify-center font-bold text-lg flex-shrink-0">
              F
            </div>
          )}
          <div className="min-w-0">
            <span className="font-bold text-base tracking-wider block leading-tight">
              {config?.nombre_sistema?.valor || ""}
            </span>
            <span className="text-xs text-white/60 block">
              Gestión de Eventos
            </span>
          </div>
        </div>

        {/* Navegación */}
        <nav className="flex-1 px-3 py-6 space-y-1 overflow-y-auto">
          {menuItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all text-sm font-medium ${
                  isActive
                    ? "bg-red-600 text-white shadow-lg"
                    : "text-white/70 hover:bg-white/10 hover:text-white"
                }`}
              >
                <span className="text-lg">{item.icon}</span>
                <span className="truncate">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Usuario */}
        <div className="p-4 border-t border-white/10 bg-black/20">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
              <span className="text-sm font-bold">
                {user?.name?.charAt(0) || "A"}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">
                {user?.name || "Administrador"}
              </p>
              <p className="text-xs text-white/60 truncate">
                {user?.email || "admin@fepcmac.com"}
              </p>
            </div>
          </div>
          <button
            onClick={logout}
            className="w-full px-4 py-2 text-xs font-medium text-white/70 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
          >
            Cerrar Sesión
          </button>
        </div>
      </aside>

      {/* Contenido Principal */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6 flex-shrink-0">
          <h2 className="text-lg font-semibold text-gray-800">
            Gestión de Eventos
          </h2>
          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-600 hidden sm:block">
              {user?.name}
            </span>
            <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center text-red-600 font-semibold text-sm">
              {user?.name?.charAt(0) || "A"}
            </div>
          </div>
        </header>

        {/* Main Content - Scrollable */}
        <main className="flex-1 overflow-y-auto bg-gray-50 p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

function App() {
  const { loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <div className="text-center">
          <div className="w-16 h-16 rounded-xl bg-red-600 flex items-center justify-center mx-auto mb-4">
            <span className="text-white text-3xl font-bold">F</span>
          </div>
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 font-medium">Cargando FEPCMAC...</p>
        </div>
      </div>
    );
  }

  return (
    <BrowserRouter>
      <Toaster position="top-right" />
      <Routes>
        {/* Ruta Pública */}
        <Route path="/login" element={<Login />} />
        // Rutas Privadas de Admin
        <Route element={<PrivateLayout />}>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/eventos" element={<Eventos />} />
          <Route path="/participantes" element={<Participantes />} />
          <Route path="/materiales" element={<Materiales />} />
          <Route path="/certificados" element={<Certificados />} /> // ✅ Admin
          <Route path="/usuarios" element={<Usuarios />} />
          <Route path="/reportes" element={<Reportes />} />
          <Route path="/importacion" element={<Importacion />} />
          <Route path="/configuracion" element={<Configuracion />} />
          <Route
            path="/certificados/configurar/:eventoId"
            element={<ConfigurarPlantilla />}
          />
          {/* ✅ ELIMINAR la línea duplicada de /certificados */}
        </Route>
        // Rutas del Portal de Participantes
        <Route element={<ParticipantLayout />}>
          <Route path="/portal" element={<MisEventos />} />
          <Route path="/portal/materiales" element={<MisMateriales />} />
          <Route path="/portal/certificados" element={<MisCertificados />} /> //
          ✅ Participante
          <Route path="/portal/perfil" element={<MiPerfil />} />
        </Route>
        {/* Ruta Fallback */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
