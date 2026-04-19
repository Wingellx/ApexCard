"use client";

import { createContext, useContext, useState, useCallback, useEffect, useRef } from "react";
import { CheckCircle2, XCircle, X } from "lucide-react";
import { cn } from "@/lib/utils";

type ToastType = "success" | "error";

interface ToastItem {
  id: string;
  type: ToastType;
  message: string;
}

interface ToastContextValue {
  toast: (message: string, type?: ToastType) => void;
  success: (message: string) => void;
  error: (message: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx;
}

function Toast({ item, onRemove }: { item: ToastItem; onRemove: (id: string) => void }) {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    timerRef.current = setTimeout(() => onRemove(item.id), 4000);
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [item.id, onRemove]);

  return (
    <div className={cn(
      "flex items-center gap-3 pl-4 pr-3 py-3 rounded-xl border shadow-2xl text-sm font-medium w-[320px] animate-in",
      item.type === "success"
        ? "bg-[#0d1a14] border-emerald-500/30 text-emerald-300"
        : "bg-[#1a0d0d] border-rose-500/30 text-rose-300"
    )}>
      {item.type === "success"
        ? <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
        : <XCircle className="w-4 h-4 shrink-0 text-rose-400" />}
      <p className="flex-1 leading-snug">{item.message}</p>
      <button
        onClick={() => onRemove(item.id)}
        className="opacity-50 hover:opacity-100 transition-opacity ml-1"
        aria-label="Dismiss"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const remove = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const toast = useCallback((message: string, type: ToastType = "success") => {
    const id = Math.random().toString(36).slice(2, 9);
    setToasts(prev => [...prev.slice(-4), { id, type, message }]);
  }, []);

  const success = useCallback((message: string) => toast(message, "success"), [toast]);
  const error   = useCallback((message: string) => toast(message, "error"),   [toast]);

  return (
    <ToastContext.Provider value={{ toast, success, error }}>
      {children}
      <div className="fixed bottom-6 right-6 z-[9999] flex flex-col-reverse gap-2 pointer-events-none">
        {toasts.map(item => (
          <div key={item.id} className="pointer-events-auto">
            <Toast item={item} onRemove={remove} />
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
