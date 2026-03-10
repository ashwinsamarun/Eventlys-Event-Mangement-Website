import React, { createContext, useCallback, useContext, useMemo, useState } from "react";
import "../styles/Toasts.css";

const ToastContext = createContext(null);

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const remove = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const push = useCallback((type, message, opts = {}) => {
    const id = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
    const duration = opts.duration ?? 2600;

    setToasts((prev) => [...prev, { id, type, message }]);

    window.setTimeout(() => remove(id), duration);
  }, [remove]);

  const api = useMemo(() => ({
    success: (msg, opts) => push("success", msg, opts),
    error: (msg, opts) => push("error", msg, opts),
    info: (msg, opts) => push("info", msg, opts),
  }), [push]);

  return (
    <ToastContext.Provider value={api}>
      {children}

      <div className="toast-stack" aria-live="polite" aria-relevant="additions">
        {toasts.map((t) => (
          <div key={t.id} className={`toast toast-${t.type}`} onClick={() => remove(t.id)}>
            <span className="toast-dot" />
            <span className="toast-msg">{t.message}</span>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within <ToastProvider>");
  return ctx;
};
