import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  BadgeCheck,
  Boxes,
  CalendarCheck,
  Headphones,
  MapPin,
  PackageCheck,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  Wrench,
} from "lucide-react";
import { productCategories } from "@/data/products";
import { services } from "@/data/services";
import { siteConfig } from "@/lib/constants";

export const metadata: Metadata = {
  title: "About Us | Ustaad Pro",
  description:
    "Learn how Ustaad Pro connects customers in Pakistan with home-service professionals and home-improvement products.",
};

const highlights = [
  {
    icon: CalendarCheck,
    title: "Simple online booking",
    description: "Choose a service, share the job details, and request a convenient appointment from one platform.",
  },
  {
    icon: ShoppingBag,
    title: "Products for every project",
    description: "Browse practical tools, equipment, fittings, safety gear, and home-improvement essentials.",
  },
  {
    icon: Headphones,
    title: "Support when you need it",
    description: "Our team helps with bookings, orders, delivery updates, returns, and service concerns.",
  },
];

const principles = [
  { icon: BadgeCheck, title: "Dependable help", text: "Professionals selected for the skills needed to complete everyday household and property work." },
  { icon: ShieldCheck, title: "Clear expectations", text: "Visible pricing models, confirmed scopes, and policies that explain delivery, service, and refund processes." },
  { icon: PackageCheck, title: "Useful products", text: "A focused catalogue for repair, maintenance, safety, energy, security, and home upgrades." },
  { icon: Sparkles, title: "Better experiences", text: "A straightforward digital journey from discovery and booking to completion and after-sales support." },
];

