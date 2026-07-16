import { useEffect, useRef } from "react";
import { useAuth } from "../contexts/AuthContext";
import { toast } from "react-hot-toast";

// Eventos que consideramos "actividad" del usuario
const EVENTOS = ["mousemove", "mousedown", "keydown", "scroll", "touchstart"];

export default function InactivityWatcher() {
  const { user, logout } = useAuth();
  const timer = useRef(null);
  const minutos = useRef(30); // por defecto 30 min

  useEffect(() => {
    if (!user) return;

    const cerrarPorInactividad = () => {
      logout();
      toast("Sesión cerrada por inactividad", { icon: "🔒" });
    };

    const reset = () => {
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(
        cerrarPorInactividad,
        minutos.current * 60 * 1000,
      );
    };

    const onActivity = () => reset();
    EVENTOS.forEach((e) =>
      window.addEventListener(e, onActivity, { passive: true }),
    );

    reset(); // arrancar el temporizador

    // Leer el tiempo configurado del sistema (si existe)
    fetch("/api/config")
      .then((r) => r.json())
      .then((cfg) => {
        const m = parseInt(cfg?.minutos_inactividad?.valor);
        if (m > 0) {
          minutos.current = m;
          reset();
        }
      })
      .catch(() => {});

    return () => {
      if (timer.current) clearTimeout(timer.current);
      EVENTOS.forEach((e) => window.removeEventListener(e, onActivity));
    };
  }, [user]);

  return null;
}
