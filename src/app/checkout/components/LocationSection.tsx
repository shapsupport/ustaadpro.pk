"use client";

import { MapPin, Navigation, AlertCircle, CheckCircle2 } from "lucide-react";
import { useLocation } from "@/context/LocationContext";
import { Input } from "@/components/ui/input";
import type { ChangeEvent } from "react";

interface LocationSectionProps {
  houseNumber: string;
  landmark: string;
  onHouseNumberChange: (e: ChangeEvent<HTMLInputElement>) => void;
  onLandmarkChange: (e: ChangeEvent<HTMLInputElement>) => void;
}

export function LocationSection({
  houseNumber,
  landmark,
  onHouseNumberChange,
  onLandmarkChange,
}: LocationSectionProps) {
  const { location, setShowPicker, detectLocation, geoError } = useLocation();

  const hasLocation =
    location.status === "serviceable" ||
    location.status === "not-serviceable" ||
    Boolean(location.label);

  const selectedLabel =
    location.shortLabel || location.label || "No location selected";

  return (
    <fieldset className="space-y-4">
      <legend className="text-sm font-bold text-slate-800">Delivery address</legend>

      {/* Selected area */}
      {hasLocation ? (
        <div className="flex items-start gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-3.5">
          <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-emerald-100">
            <MapPin className="h-4 w-4 text-emerald-700" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-emerald-900">{selectedLabel}</p>
            <p className="mt-0.5 text-xs text-emerald-600">Service area confirmed</p>
          </div>
          <button
            type="button"
            onClick={() => setShowPicker(true)}
            className="shrink-0 rounded-xl bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-600 shadow-sm ring-1 ring-slate-200 transition hover:ring-slate-300"
          >
            Change
          </button>
        </div>
      ) : (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-3.5">
          <div className="flex items-start gap-2.5">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
            <div className="flex-1">
              <p className="text-sm font-semibold text-amber-800">
                Select your service area
              </p>
              <p className="mt-0.5 text-xs text-amber-700">
                We need your area so the technician can reach you.
              </p>
            </div>
          </div>
          <div className="mt-3 flex gap-2">
            <button
              type="button"
              onClick={() => setShowPicker(true)}
              className="flex-1 rounded-xl bg-white px-3 py-2 text-xs font-bold text-amber-800 shadow-sm ring-1 ring-amber-200 transition hover:bg-amber-50"
            >
              Choose area
            </button>
            <button
              type="button"
              onClick={() => detectLocation()}
              className="flex items-center gap-1.5 rounded-xl bg-amber-800 px-3 py-2 text-xs font-bold text-white transition hover:bg-amber-900"
            >
              <Navigation className="h-3.5 w-3.5" />
              Use GPS
            </button>
          </div>
          {geoError ? (
            <p className="mt-2 text-xs text-amber-700">{geoError}</p>
          ) : null}
        </div>
      )}

      {/* House number */}
      <div>
        <label
          htmlFor="houseNumber"
          className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-500"
        >
          House / Apartment number <span className="text-red-500">*</span>
        </label>
        <Input
          id="houseNumber"
          name="houseNumber"
          value={houseNumber}
          onChange={onHouseNumberChange}
          placeholder="House 12, Flat 3, Gate A…"
          className="rounded-2xl border-slate-200 bg-slate-50 py-5 text-sm focus-visible:ring-primary"
        />
      </div>

      {/* Landmark */}
      <div>
        <label
          htmlFor="landmark"
          className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-500"
        >
          Landmark / Directions{" "}
          <span className="font-normal normal-case tracking-normal text-slate-400">
            (optional)
          </span>
        </label>
        <Input
          id="landmark"
          name="landmark"
          value={landmark}
          onChange={onLandmarkChange}
          placeholder="Near city hospital, blue gate…"
          className="rounded-2xl border-slate-200 bg-slate-50 py-5 text-sm focus-visible:ring-primary"
        />
      </div>

      {/* GPS detect */}
      {hasLocation && (
        <button
          type="button"
          onClick={() => detectLocation()}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-600 hover:text-emerald-700"
        >
          <Navigation className="h-3.5 w-3.5" />
          Re-detect my GPS location
        </button>
      )}
    </fieldset>
  );
}