export default function AboutPage() {
  return (
    <main className="overflow-hidden bg-white">
      <section className="relative border-b border-emerald-100 bg-gradient-to-br from-emerald-950 via-emerald-900 to-slate-950 text-white">
        <div className="absolute -right-24 -top-24 h-80 w-80 rounded-full bg-lime-400/10 blur-3xl" />
        <div className="absolute -bottom-28 left-1/4 h-72 w-72 rounded-full bg-emerald-400/10 blur-3xl" />
        <div className="container-wide relative px-4 py-20 md:px-6 md:py-28 lg:px-8">
          <div className="max-w-3xl">
            <span className="inline-flex rounded-full border border-lime-300/25 bg-lime-300/10 px-4 py-2 text-sm font-semibold text-lime-300">
              Built for homes and businesses in Pakistan
            </span>
            <h1 className="mt-6 text-4xl font-extrabold tracking-tight sm:text-5xl md:text-6xl">
              Professional services and the right products, all in one place.
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-emerald-50/80">
              Ustaad Pro is a home-services and home-improvement platform that helps customers find skilled support, book work, and shop for products needed to maintain, repair, protect, and improve their spaces.
            </p>
            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <Link href="/services" className="inline-flex items-center justify-center gap-2 rounded-xl bg-lime-400 px-6 py-3.5 font-bold text-emerald-950 transition hover:bg-lime-300">
                Explore services <ArrowRight className="h-4 w-4" />
              </Link>
              <Link href="/store" className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/20 bg-white/10 px-6 py-3.5 font-bold text-white transition hover:bg-white/15">
                Visit the store <ShoppingBag className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="container-wide px-4 py-16 md:px-6 md:py-24 lg:px-8">
        <div className="grid gap-12 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.2em] text-emerald-600">Who we are</p>
            <h2 className="mt-3 text-3xl font-extrabold tracking-tight text-slate-950 md:text-4xl">
              Making property care easier to arrange
            </h2>
            <div className="mt-6 space-y-4 text-base leading-8 text-slate-600">
              <p>
                Finding a capable professional, explaining the work, sourcing materials, and following up can take more time than the repair itself. Ustaad Pro brings those steps into a single, convenient experience.
              </p>
              <p>
                Customers can discover services, review available options, place a booking, purchase relevant products, and contact support from the same platform. We serve homeowners, tenants, landlords, offices, shops, and other customers seeking practical property support.
              </p>
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            {highlights.map(({ icon: Icon, title, description }) => (
              <article key={title} className="rounded-2xl border border-slate-200 bg-slate-50 p-6">
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700">
                  <Icon className="h-5 w-5" />
                </span>
                <h3 className="mt-5 font-bold text-slate-950">{title}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-600">{description}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-slate-50 py-16 md:py-24">
        <div className="container-wide px-4 md:px-6 lg:px-8">
          <div className="max-w-3xl">
            <p className="text-sm font-bold uppercase tracking-[0.2em] text-emerald-600">What we do</p>
            <h2 className="mt-3 text-3xl font-extrabold tracking-tight text-slate-950 md:text-4xl">Services for maintenance, repairs, and upgrades</h2>
            <p className="mt-4 leading-7 text-slate-600">Our service catalogue covers routine jobs, urgent repairs, planned improvements, installations, and specialist property work.</p>
          </div>
          <div className="mt-10 grid gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {services.map((service) => (
              <Link key={service.id} href="/services" className="group flex items-start gap-3 rounded-xl border border-slate-200 bg-white p-4 transition hover:-translate-y-0.5 hover:border-emerald-300 hover:shadow-md">
                <span className="mt-0.5 rounded-lg bg-emerald-50 p-2 text-emerald-700"><Wrench className="h-4 w-4" /></span>
                <span>
                  <strong className="block text-sm text-slate-900 group-hover:text-emerald-700">{service.title}</strong>
                  <span className="mt-1 line-clamp-2 block text-xs leading-5 text-slate-500">{service.description}</span>
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="container-wide px-4 py-16 md:px-6 md:py-24 lg:px-8">
        <div className="grid gap-10 lg:grid-cols-[0.72fr_1.28fr] lg:items-start">
          <div className="rounded-3xl bg-emerald-700 p-8 text-white md:p-10">
            <Boxes className="h-10 w-10 text-lime-300" />
            <h2 className="mt-6 text-3xl font-extrabold tracking-tight">What we sell</h2>
            <p className="mt-4 leading-7 text-emerald-50/85">
              Our store brings together products for repairs, installations, everyday maintenance, professional work, and modern home upgrades.
            </p>
            <Link href="/store" className="mt-7 inline-flex items-center gap-2 font-bold text-lime-300 hover:text-lime-200">
              Browse all products <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {productCategories.map((category) => (
              <article key={category.slug} className="rounded-2xl border border-slate-200 p-5">
                <h3 className="font-bold text-slate-950">{category.name}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-600">{category.description}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="border-y border-slate-200 bg-slate-950 py-16 text-white md:py-20">
        <div className="container-wide px-4 md:px-6 lg:px-8">
          <div className="text-center">
            <p className="text-sm font-bold uppercase tracking-[0.2em] text-lime-400">What guides us</p>
            <h2 className="mt-3 text-3xl font-extrabold tracking-tight md:text-4xl">Practical, transparent, customer-focused</h2>
          </div>
          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {principles.map(({ icon: Icon, title, text }) => (
              <article key={title} className="rounded-2xl border border-white/10 bg-white/5 p-6">
                <Icon className="h-6 w-6 text-lime-400" />
                <h3 className="mt-4 font-bold">{title}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-400">{text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="container-wide px-4 py-16 md:px-6 md:py-24 lg:px-8">
        <div className="rounded-3xl border border-emerald-100 bg-emerald-50 p-7 md:flex md:items-center md:justify-between md:gap-10 md:p-10">
          <div className="max-w-2xl">
            <p className="text-sm font-bold uppercase tracking-[0.2em] text-emerald-700">Our office</p>
            <h2 className="mt-3 text-2xl font-extrabold text-slate-950">Come and find us in Islamabad</h2>
            <p className="mt-3 leading-7 text-slate-600">{siteConfig.address}</p>
          </div>
          <a href={siteConfig.mapsUrl} target="_blank" rel="noopener noreferrer" className="mt-6 inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-emerald-700 px-6 py-3.5 font-bold text-white transition hover:bg-emerald-800 md:mt-0">
            <MapPin className="h-5 w-5" /> View on Google Maps
          </a>
        </div>
      </section>
    </main>
  );
}
