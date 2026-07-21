"use client";

import Link from "next/link";
import Image from "next/image";
import { footerLinks, socialLinks, siteConfig } from "@/lib/constants";
import { Separator } from "@/components/ui/separator";
import { NewsletterForm } from "@/components/shared/NewsletterForm";
import { ArrowRight, Mail, MapPin, Phone } from "lucide-react";

const Facebook = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/></svg>
);
const Instagram = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><rect width="20" height="20" x="2" y="2" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" x2="17.51" y1="6.5" y2="6.5"/></svg>
);
const Twitter = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z"/></svg>
);
const Youtube = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M2.5 7.1C2.1 8.4 2 10.5 2 12s.1 3.6.5 4.9c.4 1.5 2 2.6 4 3 1.9.4 5.5.6 5.5.6s3.6-.2 5.5-.6c2-.4 3.6-1.5 4-3 .4-1.3.5-3.4.5-4.9s-.1-3.6-.5-4.9c-.4-1.5-2-2.6-4-3-1.9-.4-5.5-.6-5.5-.6s-3.6.2-5.5.6c-2 .4-3.6 1.5-4 3z"/><path d="m9.75 15 5.5-3-5.5-3v6z"/></svg>
);
const Linkedin = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"/><rect width="4" height="12" x="2" y="9"/><circle cx="4" cy="4" r="2"/></svg>
);

const socialIconMap: Record<string, React.ElementType> = {
  Facebook,
  Instagram,
  Twitter,
  YouTube: Youtube,
  LinkedIn: Linkedin,
};

export function Footer() {
  return (
    <footer className="bg-slate-950 text-slate-300" role="contentinfo">
      <div className="border-b border-white/10 bg-gradient-to-r from-slate-900 via-slate-950 to-slate-900">
        <div className="container-wide flex flex-col gap-6 px-4 py-10 md:flex-row md:items-center md:justify-between md:px-6 lg:px-8">
          <div>
            <h3 className="text-xl font-bold text-white">Stay updated with home service tips</h3>
            <p className="mt-1 text-sm text-slate-400">Get offers, maintenance guides, and booking reminders in your inbox.</p>
          </div>
          <div className="w-full max-w-md">
            <NewsletterForm variant="inline" />
          </div>
        </div>
      </div>

      <div className="container-wide grid gap-10 px-4 py-14 sm:grid-cols-2 md:px-6 lg:grid-cols-5 lg:gap-8 lg:px-8">
        <div className="lg:col-span-2">
          <Link href="/" aria-label="Ustaad Pro Home" className="inline-flex rounded-2xl bg-white p-2 shadow-lg shadow-black/20">
            <Image
              src="/brand/ustaad-pro-logo.webp"
              alt="Ustaad Pro — Expert Service Every Time"
              width={144}
              height={144}
              className="h-32 w-32 object-contain"
            />
          </Link>
          <p className="mt-4 max-w-xs text-sm leading-7 text-slate-400">
            {siteConfig.tagline}. Book reliable professionals for repairs, maintenance, renovations, and everyday home support in Pakistan.
          </p>

          <div className="mt-6 space-y-3 text-sm">
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 shrink-0 text-lime-400" />
              <span>{siteConfig.address}</span>
            </div>
            <div className="flex items-center gap-2">
              <Mail className="h-4 w-4 shrink-0 text-lime-400" />
              <a href={`mailto:${siteConfig.email}`} className="transition-colors hover:text-lime-400">
                {siteConfig.email}
              </a>
            </div>
            <div className="flex items-center gap-2">
              <Phone className="h-4 w-4 shrink-0 text-lime-400" />
              <span>{siteConfig.phone}</span>
            </div>
          </div>

          <div className="mt-6 flex gap-3">
            {socialLinks.map((social) => {
              const Icon = socialIconMap[social.label];
              return (
                <a
                  key={social.label}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/10 text-slate-300 transition-all hover:bg-lime-500 hover:text-white"
                  aria-label={social.label}
                >
                  {Icon && <Icon className="h-4 w-4" />}
                </a>
              );
            })}
          </div>
        </div>

        <div>
          <h4 className="mb-4 text-sm font-semibold uppercase tracking-[0.22em] text-white">Quick Links</h4>
          <ul className="space-y-2.5">
            {footerLinks.quickLinks.map((link) => (
              <li key={link.href}>
                <Link href={link.href} className="text-sm text-slate-400 transition-colors hover:text-lime-400">
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h4 className="mb-4 text-sm font-semibold uppercase tracking-[0.22em] text-white">Services</h4>
          <ul className="space-y-2.5">
            {footerLinks.services.map((link) => (
              <li key={link.href}>
                <Link href={link.href} className="text-sm text-slate-400 transition-colors hover:text-lime-400">
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h4 className="mb-4 text-sm font-semibold uppercase tracking-[0.22em] text-white">Store</h4>
          <ul className="space-y-2.5">
            {footerLinks.store.map((link) => (
              <li key={link.href}>
                <Link href={link.href} className="text-sm text-slate-400 transition-colors hover:text-lime-400">
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>

          <h4 className="mb-4 mt-8 text-sm font-semibold uppercase tracking-[0.22em] text-white">Legal</h4>
          <ul className="space-y-2.5">
            {footerLinks.legal.map((link) => (
              <li key={link.href}>
                <Link href={link.href} className="text-sm text-slate-400 transition-colors hover:text-lime-400">
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <Separator className="bg-white/10" />
      <div className="container-wide flex flex-col items-center gap-4 px-4 py-6 md:flex-row md:justify-between md:px-6 lg:px-8">
        <p className="text-sm text-slate-500">© {new Date().getFullYear()} Ustaad Pro. All rights reserved.</p>
        <Link href="/services" className="inline-flex items-center gap-2 text-sm font-semibold text-lime-400">
          Explore services
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </footer>
  );
}
