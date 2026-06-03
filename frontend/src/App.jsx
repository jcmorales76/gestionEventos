import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  Outlet,
} from "react-router-dom";
import { useAuth } from "./contexts/AuthContext";
import { useTheme } from "./contexts/ThemeContext";
import { Toaster } from "react-hot-toast";

// Importar TODAS las páginas
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Eventos from "./pages/Eventos";
import Participantes from "./pages/Participantes";
import Materiales from "./pages/Materiales";
import Certificados from "./pages/Certificados";
import Usuarios from "./pages/Usuarios";
import Reportes from "./pages/Reportes";

// Layouts
import ParticipantLayout from "./layouts/ParticipantLayout";
import MisEventos from "./pages/MisEventos";
import MisMateriales from "./pages/MisMateriales";
import MisCertificados from "./pages/MisCertificados";
import MiPerfil from "./pages/MiPerfil";

// Layout Privado para Admin
const PrivateLayout = () => {
  const { user, logout } = useAuth();
  const { theme } = useTheme();

  if (!user) return <Navigate to="/login" replace />;

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar - Verifica que los href coincidan con las rutas */}
      <aside
        style={{ backgroundColor: theme.sidebarBg }}
        className="w-60 flex-shrink-0 hidden md:flex flex-col text-white transition-all duration-300"
      >
        {/* Logo */}
        <div className="p-4 flex items-center gap-3 border-b border-white/10">
          <div className="w-9 h-9 rounded-lg bg-red-600 flex items-center justify-center font-bold text-lg">
            F
          </div>
          <div>
            <span className="font-bold text-base tracking-wider block leading-tight">
              FEPCMAC
            </span>
            <span className="text-xs text-white/60">Gestión de Eventos</span>
          </div>
        </div>

        {/* Navegación - Los href deben coincidir EXACTAMENTE con las rutas */}
        <nav className="flex-1 px-3 space-y-1 mt-4">
          <a href="/dashboard" className="sidebar-link">
            Dashboard
          </a>
          <a href="/eventos" className="sidebar-link">
            Eventos
          </a>
          <a href="/participantes" className="sidebar-link">
            Participantes
          </a>
          <a href="/materiales" className="sidebar-link">
            Materiales
          </a>
          <a href="/certificados" className="sidebar-link">
            Certificados
          </a>
          <a href="/usuarios" className="sidebar-link">
            Usuarios
          </a>
          <a href="/reportes" className="sidebar-link">
            Reportes
          </a>
        </nav>

        {/* Usuario */}
        <div className="p-3 border-t border-white/10">
          <button
            onClick={logout}
            className="text-sm text-white/70 hover:text-white"
          >
            Cerrar sesión
          </button>
        </div>
      </aside>

      {/* Contenido Principal */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="h-14 bg-white border-b border-gray-200 flex items-center justify-between px-5">
          <h2 className="text-base font-semibold text-gray-800">
            Gestión de Eventos
          </h2>
        </header>

        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-50 p-5">
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
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
      </div>
    );
  }

  return (
    <BrowserRouter>
      <Toaster position="top-right" />
      <Routes>
        {/* Ruta Pública */}
        <Route path="/login" element={<Login />} />

        {/* Rutas Privadas de Admin */}
        <Route element={<PrivateLayout />}>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/eventos" element={<Eventos />} />
          <Route path="/participantes" element={<Participantes />} />
          <Route path="/materiales" element={<Materiales />} />
          <Route path="/certificados" element={<Certificados />} />
          <Route path="/usuarios" element={<Usuarios />} />
          <Route path="/reportes" element={<Reportes />} />
        </Route>

        {/* Rutas del Portal de Participantes */}
        <Route element={<ParticipantLayout />}>
          <Route path="/portal" element={<MisEventos />} />
          <Route path="/portal/materiales" element={<MisMateriales />} />
          <Route path="/portal/certificados" element={<MisCertificados />} />
          <Route path="/portal/perfil" element={<MiPerfil />} />
        </Route>

        {/* Ruta Fallback */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
