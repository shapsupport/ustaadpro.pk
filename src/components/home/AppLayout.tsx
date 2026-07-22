"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowRight, BadgeCheck, CalendarCheck, Camera, CheckCircle2, ChevronDown,
  ChevronLeft, ChevronRight, Clock3, Flame, Hammer, Layers3, MapPin,
  Paintbrush, Search, ShieldCheck, Shirt, Snowflake, Sparkles, Star,
  Timer, UserCheck, WalletCards, Wrench, Zap, type LucideIcon,
} from "lucide-react";
import type { ApiCategory, ApiReview, ApiService } from "@/lib/api-types";
import { useLocation } from "@/context/LocationContext";
import { searchApi } from "@/lib/search";
import { orderCategories, orderServices } from "@/lib/service-order";
import { SearchSuggestions } from "@/components/search/SearchSuggestions";
import { AppStoreButtons } from "@/components/shared/AppStoreButtons";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE;

function imgSrc(url?: string) {
  if (!url) return null;
  return url.startsWith("http") ? url : `${API_BASE}${url}`;
}

const CAT_ICONS: Record<string, LucideIcon> = {
  "ac-services": Snowflake,
  electrician: Zap,
  plumbers: Wrench,
  "home-cleaning": Sparkles,
  "dry-cleaning": Shirt,
  painters: Paintbrush,
  carpenter: Hammer,
  cctv: Camera,
  "welder-fabricator": Flame,
};

const trustItems = [
  { icon: WalletCards, title: "Upfront pricing", text: "No hidden charges" },
  { icon: ShieldCheck, title: "Skilled professionals", text: "Carefully selected pros" },
  { icon: Timer, title: "On-time service", text: "Punctual & reliable" },
  { icon: CheckCircle2, title: "Customer support", text: "We’re here to help" },
];

interface AppLayoutProps {
  initialServices: ApiService[];
  categories: ApiCategory[];
  reviews: ApiReview[];
}

