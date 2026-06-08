import { useState } from "react";

export default function ModalConfirmacionPersonalizada({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = "Aceptar",
  cancelText = "Cancelar",
  type = "warning",
}) {
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const configs = {
    warning: {
      icon: "🔑",
      bg: "bg-orange-100",
      iconColor: "text-orange-600",
      buttonBg: "bg-orange-600 hover:bg-orange-700",
      buttonFocus: "focus:ring-orange-500",
    },
    danger: {
      icon: "🗑️",
      bg: "bg-red-100",
      iconColor: "text-red-600",
      buttonBg: "bg-red-600 hover:bg-red-700",
      buttonFocus: "focus:ring-red-500",
    },
    info: {
      icon: "ℹ️",
      bg: "bg-blue-100",
      iconColor: "text-blue-600",
      buttonBg: "bg-blue-600 hover:bg-blue-700",
      buttonFocus: "focus:ring-blue-500",
    },
  };

  const config = configs[type] || configs.warning;

  const handleConfirm = async () => {
    setLoading(true);
    try {
      await onConfirm();
    } finally {
      setLoading(false);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-fadeIn">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden">
        {/* Header con icono y título */}
        <div className="p-6 pb-4">
          <div className="flex items-start gap-4">
            <div
              className={`w-14 h-14 rounded-full ${config.bg} flex items-center justify-center flex-shrink-0`}
            >
              <span className="text-2xl">{config.icon}</span>
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-lg font-bold text-gray-900 mb-2">{title}</h3>
              {/* ✅ AQUÍ ESTÁ LA CORRECCIÓN - Usar dangerouslySetInnerHTML */}
              <div
                className="text-sm text-gray-600 leading-relaxed"
                dangerouslySetInnerHTML={{ __html: message }}
              />
            </div>
          </div>
        </div>

        {/* Footer con botones */}
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex justify-end gap-3">
          <button
            onClick={onClose}
            disabled={loading}
            className="px-5 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 disabled:opacity-50 transition-colors"
          >
            {cancelText}
          </button>
          <button
            onClick={handleConfirm}
            disabled={loading}
            className={`px-5 py-2.5 text-sm font-medium text-white ${config.buttonBg} rounded-lg focus:outline-none focus:ring-2 ${config.buttonFocus} focus:ring-offset-2 disabled:opacity-50 transition-colors flex items-center gap-2`}
          >
            {loading && (
              <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                  fill="none"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
            )}
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
