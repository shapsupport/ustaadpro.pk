"use client";

import { useRouter } from "next/navigation";
import CartCheckoutModal from "@/components/store/CartCheckoutModal";

export default function ShopCheckoutPage() {
  const router = useRouter();

  return (
    <CartCheckoutModal
      isOpen
      pageMode
      onClose={() => router.push("/store")}
    />
  );
}
