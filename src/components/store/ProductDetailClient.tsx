"use client";

import { useState, type ChangeEvent, type FormEvent } from "react";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type { ApiProduct } from "@/lib/api-types";
import {
  ArrowLeft,
  BadgeCheck,
  CheckCircle2,
  Package,
  ShieldCheck,
  ShoppingBag,
  Star,
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
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    address: "",
    notes: "",
  });
  const [submitted, setSubmitted] = useState(false);

  const imageSrc = buildImageUrl(product.imageUrl);
  const hasDiscount = Boolean(
    product.originalPrice && Number(product.originalPrice) > Number(product.price),
  );

  const handleChange = (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = event.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!formData.name || !formData.phone || !formData.address) {
      return;
    }

    const order = {
      id: `order-${Date.now()}`,
      productId: product.id,
      productTitle: product.title,
      price: product.price,
      customerName: formData.name,
      phone: formData.phone,
      address: formData.address,
      notes: formData.notes,
      createdAt: new Date().toISOString(),
    };

    const existing = JSON.parse(
      typeof window !== "undefined"
        ? window.localStorage.getItem("ustaadpro_store_orders") || "[]"
        : "[]",
    );
    const next = [order, ...existing];
    window.localStorage.setItem("ustaadpro_store_orders", JSON.stringify(next));
    setSubmitted(true);
  };

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
                  In stock
                </span>
              </div>
              <h1 className="mt-4 text-3xl font-bold text-slate-900">{product.title}</h1>
              <p className="mt-3 text-sm leading-7 text-slate-600">{product.description}</p>

              <div className="mt-5 flex items-center gap-3 text-sm text-slate-600">
                <div className="flex items-center gap-1 rounded-full bg-amber-50 px-3 py-1 text-amber-600">
                  <Star className="h-4 w-4 fill-amber-400" />
                  4.8 rating
                </div>
                <span className="rounded-full bg-slate-100 px-3 py-1">Verified product</span>
              </div>

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
                <h2 className="text-2xl font-bold text-slate-900">Order this product</h2>
              </div>
              <p className="mt-2 text-sm text-slate-600">
                Share your details and we will contact you with the next steps for delivery and payment.
              </p>

              {submitted ? (
                <div className="mt-6 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">
                  <div className="flex items-center gap-2 font-semibold">
                    <CheckCircle2 className="h-4 w-4" />
                    Your order request has been received.
                  </div>
                  <p className="mt-2">We saved your request locally and will contact you shortly.</p>
                </div>
              ) : (
                <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label className="mb-2 block text-sm font-semibold text-slate-700" htmlFor="name">
                        Full name
                      </label>
                      <Input id="name" name="name" value={formData.name} onChange={handleChange} placeholder="Ayesha Khan" />
                    </div>
                    <div>
                      <label className="mb-2 block text-sm font-semibold text-slate-700" htmlFor="phone">
                        Phone number
                      </label>
                      <Input id="phone" name="phone" value={formData.phone} onChange={handleChange} placeholder="03xx-xxxxxxx" />
                    </div>
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-semibold text-slate-700" htmlFor="address">
                      Delivery address
                    </label>
                    <Textarea id="address" name="address" value={formData.address} onChange={handleChange} placeholder="House number, street, area, city" />
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-semibold text-slate-700" htmlFor="notes">
                      Order notes
                    </label>
                    <Textarea id="notes" name="notes" value={formData.notes} onChange={handleChange} placeholder="Any special instructions for delivery or product selection" />
                  </div>
                  <div className="rounded-2xl border border-lime-200 bg-lime-50 p-4">
                    <div className="flex items-center gap-2 text-sm font-semibold text-lime-800">
                      <BadgeCheck className="h-4 w-4" />
                      Order summary
                    </div>
                    <p className="mt-2 text-sm text-slate-700">Product: {product.title}</p>
                    <p className="mt-1 text-sm text-slate-700">Price: {formatPrice(product.price)}</p>
                  </div>
                  <Button className="w-full bg-lime-500 text-white hover:bg-lime-600">Place order request</Button>
                </form>
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
