"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  Layers,
  Clock,
  BadgeCheck,
  Home,
  ChevronRight,
  Wrench,
  Star,
  Minus,
  Plus,
  ShoppingCart,
} from "lucide-react";
import type { ApiCatalogCategory, ApiService, ApiSubcategory } from "@/lib/api-types";
import BookingModal from "@/components/booking/BookingModal";
import { useServiceCart } from "@/context/ServiceCartContext";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "https://api.ustaadpro.pk";

function imgSrc(url: string | undefined | null) {
  if (!url) return null;
  if (url.startsWith("http")) return url;
  return `${API_BASE.replace(/\/$/, "")}${url.startsWith("/") ? "" : "/"}${url}`;
}

interface CategoryPageClientProps {
  catalogCategory: ApiCatalogCategory;
}

export function CategoryPageClient({ catalogCategory }: CategoryPageClientProps) {
  const router = useRouter();
  const [activeSubcategory, setActiveSubcategory] = useState<ApiSubcategory | null>(null);
  const [bookingService, setBookingService] = useState<ApiService | null>(null);
  const [bookingQuantity, setBookingQuantity] = useState(1);
  const [isBookingOpen, setIsBookingOpen] = useState(false);

  const subcategories = catalogCategory.subcategories ?? [];
  const directServices: ApiService[] = (catalogCategory.directServices ?? catalogCategory.services ?? []);

  const handleSubcategoryClick = (subcat: ApiSubcategory) => {
    setActiveSubcategory(subcat);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleBack = () => {
    if (activeSubcategory) {
      setActiveSubcategory(null);
    } else {
      router.push("/services");
    }
  };

  const handleBookService = (service: ApiService, quantity = 1) => {
    setBookingService(service);
    setBookingQuantity(Math.max(1, quantity));
    setIsBookingOpen(true);
  };

  // LEVEL 3: Services under a selected subcategory
  if (activeSubcategory) {
    const services = activeSubcategory.services ?? [];
    return (
      <div className="min-h-screen bg-slate-50">
        {/* Header */}
        <div className="sticky top-0 z-40 border-b border-slate-100 bg-white/95 backdrop-blur">
          <div className="mx-auto flex max-w-7xl items-center gap-3 px-4 py-4 sm:px-6 lg:px-8">
            <button
              type="button"
              onClick={handleBack}
              className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 transition hover:bg-slate-50"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <nav className="flex items-center gap-1.5 text-sm text-slate-500">
              <Link href="/services" className="font-medium hover:text-emerald-600">Services</Link>
              <ChevronRight className="h-4 w-4" />
              <button
                type="button"
                onClick={() => setActiveSubcategory(null)}
                className="font-medium hover:text-emerald-600"
              >
                {catalogCategory.title}
              </button>
              <ChevronRight className="h-4 w-4" />
              <span className="font-bold text-slate-900">{activeSubcategory.title}</span>
            </nav>
          </div>
        </div>

        {/* Subcategory Hero */}
        <div className="relative overflow-hidden border-b border-slate-100 bg-gradient-to-br from-emerald-600 to-emerald-700 px-4 py-12 sm:px-6 lg:px-8">
          <div className="absolute inset-0 opacity-10" style={{ backgroundImage: "radial-gradient(#fff 1px, transparent 1px)", backgroundSize: "16px 16px" }} />
          <div className="relative mx-auto max-w-7xl">
            <span className="inline-flex items-center gap-2 rounded-full bg-white/20 px-3 py-1.5 text-xs font-bold text-white">
              <Wrench className="h-3.5 w-3.5" /> {catalogCategory.title}
            </span>
            <h1 className="mt-3 text-3xl font-black text-white sm:text-4xl">{activeSubcategory.title}</h1>
            {activeSubcategory.description && (
              <p className="mt-2 text-emerald-100">{activeSubcategory.description}</p>
            )}
            <p className="mt-3 text-sm font-medium text-emerald-200">
              {services.length} service option{services.length !== 1 ? "s" : ""} available
            </p>
          </div>
        </div>

        {/* Services Grid */}
        <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
          {services.length === 0 ? (
            <div className="rounded-3xl border border-slate-200 bg-white p-12 text-center shadow-sm">
              <Layers className="mx-auto h-12 w-12 text-slate-300" />
              <p className="mt-4 text-xl font-bold text-slate-400">No services listed yet</p>
            </div>
          ) : (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {services.map((service) => (
                <ServiceCard
                  key={service.id}
                  service={service}
                  onBook={(quantity) => handleBookService(service, quantity)}
                />
              ))}
            </div>
          )}
        </div>

        {bookingService && (
          <BookingModal
            isOpen={isBookingOpen}
            onClose={() => setIsBookingOpen(false)}
            service={{ id: bookingService.id, title: bookingService.title, price: bookingService.price, quantity: bookingQuantity, unitDescription: bookingService.unitDescription || bookingService.serviceType || bookingService.service_type }}
          />
        )}
      </div>
    );
  }

  // LEVEL 2: Subcategory cards
  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="sticky top-0 z-40 border-b border-slate-100 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center gap-3 px-4 py-4 sm:px-6 lg:px-8">
          <button
            type="button"
            onClick={handleBack}
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 transition hover:bg-slate-50"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <nav className="flex items-center gap-1.5 text-sm text-slate-500">
            <Link href="/" className="flex items-center gap-1 font-medium hover:text-emerald-600">
              <Home className="h-3.5 w-3.5" /> Home
            </Link>
            <ChevronRight className="h-4 w-4" />
            <Link href="/services" className="font-medium hover:text-emerald-600">Services</Link>
            <ChevronRight className="h-4 w-4" />
            <span className="font-bold text-slate-900">{catalogCategory.title}</span>
          </nav>
        </div>
      </div>

      {/* Category Hero */}
      <div className="relative overflow-hidden border-b border-emerald-100">
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-800 to-emerald-900" />
        {catalogCategory.mainCategory?.webImageUrl && (
          <Image
            src={imgSrc(catalogCategory.mainCategory.webImageUrl) ?? ""}
            alt={catalogCategory.title}
            fill

            className="object-cover opacity-20"
          />
        )}
        <div className="relative mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
          <span className="inline-flex items-center gap-2 rounded-full bg-emerald-500/20 px-3 py-1.5 text-xs font-bold text-emerald-300">
            <BadgeCheck className="h-3.5 w-3.5" /> Verified Professionals
          </span>
          <h1 className="mt-4 text-4xl font-black text-white sm:text-5xl">{catalogCategory.title}</h1>
          {catalogCategory.subtitle && (
            <p className="mt-3 text-lg text-slate-300">{catalogCategory.subtitle}</p>
          )}
          <div className="mt-5 flex flex-wrap items-center gap-4 text-sm text-slate-400">
            <span className="flex items-center gap-1.5">
              <Layers className="h-4 w-4 text-emerald-400" />
              {subcategories.length} sub-service{subcategories.length !== 1 ? "s" : ""}
            </span>
            <span className="flex items-center gap-1.5">
              <Wrench className="h-4 w-4 text-emerald-400" />
              {subcategories.reduce((acc, sc) => acc + (sc.services?.length ?? 0), 0) + directServices.length} total services
            </span>
          </div>
        </div>
      </div>

      {/* Subcategory Cards */}
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        {subcategories.length > 0 && (
          <div className="mb-8">
            <h2 className="mb-1 text-2xl font-black text-slate-900">Select a Service Type</h2>
            <p className="text-sm text-slate-500">Choose a category to view available services and pricing</p>
          </div>
        )}

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {subcategories.map((subcat) => (
            <SubcategoryCard
              key={subcat.id}
              subcat={subcat}
              onClick={() => handleSubcategoryClick(subcat)}
            />
          ))}
        </div>

        {/* Direct Services (if any) */}
        {directServices.length > 0 && (
          <div className="mt-12">
            <h2 className="mb-6 text-xl font-black text-slate-900">Individual Services</h2>
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {directServices.map((service) => (
                <ServiceCard
                  key={service.id}
                  service={service}
                  onBook={(quantity) => handleBookService(service, quantity)}
                />
              ))}
            </div>
          </div>
        )}

        {subcategories.length === 0 && directServices.length === 0 && (
          <div className="rounded-3xl border border-slate-200 bg-white p-12 text-center shadow-sm">
            <Layers className="mx-auto h-12 w-12 text-slate-300" />
            <p className="mt-4 text-xl font-bold text-slate-400">No services available yet</p>
            <Link
              href="/services"
              className="mt-6 inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-6 py-3 font-bold text-white hover:bg-emerald-700"
            >
              <ArrowLeft className="h-4 w-4" /> Back to Services
            </Link>
          </div>
        )}
      </div>

      {bookingService && (
        <BookingModal
          isOpen={isBookingOpen}
          onClose={() => setIsBookingOpen(false)}
          service={{ id: bookingService.id, title: bookingService.title, price: bookingService.price, quantity: bookingQuantity, unitDescription: bookingService.unitDescription || bookingService.serviceType || bookingService.service_type }}
        />
      )}
    </div>
  );
}

