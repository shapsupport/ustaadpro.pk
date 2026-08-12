"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, ShoppingBag } from "lucide-react";
import BookingModal from "@/components/booking/BookingModal";
import { useServiceCart, type ServiceCartItem } from "@/context/ServiceCartContext";

type CheckoutService = Omit<ServiceCartItem, "key">;
const CHECKOUT_SELECTION_KEY = "ustaadpro_service_checkout";
const CART_KEY = "ustaadpro_service_cart";

function readServices(value: string | null): CheckoutService[] {
  if (!value) return [];
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed.filter((item) => item && item.id && item.title) : [];
  } catch {
    return [];
  }
}

export default function ServiceCheckoutPage() {
  const { items, clearServices } = useServiceCart();
  const [services, setServices] = useState<CheckoutService[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const sessionSelection = readServices(sessionStorage.getItem(CHECKOUT_SELECTION_KEY));
    const savedSelection = readServices(localStorage.getItem(CHECKOUT_SELECTION_KEY));
    const savedCart = readServices(localStorage.getItem(CART_KEY));
    const selected = sessionSelection.length
      ? sessionSelection
      : savedSelection.length
        ? savedSelection
        : items.length
          ? items
          : savedCart;
    // Browser storage is intentionally hydrated after mount.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setServices(selected);
    setReady(true);
    // The active selection must remain stable for the lifetime of this page.
    // A successful booking clears the cart, but the mounted BookingModal still
    // needs its service data to render the confirmation screen.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!ready) return <div className="min-h-screen bg-slate-50 p-8 text-center text-sm text-slate-500">Preparing checkout…</div>;

  if (!services.length) {
    return (
      <main className="grid min-h-[70vh] place-items-center bg-slate-50 px-4">
        <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-sm">
          <ShoppingBag className="mx-auto h-12 w-12 text-slate-300" />
          <h1 className="mt-4 text-2xl font-black text-slate-900">No service selected</h1>
          <p className="mt-2 text-sm text-slate-500">Choose a service first, then return here to complete your booking.</p>
          <Link href="/services" className="mt-6 inline-flex items-center gap-2 rounded-2xl bg-emerald-600 px-5 py-3 text-sm font-black text-white hover:bg-emerald-700">
            <ArrowLeft className="h-4 w-4" /> Browse services
          </Link>
        </div>
      </main>
    );
  }

  return (
    <BookingModal
      isOpen
      pageMode
      service={services[0]}
      services={services}
      onClose={() => history.back()}
      onBookingComplete={() => {
        clearServices();
        sessionStorage.removeItem(CHECKOUT_SELECTION_KEY);
        localStorage.removeItem(CHECKOUT_SELECTION_KEY);
      }}
    />
  );
}
