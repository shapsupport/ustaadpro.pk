"use client";

import { useEffect, useState } from "react";
import { ArrowUp } from "lucide-react";

export function ScrollToTop() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const updateVisibility = () => setVisible(window.scrollY > 500);
    updateVisibility();
    window.addEventListener("scroll", updateVisibility, { passive: true });
    return () => window.removeEventListener("scroll", updateVisibility);
  }, []);

  if (!visible) return null;

  return (
    <button
      type="button"
      onClick={() => window.scrollTo({
        top: 0,
        behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth",
      })}
      className="fixed bottom-[max(1rem,env(safe-area-inset-bottom))] left-4 z-[110] grid h-11 w-11 place-items-center rounded-full border border-emerald-200 bg-white/95 text-emerald-700 shadow-[0_10px_30px_rgba(15,23,42,0.18)] backdrop-blur transition hover:-translate-y-0.5 hover:border-emerald-400 hover:bg-emerald-50 active:translate-y-0 sm:bottom-6 sm:left-6 sm:h-12 sm:w-12"
      aria-label="Scroll to top"
      title="Back to top"
    >
      <ArrowUp className="h-5 w-5" strokeWidth={2.5} />
    </button>
  );
}
