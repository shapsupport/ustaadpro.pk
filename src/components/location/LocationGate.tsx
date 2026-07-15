"use client";

import { MapPin, Bell, Clock, ArrowRight } from "lucide-react";
import { useLocation } from "@/context/LocationContext";
import { NewsletterForm } from "@/components/shared/NewsletterForm";

export function LocationGate({ children }: { children: React.ReactNode }) {
  const { location, setShowPicker } = useLocation();

  // While idle or loading, just show children (modal will appear on top)
  if (location.status === "idle" || location.status === "loading") {
    return <>{children}</>;
  }

  // User is outside serviceable area → show coming soon page
  if (location.status === "not-serviceable") {
    return <ComingSoonCity city={location.city || "Your City"} onChangeLocation={() => setShowPicker(true)} />;
  }

  // Serviceable
  return <>{children}</>;
}

function ComingSoonCity({ city, onChangeLocation }: { city: string; onChangeLocation: () => void }) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-slate-50 to-emerald-50 px-4 text-center py-20">
      {/* Pulsing map pin */}
      <div className="relative mb-8">
        <div className="absolute inset-0 rounded-full bg-primary/20 animate-ping" />
        <div className="relative h-20 w-20 rounded-full bg-white border-4 border-primary/30 flex items-center justify-center shadow-xl">
          <MapPin className="h-9 w-9 text-primary" />
        </div>
      </div>

      <div className="inline-flex items-center gap-2 bg-primary/10 text-primary text-sm font-semibold px-4 py-1.5 rounded-full mb-6">
        <Clock className="h-4 w-4" />
        Coming Soon
      </div>

      <h1 className="text-4xl sm:text-5xl font-extrabold text-slate-900 mb-3">
        We&apos;re heading to{" "}
        <span className="text-primary">{city}</span>!
      </h1>
      <p className="text-slate-500 text-lg max-w-md mb-10 leading-relaxed">
        Ustaad Pro currently serves Rawalpindi &amp; Islamabad. We&apos;re expanding fast and{" "}
        <strong className="text-slate-700">{city}</strong> is on our radar. Be the first to know when we launch!
      </p>

      {/* Features preview */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-10 max-w-2xl w-full">
        {[
          { icon: "⚡", label: "Electricians" },
          { icon: "🔧", label: "Plumbers" },
          { icon: "❄️", label: "AC Technicians" },
        ].map((f) => (
          <div key={f.label} className="bg-white rounded-2xl border border-slate-100 shadow-sm px-5 py-4 flex items-center gap-3">
            <span className="text-2xl">{f.icon}</span>
            <span className="font-semibold text-slate-700 text-sm">{f.label}</span>
          </div>
        ))}
      </div>

      {/* Notify form */}
      <div className="w-full max-w-sm mb-8">
        <p className="text-slate-500 text-sm mb-3 flex items-center gap-1.5 justify-center">
          <Bell className="h-4 w-4 text-primary" />
          Get notified when we launch in {city}
        </p>
        <NewsletterForm />
      </div>

      <button
        onClick={onChangeLocation}
        className="flex items-center gap-2 text-sm font-semibold text-primary hover:text-emerald-700 transition-colors"
      >
        Change location
        <ArrowRight className="h-4 w-4" />
      </button>
    </div>
  );
}
