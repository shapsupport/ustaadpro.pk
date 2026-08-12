"use client";

import { useLayoutEffect } from "react";
import { usePathname } from "next/navigation";

export function MainWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  useLayoutEffect(() => {
    const root = document.documentElement;
    const previousBehavior = root.style.scrollBehavior;
    root.style.scrollBehavior = "auto";
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
    root.style.scrollBehavior = previousBehavior;
  }, [pathname]);

  return (
    <main className={pathname === "/service-checkout" ? "min-h-dvh flex-1" : "min-h-[calc(100dvh-5rem)] flex-1 pt-20"}>
      {children}
    </main>
  );
}
