"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
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
} from "lucide-react";
import type { ApiReview, ApiService, WorkPrice } from "@/lib/api-types";
import BookingModal from "@/components/booking/BookingModal";
import { StickyCheckoutBar } from "@/components/shared/StickyCheckoutBar";

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

export function ServiceDetailClient({ service, initialReviews }: { service: ApiService; initialReviews: ApiReview[] }) {
  const router = useRouter();
  const [selectedWork, setSelectedWork] = useState<WorkPrice | null>(
    service.workPrices?.[0] ?? null,
  );
  const [isBookingOpen, setIsBookingOpen] = useState(false);
  const [showStickyCheckout, setShowStickyCheckout] = useState(false);
  const [reviewsOpen, setReviewsOpen] = useState(false);
  const [reviewSnapshot, setReviewSnapshot] = useState(initialReviews);
  const bookingButtonRef = useRef<HTMLAnchorElement>(null);
  const reviewsRef = useRef<HTMLDivElement>(null);

  const displayImage = imgSrc(service.image_url || service.imageUrl);
  const originalPrice = Number(
    service.original_price || service.originalPrice || 0,
  );
  const bookingPrice = selectedWork?.price ?? service.price;
  const liveRating = reviewSnapshot.length
    ? reviewSnapshot.reduce((sum, review) => sum + Number(review.rating || 0), 0) / reviewSnapshot.length
    : 0;
  const discount =
    originalPrice > service.price
      ? Math.round(((originalPrice - service.price) / originalPrice) * 100)
      : 0;
  const bookingHref = `/checkout?serviceId=${service.id}&serviceTitle=${encodeURIComponent(service.title)}&servicePrice=${bookingPrice}&workTitle=${encodeURIComponent(selectedWork?.title || "")}&workPriceId=${selectedWork?.id || ""}`;

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

  return (
    <div className="min-h-screen bg-slate-50">
      {/* ── Back bar ── */}
      <div className="border-b border-slate-100 bg-white/90 px-4 py-3 backdrop-blur-md">
        <div className="max-w-6xl mx-auto flex items-center gap-3">
          <button
            type="button"
            onClick={() => router.back()}
            className="flex shrink-0 items-center gap-2 rounded-xl px-2 py-1.5 text-base font-bold text-slate-700 transition-colors hover:bg-emerald-50 hover:text-primary sm:text-lg"
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
                        className={`flex items-start gap-3 text-left p-4 rounded-2xl border-2 transition-all ${isSelected
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
                  <button type="button" onClick={openReviews} className="mt-2 flex items-center gap-2 rounded-lg text-left transition hover:text-primary" aria-label="Open customer reviews">
                    <StarRating rating={liveRating} />
                    <span className="text-sm font-semibold text-slate-700">
                      {reviewSnapshot.length ? liveRating.toFixed(1) : "0.0"}
                    </span>
                    <span className="text-sm text-slate-400">
                      {reviewSnapshot.length ? `(${reviewSnapshot.length} review${reviewSnapshot.length === 1 ? "" : "s"})` : "(No reviews)"}
                    </span>
                    <ChevronDown className="h-4 w-4 text-primary" />
                  </button>
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

                {/* CTA Buttons */}
                <button
                  type="button"
                  onClick={() => setIsBookingOpen(true)}
                  className="flex items-center justify-center gap-2 w-full bg-primary hover:bg-emerald-700 text-white font-bold py-4 rounded-2xl text-base transition-colors shadow-lg shadow-primary/20"
                >
                  <ShoppingBag className="h-5 w-5" />
                  Book Now
                </button>
                <Link ref={bookingButtonRef} href={bookingHref} className="flex w-full items-center justify-center gap-2 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-bold py-3.5 text-sm transition-colors mt-3">
                  <ShoppingBag className="h-4 w-4" />
                  Quick Checkout
                </Link>
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
                      <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />
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
          selectedWorkPriceId: selectedWork?.id ? Number(selectedWork.id) : undefined,
          selectedWorkTitle: selectedWork?.title || undefined,
        }}
      />

      {/* Sticky Checkout Bar */}
      <StickyCheckoutBar
        visible={showStickyCheckout}
        href={bookingHref}
        label="Book Now"
        title={selectedWork?.title || service.title}
        price={`Rs ${bookingPrice.toLocaleString()}`}
      />
    </div>
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

function ServiceReviews({ serviceId, initialReviews, open, onToggle, onReviewsLoaded }: { serviceId: string; initialReviews: ApiReview[]; open: boolean; onToggle: () => void; onReviewsLoaded: (reviews: ApiReview[]) => void }) {
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
        const response = await fetch(`${API_BASE}/api/services/${encodeURIComponent(serviceId)}/reviews`, {
          cache: "no-store",
          signal: controller.signal,
          headers: { Accept: "application/json" },
        });
        if (!response.ok) throw new Error("Reviews could not be loaded.");
        const data: unknown = await response.json();
        if (!Array.isArray(data)) throw new Error("The review response was invalid.");
        const normalized = (data as ApiReview[]).filter((review) => Number(review.rating) >= 1 && Number(review.rating) <= 5 && String(review.comment || "").trim());
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
  const counts = useMemo(() => Object.fromEntries([1, 2, 3, 4, 5].map((star) => [star, reviews.filter((review) => Math.round(Number(review.rating)) === star).length])), [reviews]);
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
      <button type="button" onClick={onToggle} className="flex w-full items-center justify-between gap-4 p-6 text-left transition hover:bg-slate-50 sm:p-8" aria-expanded={open}>
        <div className="flex items-center gap-4">
          <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-50 text-amber-500"><MessageSquareText className="h-6 w-6" /></span>
          <div><h2 className="text-xl font-black text-slate-900">Customer reviews</h2><div className="mt-1 flex items-center gap-2"><StarRating rating={average} /><span className="text-sm font-bold text-slate-700">{average ? average.toFixed(1) : "New"}</span><span className="text-sm text-slate-400">({reviews.length})</span></div></div>
        </div>
        <span className="flex items-center gap-2 text-sm font-bold text-primary">{open ? "Close reviews" : "Open reviews"}<ChevronDown className={`h-5 w-5 transition ${open ? "rotate-180" : ""}`} /></span>
      </button>

      {open && <div className="border-t border-slate-100 p-6 sm:p-8">
        {loading ? <div className="py-12 text-center text-sm font-medium text-slate-500">Loading customer reviews…</div> : error ? <div className="rounded-2xl border border-red-100 bg-red-50 p-5 text-sm font-medium text-red-700">{error}</div> : reviews.length === 0 ? <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-5 py-12 text-center"><Star className="mx-auto h-8 w-8 text-amber-400" /><h3 className="mt-3 font-bold text-slate-800">No published reviews yet</h3><p className="mt-1 text-sm text-slate-500">Reviews from completed bookings will appear here.</p></div> : <>
          <div className="grid gap-6 lg:grid-cols-[240px_1fr]">
            <aside>
              <div className="rounded-2xl bg-slate-50 p-5 text-center"><strong className="text-4xl font-black text-slate-900">{average.toFixed(1)}</strong><div className="mt-2 flex justify-center"><StarRating rating={average} /></div><p className="mt-2 text-xs text-slate-500">Based on {reviews.length} published review{reviews.length === 1 ? "" : "s"}</p></div>
              <div className="mt-4 space-y-2">{[5, 4, 3, 2, 1].map((star) => <button key={star} type="button" onClick={() => setStarFilter(starFilter === star ? "all" : star)} className={`flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-xs transition ${starFilter === star ? "bg-emerald-50 text-emerald-700" : "text-slate-600 hover:bg-slate-50"}`}><span className="w-7 font-bold">{star}★</span><span className="h-2 flex-1 overflow-hidden rounded-full bg-slate-100"><span className="block h-full rounded-full bg-amber-400" style={{ width: `${reviews.length ? (counts[star] / reviews.length) * 100 : 0}%` }} /></span><span className="w-5 text-right">{counts[star]}</span></button>)}</div>
            </aside>
            <div>
              <div className="mb-4 flex flex-col gap-3 border-b border-slate-100 pb-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-2 text-sm font-bold text-slate-700"><SlidersHorizontal className="h-4 w-4 text-primary" />{starFilter === "all" ? "All ratings" : `${starFilter}-star reviews`} <span className="font-normal text-slate-400">({visibleReviews.length})</span></div>
                <select value={sort} onChange={(event) => setSort(event.target.value as ReviewSort)} className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 outline-none focus:border-primary" aria-label="Sort reviews"><option value="best">Best reviews first</option><option value="newest">Newest first</option><option value="oldest">Oldest first</option></select>
              </div>
              {visibleReviews.length ? <div className="divide-y divide-slate-100">{visibleReviews.map((review) => {
                const author = reviewAuthor(review);
                const timestamp = reviewDate(review);
                return <article key={review.id} className="py-5 first:pt-0"><div className="flex items-start justify-between gap-4"><div className="flex items-center gap-3"><span className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100 text-sm font-black text-emerald-700">{author.charAt(0).toUpperCase()}</span><div><strong className="block text-sm text-slate-900">{author}</strong><span className="flex items-center gap-1 text-xs font-medium text-emerald-700"><BadgeCheck className="h-3.5 w-3.5" /> Verified booking</span></div></div>{timestamp > 0 && <time className="text-xs text-slate-400" dateTime={new Date(timestamp).toISOString()}>{new Intl.DateTimeFormat("en-PK", { day: "numeric", month: "short", year: "numeric" }).format(timestamp)}</time>}</div><div className="mt-3"><StarRating rating={Number(review.rating)} /></div><p className="mt-3 whitespace-pre-line text-sm leading-7 text-slate-600">{review.comment}</p></article>;
              })}</div> : <div className="rounded-xl bg-slate-50 py-10 text-center text-sm text-slate-500">No {starFilter}-star reviews are available.</div>}
            </div>
          </div>
        </>}
      </div>}
    </section>
  );
}