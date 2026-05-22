"use client";
import { createContext, useCallback, useContext, useState, ReactNode } from "react";
import { ToastList, ToastItem, ToastVariant } from "@/components/ui/Toast";

interface ShowOptions {
  variant: ToastVariant;
  message: string;
}

interface ToastContextValue {
  show: (opts: ShowOptions) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);

  const show = useCallback(({ variant, message }: ShowOptions) => {
    const id = crypto.randomUUID();
    setItems((prev) => [...prev, { id, variant, message }]);
    setTimeout(() => {
      setItems((prev) => prev.filter((t) => t.id !== id));
    }, 5000);
  }, []);

  return (
    <ToastContext.Provider value={{ show }}>
      {children}
      <ToastList items={items} />
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used inside ToastProvider");
  return ctx;
}