// ─── Sub-category Card ─────────────────────────────────────────────────────────
function SubcategoryCard({
  subcat,
  onClick,
}: {
  subcat: ApiSubcategory;
  onClick: () => void;
}) {
  const src = imgSrc(subcat.imageUrl || subcat.image_url || subcat.imageurl);
  const serviceCount = subcat.services?.length ?? 0;

  return (
    <button
      type="button"
      onClick={onClick}
      className="group flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white text-left shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl"
    >
      {/* Image */}
      <div className="relative h-44 shrink-0 overflow-hidden bg-slate-100">
        {src ? (
          <Image
            src={src}
            alt={subcat.title}
            fill

            className="object-cover transition-transform duration-500 group-hover:scale-105"
            sizes="(max-width:640px) 100vw, (max-width:1024px) 50vw, 33vw"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-emerald-50 to-emerald-100">
            <Wrench className="h-12 w-12 text-emerald-300" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
        {serviceCount > 0 && (
          <div className="absolute bottom-3 left-3 flex items-center gap-1.5 rounded-full bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white shadow">
            <BadgeCheck className="h-3.5 w-3.5" />
            {serviceCount} service{serviceCount !== 1 ? "s" : ""}
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex flex-1 items-start justify-between gap-3 p-5">
        <div className="min-w-0">
          <h3 className="text-lg font-bold text-slate-900 transition-colors group-hover:text-emerald-600">
            {subcat.title}
          </h3>
          {subcat.description && (
            <p className="mt-1.5 line-clamp-2 text-sm text-slate-500">{subcat.description}</p>
          )}
        </div>
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 transition-colors group-hover:bg-emerald-600 group-hover:text-white">
          <ArrowRight className="h-4 w-4" />
        </span>
      </div>
    </button>
  );
}

// ─── Service Card ─────────────────────────────────────────────────────────────
function ServiceCard({
  service,
  onBook,
}: {
  service: ApiService;
  onBook: (quantity: number) => void;
}) {
  const { items, addService } = useServiceCart();
  const src = imgSrc(service.serviceImageUrl || service.imageUrl || service.image_url);
  const originalPrice = Number(service.original_price || service.originalPrice || 0);
  const discount = originalPrice > service.price ? Math.round(((originalPrice - service.price) / originalPrice) * 100) : 0;
  const unitText = service.unitDescription || service.serviceType || service.service_type || "";
  const allowsQuantity = /^per\b/i.test(unitText.trim()) || /^per\b/i.test((service.description || "").trim());
  const [quantity, setQuantity] = useState(1);
  const cartKey = `${service.id}:service`;
  const inCart = items.some((item) => item.key === cartKey);
  const addToCart = () => addService({ id: service.id, title: service.title, price: Number(service.price), quantity, imageUrl: service.serviceImageUrl || service.imageUrl || service.image_url, unitDescription: unitText });

  return (
    <div className="group flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl">
      {/* Image */}
      <div className="relative h-44 shrink-0 overflow-hidden bg-slate-100">
        {src ? (
          <Image
            src={src}
            alt={service.title}
            fill

            className="object-cover transition-transform duration-500 group-hover:scale-105"
            sizes="(max-width:640px) 100vw, (max-width:1024px) 50vw, 33vw"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-slate-100 to-slate-200">
            <Layers className="h-12 w-12 text-slate-300" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/35 to-transparent" />
        <div className="absolute left-3 top-3 flex flex-wrap gap-2">
          {discount > 0 && (
            <span className="rounded-full bg-red-500 px-2.5 py-1 text-xs font-bold text-white shadow">
              {discount}% OFF
            </span>
          )}
        </div>
        {service.duration && (
          <div className="absolute bottom-3 right-3 flex items-center gap-1.5 rounded-full bg-black/50 px-3 py-1 text-xs font-medium text-white backdrop-blur-sm">
            <Clock className="h-3.5 w-3.5" />
            {service.duration}
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex flex-1 flex-col p-5">
        <h3 className="text-lg font-bold text-slate-900 transition-colors group-hover:text-emerald-600">
          {service.title}
        </h3>
        {(service.detailDescription || service.detail_description || service.description) && (
          <p className="mt-1.5 line-clamp-2 flex-1 text-sm text-slate-500">
            {service.detailDescription || service.detail_description || service.description}
          </p>
        )}

        {Number(service.reviews || 0) > 0 && (
          <div className="mt-3 flex items-center gap-1.5">
            <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
            <span className="text-sm font-bold text-slate-700">{Number(service.rating || 0).toFixed(1)}</span>
            <span className="text-xs text-slate-400">({service.reviews} reviews)</span>
          </div>
        )}

        {allowsQuantity && <div className="mt-4 flex items-center justify-between rounded-xl border border-emerald-100 bg-emerald-50 p-2.5"><div><p className="text-xs font-bold text-emerald-900">How many?</p><p className="text-[10px] text-emerald-700">{unitText || "Per item"}</p></div><div className="flex items-center overflow-hidden rounded-xl border border-emerald-200 bg-white"><button type="button" onClick={() => setQuantity((value) => Math.max(1, value - 1))} disabled={quantity <= 1} aria-label="Decrease quantity" className="grid h-9 w-9 place-items-center disabled:opacity-30"><Minus className="h-4 w-4" /></button><span className="grid h-9 min-w-9 place-items-center border-x border-emerald-100 text-sm font-black">{quantity}</span><button type="button" onClick={() => setQuantity((value) => Math.min(10, value + 1))} disabled={quantity >= 10} aria-label="Increase quantity" className="grid h-9 w-9 place-items-center disabled:opacity-30"><Plus className="h-4 w-4" /></button></div></div>}

        {/* Price + Book */}
        <div className="mt-4 border-t border-slate-100 pt-4">
          <div className="flex items-center justify-between gap-3">
          <div>
            {unitText && <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">{unitText}</p>}
            <div className="flex items-baseline gap-1.5">
              <span className="text-xl font-black text-slate-900">Rs {(service.price * quantity).toLocaleString()}</span>
              {discount > 0 && (
                <span className="text-xs text-slate-400 line-through">Rs {originalPrice.toLocaleString()}</span>
              )}
            </div>
          </div>
          </div>
          <div className="mt-3 grid grid-cols-2 gap-2">
          <button type="button" onClick={addToCart} className={`flex items-center justify-center gap-2 rounded-xl border px-3 py-2.5 text-sm font-bold transition ${inCart ? "border-emerald-300 bg-emerald-50 text-emerald-700" : "border-slate-200 bg-white text-slate-700 hover:border-emerald-400 hover:bg-emerald-50"}`}><ShoppingCart className="h-4 w-4" />{inCart ? "Add another" : "Add to cart"}</button>
          <button
            type="button"
            onClick={() => onBook(quantity)}
            className="flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-bold text-white shadow-md shadow-emerald-600/20 transition hover:bg-emerald-700"
          >
            Book <ArrowRight className="h-4 w-4" />
          </button>
          </div>
        </div>
      </div>
    </div>
  );
}
