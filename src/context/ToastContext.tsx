"use client";

import { CheckCircle2, X } from "lucide-react";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";

const TOAST_DURATION_MS = 5000;
const SUCCESS_TOAST_EVENT = "ustaadpro:success-toast";

export function showSuccessToast(message: string) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(
    new CustomEvent<string>(SUCCESS_TOAST_EVENT, { detail: message }),
  );
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [message, setMessage] = useState("");
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const dismissToast = useCallback(() => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = null;
    setMessage("");
  }, []);

  useEffect(() => {
    const showToast = (event: Event) => {
      const nextMessage = (event as CustomEvent<string>).detail;
      if (!nextMessage) return;
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      setMessage(nextMessage);
      timeoutRef.current = setTimeout(() => {
        setMessage("");
        timeoutRef.current = null;
      }, TOAST_DURATION_MS);
    };

    window.addEventListener(SUCCESS_TOAST_EVENT, showToast);
    return () => {
      window.removeEventListener(SUCCESS_TOAST_EVENT, showToast);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  return (
    <>
      {children}
      {message && (
        <div
          role="status"
          aria-live="polite"
          className="fixed right-4 top-20 z-[200] flex w-[calc(100%-2rem)] max-w-sm items-center gap-3 rounded-2xl border border-emerald-200 bg-white p-4 text-slate-800 shadow-2xl sm:right-6 sm:top-24"
        >
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
            <CheckCircle2 className="h-6 w-6" />
          </span>
          <p className="flex-1 text-sm font-bold">{message}</p>
          <button
            type="button"
            onClick={dismissToast}
            aria-label="Dismiss notification"
            className="rounded-full p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}
    </>
  );
}
