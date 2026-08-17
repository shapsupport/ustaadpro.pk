"use client";

import Image from "next/image";
import Link from "next/link";
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
  ChevronRight,
  MessageCircle,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { StickyCheckoutBar } from "@/components/shared/StickyCheckoutBar";
import { useCart } from "@/context/CartContext";

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
  const purchaseActionsRef = useRef<HTMLDivElement>(null);
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
    router.push("/shop-checkout");
  };

  const handleBuyViaWhatsApp = () => {
    if (maxQuantity === 0) return;
    addItem(product, quantity);
    router.push("/shop-checkout");
  };

  const handleBack = () => {
    // Prevent the browser from restoring the store's previous (often footer)
    // scroll position when this in-page Back control is used.
    try {
      sessionStorage.setItem("ustaadpro_store_return_to_top", "true");
      window.history.scrollRestoration = "manual";
    } catch { /* Browser storage/history may be unavailable. */ }
    router.back();
  };

  useEffect(() => {
    const updateStickyCheckout = () => {
      const actions = purchaseActionsRef.current;
      setShowStickyCheckout(Boolean(actions && actions.getBoundingClientRect().bottom <= 0));
    };

    updateStickyCheckout();
    const observer = new IntersectionObserver(updateStickyCheckout, { threshold: 0 });
    if (purchaseActionsRef.current) observer.observe(purchaseActionsRef.current);
    document.addEventListener("scroll", updateStickyCheckout, { passive: true, capture: true });
    window.addEventListener("resize", updateStickyCheckout);
    window.visualViewport?.addEventListener("scroll", updateStickyCheckout);
    window.visualViewport?.addEventListener("resize", updateStickyCheckout);
    return () => {
      observer.disconnect();
      document.removeEventListener("scroll", updateStickyCheckout, { capture: true });
      window.removeEventListener("resize", updateStickyCheckout);
      window.visualViewport?.removeEventListener("scroll", updateStickyCheckout);
      window.visualViewport?.removeEventListener("resize", updateStickyCheckout);
    };
  }, []);

  return (
    <>
      <div className="min-h-screen bg-slate-50 px-4 pb-32 pt-10 sm:px-6 sm:pb-10 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <nav aria-label="Breadcrumb" className="mb-2 flex w-fit max-w-full min-w-0 items-center gap-1.5 overflow-hidden whitespace-nowrap rounded-lg bg-white px-2.5 py-1.5 text-[11px] text-slate-500 ring-1 ring-slate-200 sm:text-xs">
            <Link href="/" className="font-semibold transition hover:text-emerald-700">Home</Link>
            <ChevronRight className="h-3 w-3 shrink-0 text-slate-300" />
            <Link href="/store" className="font-semibold transition hover:text-emerald-700">Shop</Link>
            <ChevronRight className="h-3 w-3 shrink-0 text-slate-300" />
            <span className="min-w-0 truncate font-medium text-slate-700" title={product.title}>{product.title}</span>
          </nav>
          <button
            type="button"
            onClick={handleBack}
            className="inline-flex h-8 cursor-pointer items-center gap-1.5 rounded-lg border border-emerald-200 bg-emerald-50 px-2.5 text-[11px] font-bold text-emerald-800 shadow-sm transition hover:border-emerald-300 hover:bg-emerald-100 sm:text-xs"
            aria-label="Go back to the previous page"
          >
            <ArrowLeft className="h-3 w-3" />
            Back to products
          </button>

          <div className="mt-8 grid gap-8 lg:grid-cols-[1.05fr_0.95fr]">
            <Card className="overflow-hidden border-slate-200 bg-white p-0 shadow-sm">
              <div className="relative m-2 aspect-[4/3] overflow-hidden rounded-2xl bg-white sm:m-3 sm:rounded-3xl lg:m-0 lg:rounded-none">
                {imageSrc ? (
                  <Image
                    src={imageSrc}
                    alt={product.title}
                    fill
                    className="rounded-xl object-contain p-2 [image-rendering:auto] sm:rounded-2xl sm:p-4"
                    sizes="(max-width:639px) calc(100vw - 3rem), (max-width:1023px) 90vw, 50vw"
                    quality={88}
                  />
                ) : (
                  <div className="flex h-full items-center justify-center">
                    <Package className="h-20 w-20 text-slate-300" />
                  </div>
                )}
              </div>
              <div className="p-4 sm:p-6">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-full bg-lime-100 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-lime-700 sm:px-3 sm:text-xs sm:tracking-[0.25em]">
                    {product.category}
                  </span>
                  <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-semibold text-slate-600 sm:px-3 sm:text-xs">
                    {product.stock > 0 ? "Available to order" : "Currently unavailable"}
                  </span>
                </div>
                <h1 className="mt-4 text-xl font-bold leading-tight text-slate-900 sm:text-3xl">{product.title}</h1>
                <p className="mt-3 text-xs leading-5 text-slate-600 sm:text-sm sm:leading-7">{product.description}</p>

                <div className="mt-6 flex items-end gap-3">
                  <div className="text-2xl font-bold text-slate-900 sm:text-3xl">{formatPrice(product.price)}</div>
                  {hasDiscount ? (
                    <div className="text-xs text-slate-400 line-through sm:text-sm">
                      {formatPrice(product.originalPrice)}
                    </div>
                  ) : null}
                </div>

                <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 p-3 sm:mt-6 sm:p-4">
                  <div className="flex items-start gap-2 text-xs leading-5 text-slate-700 sm:text-sm">
                    <ShieldCheck className="mt-0.5 h-4 w-4 text-lime-600" />
                    <span>Secure checkout, fast support, and delivery updates for every order.</span>
                  </div>
                </div>
              </div>
            </Card>

            <Card className="border-slate-200 bg-white shadow-sm">
              <div className="p-4 sm:p-6">
                <div className="flex items-center gap-2">
                  <ShoppingBag className="h-5 w-5 text-lime-600" />
                  <h2 className="text-lg font-bold text-slate-900 sm:text-2xl">Buy this product</h2>
                </div>
                <p className="mt-2 text-xs leading-5 text-slate-600 sm:text-sm">
                  Choose your quantity, add to cart or buy now with cash on delivery.
                </p>

                <div className="mt-5 rounded-2xl border border-lime-200 bg-lime-50 p-3 sm:mt-6 sm:p-4">
                  <div className="flex items-center gap-2 text-xs font-semibold text-lime-800 sm:text-sm">
                    <BadgeCheck className="h-4 w-4" />
                    Order summary
                  </div>
                  <p className="mt-2 text-xs text-slate-700 sm:text-sm">Product: {product.title}</p>
                  <p className="mt-1 text-xs text-slate-700 sm:text-sm">Unit price: {formatPrice(product.price)}</p>
                  <p className="mt-1 text-xs font-bold text-slate-900 sm:text-sm">Total: {formatPrice(totalPrice)}</p>
                </div>

                {/* Quantity Selector */}
                <div className="mt-5 flex items-center justify-between rounded-2xl border border-slate-200 bg-white p-4">
                  <div>
                    <p className="text-sm font-bold text-slate-900">Quantity</p>
                    <p className="text-xs text-slate-500">Select how many you need</p>
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
                <div ref={purchaseActionsRef} className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
                  {/* Add to Cart */}
                  <button
                    type="button"
                    onClick={handleAddToCart}
                    disabled={maxQuantity === 0}
                    className={`flex flex-1 items-center justify-center gap-2 rounded-2xl border px-3 py-3.5 text-sm font-bold transition sm:py-4 sm:text-base cursor-pointer ${
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
                    type="button"
                    onClick={handleBuyNow}
                    disabled={maxQuantity === 0}
                    className={`flex flex-1 items-center justify-center gap-2 rounded-2xl px-3 py-3.5 text-sm font-bold text-white shadow-lg transition-colors sm:py-4 sm:text-base cursor-pointer ${
                      maxQuantity === 0
                        ? "cursor-not-allowed bg-slate-300 shadow-none"
                        : "bg-emerald-600 shadow-emerald-600/20 hover:bg-emerald-700"
                    }`}
                  >
                    <ShoppingBag className="h-5 w-5" />
                    Buy Now
                  </button>

                  {/* Buy via WhatsApp */}
                  <button
                    type="button"
                    onClick={handleBuyViaWhatsApp}
                    disabled={maxQuantity === 0}
                    className={`flex min-w-0 items-center justify-center gap-2 rounded-2xl px-3 py-3.5 text-sm font-bold text-white shadow-lg transition-colors sm:py-4 sm:text-base ${
                      maxQuantity === 0
                        ? "cursor-not-allowed bg-slate-300 shadow-none"
                        : "cursor-pointer bg-[#25D366] shadow-emerald-600/20 hover:bg-[#20bd5a]"
                    }`}
                  >
                    <MessageCircle className="h-5 w-5 shrink-0" />
                    <span>Buy via WhatsApp</span>
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

    </>
  );
}
