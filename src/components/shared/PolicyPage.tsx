import Link from "next/link";
import type { ReactNode } from "react";

type PolicyPageProps = {
  title: string;
  description: string;
  children: ReactNode;
};

export function PolicyPage({ title, description, children }: PolicyPageProps) {
  return (
    <main className="container-wide py-12 md:py-20">
      <article className="mx-auto max-w-4xl rounded-2xl border border-gray-100 bg-white p-6 shadow-sm md:p-12">
        <header className="border-b border-gray-100 pb-8">
          <p className="mb-3 text-sm font-semibold uppercase tracking-[0.18em] text-lime-600">
            Ustaad Pro Legal
          </p>
          <h1 className="text-3xl font-extrabold tracking-tight text-gray-900 md:text-4xl">
            {title}
          </h1>
          <p className="mt-4 max-w-3xl leading-7 text-gray-600">{description}</p>
          <p className="mt-3 text-sm text-gray-500">Last updated: 22 July 2026</p>
        </header>

        <div className="policy-content mt-10 space-y-9 text-gray-600 leading-7">{children}</div>

        <footer className="mt-12 border-t border-gray-100 pt-8 text-sm text-gray-500">
          See also our{" "}
          <Link href="/privacy-policy" className="font-medium text-lime-700 hover:underline">
            Privacy Policy
          </Link>
          ,{" "}
          <Link href="/return-refund-policy" className="font-medium text-lime-700 hover:underline">
            Return &amp; Refund Policy
          </Link>{" "}
          and{" "}
          <Link href="/shipping-service-policy" className="font-medium text-lime-700 hover:underline">
            Shipping &amp; Service Policy
          </Link>
          .
        </footer>
      </article>
    </main>
  );
}

export function PolicySection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section>
      <h2 className="mb-3 text-xl font-bold text-gray-900">{title}</h2>
      <div className="space-y-3">{children}</div>
    </section>
  );
}

export function PolicyList({ children }: { children: ReactNode }) {
  return <ul className="ml-5 list-disc space-y-2">{children}</ul>;
}

export function PolicyContact() {
  return (
    <address className="not-italic">
      <strong className="text-gray-900">Ustaad Pro</strong>
      <br />
      Sharplogicians Agile Center, Building # 153-M, Office # 32, 4th Floor,
      D-Block Civic Center, Phase 4, Bahria Town, Islamabad 46220, Pakistan
      <br />
      Email:{" "}
      <a href="mailto:ustaadpro.official26@gmail.com" className="font-medium text-lime-700 hover:underline">
        ustaadpro.official26@gmail.com
      </a>
      <br />
      Phone: <a href="tel:+923719201273" className="font-medium text-lime-700 hover:underline">+92 371 9201273</a>
      <br />
      <a
        href="https://maps.app.goo.gl/N7Hn1o8pupSz3iQ69"
        target="_blank"
        rel="noopener noreferrer"
        className="font-medium text-lime-700 hover:underline"
      >
        View office on Google Maps
      </a>
    </address>
  );
}
