import { useState, useEffect, useCallback } from "react";
import { onToast } from "@/lib/toast";
import { CheckCircle2, XCircle, Info, AlertTriangle, X } from "lucide-react";

const ICONS = {
  success: CheckCircle2,
  error: XCircle,
  info: Info,
  warning: AlertTriangle,
};

const STYLES = {
  success: "bg-green-50 border-green-200 text-green-800",
  error:   "bg-red-50 border-red-200 text-red-800",
  info:    "bg-blue-50 border-blue-200 text-blue-800",
  warning: "bg-amber-50 border-amber-200 text-amber-800",
};

const ICON_STYLES = {
  success: "text-green-500",
  error:   "text-red-500",
  info:    "text-blue-500",
  warning: "text-amber-500",
};

const PROGRESS_STYLES = {
  success: "bg-green-400",
  error:   "bg-red-400",
  info:    "bg-blue-400",
  warning: "bg-amber-400",
};

function ToastItem({ toast: t, onDismiss }) {
  const [exiting, setExiting] = useState(false);
  const Icon = ICONS[t.type] || Info;

  useEffect(() => {
    const timer = setTimeout(() => {
      setExiting(true);
      setTimeout(() => onDismiss(t.id), 300);
    }, t.duration);
    return () => clearTimeout(timer);
  }, [t, onDismiss]);

  const handleDismiss = () => {
    setExiting(true);
    setTimeout(() => onDismiss(t.id), 300);
  };

  return (
    <div
      className={`
        relative flex items-start gap-3 px-4 py-3 rounded-xl border shadow-lg backdrop-blur-sm
        transition-all duration-300
        ${STYLES[t.type]}
        ${exiting ? "opacity-0 translate-x-8" : "opacity-100 translate-x-0"}
      `}
      style={{ minWidth: 300, maxWidth: 440 }}
    >
      <Icon className={`w-5 h-5 mt-0.5 shrink-0 ${ICON_STYLES[t.type]}`} />
      <p className="flex-1 text-sm font-medium leading-snug">{t.message}</p>
      <button
        onClick={handleDismiss}
        className="shrink-0 p-0.5 rounded hover:bg-black/5 transition-colors"
      >
        <X className="w-4 h-4 opacity-40" />
      </button>
      {/* Progress bar */}
      <div className="absolute bottom-0 left-0 right-0 h-0.5 rounded-b-xl overflow-hidden">
        <div
          className={`h-full ${PROGRESS_STYLES[t.type]}`}
          style={{
            animation: `toast-progress ${t.duration}ms linear forwards`,
          }}
        />
      </div>
    </div>
  );
}

export function Snackbar() {
  const [toasts, setToasts] = useState([]);

  useEffect(() => {
    return onToast((t) => {
      setToasts((prev) => [...prev.slice(-4), t]); // max 5 visible
    });
  }, []);

  const dismiss = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  if (toasts.length === 0) return null;

  return (
    <>
      <style>{`
        @keyframes toast-progress {
          from { width: 100%; }
          to { width: 0%; }
        }
      `}</style>
      <div className="fixed bottom-4 right-4 z-[9999] flex flex-col gap-2 items-end">
        {toasts.map((t) => (
          <ToastItem key={t.id} toast={t} onDismiss={dismiss} />
        ))}
      </div>
    </>
  );
}
