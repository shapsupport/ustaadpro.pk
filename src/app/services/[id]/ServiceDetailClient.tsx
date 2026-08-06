"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
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
  ChevronDown,
  MessageSquareText,
  SlidersHorizontal,
  Minus,
  Plus,
  Wallet,
  Info,
} from "lucide-react";
import type { ApiReview, ApiService, WorkPrice } from "@/lib/api-types";
import BookingModal from "@/components/booking/BookingModal";
import { Skeleton } from "@/components/ui/skeleton";
import { StickyCheckoutBar } from "@/components/shared/StickyCheckoutBar";
import { useServiceCart } from "@/context/ServiceCartContext";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "https://api.ustaadpro.pk";

function imgSrc(url: string | undefined | null) {
  if (!url) return null;
  return url.startsWith("http") ? url : `${API_BASE.replace(/\/$/, "")}${url.startsWith("/") ? "" : "/"}${url}`;
}

function normalizedText(value?: string | null) {
  return (value || "").trim().toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

function isPricingUnitText(value: string, unitText: string) {
  const detail = normalizedText(value);
  const unit = normalizedText(unitText);
  return Boolean(detail) && (
    detail === unit ||
    /^per\b/.test(detail) ||
    /\bvisit\b.*\binspection\b|\binspection\b.*\bvisit\b/.test(detail)
  );
}

function pricingExplanation(unitText: string, price: number) {
  const unit = unitText.trim();
  const normalized = normalizedText(unit);
  const formattedPrice = `Rs ${price.toLocaleString("en-PK")}`;
  if (/\bvisit\b|\binspection\b/.test(normalized)) {
    return `${formattedPrice} covers the professional's visit and inspection. Any repair, labour, parts, or materials needed will be assessed on-site and quoted for your approval before work begins.`;
  }
  if (/^per\b/.test(normalized)) {
    const subject = unit.replace(/^per\s+/i, "").trim() || "item";
    return `The displayed rate is ${formattedPrice} for each ${subject}. Your estimated service total changes with the quantity selected; any additional work or materials will be confirmed before work begins.`;
  }
  return unit
    ? `The displayed rate is ${formattedPrice} ${unit.toLowerCase()}. Any additional work or materials will be confirmed before work begins.`
    : `The service starts from ${formattedPrice}. The professional will confirm any additional work or material cost before starting.`;
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

export function ServiceDetailClient({ service, initialReviews }: { service: ApiService; initialReviews: ApiReview[] }) {
  const router = useRouter();
  const { addService } = useServiceCart();
  const [selectedWork, setSelectedWork] = useState<WorkPrice | null>(
    service.workPrices?.[0] ?? null,
  );
  const [isBookingOpen, setIsBookingOpen] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [showStickyCheckout, setShowStickyCheckout] = useState(false);
  const [reviewsOpen, setReviewsOpen] = useState(false);
  const [serviceInfoOpen, setServiceInfoOpen] = useState(false);
  const [reviewSnapshot, setReviewSnapshot] = useState(initialReviews);
  const bookingButtonRef = useRef<HTMLButtonElement>(null);
  const reviewsRef = useRef<HTMLDivElement>(null);

  const displayImage = imgSrc(
    selectedWork?.imageUrl || selectedWork?.image_url || service.serviceImageUrl || service.imageUrl || service.image_url,
  );
  const originalPrice = Number(
    service.originalPrice || service.original_price || 0,
  );
  const bookingPrice = selectedWork?.price ?? service.price;
  const unitText = service.unitDescription || service.serviceType || service.service_type || "";
  const rawDescription = service.detailDescription || service.detail_description || service.description || "";
  const displayDescription = isPricingUnitText(rawDescription, unitText) ? "" : rawDescription;
  const meaningfulDetails = (service.details || []).filter((detail) => !isPricingUnitText(detail, unitText));
  const howItWorks = meaningfulDetails.length > 0 ? meaningfulDetails : [
    "Choose your preferred date, time, and service address.",
    "Choose the Rs 200 booking advance or pay the listed charge in full, then upload the screenshot.",
    "Admin verifies the payment and confirms the booking; you will be notified shortly.",
    "The professional visits your home, completes the approved work, and adjusts the Rs 200 advance in the final bill.",
  ];
  const quantityUnitText = selectedWork?.description || unitText || service.description || "";
  const allowsQuantity = /^\s*per\b/i.test(quantityUnitText);
  const totalPrice = bookingPrice * (allowsQuantity ? quantity : 1);
  const liveRating = reviewSnapshot.length
    ? reviewSnapshot.reduce((sum, review) => sum + Number(review.rating || 0), 0) / reviewSnapshot.length
    : Number(service.rating || 0);
  const discount =
    originalPrice > service.price
      ? Math.round(((originalPrice - service.price) / originalPrice) * 100)
      : 0;

  useEffect(() => {
    const updateStickyCheckout = () => {
      const button = bookingButtonRef.current;
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

  const openReviews = () => {
    setReviewsOpen(true);
    window.setTimeout(() => reviewsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 0);
  };

  const selectWork = (work: WorkPrice) => {
    setSelectedWork(work);
    setQuantity(1);
  };

  const addWorkToBooking = (work: WorkPrice, workQuantity = 1) => {
    selectWork(work);
    setQuantity(workQuantity);
    addService({
      id: service.id,
      title: service.title,
      price: work.price,
      quantity: /^\s*per\b/i.test(work.description || "") ? workQuantity : 1,
      imageUrl: imgSrc(work.imageUrl || work.image_url) || displayImage,
      selectedWorkPriceId: Number(work.id),
      selectedWorkTitle: work.title,
      unitDescription: work.description || unitText,
    });
  };

  const changeWorkQuantity = (work: WorkPrice, nextQuantity: number) => {
    if (selectedWork?.id !== work.id) selectWork(work);
    setQuantity(Math.max(1, Math.min(10, nextQuantity)));
  };

  const addCurrentServiceToCart = () => addService({
    id: service.id,
    title: service.title,
    price: bookingPrice,
    quantity: allowsQuantity ? quantity : 1,
    imageUrl: displayImage,
    selectedWorkPriceId: selectedWork?.id ? Number(selectedWork.id) : undefined,
    selectedWorkTitle: selectedWork?.title || undefined,
    unitDescription: unitText,
  });

  return (
    <>
      <div className="min-h-screen bg-slate-50 pt-4">
        {/* Back bar */}
        <div className="border-b border-slate-100 bg-white/90 px-4 py-3 backdrop-blur-md">
          <div className="max-w-6xl mx-auto flex items-center gap-3">
            <button
              type="button"
              onClick={() => router.back()}
              className="flex shrink-0 items-center gap-1.5 sm:gap-2 rounded-lg sm:rounded-xl px-1.5 sm:px-2 py-1 sm:py-1.5 text-sm sm:text-base font-bold text-slate-700 transition-colors hover:bg-emerald-50 hover:text-emerald-600 sm:text-lg"
              aria-label="Go back to the previous page"
            >
              <ArrowLeft className="h-5 w-5 sm:h-6 sm:w-6" />
              Back
            </button>
            <ChevronRight className="h-5 w-5 shrink-0 text-slate-300" />
            <span className="truncate text-base font-medium text-slate-500 sm:text-lg">{service.title}</span>
          </div>
        </div>

        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid lg:grid-cols-5 gap-8">
            {/* LEFT: image + work prices */}
            <div className="lg:col-span-3 space-y-6">
              {/* Hero image */}
              <div className="relative hidden aspect-[16/9] overflow-hidden rounded-3xl bg-slate-100 shadow-md sm:block">
                {displayImage ? (
                  <Image
                    src={displayImage}
                    alt={service.title}
                    fill

                    className="object-cover"
                    sizes="(max-width:1024px) 100vw, 60vw"
                    priority
                    loading="eager"
                  />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-slate-100 to-slate-200">
                    <Layers className="h-16 w-16 text-slate-300" />
                  </div>
                )}
                {service.badge && (
                  <span className="absolute top-4 left-4 bg-emerald-600 text-white text-xs font-bold px-3 py-1.5 rounded-full shadow">
                    {service.badge}
                  </span>
                )}
                {discount > 0 && (
                  <span className="absolute top-4 right-4 bg-red-500 text-white text-xs font-bold px-3 py-1.5 rounded-full shadow">
                    {discount}% OFF
                  </span>
                )}
              </div>

              {/* Work Prices / Sub-services / Service Options */}
              {service.workPrices && service.workPrices.length > 0 && (
                <div>
                  <h2 className="text-lg font-bold text-slate-900 mb-3 flex items-center gap-2">
                    <Tag className="h-5 w-5 text-emerald-600" />
                    Select Service Option / Type
                  </h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
                    {service.workPrices.map((wp) => {
                      const wpImg = imgSrc(wp.imageUrl || wp.image_url);
                      const isSelected = selectedWork?.id === wp.id;
                      const pricedPerItem = /\bper\b/i.test(wp.description || "");
                      const workQuantity = isSelected ? quantity : 1;
                      return (
                        <div
                          key={wp.id}
                          className={`flex min-w-0 flex-col overflow-hidden rounded-2xl border-2 transition-all ${
                            isSelected
                              ? "border-emerald-600 bg-emerald-50/70 shadow-sm"
                              : "border-slate-200 bg-white hover:border-emerald-300"
                          }`}
                        >
                          <button
                            type="button"
                            onClick={() => selectWork(wp)}
                            className="relative flex w-full flex-1 items-center gap-3 p-3 text-left transition-colors hover:bg-slate-50/70 sm:items-start sm:p-4"
                          >
                            {wpImg && (
                              <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-slate-100 sm:h-14 sm:w-14">
                                <Image
                                  src={wpImg}
                                  alt={wp.title}
                                  fill

                                  className="object-cover"
                                  sizes="(max-width: 639px) 64px, 56px"
                                />
                              </div>
                            )}
                            <div className={`min-w-0 flex-1 ${isSelected ? "pr-7" : ""}`}>
                              <p
                                className={`break-words text-sm font-semibold leading-5 ${isSelected ? "text-emerald-700" : "text-slate-800"}`}
                              >
                                {wp.title}
                              </p>
                              <p className="mt-1 text-sm font-bold text-slate-900">
                                Rs {wp.price.toLocaleString()}
                              </p>
                              {wp.description && (
                                <p className="mt-1.5 w-fit max-w-full break-words rounded-md border border-emerald-200 bg-emerald-50 px-2 py-1 text-xs font-semibold leading-4 text-emerald-800">
                                  {wp.description}
                                </p>
                              )}
                            </div>
                            {isSelected && (
                              <BadgeCheck className="absolute right-3 top-3 h-5 w-5 shrink-0 text-emerald-600 sm:right-4 sm:top-4" />
                            )}
                          </button>
                          <div className="flex items-center gap-2 border-t border-slate-200/80 bg-white p-2 sm:hidden">
                            {pricedPerItem && (
                              <div className="flex shrink-0 items-center overflow-hidden rounded-xl border border-slate-200 bg-slate-50">
                                <button
                                  type="button"
                                  onClick={() => changeWorkQuantity(wp, workQuantity - 1)}
                                  disabled={workQuantity <= 1}
                                  className="grid h-10 w-9 place-items-center text-slate-700 transition hover:bg-slate-200 disabled:cursor-not-allowed disabled:opacity-30"
                                  aria-label={`Decrease ${wp.title} quantity`}
                                >
                                  <Minus className="h-4 w-4" />
                                </button>
                                <span className="grid h-10 min-w-9 place-items-center border-x border-slate-200 bg-white text-sm font-black text-slate-900">
                                  {workQuantity}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => changeWorkQuantity(wp, workQuantity + 1)}
                                  disabled={workQuantity >= 10}
                                  className="grid h-10 w-9 place-items-center text-slate-700 transition hover:bg-slate-200 disabled:cursor-not-allowed disabled:opacity-30"
                                  aria-label={`Increase ${wp.title} quantity`}
                                >
                                  <Plus className="h-4 w-4" />
                                </button>
                              </div>
                            )}
                            <button
                              type="button"
                              onClick={() => addWorkToBooking(wp, workQuantity)}
                              className="flex min-w-0 flex-1 items-center justify-center gap-2 rounded-xl bg-emerald-600 px-3 py-3 text-sm font-bold text-white shadow-sm shadow-emerald-600/20 transition hover:bg-emerald-700"
                              aria-label={`Add ${workQuantity} ${wp.title} to booking`}
                            >
                              <ShoppingBag className="h-4 w-4 shrink-0" />
                              <span className="truncate">Add to Cart</span>
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {selectedWork && (
                    <div className="mt-4 hidden rounded-2xl border border-emerald-200 bg-white p-4 shadow-sm sm:block lg:hidden">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                            Your selection
                          </p>
                          <p className="mt-1 break-words text-sm font-bold leading-5 text-slate-900">
                            {selectedWork.title}
                          </p>
                        </div>
                        <p className="shrink-0 text-lg font-black text-slate-950">
                          Rs {totalPrice.toLocaleString()}
                        </p>
                      </div>

                      {allowsQuantity && (
                        <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-4">
                          <span className="text-sm font-bold text-slate-700">Quantity</span>
                          <div className="flex items-center overflow-hidden rounded-xl border border-slate-200 bg-slate-50">
                            <button
                              type="button"
                              onClick={() => setQuantity((current) => Math.max(1, current - 1))}
                              disabled={quantity <= 1}
                              className="grid h-10 w-10 place-items-center text-slate-700 transition hover:bg-slate-200 disabled:cursor-not-allowed disabled:opacity-30"
                              aria-label="Decrease service quantity"
                            >
                              <Minus className="h-4 w-4" />
                            </button>
                            <span className="grid h-10 min-w-10 place-items-center border-x border-slate-200 bg-white text-sm font-black text-slate-900">
                              {quantity}
                            </span>
                            <button
                              type="button"
                              onClick={() => setQuantity((current) => Math.min(10, current + 1))}
                              disabled={quantity >= 10}
                              className="grid h-10 w-10 place-items-center text-slate-700 transition hover:bg-slate-200 disabled:cursor-not-allowed disabled:opacity-30"
                              aria-label="Increase service quantity"
                            >
                              <Plus className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      )}

                      <button
                        type="button"
                        onClick={() => setIsBookingOpen(true)}
                        className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl bg-emerald-600 py-3.5 text-sm font-bold text-white shadow-lg shadow-emerald-600/20 transition-colors hover:bg-emerald-700"
                      >
                        <ShoppingBag className="h-5 w-5" />
                        Book Selected Service
                      </button>
                    </div>
                  )}
                </div>
              )}

              <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h2 className="text-base font-bold text-slate-950">Before you book</h2>
                    <p className="mt-1 text-sm leading-6 text-slate-600">
                      {pricingExplanation(unitText, bookingPrice)}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setServiceInfoOpen((current) => !current)}
                    aria-expanded={serviceInfoOpen}
                    aria-label={serviceInfoOpen ? "Hide booking information" : "Show booking information"}
                    className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-slate-200 bg-slate-50 text-emerald-700 transition hover:border-emerald-300 hover:bg-emerald-50"
                  >
                    <Info className="h-5 w-5" />
                  </button>
                </div>

                <div className="mt-4 grid gap-2.5 sm:grid-cols-3">
                  {["Choose date, time and address", "Pay Rs 200 or pay in full", "Upload receipt for verification"].map((item, index) => (
                    <div key={item} className="flex items-center gap-2 rounded-xl bg-slate-50 px-3 py-2.5 text-xs font-semibold text-slate-700">
                      <span className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-emerald-100 text-[10px] font-black text-emerald-700">{index + 1}</span>
                      {item}
                    </div>
                  ))}
                </div>

                {serviceInfoOpen && (
                  <div className="mt-5 border-t border-slate-200 pt-5">
                    <h3 className="flex items-center gap-2 text-sm font-bold text-slate-900">
                      <Wallet className="h-4 w-4 text-emerald-600" /> Payment and booking details
                    </h3>
                    <ul className="mt-3 space-y-2 text-sm leading-6 text-slate-600">
                      {howItWorks.slice(2).map((item) => (
                        <li key={item} className="flex gap-2"><CheckCircle2 className="mt-1 h-4 w-4 shrink-0 text-emerald-600" />{item}</li>
                      ))}
                      <li className="flex gap-2"><CheckCircle2 className="mt-1 h-4 w-4 shrink-0 text-emerald-600" />The verified Rs 200 advance is deducted from the listed charge. Paying in full leaves no balance against that charge.</li>
                      <li className="flex gap-2"><CheckCircle2 className="mt-1 h-4 w-4 shrink-0 text-emerald-600" />Any approved inspection follow-up, labour, repair, parts, or materials can be paid after the quote.</li>
                      <li className="flex gap-2"><CheckCircle2 className="mt-1 h-4 w-4 shrink-0 text-emerald-600" />Eligible cancelled-booking payments are credited to your UstaadPro wallet.</li>
                    </ul>
                  </div>
                )}
              </div>

              {/* Includes / Excludes */}
              {((service.includes?.length ?? 0) > 0 ||
                (service.excludes?.length ?? 0) > 0) && (
                  <div className="grid sm:grid-cols-2 gap-4">
                    {service.includes && service.includes.length > 0 && (
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
                    {service.excludes && service.excludes.length > 0 && (
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

            {/* RIGHT: sticky booking card */}
            <div className="order-first lg:order-none lg:col-span-2 mt-0">
              <div className="lg:sticky lg:top-32 space-y-4">
                {/* Booking card */}
                <div className="bg-white rounded-3xl border border-slate-100 shadow-lg p-6">
                  <div className="relative mb-5 aspect-[16/9] overflow-hidden rounded-2xl bg-slate-100 lg:hidden">
                    {displayImage ? (
                      <Image src={displayImage} alt={service.title} fill className="object-cover" sizes="100vw" priority />
                    ) : (
                      <div className="absolute inset-0 grid place-items-center bg-gradient-to-br from-slate-100 to-slate-200"><Layers className="h-12 w-12 text-slate-300" /></div>
                    )}
                  </div>
                  {/* Title + rating */}
                  <div className="mb-4">
                    {service.badge && (
                      <span className="inline-block bg-emerald-100 text-emerald-700 text-xs font-bold px-2.5 py-1 rounded-full mb-2">
                        {service.badge}
                      </span>
                    )}
                    <h1 className="text-xl sm:text-2xl font-bold text-slate-900 leading-tight">
                      {service.title}
                    </h1>
                    <button type="button" onClick={openReviews} className="mt-2 flex items-center gap-2 rounded-lg text-left transition hover:text-emerald-600" aria-label="Open customer reviews">
                      <StarRating rating={liveRating} />
                      <span className="text-sm font-semibold text-slate-700">
                        {reviewSnapshot.length ? liveRating.toFixed(1) : (service.rating ? service.rating.toFixed(1) : "0.0")}
                      </span>
                      <span className="text-sm text-slate-400">
                        {reviewSnapshot.length ? `(${reviewSnapshot.length} review${reviewSnapshot.length === 1 ? "" : "s"})` : "(No reviews)"}
                      </span>
                      <ChevronDown className="h-4 w-4 text-emerald-600" />
                    </button>
                  </div>

                  {/* Description */}
                  {displayDescription && (
                    <p className="text-sm text-slate-600 leading-relaxed mb-5">
                      {displayDescription}
                    </p>
                  )}

                  {/* Pricing */}
                  <div className="bg-slate-50 rounded-2xl p-4 mb-5">
                    <p className="text-xs text-slate-400 uppercase tracking-wider font-semibold mb-1">
                      {selectedWork ? "Selected Option" : (unitText ? unitText : "Starting from")}
                    </p>
                    {selectedWork ? (
                      <>
                        <p className="font-semibold text-slate-800 text-sm mb-1">
                          {selectedWork.title}
                        </p>
                        <div className="flex flex-wrap items-baseline gap-2">
                          <span className="text-2xl sm:text-3xl font-black text-slate-900">
                            Rs {totalPrice.toLocaleString()}
                          </span>
                          {allowsQuantity && quantity > 1 && (
                            <span className="text-xs font-bold text-emerald-700">
                              {quantity} × Rs {selectedWork.price.toLocaleString()}
                            </span>
                          )}
                        </div>
                        {selectedWork.description && (
                          <p className="mt-2 inline-flex rounded-lg border border-emerald-200 bg-emerald-100 px-2.5 py-1 text-sm font-bold text-emerald-800">
                            {selectedWork.description}
                          </p>
                        )}
                        {allowsQuantity && (
                          <div className="mt-4 flex items-center justify-between border-t border-slate-200 pt-4">
                            <div>
                              <p className="text-xs font-bold text-slate-700">Quantity</p>
                              <p className="text-[11px] text-slate-400">Select up to 10</p>
                            </div>
                            <div className="flex items-center overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
                              <button
                                type="button"
                                onClick={() => setQuantity((current) => Math.max(1, current - 1))}
                                disabled={quantity <= 1}
                                className="grid h-10 w-10 place-items-center text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-30"
                                aria-label="Decrease service quantity"
                              >
                                <Minus className="h-4 w-4" />
                              </button>
                              <span className="grid h-10 min-w-10 place-items-center border-x border-slate-200 text-sm font-black text-slate-900">
                                {quantity}
                              </span>
                              <button
                                type="button"
                                onClick={() => setQuantity((current) => Math.min(10, current + 1))}
                                disabled={quantity >= 10}
                                className="grid h-10 w-10 place-items-center text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-30"
                                aria-label="Increase service quantity"
                              >
                                <Plus className="h-4 w-4" />
                              </button>
                            </div>
                          </div>
                        )}
                      </>
                    ) : (
                      <>
                        <div className="flex flex-wrap items-baseline gap-2">
                          <span className="text-3xl font-black text-slate-900">
                            Rs {totalPrice.toLocaleString()}
                          </span>
                          {allowsQuantity && quantity > 1 && (
                            <span className="text-xs font-bold text-emerald-700">
                              {quantity} × Rs {service.price.toLocaleString()}
                            </span>
                          )}
                          {originalPrice > service.price && (
                            <span className="text-sm text-slate-400 line-through">
                              Rs {(originalPrice * (allowsQuantity ? quantity : 1)).toLocaleString()}
                            </span>
                          )}
                          {discount > 0 && (
                            <span className="text-xs bg-red-100 text-red-600 font-bold px-2 py-0.5 rounded-full">
                              {discount}% off
                            </span>
                          )}
                        </div>
                        {allowsQuantity && (
                          <div className="mt-4 flex items-center justify-between gap-4 border-t border-slate-200 pt-4">
                            <div>
                              <p className="text-xs font-bold text-slate-700">Quantity</p>
                              <p className="text-[11px] text-slate-400">
                                {unitText || "Per item"} · select up to 10
                              </p>
                            </div>
                            <div className="flex shrink-0 items-center overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
                              <button
                                type="button"
                                onClick={() => setQuantity((current) => Math.max(1, current - 1))}
                                disabled={quantity <= 1}
                                className="grid h-10 w-10 place-items-center text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-30"
                                aria-label="Decrease service quantity"
                              >
                                <Minus className="h-4 w-4" />
                              </button>
                              <span className="grid h-10 min-w-10 place-items-center border-x border-slate-200 text-sm font-black text-slate-900">
                                {quantity}
                              </span>
                              <button
                                type="button"
                                onClick={() => setQuantity((current) => Math.min(10, current + 1))}
                                disabled={quantity >= 10}
                                className="grid h-10 w-10 place-items-center text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-30"
                                aria-label="Increase service quantity"
                              >
                                <Plus className="h-4 w-4" />
                              </button>
                            </div>
                          </div>
                        )}
                      </>
                    )}
                  </div>

                  {/* Duration + type */}
                  <div className="flex items-center gap-4 text-sm text-slate-500 mb-6">
                    {service.duration && (
                      <div className="flex items-center gap-1.5">
                        <Clock className="h-4 w-4 text-emerald-600" />
                        {service.duration}
                      </div>
                    )}
                    {unitText && (
                      <div className="flex items-center gap-1.5">
                        <Shield className="h-4 w-4 text-emerald-600" />
                        {unitText}
                      </div>
                    )}
                  </div>

                  {/* CTA Buttons */}
                  <button
                    ref={bookingButtonRef}
                    type="button"
                    onClick={() => setIsBookingOpen(true)}
                    className="flex items-center justify-center gap-2 w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-4 rounded-2xl text-base transition-colors shadow-lg shadow-emerald-600/20"
                  >
                    <ShoppingBag className="h-5 w-5" />
                    Book Now
                  </button>
                  <button
                    type="button"
                    onClick={addCurrentServiceToCart}
                    className="mt-3 flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-emerald-600 bg-white py-3.5 text-sm font-bold text-emerald-700 transition hover:bg-emerald-50"
                  >
                    <Plus className="h-4 w-4" />
                    Add to service cart
                  </button>
                  <a
                    href="https://wa.me/923719201273?text=Hi%20Ustaad%20Pro%2C%20I%20want%20to%20book%20a%20service."
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
                        <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </div>
          <div ref={reviewsRef} className="scroll-mt-28 pt-8">
            <ServiceReviews
              serviceId={service.id}
              initialReviews={initialReviews}
              open={reviewsOpen}
              onToggle={() => setReviewsOpen((current) => !current)}
              onReviewsLoaded={setReviewSnapshot}
            />
          </div>
        </div>

        {/* Booking Form Modal */}
        <BookingModal
          isOpen={isBookingOpen}
          onClose={() => setIsBookingOpen(false)}
          service={{
            id: service.id,
            title: service.title,
            price: bookingPrice,
            quantity: allowsQuantity ? quantity : 1,
            selectedWorkPriceId: selectedWork?.id ? Number(selectedWork.id) : undefined,
            selectedWorkTitle: selectedWork?.title || undefined,
            unitDescription: unitText,
          }}
        />

        {/* Sticky Checkout Bar */}
        <StickyCheckoutBar
          visible={showStickyCheckout}
          href="#book-service"
          label="Book Now"
          title={selectedWork?.title || service.title}
          price={`Rs ${totalPrice.toLocaleString()}`}
          quantity={allowsQuantity ? quantity : undefined}
          maxQuantity={10}
          onQuantityChange={
            allowsQuantity
              ? (nextQuantity) => setQuantity(Math.max(1, Math.min(10, nextQuantity)))
              : undefined
          }
          onClick={() => setIsBookingOpen(true)}
        />
      </div>
    </>
  );
}

type ReviewSort = "best" | "newest" | "oldest";

function reviewDate(review: ApiReview) {
  const value = review.createdAt || review.created_at;
  const timestamp = value ? new Date(value).getTime() : 0;
  return Number.isFinite(timestamp) ? timestamp : 0;
}

function reviewAuthor(review: ApiReview) {
  return review.userName || review.user_name || review.customerName || review.user?.name || "Ustaad Pro customer";
}

function ServiceReviews({
  serviceId,
  initialReviews,
  open,
  onToggle,
  onReviewsLoaded,
}: {
  serviceId: string;
  initialReviews: ApiReview[];
  open: boolean;
  onToggle: () => void;
  onReviewsLoaded: (reviews: ApiReview[]) => void;
}) {
  const [reviews, setReviews] = useState<ApiReview[]>(initialReviews);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [starFilter, setStarFilter] = useState<number | "all">("all");
  const [sort, setSort] = useState<ReviewSort>("best");

  useEffect(() => {
    const controller = new AbortController();
    async function loadReviews() {
      setLoading(true);
      setError("");
      try {
        const response = await fetch(`${API_BASE.replace(/\/$/, "")}/api/services/${encodeURIComponent(serviceId)}/reviews`, {
          cache: "no-store",
          signal: controller.signal,
          headers: { Accept: "application/json" },
        });
        if (!response.ok) throw new Error("Reviews could not be loaded.");
        const data: unknown = await response.json();
        if (!Array.isArray(data)) throw new Error("The review response was invalid.");
        const normalized = (data as ApiReview[]).filter(
          (review) => Number(review.rating) >= 1 && Number(review.rating) <= 5 && String(review.comment || "").trim()
        );
        setReviews(normalized);
        onReviewsLoaded(normalized);
      } catch (loadError) {
        if (!controller.signal.aborted) setError(loadError instanceof Error ? loadError.message : "Reviews could not be loaded.");
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }
    void loadReviews();
    return () => controller.abort();
  }, [onReviewsLoaded, serviceId]);

  const average = reviews.length ? reviews.reduce((sum, review) => sum + Number(review.rating), 0) / reviews.length : 0;
  const counts = useMemo(
    () => Object.fromEntries([1, 2, 3, 4, 5].map((star) => [star, reviews.filter((review) => Math.round(Number(review.rating)) === star).length])),
    [reviews]
  );
  const visibleReviews = useMemo(() => {
    const filtered = starFilter === "all" ? [...reviews] : reviews.filter((review) => Math.round(Number(review.rating)) === starFilter);
    return filtered.sort((a, b) => {
      if (sort === "newest") return reviewDate(b) - reviewDate(a);
      if (sort === "oldest") return reviewDate(a) - reviewDate(b);
      return Number(b.rating) - Number(a.rating) || reviewDate(b) - reviewDate(a) || String(b.comment).length - String(a.comment).length;
    });
  }, [reviews, sort, starFilter]);

  return (
    <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full flex-col items-stretch gap-3 p-4 text-left transition hover:bg-slate-50 sm:flex-row sm:items-center sm:justify-between sm:gap-4 sm:p-8"
        aria-expanded={open}
      >
        <div className="flex min-w-0 items-center gap-3 sm:gap-4">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-amber-500 sm:h-12 sm:w-12 sm:rounded-2xl">
            <MessageSquareText className="h-5 w-5 sm:h-6 sm:w-6" />
          </span>
          <div className="min-w-0">
            <h2 className="text-lg font-black text-slate-900 sm:text-xl">Customer reviews</h2>
            <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1">
              <StarRating rating={average} />
              <span className="text-sm font-bold text-slate-700">{average ? average.toFixed(1) : "New"}</span>
              <span className="text-sm text-slate-400">({reviews.length})</span>
            </div>
          </div>
        </div>
        <span className="flex items-center justify-between gap-2 rounded-xl bg-emerald-50 px-3 py-2 text-sm font-bold text-emerald-700 sm:shrink-0 sm:bg-transparent sm:px-0 sm:py-0">
          {open ? "Close reviews" : "Open reviews"}
          <ChevronDown className={`h-5 w-5 transition ${open ? "rotate-180" : ""}`} />
        </span>
      </button>

      {open && (
        <div className="border-t border-slate-100 p-6 sm:p-8">
          {loading ? (
            <div className="grid gap-4 sm:grid-cols-2" role="status" aria-label="Loading customer reviews">
              <span className="sr-only">Loading customer reviews…</span>
              {Array.from({ length: 4 }).map((_, index) => (
                <div key={index} className="rounded-2xl border border-slate-100 p-5">
                  <div className="flex items-center gap-3">
                    <Skeleton className="h-10 w-10 rounded-full" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="h-3 w-24" />
                    </div>
                  </div>
                  <Skeleton className="mt-4 h-4 w-28" />
                  <Skeleton className="mt-4 h-4 w-full" />
                  <Skeleton className="mt-2 h-4 w-4/5" />
                </div>
              ))}
            </div>
          ) : error ? (
            <div className="rounded-2xl border border-red-100 bg-red-50 p-5 text-sm font-medium text-red-700">{error}</div>
          ) : reviews.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-5 py-12 text-center">
              <Star className="mx-auto h-8 w-8 text-amber-400" />
              <h3 className="mt-3 font-bold text-slate-800">No published reviews yet</h3>
              <p className="mt-1 text-sm text-slate-500">Reviews from completed bookings will appear here.</p>
            </div>
          ) : (
            <>
              <div className="grid gap-6 lg:grid-cols-[240px_1fr]">
                <aside>
                  <div className="rounded-2xl bg-slate-50 p-5 text-center">
                    <strong className="text-4xl font-black text-slate-900">{average.toFixed(1)}</strong>
                    <div className="mt-2 flex justify-center">
                      <StarRating rating={average} />
                    </div>
                    <p className="mt-2 text-xs text-slate-500">
                      Based on {reviews.length} published review{reviews.length === 1 ? "" : "s"}
                    </p>
                  </div>
                  <div className="mt-4 space-y-2">
                    {[5, 4, 3, 2, 1].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setStarFilter(starFilter === star ? "all" : star)}
                        className={`flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-xs transition ${
                          starFilter === star ? "bg-emerald-50 text-emerald-700 font-bold" : "text-slate-600 hover:bg-slate-50"
                        }`}
                      >
                        <span className="w-7 font-bold">{star}★</span>
                        <span className="h-2 flex-1 overflow-hidden rounded-full bg-slate-100">
                          <span
                            className="block h-full rounded-full bg-amber-400"
                            style={{ width: `${reviews.length ? (counts[star] / reviews.length) * 100 : 0}%` }}
                          />
                        </span>
                        <span className="w-5 text-right">{counts[star]}</span>
                      </button>
                    ))}
                  </div>
                </aside>
                <div>
                  <div className="mb-4 flex flex-col gap-3 border-b border-slate-100 pb-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center gap-2 text-sm font-bold text-slate-700">
                      <SlidersHorizontal className="h-4 w-4 text-emerald-600" />
                      {starFilter === "all" ? "All ratings" : `${starFilter}-star reviews`}{" "}
                      <span className="font-normal text-slate-400">({visibleReviews.length})</span>
                    </div>
                    <select
                      value={sort}
                      onChange={(event) => setSort(event.target.value as ReviewSort)}
                      className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 outline-none focus:border-emerald-600"
                      aria-label="Sort reviews"
                    >
                      <option value="best">Best reviews first</option>
                      <option value="newest">Newest first</option>
                      <option value="oldest">Oldest first</option>
                    </select>
                  </div>
                  {visibleReviews.length ? (
                    <div className="divide-y divide-slate-100">
                      {visibleReviews.map((review) => {
                        const author = reviewAuthor(review);
                        const timestamp = reviewDate(review);
                        return (
                          <article key={review.id} className="py-5 first:pt-0">
                            <div className="flex items-start justify-between gap-4">
                              <div className="flex items-center gap-3">
                                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100 text-sm font-black text-emerald-700">
                                  {author.charAt(0).toUpperCase()}
                                </span>
                                <div>
                                  <strong className="block text-sm text-slate-900">{author}</strong>
                                  <span className="flex items-center gap-1 text-xs font-medium text-emerald-700">
                                    <BadgeCheck className="h-3.5 w-3.5" /> Verified booking
                                  </span>
                                </div>
                              </div>
                              {timestamp > 0 && (
                                <time className="text-xs text-slate-400" dateTime={new Date(timestamp).toISOString()}>
                                  {new Intl.DateTimeFormat("en-PK", { day: "numeric", month: "short", year: "numeric" }).format(timestamp)}
                                </time>
                              )}
                            </div>
                            <div className="mt-3">
                              <StarRating rating={Number(review.rating)} />
                            </div>
                            <p className="mt-3 whitespace-pre-line text-sm leading-7 text-slate-600">{review.comment}</p>
                          </article>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="rounded-xl bg-slate-50 py-10 text-center text-sm text-slate-500">
                      No {starFilter}-star reviews are available.
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </section>
  );
}
