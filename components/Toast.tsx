"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";

type Kind = "success" | "error";
type Toast = { id: number; kind: Kind; message: string };

const ToastCtx = createContext<{ toast: (message: string, kind?: Kind) => void }>({ toast: () => {} });

export function useToast() {
  return useContext(ToastCtx);
}

const LIFETIME_MS = 5000;

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<Toast[]>([]);

  const toast = useCallback((message: string, kind: Kind = "success") => {
    // Date.now can collide when two actions resolve in the same tick.
    const id = Date.now() + Math.random();
    setItems((t) => [...t, { id, kind, message }]);
  }, []);

  const dismiss = useCallback((id: number) => setItems((t) => t.filter((x) => x.id !== id)), []);

  return (
    <ToastCtx.Provider value={{ toast }}>
      {children}
      <div
        // polite, not assertive: a save confirmation should not interrupt a
        // screen reader mid-sentence.
        role="status"
        aria-live="polite"
        className="pointer-events-none fixed bottom-4 right-4 z-[200] flex w-[min(24rem,calc(100vw-2rem))] flex-col gap-2"
      >
        {items.map((t) => (
          <ToastItem key={t.id} toast={t} onDone={() => dismiss(t.id)} />
        ))}
      </div>
    </ToastCtx.Provider>
  );
}

function ToastItem({ toast, onDone }: { toast: Toast; onDone: () => void }) {
  const [leaving, setLeaving] = useState(false);

  useEffect(() => {
    const out = setTimeout(() => setLeaving(true), LIFETIME_MS);
    const gone = setTimeout(onDone, LIFETIME_MS + 200);
    return () => {
      clearTimeout(out);
      clearTimeout(gone);
    };
  }, [onDone]);

  const ok = toast.kind === "success";
  return (
    <div
      className={`pointer-events-auto flex items-start gap-2.5 rounded-lg border px-3.5 py-2.5 shadow-lg transition-all duration-200 ${
        leaving ? "translate-y-1 opacity-0" : "translate-y-0 opacity-100"
      } ${
        ok
          ? "border-emerald-500/40 bg-white text-neutral-800 dark:bg-neutral-900 dark:text-neutral-100"
          : "border-red-400 bg-white text-neutral-800 dark:border-red-500/50 dark:bg-neutral-900 dark:text-neutral-100"
      }`}
    >
      <span className={`mt-0.5 shrink-0 ${ok ? "text-emerald-500" : "text-red-500"}`}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
          {ok ? <polyline points="20 6 9 17 4 12" /> : <><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></>}
        </svg>
      </span>
      <p className="flex-1 text-sm leading-snug">{toast.message}</p>
      <button
        type="button"
        onClick={onDone}
        aria-label="Dismiss"
        className="shrink-0 text-neutral-400 transition-colors hover:text-neutral-700 dark:hover:text-neutral-200"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden>
          <line x1="18" y1="6" x2="6" y2="18" />
          <line x1="6" y1="6" x2="18" y2="18" />
        </svg>
      </button>
    </div>
  );
}