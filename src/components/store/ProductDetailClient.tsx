"use client";

import Link from "next/link";
import Image from "next/image";
import { Card } from "@/components/ui/card";
import type { ApiProduct } from "@/lib/api-types";
import {
  ArrowLeft,
  BadgeCheck,
  Package,
  ShieldCheck,
  ShoppingBag,
} from "lucide-react";

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
  const imageSrc = buildImageUrl(product.imageUrl);
  const hasDiscount = Boolean(
    product.originalPrice && Number(product.originalPrice) > Number(product.price),
  );

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-10 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <Link
          href="/store"
          className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-2 text-sm font-semibold text-slate-700 shadow-sm"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to store
        </Link>

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
                Proceed to checkout to enter your address, select a payment method, and complete your order request.
              </p>

              <div className="mt-6 rounded-2xl border border-lime-200 bg-lime-50 p-4">
                <div className="flex items-center gap-2 text-sm font-semibold text-lime-800">
                  <BadgeCheck className="h-4 w-4" />
                  Order summary
                </div>
                <p className="mt-2 text-sm text-slate-700">Product: {product.title}</p>
                <p className="mt-1 text-sm text-slate-700">Price: {formatPrice(product.price)}</p>
              </div>

              <Link
                href={`/checkout?productId=${product.id}&productTitle=${encodeURIComponent(product.title)}&productPrice=${product.price}`}
                className="mt-6 flex w-full items-center justify-center gap-2 rounded-2xl bg-lime-500 hover:bg-lime-600 text-white font-bold py-4 text-base transition-colors shadow-lg shadow-lime-500/20"
              >
                <ShoppingBag className="h-5 w-5" />
                Buy Now
              </Link>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
