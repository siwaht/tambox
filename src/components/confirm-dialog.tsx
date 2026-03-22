"use client";

import { useEffect, useRef } from "react";

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: "danger" | "default";
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  variant = "default",
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const confirmRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (open) {
      confirmRef.current?.focus();
      const handler = (e: KeyboardEvent) => {
        if (e.key === "Escape") onCancel();
      };
      window.addEventListener("keydown", handler);
      return () => window.removeEventListener("keydown", handler);
    }
  }, [open, onCancel]);

  if (!open) return null;

  return (
    <div className="overlay-backdrop" style={{ zIndex: 60 }} onClick={onCancel}>
      <div
        className="overlay-panel p-5 w-[360px] animate-scale"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start gap-3 mb-4">
          {variant === "danger" && (
            <div className="w-8 h-8 rounded-lg bg-[var(--danger-subtle)] flex items-center justify-center shrink-0 mt-0.5">
              <span className="text-[var(--danger)] text-[14px]">⚠</span>
            </div>
          )}
          <div>
            <h3 className="text-[14px] font-semibold text-[var(--text-primary)] mb-1">{title}</h3>
            <p className="text-[12px] text-[var(--text-secondary)] leading-relaxed">{message}</p>
          </div>
        </div>
        <div className="flex justify-end gap-2">
          <button onClick={onCancel} className="btn btn-ghost text-[12px]">{cancelLabel}</button>
          <button
            ref={confirmRef}
            onClick={onConfirm}
            className={`btn text-[12px] ${
              variant === "danger"
                ? "bg-[var(--danger)] text-white hover:bg-red-600"
                : "btn-primary"
            }`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
