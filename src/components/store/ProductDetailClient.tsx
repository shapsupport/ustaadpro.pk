"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import type { ApiProduct } from "@/lib/api-types";
import {
  ArrowLeft,
  BadgeCheck,
  Check,
  Minus,
  Package,
  Plus,
  ShieldCheck,
  ShoppingBag,
  ShoppingCart,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { StickyCheckoutBar } from "@/components/shared/StickyCheckoutBar";
import { useCart } from "@/context/CartContext";
import CartCheckoutModal from "@/components/store/CartCheckoutModal";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE || "";

function buildImageUrl(url?: string) {
  if (!url) return null;
  if (url.startsWith("http://") || url.startsWith("https://")) return url;
  return `${API_BASE_URL}${url.startsWith("/") ? url : `/${url}`}`;
}

function formatPrice(price?: number | string) {
  const amount = Number(price || 0);
  return `Rs ${amount.toLocaleString("en-PK")}`;
}

export default function ProductDetailClient({ product }: { product: ApiProduct }) {
  const router = useRouter();
  const { addItem } = useCart();
  const [showStickyCheckout, setShowStickyCheckout] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [cartAdded, setCartAdded] = useState(false);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const buyButtonRef = useRef<HTMLButtonElement>(null);
  const imageSrc = buildImageUrl(product.imageUrl);
  const hasDiscount = Boolean(
    product.originalPrice && Number(product.originalPrice) > Number(product.price),
  );
  const maxQuantity = Math.max(0, product.stock);
  const totalPrice = Number(product.price) * quantity;

  const updateQuantity = (nextQuantity: number) => {
    setQuantity(Math.min(Math.max(1, nextQuantity), maxQuantity || 1));
  };

  const handleAddToCart = () => {
    if (maxQuantity === 0) return;
    addItem(product, quantity);
    setCartAdded(true);
    window.setTimeout(() => setCartAdded(false), 1800);
  };

  const handleBuyNow = () => {
    if (maxQuantity === 0) return;
    addItem(product, quantity);
    setCheckoutOpen(true);
  };

  useEffect(() => {
    const updateStickyCheckout = () => {
      const button = buyButtonRef.current;
      setShowStickyCheckout(Boolean(button && button.getBoundingClientRect().bottom < 0));
    };

    updateStickyCheckout();
    window.addEventListener("scroll", updateStickyCheckout, { passive: true });
    window.addEventListener("resize", updateStickyCheckout);
    return () => {
      window.removeEventListener("scroll", updateStickyCheckout);
      window.removeEventListener("resize", updateStickyCheckout);
    };
  }, []);

  return (
    <>
      <div className="min-h-screen bg-slate-50 px-4 py-10 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <button
            type="button"
            onClick={() => router.back()}
            className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-base font-bold text-slate-700 shadow-sm transition-colors hover:bg-slate-100 hover:text-slate-950 sm:text-lg cursor-pointer"
            aria-label="Go back to the previous page"
          >
            <ArrowLeft className="h-5 w-5" />
            Back
          </button>

          <div className="mt-8 grid gap-8 lg:grid-cols-[1.05fr_0.95fr]">
            <Card className="overflow-hidden border-slate-200 bg-white p-0 shadow-sm">
              <div className="relative aspect-[4/3] bg-slate-100">
                {imageSrc ? (
                  <Image
                    src={imageSrc}
                    alt={product.title}
                    fill
                    className="object-cover"
                    sizes="(max-width:1024px) 100vw, 50vw"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center">
                    <Package className="h-20 w-20 text-slate-300" />
                  </div>
                )}
              </div>
              <div className="p-6">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-full bg-lime-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.25em] text-lime-700">
                    {product.category}
                  </span>
                  <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                    {product.stock > 0 ? `${product.stock.toLocaleString("en-PK")} in stock` : "Out of stock"}
                  </span>
                </div>
                <h1 className="mt-4 text-3xl font-bold text-slate-900">{product.title}</h1>
                <p className="mt-3 text-sm leading-7 text-slate-600">{product.description}</p>

                <div className="mt-6 flex items-end gap-3">
                  <div className="text-3xl font-bold text-slate-900">{formatPrice(product.price)}</div>
                  {hasDiscount ? (
                    <div className="text-sm text-slate-400 line-through">
                      {formatPrice(product.originalPrice)}
                    </div>
                  ) : null}
                </div>

                <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <div className="flex items-start gap-2 text-sm text-slate-700">
                    <ShieldCheck className="mt-0.5 h-4 w-4 text-lime-600" />
                    <span>Secure checkout, fast support, and delivery updates for every order.</span>
                  </div>
                </div>
              </div>
            </Card>

            <Card className="border-slate-200 bg-white shadow-sm">
              <div className="p-6">
                <div className="flex items-center gap-2">
                  <ShoppingBag className="h-5 w-5 text-lime-600" />
                  <h2 className="text-2xl font-bold text-slate-900">Buy this product</h2>
                </div>
                <p className="mt-2 text-sm text-slate-600">
                  Choose your quantity, add to cart or buy now with cash on delivery.
                </p>

                <div className="mt-6 rounded-2xl border border-lime-200 bg-lime-50 p-4">
                  <div className="flex items-center gap-2 text-sm font-semibold text-lime-800">
                    <BadgeCheck className="h-4 w-4" />
                    Order summary
                  </div>
                  <p className="mt-2 text-sm text-slate-700">Product: {product.title}</p>
                  <p className="mt-1 text-sm text-slate-700">Unit price: {formatPrice(product.price)}</p>
                  <p className="mt-1 text-sm font-bold text-slate-900">Total: {formatPrice(totalPrice)}</p>
                </div>

                {/* Quantity Selector */}
                <div className="mt-5 flex items-center justify-between rounded-2xl border border-slate-200 bg-white p-4">
                  <div>
                    <p className="text-sm font-bold text-slate-900">Quantity</p>
                    <p className="text-xs text-slate-500">Choose up to {product.stock.toLocaleString("en-PK")}</p>
                  </div>
                  <div className="flex items-center overflow-hidden rounded-xl border border-slate-200 bg-slate-50 shadow-sm">
                    <button
                      type="button"
                      onClick={() => updateQuantity(quantity - 1)}
                      disabled={quantity <= 1 || maxQuantity === 0}
                      className="flex h-11 w-11 items-center justify-center text-slate-700 transition hover:bg-slate-200 disabled:cursor-not-allowed disabled:opacity-35 cursor-pointer"
                      aria-label="Decrease quantity"
                    >
                      <Minus className="h-4 w-4" />
                    </button>
                    <input
                      type="number"
                      min={1}
                      max={maxQuantity || 1}
                      value={quantity}
                      onChange={(event) => updateQuantity(Number(event.target.value) || 1)}
                      className="h-11 w-14 border-x border-slate-200 bg-white text-center text-base font-black text-slate-900 outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                      aria-label="Product quantity"
                      disabled={maxQuantity === 0}
                    />
                    <button
                      type="button"
                      onClick={() => updateQuantity(quantity + 1)}
                      disabled={quantity >= maxQuantity}
                      className="flex h-11 w-11 items-center justify-center text-slate-700 transition hover:bg-slate-200 disabled:cursor-not-allowed disabled:opacity-35 cursor-pointer"
                      aria-label="Increase quantity"
                    >
                      <Plus className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                {/* CTA Buttons */}
                <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                  {/* Add to Cart */}
                  <button
                    type="button"
                    onClick={handleAddToCart}
                    disabled={maxQuantity === 0}
                    className={`flex flex-1 items-center justify-center gap-2 rounded-2xl border px-3 py-4 text-base font-bold transition cursor-pointer ${
                      maxQuantity === 0
                        ? "cursor-not-allowed border-slate-200 bg-slate-100 text-slate-400"
                        : cartAdded
                        ? "border-emerald-600 bg-emerald-600 text-white shadow-lg shadow-emerald-600/20"
                        : "border-emerald-500 bg-white text-emerald-600 shadow-sm hover:bg-emerald-50"
                    }`}
                  >
                    {cartAdded ? (
                      <>
                        <Check className="h-5 w-5" />
                        Added to Cart!
                      </>
                    ) : (
                      <>
                        <ShoppingCart className="h-5 w-5" />
                        Add to Cart
                      </>
                    )}
                  </button>

                  {/* Buy Now */}
                  <button
                    ref={buyButtonRef}
                    type="button"
                    onClick={handleBuyNow}
                    disabled={maxQuantity === 0}
                    className={`flex flex-1 items-center justify-center gap-2 rounded-2xl px-3 py-4 text-base font-bold text-white shadow-lg transition-colors cursor-pointer ${
                      maxQuantity === 0
                        ? "cursor-not-allowed bg-slate-300 shadow-none"
                        : "bg-emerald-600 shadow-emerald-600/20 hover:bg-emerald-700"
                    }`}
                  >
                    <ShoppingBag className="h-5 w-5" />
                    Buy Now
                  </button>
                </div>
              </div>
            </Card>
          </div>
        </div>
        <StickyCheckoutBar
          visible={showStickyCheckout}
          href="#"
          label="Buy Now"
          title={`${product.title} × ${quantity}`}
          price={formatPrice(totalPrice)}
          tone="lime"
          disabled={maxQuantity === 0}
          quantity={quantity}
          maxQuantity={maxQuantity}
          onQuantityChange={updateQuantity}
          onClick={handleBuyNow}
        />
      </div>

      {/* Checkout Modal */}
      <CartCheckoutModal
        isOpen={checkoutOpen}
        onClose={() => setCheckoutOpen(false)}
      />
    </>
  );
}
