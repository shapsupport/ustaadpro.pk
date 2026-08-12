"use client";

import { usePathname } from "next/navigation";
import { Navbar } from "./Navbar";
import { Footer } from "./Footer";
import FloatingServiceCart from "@/components/booking/FloatingServiceCart";
import { WhatsAppBot } from "@/components/shared/WhatsAppBot";

export function SiteChrome({ position }: { position: "top" | "bottom" }) {
  const pathname = usePathname();
  if (pathname === "/service-checkout") return null;

  return position === "top" ? (
    <Navbar />
  ) : (
    <>
      <FloatingServiceCart />
      <WhatsAppBot />
      <Footer />
    </>
  );
}
