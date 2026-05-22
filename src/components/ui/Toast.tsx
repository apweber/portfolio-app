"use client";

export type ToastVariant = "success" | "error";

export interface ToastItem {
  id: string;
  variant: ToastVariant;
  message: string;
}

const variantClasses: Record<ToastVariant, string> = {
  success: "bg-green-600",
  error: "bg-red-600",
};

interface ToastProps {
  items: ToastItem[];
}

export function ToastList({ items }: ToastProps) {
  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col gap-2" aria-live="polite">
      {items.map((t) => (
        <div
          key={t.id}
          role="alert"
          className={`rounded-md px-4 py-3 text-sm text-white shadow-lg ${variantClasses[t.variant]}`}
        >
          {t.message}
        </div>
      ))}
    </div>
  );
}
