import Link from "next/link";
import { ArrowLeft, Home, SearchX } from "lucide-react";

export default function NotFound() {
  return (
    <div className="flex min-h-[70vh] items-center justify-center bg-slate-50 px-4 py-16">
      <div className="max-w-2xl rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-sm sm:p-10">
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-50 text-primary">
          <SearchX className="h-8 w-8" />
        </div>
        <p className="mb-3 text-sm font-semibold uppercase tracking-[0.3em] text-emerald-600">404</p>
        <h1 className="text-3xl font-black text-slate-900 sm:text-4xl">We couldn&apos;t find that page</h1>
        <p className="mx-auto mt-4 max-w-xl text-base leading-7 text-slate-600">
          The page you were looking for may have moved, been removed, or never existed. Let us help you get back to trusted home services quickly.
        </p>
        <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
          <Link href="/" className="inline-flex items-center justify-center gap-2 rounded-2xl bg-primary px-5 py-3 font-semibold text-white transition hover:bg-emerald-700">
            <Home className="h-4 w-4" />
            Go home
          </Link>
          <Link href="/services" className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 px-5 py-3 font-semibold text-slate-700 transition hover:bg-slate-50">
            <ArrowLeft className="h-4 w-4" />
            Browse services
          </Link>
        </div>
      </div>
    </div>
  );
}
