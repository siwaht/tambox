"use client";

import { useState, useEffect, useCallback, createContext, useContext, ReactNode } from "react";

type ToastType = "success" | "error" | "info";

interface Toast {
  id: number;
  message: string;
  type: ToastType;
}

interface ToastContextValue {
  toast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextValue>({ toast: () => {} });

export function useToast() {
  return useContext(ToastContext);
}

let nextId = 0;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const toast = useCallback((message: string, type: ToastType = "info") => {
    const id = nextId++;
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3000);
  }, []);

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      {/* Toast container */}
      <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2 pointer-events-none">
        {toasts.map((t) => (
          <ToastItem key={t.id} toast={t} onDismiss={() => setToasts((prev) => prev.filter((x) => x.id !== t.id))} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

function ToastItem({ toast, onDismiss }: { toast: Toast; onDismiss: () => void }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    requestAnimationFrame(() => setVisible(true));
    const timer = setTimeout(() => setVisible(false), 2700);
    return () => clearTimeout(timer);
  }, []);

  const colors = {
    success: "border-[var(--success)] bg-[var(--success-subtle)]",
    error: "border-[var(--danger)] bg-[var(--danger-subtle)]",
    info: "border-[var(--accent)] bg-[var(--accent-subtle)]",
  };

  const icons = { success: "✓", error: "✕", info: "ℹ" };
  const iconColors = {
    success: "text-[var(--success)]",
    error: "text-[var(--danger)]",
    info: "text-[var(--accent)]",
  };

  return (
    <div
      className={`pointer-events-auto flex items-center gap-2.5 px-3.5 py-2.5 rounded-lg border
        bg-[var(--bg-elevated)] shadow-lg backdrop-blur-sm
        transition-all duration-300 ease-out cursor-pointer
        ${colors[toast.type]}
        ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"}`}
      onClick={onDismiss}
    >
      <span className={`text-[12px] font-medium ${iconColors[toast.type]}`}>{icons[toast.type]}</span>
      <span className="text-[12px] text-[var(--text-primary)]">{toast.message}</span>
    </div>
  );
}
