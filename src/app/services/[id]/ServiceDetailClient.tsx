"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowLeft,
  Star,
  Clock,
  CheckCircle2,
  XCircle,
  ChevronRight,
  ShoppingBag,
  Shield,
  BadgeCheck,
  Tag,
  Layers,
} from "lucide-react";
import type { ApiService, WorkPrice } from "@/lib/api-types";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE;

function imgSrc(url: string | undefined) {
  if (!url) return null;
  return url.startsWith("http") ? url : `${API_BASE}${url}`;
}

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          className={`h-4 w-4 ${i <= Math.round(rating) ? "fill-amber-400 text-amber-400" : "fill-slate-200 text-slate-200"}`}
        />
      ))}
    </div>
  );
}

export function ServiceDetailClient({ service }: { service: ApiService }) {
  const [selectedWork, setSelectedWork] = useState<WorkPrice | null>(
    service.workPrices?.[0] ?? null,
  );

  const displayImage = imgSrc(service.image_url || service.imageUrl);
  const originalPrice = Number(
    service.original_price || service.originalPrice || 0,
  );
  const bookingPrice = selectedWork?.price ?? service.price;
  const discount =
    originalPrice > service.price
      ? Math.round(((originalPrice - service.price) / originalPrice) * 100)
      : 0;
  const bookingHref = `/checkout?serviceId=${service.id}&serviceTitle=${encodeURIComponent(service.title)}&servicePrice=${bookingPrice}&workTitle=${encodeURIComponent(selectedWork?.title || "")}&workPriceId=${selectedWork?.id || ""}`;

  return (
    <div className="min-h-screen bg-slate-50">
      {/* ── Back bar ── */}
      <div className="sticky top-20 z-30 bg-white/90 backdrop-blur-md border-b border-slate-100 px-4 py-3">
        <div className="max-w-6xl mx-auto flex items-center gap-3">
          <Link
            href="/"
            className="flex items-center gap-1.5 text-sm font-medium text-slate-600 hover:text-primary transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Home
          </Link>
          <ChevronRight className="h-4 w-4 text-slate-300" />
          <span className="text-sm text-slate-400">{service.title}</span>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid lg:grid-cols-5 gap-8">
          {/* ── LEFT: image + work prices ── */}
          <div className="lg:col-span-3 space-y-6">
            {/* Hero image */}
            <div className="relative aspect-[16/9] rounded-3xl overflow-hidden bg-slate-100 shadow-md">
              {displayImage ? (
                <Image
                  src={displayImage}
                  alt={service.title}
                  fill
                  className="object-cover"
                  sizes="(max-width:1024px) 100vw, 60vw"
                />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-slate-100 to-slate-200">
                  <Layers className="h-16 w-16 text-slate-300" />
                </div>
              )}
              {service.badge && (
                <span className="absolute top-4 left-4 bg-primary text-white text-xs font-bold px-3 py-1.5 rounded-full shadow">
                  {service.badge}
                </span>
              )}
              {discount > 0 && (
                <span className="absolute top-4 right-4 bg-red-500 text-white text-xs font-bold px-3 py-1.5 rounded-full shadow">
                  {discount}% OFF
                </span>
              )}
            </div>

            {/* ── Work Prices / Sub-services ── */}
            {service.workPrices && service.workPrices.length > 0 && (
              <div>
                <h2 className="text-lg font-bold text-slate-900 mb-3 flex items-center gap-2">
                  <Tag className="h-5 w-5 text-primary" />
                  Choose a Service
                </h2>
                <div className="grid sm:grid-cols-2 gap-3">
                  {service.workPrices.map((wp) => {
                    const wpImg = imgSrc(wp.imageUrl);
                    const isSelected = selectedWork?.id === wp.id;
                    return (
                      <button
                        key={wp.id}
                        onClick={() => setSelectedWork(wp)}
                        className={`flex items-start gap-3 text-left p-4 rounded-2xl border-2 transition-all ${
                          isSelected
                            ? "border-primary bg-emerald-50 shadow-sm"
                            : "border-slate-200 bg-white hover:border-primary/40 hover:bg-slate-50"
                        }`}
                      >
                        {wpImg && (
                          <div className="relative h-14 w-14 rounded-xl overflow-hidden shrink-0 bg-slate-100">
                            <Image
                              src={wpImg}
                              alt={wp.title}
                              fill
                              className="object-cover"
                              sizes="56px"
                            />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <p
                            className={`text-sm font-semibold truncate ${isSelected ? "text-primary" : "text-slate-800"}`}
                          >
                            {wp.title}
                          </p>
                          <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">
                            {wp.description}
                          </p>
                          <p className="text-sm font-bold text-slate-900 mt-1">
                            Rs {wp.price.toLocaleString()}
                          </p>
                        </div>
                        {isSelected && (
                          <BadgeCheck className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* ── Details checklist ── */}
            {service.details?.length > 0 && (
              <div className="bg-white rounded-3xl border border-slate-100 p-6 shadow-sm">
                <h2 className="text-lg font-bold text-slate-900 mb-4">
                  How it works
                </h2>
                <ol className="space-y-3">
                  {service.details.map((d, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-primary text-xs font-bold shrink-0 mt-0.5">
                        {i + 1}
                      </div>
                      <span className="text-sm text-slate-600 leading-relaxed">
                        {d}
                      </span>
                    </li>
                  ))}
                </ol>
              </div>
            )}

            {/* ── Includes / Excludes ── */}
            {((service.includes?.length ?? 0) > 0 ||
              (service.excludes?.length ?? 0) > 0) && (
              <div className="grid sm:grid-cols-2 gap-4">
                {service.includes?.length > 0 && (
                  <div className="bg-emerald-50 border border-emerald-100 rounded-3xl p-5">
                    <h3 className="text-sm font-bold text-emerald-800 mb-3 flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4" /> What&apos;s Included
                    </h3>
                    <ul className="space-y-2">
                      {service.includes.map((item, i) => (
                        <li
                          key={i}
                          className="flex items-start gap-2 text-sm text-emerald-700"
                        >
                          <CheckCircle2 className="h-3.5 w-3.5 mt-0.5 shrink-0 text-emerald-500" />
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {service.excludes?.length > 0 && (
                  <div className="bg-red-50 border border-red-100 rounded-3xl p-5">
                    <h3 className="text-sm font-bold text-red-800 mb-3 flex items-center gap-2">
                      <XCircle className="h-4 w-4" /> Not Included
                    </h3>
                    <ul className="space-y-2">
                      {service.excludes.map((item, i) => (
                        <li
                          key={i}
                          className="flex items-start gap-2 text-sm text-red-700"
                        >
                          <XCircle className="h-3.5 w-3.5 mt-0.5 shrink-0 text-red-400" />
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* ── RIGHT: sticky booking card ── */}
          <div className="lg:col-span-2">
            <div className="lg:sticky lg:top-32 space-y-4">
              {/* Booking card */}
              <div className="bg-white rounded-3xl border border-slate-100 shadow-lg p-6">
                {/* Title + rating */}
                <div className="mb-4">
                  {service.badge && (
                    <span className="inline-block bg-primary/10 text-primary text-xs font-bold px-2.5 py-1 rounded-full mb-2">
                      {service.badge}
                    </span>
                  )}
                  <h1 className="text-2xl font-bold text-slate-900 leading-tight">
                    {service.title}
                  </h1>
                  <div className="flex items-center gap-2 mt-2">
                    <StarRating rating={service.rating} />
                    <span className="text-sm font-semibold text-slate-700">
                      {service.rating}
                    </span>
                    <span className="text-sm text-slate-400">
                      ({service.reviews} reviews)
                    </span>
                  </div>
                </div>

                {/* Description */}
                <p className="text-sm text-slate-600 leading-relaxed mb-5">
                  {service.detail_description ||
                    service.detailDescription ||
                    service.description}
                </p>

                {/* Pricing */}
                <div className="bg-slate-50 rounded-2xl p-4 mb-5">
                  <p className="text-xs text-slate-400 uppercase tracking-wider font-semibold mb-1">
                    {selectedWork ? "Selected service" : "Starting from"}
                  </p>
                  {selectedWork ? (
                    <>
                      <p className="font-semibold text-slate-800 text-sm mb-1">
                        {selectedWork.title}
                      </p>
                      <div className="flex items-baseline gap-2">
                        <span className="text-3xl font-black text-slate-900">
                          Rs {selectedWork.price.toLocaleString()}
                        </span>
                      </div>
                    </>
                  ) : (
                    <div className="flex items-baseline gap-2">
                      <span className="text-3xl font-black text-slate-900">
                        Rs {service.price.toLocaleString()}
                      </span>
                      {originalPrice > service.price && (
                        <span className="text-sm text-slate-400 line-through">
                          Rs {originalPrice.toLocaleString()}
                        </span>
                      )}
                      {discount > 0 && (
                        <span className="text-xs bg-red-100 text-red-600 font-bold px-2 py-0.5 rounded-full">
                          {discount}% off
                        </span>
                      )}
                    </div>
                  )}
                </div>

                {/* Duration + type */}
                <div className="flex items-center gap-4 text-sm text-slate-500 mb-6">
                  <div className="flex items-center gap-1.5">
                    <Clock className="h-4 w-4 text-primary" />
                    {service.duration}
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Shield className="h-4 w-4 text-primary" />
                    {service.service_type || service.serviceType}
                  </div>
                </div>

                {/* CTA */}
                <Link
                  href={bookingHref}
                  className="flex items-center justify-center gap-2 w-full bg-primary hover:bg-emerald-700 text-white font-bold py-4 rounded-2xl text-base transition-colors shadow-lg shadow-primary/20"
                >
                  <ShoppingBag className="h-5 w-5" />
                  Book Now
                </Link>
                <a
                  href={`https://wa.me/${process.env.NEXT_PUBLIC_WA_NUM}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-3.5 rounded-2xl text-sm transition-colors mt-3"
                >
                  <ShoppingBag className="h-4 w-4" />
                  Book via WhatsApp
                </a>
              </div>

              {/* Trust badges */}
              <div className="bg-white rounded-3xl border border-slate-100 p-5">
                <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
                  Why Ustaad Pro?
                </p>
                <ul className="space-y-2.5">
                  {[
                    "Background-verified professionals",
                    "Transparent pricing, no surprises",
                    "Satisfaction guarantee",
                    "Same-day service available",
                  ].map((item) => (
                    <li
                      key={item}
                      className="flex items-center gap-2 text-sm text-slate-600"
                    >
                      <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
