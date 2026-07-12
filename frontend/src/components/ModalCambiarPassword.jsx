import { useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { toast } from "react-hot-toast";
import Modal from "./Modal";

export default function ModalCambiarPassword({ onClose }) {
  const { user } = useAuth();
  const [form, setForm] = useState({ actual: "", nueva: "", confirmar: "" });
  const [saving, setSaving] = useState(false);

  const submit = async () => {
    if (!form.actual || !form.nueva)
      return toast.error("Completa la contraseña actual y la nueva");
    if (form.nueva.length < 4)
      return toast.error("La nueva contraseña es demasiado corta");
    if (form.nueva !== form.confirmar)
      return toast.error("Las contraseñas nuevas no coinciden");

    setSaving(true);
    try {
      const res = await fetch(
        "/api/auth/change-password",
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userId: user.id,
            currentPassword: form.actual,
            newPassword: form.nueva,
          }),
        },
      );
      const data = await res.json();
      if (res.ok) {
        toast.success("✅ Contraseña actualizada");
        onClose();
      } else {
        toast.error(data.message || "Error al cambiar la contraseña");
      }
    } catch (error) {
      toast.error("Error de conexión");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      isOpen={true}
      onClose={onClose}
      title="Cambiar contraseña"
      size="sm"
      footer={
        <>
          <button onClick={onClose} className="btn-secondary">
            Cancelar
          </button>
          <button
            onClick={submit}
            disabled={saving}
            className="btn-primary disabled:opacity-50"
          >
            {saving ? "Guardando..." : "Actualizar"}
          </button>
        </>
      }
    >
      <div className="space-y-4">
        <div>
          <label className="label-input">Contraseña actual</label>
          <input
            type="password"
            className="input-field"
            value={form.actual}
            onChange={(e) => setForm({ ...form, actual: e.target.value })}
            placeholder="••••••••"
          />
        </div>
        <div>
          <label className="label-input">Nueva contraseña</label>
          <input
            type="password"
            className="input-field"
            value={form.nueva}
            onChange={(e) => setForm({ ...form, nueva: e.target.value })}
            placeholder="••••••••"
          />
        </div>
        <div>
          <label className="label-input">Confirmar nueva contraseña</label>
          <input
            type="password"
            className="input-field"
            value={form.confirmar}
            onChange={(e) => setForm({ ...form, confirmar: e.target.value })}
            placeholder="••••••••"
          />
        </div>
      </div>
    </Modal>
  );
}
