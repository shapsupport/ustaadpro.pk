"use client";

import Link from "next/link";
import { ArrowLeft, PackageCheck } from "lucide-react";

interface CheckoutHeaderProps {
  serviceTitle: string;
  stepLabel?: string;
}

export function CheckoutHeader({ serviceTitle, stepLabel }: CheckoutHeaderProps) {
  return (
    <div className="border-b border-slate-100 bg-white/80 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
        {/* Back */}
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-600 shadow-sm transition-colors hover:border-slate-300 hover:text-slate-900"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back
        </Link>

        {/* Center */}
        <div className="flex items-center gap-2 text-center">
          <PackageCheck className="h-4 w-4 text-emerald-600" />
          <p className="text-sm font-bold text-slate-800 line-clamp-1 max-w-[200px] sm:max-w-xs">
            {serviceTitle}
          </p>
        </div>

        {/* Step label */}
        <span className="hidden rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700 sm:inline-block">
          {stepLabel ?? "Checkout"}
        </span>
      </div>
    </div>
  );
}
