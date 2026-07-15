import { Suspense } from "react";
import CheckoutPageClient from "./CheckoutPageClient";

export default function CheckoutPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-slate-50 px-4 py-10 text-center text-sm text-slate-600">Loading checkout…</div>}>
      <CheckoutPageClient />
    </Suspense>
  );
}
