"use client";

import { useLayoutEffect } from "react";
import { usePathname } from "next/navigation";

export function MainWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isCheckoutRoute = pathname === "/checkout" || pathname === "/service-checkout" || pathname === "/shop-checkout";

  useLayoutEffect(() => {
    const root = document.documentElement;
    const previousBehavior = root.style.scrollBehavior;
    root.style.scrollBehavior = "auto";
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
    root.style.scrollBehavior = previousBehavior;
  }, [pathname]);

  return (
    <main className={isCheckoutRoute ? "min-h-dvh min-w-0 w-full flex-1 overflow-x-clip" : "min-h-[calc(100dvh-5rem)] min-w-0 w-full flex-1 overflow-x-clip pt-20"}>
      {children}
    </main>
  );
}
