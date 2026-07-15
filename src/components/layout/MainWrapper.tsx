"use client";

import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

export function MainWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  return (
    <main className="flex-1 pt-20 md:pt-24">
      {children}
    </main>
  );
}
