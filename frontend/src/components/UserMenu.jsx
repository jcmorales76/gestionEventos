import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import ModalCambiarPassword from "./ModalCambiarPassword";

export default function UserMenu({ profilePath }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [modalPwd, setModalPwd] = useState(false);
  const ref = useRef(null);

  const nombre =
    [user?.nombre, user?.apellido].filter(Boolean).join(" ") ||
    user?.name ||
    user?.email ||
    "Usuario";
  const inicial = nombre.charAt(0).toUpperCase();

  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const Avatar = ({ size = "w-9 h-9", text = "text-sm" }) =>
    user?.foto_url ? (
      <img
        src={`${user.foto_url}`}
        alt="avatar"
        className={`${size} rounded-full object-cover ring-2 ring-primary-500/20`}
      />
    ) : (
      <div
        className={`${size} rounded-full bg-brand-gradient ring-2 ring-primary-500/20 flex items-center justify-center text-white font-semibold ${text} shadow-sm`}
      >
        {inicial}
      </div>
    );

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-2 rounded-full hover:bg-secondary-100/70 pl-3 pr-1 py-1 transition-colors"
      >
        <span className="text-sm text-secondary-700 hidden sm:block max-w-[140px] truncate">
          {nombre}
        </span>
        <Avatar />
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-60 surface p-2 z-50 animate-enter">
          <div className="flex items-center gap-3 px-2 py-2 border-b border-secondary-100 mb-1">
            <Avatar size="w-10 h-10" text="text-base" />
            <div className="min-w-0">
              <p className="text-sm font-semibold text-secondary-800 truncate">
                {nombre}
              </p>
              <p className="text-xs text-secondary-500 truncate">
                {user?.email}
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              setOpen(false);
              navigate(profilePath);
            }}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-secondary-700 hover:bg-secondary-50 transition-colors"
          >
            <span>👤</span> Mi Perfil
          </button>
          <button
            onClick={() => {
              setOpen(false);
              setModalPwd(true);
            }}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-secondary-700 hover:bg-secondary-50 transition-colors"
          >
            <span>🔒</span> Cambiar contraseña
          </button>

          <div className="my-1 border-t border-secondary-100" />

          <button
            onClick={logout}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-primary-600 hover:bg-primary-50 transition-colors font-medium"
          >
            <span>🚪</span> Cerrar sesión
          </button>
        </div>
      )}

      {modalPwd && <ModalCambiarPassword onClose={() => setModalPwd(false)} />}
    </div>
  );
}
