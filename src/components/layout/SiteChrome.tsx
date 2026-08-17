"use client";

import { usePathname } from "next/navigation";
import { Navbar } from "./Navbar";
import { Footer } from "./Footer";
import FloatingServiceCart from "@/components/booking/FloatingServiceCart";
import { WhatsAppBot } from "@/components/shared/WhatsAppBot";
import { ScrollToTop } from "@/components/shared/ScrollToTop";

export function SiteChrome({ position }: { position: "top" | "bottom" }) {
  const pathname = usePathname();
  const isCheckoutRoute = pathname === "/checkout" || pathname === "/service-checkout" || pathname === "/shop-checkout";
  if (isCheckoutRoute) return null;

  return position === "top" ? (
    <Navbar />
  ) : (
    <>
      <FloatingServiceCart />
      <ScrollToTop />
      <WhatsAppBot />
      <Footer />
    </>
  );
}