export function AppLayout({ initialServices, categories, reviews }: AppLayoutProps) {
  const { location, setShowPicker } = useLocation();
  const [query, setQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("all");
  const [remoteResults, setRemoteResults] = useState<ApiService[]>([]);
  const [searching, setSearching] = useState(false);
  const [featuredIndex, setFeaturedIndex] = useState(0);
  const servicesRef = useRef<HTMLElement>(null);

  const orderedServices = useMemo(() => orderServices(initialServices), [initialServices]);
  const categoryList = useMemo(() => {
    const ids = [...new Set(orderedServices.map((service) => service.category_id))];
    return orderCategories(ids.map((id) => categories.find((category) => category.id === id) ?? {
      id, title: id.replace(/-/g, " "), subtitle: "", icon: "", tint: "#059669",
    }));
  }, [categories, orderedServices]);

  useEffect(() => {
    const cleaned = query.trim();
    if (!cleaned) {
      setRemoteResults([]);
      setSearching(false);
      return;
    }
    const controller = new AbortController();
    const timeout = window.setTimeout(async () => {
      setSearching(true);
      try { setRemoteResults(await searchApi(cleaned, "service", controller.signal)); }
      catch { if (!controller.signal.aborted) setRemoteResults([]); }
      finally { if (!controller.signal.aborted) setSearching(false); }
    }, 300);
    return () => { window.clearTimeout(timeout); controller.abort(); };
  }, [query]);

  useEffect(() => {
    if (orderedServices.length < 2) return;
    const timer = window.setInterval(() => setFeaturedIndex((index) => (index + 1) % orderedServices.length), 6000);
    return () => window.clearInterval(timer);
  }, [orderedServices.length]);

  const filtered = useMemo(() => {
    const source = query.trim() ? orderServices(remoteResults) : orderedServices;
    return source.filter((service) => activeCategory === "all" || service.category_id === activeCategory);
  }, [activeCategory, orderedServices, query, remoteResults]);

  const featured = orderedServices[featuredIndex];
  const popular = filtered.slice(0, 8);

  function showCategory(id: string) {
    setActiveCategory(id);
    window.requestAnimationFrame(() => servicesRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }));
  }

  return (
    <div className="bg-white text-slate-900">
      <section className="relative overflow-hidden border-b border-emerald-100 bg-[radial-gradient(circle_at_70%_25%,#d1fae5_0,transparent_32%),linear-gradient(110deg,#fff_0%,#f8fffc_56%,#059669_56%,#047857_100%)]">
        <div className="absolute right-0 top-0 hidden h-full w-[44%] opacity-25 lg:block" style={{ backgroundImage: "radial-gradient(#fff 1px,transparent 1px)", backgroundSize: "18px 18px" }} />
        <div className="container-wide relative grid min-h-[590px] px-4 pt-9 sm:px-6 lg:grid-cols-[1.02fr_.98fr] lg:px-8 lg:pt-12">
          <div className="relative z-20 flex flex-col justify-center pb-12 lg:pb-20">
            <button type="button" onClick={() => setShowPicker(true)} className="mb-5 flex w-fit items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3.5 py-2 text-xs font-bold text-emerald-800 transition hover:bg-emerald-100">
              <MapPin className="h-4 w-4" />
              <span className="max-w-52 truncate">{location.shortLabel || location.label || "Rawalpindi & Islamabad"}</span>
              <ChevronDown className="h-3.5 w-3.5" />
            </button>

            <h1 className="max-w-xl text-4xl font-black leading-[1.06] tracking-tight text-slate-950 sm:text-5xl xl:text-6xl">
              Expert home services,
              <span className="mt-2 block text-emerald-600">at your doorstep</span>
            </h1>
            <p className="mt-5 max-w-lg text-base leading-7 text-slate-600 sm:text-lg">
              Book skilled electricians, plumbers, AC technicians and more services across Rawalpindi and Islamabad.
            </p>

            <div className="relative mt-7 max-w-xl">
              <div className="flex h-14 items-center rounded-xl border border-slate-200 bg-white p-1.5 pl-4 shadow-xl shadow-slate-900/10 focus-within:border-emerald-400 focus-within:ring-4 focus-within:ring-emerald-100">
                <Search className="mr-3 h-5 w-5 shrink-0 text-slate-400" />
                <input
                  value={query}
                  onChange={(event) => { setQuery(event.target.value); setActiveCategory("all"); }}
                  onKeyDown={(event) => { if (event.key === "Enter") servicesRef.current?.scrollIntoView({ behavior: "smooth" }); }}
                  className="h-full min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-slate-400"
                  placeholder="Search services (e.g. AC service, wiring...)"
                  aria-label="Search services"
                />
                <button type="button" onClick={() => servicesRef.current?.scrollIntoView({ behavior: "smooth" })} className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-emerald-600 text-white transition hover:bg-emerald-700" aria-label="View search results">
                  <Search className="h-5 w-5" />
                </button>
              </div>
              <SearchSuggestions query={query} scope="service" services={initialServices} />
            </div>

            <div className="mt-4 flex flex-wrap items-center gap-2 text-xs text-slate-500">
              <span className="font-semibold">Popular:</span>
              {categoryList.slice(0, 5).map((category) => (
                <button key={category.id} type="button" onClick={() => showCategory(category.id)} className="rounded-full border border-slate-200 bg-white px-3 py-1.5 transition hover:border-emerald-300 hover:text-emerald-700">{category.title}</button>
              ))}
            </div>

            <div className="mt-7 grid max-w-xl grid-cols-2 gap-2 sm:grid-cols-4">
              {[
                ["4.9", "Average rating"], ["Easy", "Online booking"], ["Local", "Service coverage"], ["Quick", "Response"],
              ].map(([value, label]) => (
                <div key={label} className="rounded-xl border border-slate-200 bg-white/90 px-3 py-3 shadow-sm">
                  <strong className="block text-sm text-emerald-700">{value}</strong>
                  <span className="text-[10px] font-medium text-slate-500">{label}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="relative z-10 hidden min-h-[560px] lg:block">
            <Image src="/home/technician-hero-branded-v3.png" alt="Ustaad Pro home-service technician" fill priority sizes="50vw" className="z-10 -translate-x-36 object-contain object-bottom xl:-translate-x-44" />
            {featured && <FeaturedCard service={featured} />}
            <div className="absolute bottom-5 right-24 z-30 flex gap-1.5">
              {orderedServices.slice(0, 3).map((service, index) => (
                <button key={service.id} onClick={() => setFeaturedIndex(index)} aria-label={`Show ${service.title}`} className={`h-2 rounded-full transition-all ${index === featuredIndex ? "w-6 bg-white" : "w-2 bg-white/45"}`} />
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="border-b border-slate-100 bg-white py-7">
        <div className="container-wide px-4 sm:px-6 lg:px-8">
          <div className="mb-5 flex items-center justify-between">
            <h2 className="text-lg font-extrabold">Browse by category</h2>
            <button type="button" onClick={() => showCategory("all")} className="flex items-center gap-1 text-sm font-bold text-emerald-700">View all <ArrowRight className="h-4 w-4" /></button>
          </div>
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-5 lg:grid-cols-10">
            {categoryList.slice(0, 9).map((category) => {
              const Icon = CAT_ICONS[category.id] || Wrench;
              return (
                <button key={category.id} type="button" onClick={() => showCategory(category.id)} className={`flex min-h-24 flex-col items-center justify-center gap-2 rounded-xl border px-2 py-3 text-center transition hover:-translate-y-0.5 hover:shadow-md ${activeCategory === category.id ? "border-emerald-400 bg-emerald-50 text-emerald-700" : "border-slate-200 bg-white text-slate-700"}`}>
                  <Icon className="h-6 w-6 text-emerald-600" />
                  <span className="text-[11px] font-bold leading-tight capitalize">{category.title}</span>
                </button>
              );
            })}
            <button type="button" onClick={() => showCategory("all")} className="flex min-h-24 flex-col items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-2 py-3 transition hover:shadow-md">
              <Layers3 className="h-6 w-6 text-emerald-600" /><span className="text-[11px] font-bold">More</span>
            </button>
          </div>
        </div>
      </section>

      <section ref={servicesRef} id="popular-services" className="scroll-mt-28 bg-slate-50/70 py-12">
        <div className="container-wide px-4 sm:px-6 lg:px-8">
          <div className="mb-7 flex items-end justify-between gap-4">
            <div><h2 className="text-2xl font-black">{query ? "Search results" : "Popular services"}</h2><p className="mt-1 text-sm text-slate-500">{searching ? "Searching services…" : `${filtered.length} service${filtered.length === 1 ? "" : "s"} available`}</p></div>
            <Link href="/services" className="hidden items-center gap-1 text-sm font-bold text-emerald-700 sm:flex">View all services <ArrowRight className="h-4 w-4" /></Link>
          </div>
          {popular.length ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{popular.map((service) => <ServiceCard key={service.id} service={service} />)}</div>
          ) : (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-white py-16 text-center">
              <h3 className="font-bold">No services found</h3><p className="mt-1 text-sm text-slate-500">Try another search or category.</p>
              <button onClick={() => { setQuery(""); setActiveCategory("all"); }} className="mt-5 rounded-lg bg-emerald-600 px-5 py-2.5 text-sm font-bold text-white">Show all services</button>
            </div>
          )}
        </div>
      </section>

      <section className="bg-white pb-12">
        <div className="container-wide px-4 sm:px-6 lg:px-8">
          <div className="grid overflow-hidden rounded-2xl border border-emerald-100 bg-emerald-50/70 sm:grid-cols-2 lg:grid-cols-4">
            {trustItems.map(({ icon: Icon, title, text }) => <div key={title} className="flex items-center gap-3 border-b border-emerald-100 p-5 last:border-0 sm:border-r lg:border-b-0"><Icon className="h-7 w-7 shrink-0 text-emerald-600" /><div><strong className="block text-sm">{title}</strong><span className="text-xs text-slate-500">{text}</span></div></div>)}
          </div>
        </div>
      </section>

      <section id="how-it-works" className="scroll-mt-24 bg-white py-12">
        <div className="container-wide px-4 text-center sm:px-6 lg:px-8">
          <h2 className="text-2xl font-black">How it works</h2><p className="mt-1 text-sm text-slate-500">Book in three simple steps</p>
          <div className="mx-auto mt-8 grid max-w-5xl gap-4 md:grid-cols-3">
            {[
              [CalendarCheck, "1", "Choose a service", "Select what you need from our service list."],
              [UserCheck, "2", "Pick date & time", "Choose your preferred appointment details."],
              [CheckCircle2, "3", "We’ll handle it", "A professional arrives and completes the work."],
            ].map(([Icon, number, title, text]) => {
              const StepIcon = Icon as LucideIcon;
              return <div key={String(number)} className="relative flex items-center gap-4 rounded-xl border border-slate-200 bg-white p-5 text-left shadow-sm"><span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-lg font-black text-white">{String(number)}</span><div><h3 className="font-bold">{String(title)}</h3><p className="mt-1 text-xs leading-5 text-slate-500">{String(text)}</p></div><StepIcon className="absolute right-4 top-4 h-4 w-4 text-emerald-200" /></div>;
            })}
          </div>
        </div>
      </section>

      <section className="bg-slate-50 py-14">
        <div className="container-wide px-4 sm:px-6 lg:px-8">
          <div className="text-center"><h2 className="text-2xl font-black">What our customers say</h2><p className="mt-1 text-sm text-slate-500">Experiences shared by Ustaad Pro customers</p></div>
          {reviews.length > 0 ? <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {reviews.map((review) => {
              const name = review.userName || review.user_name || review.customerName || review.user?.name || "Ustaad Pro customer";
              return <article key={review.id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><div className="flex gap-0.5">{Array.from({ length: 5 }).map((_, index) => <Star key={index} className={`h-4 w-4 ${index < Math.round(Number(review.rating)) ? "fill-amber-400 text-amber-400" : "text-slate-200"}`} />)}</div><p className="mt-4 line-clamp-5 text-sm leading-6 text-slate-600">“{review.comment}”</p><div className="mt-5 flex items-center gap-3"><span className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-100 text-sm font-black text-emerald-700">{name[0]}</span><div><strong className="block text-xs">{name}</strong><span className="text-[11px] text-slate-400">{review.serviceTitle || "Verified booking"}</span></div></div></article>;
            })}
          </div> : <div className="mx-auto mt-8 max-w-2xl rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-10 text-center"><Star className="mx-auto h-8 w-8 text-amber-400" /><h3 className="mt-3 font-bold text-slate-800">Customer reviews will appear here</h3><p className="mt-1 text-sm text-slate-500">The latest highly rated, published reviews are loaded directly from completed bookings.</p></div>}
        </div>
      </section>

      <section className="overflow-hidden bg-white py-12 md:py-16">
        <div className="container-wide px-4 sm:px-6 lg:px-8">
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-950 via-emerald-800 to-emerald-600 text-white">
            <div className="absolute inset-0 opacity-15" style={{ backgroundImage: "radial-gradient(#fff 1px,transparent 1px)", backgroundSize: "20px 20px" }} />
            <div className="relative grid min-h-[410px] items-center md:grid-cols-[.9fr_1.1fr]">
              <div className="relative hidden h-full min-h-[410px] md:block">
                <Image src="/home/app-spokesperson-branded-v2.png" alt="Ustaad Pro app customer holding a smartphone displaying the Ustaad Pro logo" fill sizes="45vw" className="object-contain object-bottom" />
              </div>
              <div className="relative px-6 py-12 sm:px-10 md:px-8 lg:px-14">
                <span className="inline-flex rounded-full border border-lime-300/25 bg-lime-300/10 px-3 py-1.5 text-xs font-bold uppercase tracking-[0.18em] text-lime-300">Ustaad Pro mobile app</span>
                <h2 className="mt-5 max-w-xl text-3xl font-black tracking-tight sm:text-4xl lg:text-5xl">Your home services, right in your pocket.</h2>
                <p className="mt-4 max-w-lg leading-7 text-emerald-50/80">Discover services, make bookings, follow updates, and manage your Ustaad Pro experience from your phone.</p>
                <div className="mt-7"><AppStoreButtons /></div>
                <div className="relative mx-auto mt-8 h-64 w-full max-w-xs md:hidden">
                  <Image src="/home/app-spokesperson-branded-v2.png" alt="Ustaad Pro app customer holding a smartphone displaying the Ustaad Pro logo" fill sizes="320px" className="object-contain object-bottom" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-white py-12">
        <div className="container-wide px-4 sm:px-6 lg:px-8">
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-emerald-600 to-emerald-800 px-6 py-9 text-white md:flex md:items-center md:justify-between md:px-12">
            <div className="absolute -left-16 -top-20 h-48 w-48 rounded-full bg-lime-300/20 blur-2xl" />
            <div className="relative"><h2 className="text-2xl font-black md:text-3xl">Need a professional at your doorstep?</h2><p className="mt-2 text-sm text-emerald-50/80">Browse available services and book the help you need.</p></div>
            <Link href="/services" className="relative mt-6 inline-flex items-center gap-2 rounded-xl bg-white px-6 py-3 font-bold text-emerald-700 transition hover:bg-emerald-50 md:mt-0">Book now <ArrowRight className="h-4 w-4" /></Link>
          </div>
        </div>
      </section>
    </div>
  );
}

function FeaturedCard({ service }: { service: ApiService }) {
  return (
    <div className="absolute right-0 top-24 z-20 w-72 overflow-hidden rounded-2xl border border-white/70 bg-white/95 shadow-2xl backdrop-blur xl:w-80">
      {imgSrc(service.image_url || service.imageUrl) && <div className="relative h-28"><Image src={imgSrc(service.image_url || service.imageUrl)!} alt="" fill unoptimized className="object-cover" sizes="320px" /></div>}
      <div className="p-5"><span className="rounded-full bg-emerald-100 px-2.5 py-1 text-[10px] font-bold text-emerald-700">Featured service</span><h2 className="mt-3 line-clamp-1 text-lg font-black">{service.title}</h2><p className="mt-1 line-clamp-2 text-xs leading-5 text-slate-500">{service.description}</p><div className="mt-4 flex items-end justify-between"><div><span className="block text-[10px] text-slate-400">Starting from</span><strong className="text-xl">Rs {service.price.toLocaleString()}</strong></div><Link href={`/services/${service.id}`} className="flex items-center gap-1 rounded-lg bg-emerald-600 px-3 py-2 text-xs font-bold text-white">Book now <ArrowRight className="h-3.5 w-3.5" /></Link></div><div className="mt-4 flex items-center gap-3 border-t border-slate-100 pt-3 text-[11px] text-slate-500"><span className="flex items-center gap-1"><Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" /> {service.rating || "New"}</span>{service.duration && <span className="flex items-center gap-1"><Clock3 className="h-3.5 w-3.5 text-emerald-600" /> {service.duration}</span>}</div></div>
    </div>
  );
}

function ServiceCard({ service }: { service: ApiService }) {
  const source = imgSrc(service.image_url || service.imageUrl);
  const original = Number(service.original_price || service.originalPrice || 0);
  const discount = original > service.price ? Math.round(((original - service.price) / original) * 100) : 0;
  return (
    <article className="group flex h-full flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-xl">
      <Link href={`/services/${service.id}`} className="relative block h-44 overflow-hidden bg-slate-100">
        {source ? <Image src={source} alt={service.title} fill unoptimized className="object-cover transition duration-500 group-hover:scale-105" sizes="(max-width:640px) 100vw,(max-width:1024px) 50vw,25vw" /> : <div className="flex h-full items-center justify-center"><Wrench className="h-10 w-10 text-slate-300" /></div>}
        <div className="absolute left-3 top-3 flex gap-2">{service.badge && <span className="rounded-full bg-emerald-600 px-2.5 py-1 text-[10px] font-bold text-white">{service.badge}</span>}{discount > 0 && <span className="rounded-full bg-rose-500 px-2.5 py-1 text-[10px] font-bold text-white">{discount}% OFF</span>}</div>
        {service.rating > 0 && <span className="absolute bottom-3 right-3 flex items-center gap-1 rounded-full bg-white/95 px-2 py-1 text-[10px] font-bold"><Star className="h-3 w-3 fill-amber-400 text-amber-400" /> {service.rating} ({service.reviews})</span>}
      </Link>
      <div className="flex flex-1 flex-col p-4"><Link href={`/services/${service.id}`}><h3 className="line-clamp-1 font-extrabold group-hover:text-emerald-700">{service.title}</h3></Link><p className="mt-1 line-clamp-2 min-h-10 text-xs leading-5 text-slate-500">{service.description}</p><div className="mt-3 flex items-center gap-3 text-[10px] font-medium text-slate-500"><span className="flex items-center gap-1 text-emerald-700"><BadgeCheck className="h-3.5 w-3.5" /> Professional</span>{service.duration && <span className="flex items-center gap-1"><Clock3 className="h-3.5 w-3.5 text-emerald-600" /> {service.duration}</span>}</div><div className="mt-4 flex items-end justify-between border-t border-slate-100 pt-3"><div><span className="block text-[9px] text-slate-400">Starting from</span><strong>Rs {service.price.toLocaleString()}</strong>{discount > 0 && <span className="ml-1 text-[10px] text-slate-400 line-through">Rs {original.toLocaleString()}</span>}</div><Link href={`/services/${service.id}`} className="flex items-center gap-1 rounded-lg bg-emerald-600 px-3 py-2 text-[11px] font-bold text-white transition hover:bg-emerald-700">Book now <ArrowRight className="h-3.5 w-3.5" /></Link></div></div>
    </article>
  );
}
