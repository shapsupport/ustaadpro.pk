"use client";

import React, { useState } from "react";
import { X, MapPin, Check, Loader2, Navigation } from "lucide-react";
import dynamic from "next/dynamic";
import { isInServiceArea, reverseGeocode as reverseGeocodeLocation } from "@/lib/location";

// Dynamically import Leaflet map components with ssr: false
const LeafletMapComponent = dynamic(
  () => import("./LeafletMapCore"),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-[350px] w-full items-center justify-center bg-slate-100 rounded-2xl">
        <div className="flex flex-col items-center gap-2 text-slate-500">
          <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
          <span className="text-xs font-semibold">Loading Map...</span>
        </div>
      </div>
    ),
  }
);

interface MapAddressPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectAddress: (address: string, lat?: number, lng?: number) => void;
  initialAddress?: string;
  initialLat?: number;
  initialLng?: number;
}

// Default center: Twin Cities midpoint
const DEFAULT_LAT = 33.60;
const DEFAULT_LNG = 73.05;

export default function MapAddressPickerModal({
  isOpen,
  onClose,
  onSelectAddress,
  initialAddress = "",
  initialLat,
  initialLng,
}: MapAddressPickerModalProps) {
  const [position, setPosition] = useState<{ lat: number; lng: number }>({
    lat: initialLat ?? DEFAULT_LAT,
    lng: initialLng ?? DEFAULT_LNG,
  });
  const [formattedAddress, setFormattedAddress] = useState(initialAddress);
  const [isGeocoding, setIsGeocoding] = useState(false);
  const [outOfBoundsError, setOutOfBoundsError] = useState(false);

  // Convert coordinates into a concise area/city label. Coordinates remain
  // available to the order payload but are never shown as the user's address.
  const reverseGeocode = async (lat: number, lng: number) => {
    setIsGeocoding(true);
    try {
      const result = await reverseGeocodeLocation({ lat, lng });
      setFormattedAddress(
        result.label && result.label !== "Unknown Location"
          ? result.label
          : "Selected location, Rawalpindi / Islamabad",
      );
    } catch {
      setFormattedAddress("Selected location, Rawalpindi / Islamabad");
    } finally {
      setIsGeocoding(false);
    }
  };

  // Get current device location
  const handleUseMyLocation = () => {
    if (navigator.geolocation) {
      setIsGeocoding(true);
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const newLat = pos.coords.latitude;
          const newLng = pos.coords.longitude;
          setPosition({ lat: newLat, lng: newLng });
          reverseGeocode(newLat, newLng);
        },
        () => {
          setIsGeocoding(false);
        }
      );
    }
  };

  const handlePositionChange = (lat: number, lng: number) => {
    setPosition({ lat, lng });
    setOutOfBoundsError(false); // clear error when user moves pin
    reverseGeocode(lat, lng);
  };

  const handleConfirm = () => {
    if (!isInServiceArea(position)) {
      setOutOfBoundsError(true);
      return;
    }
    const finalAddr =
      formattedAddress ||
      "Selected location, Rawalpindi / Islamabad";
    onSelectAddress(finalAddr, position.lat, position.lng);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-900/60 p-3 sm:p-4 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="flex max-h-[calc(100dvh-1rem)] w-full max-w-3xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl transition-all sm:rounded-3xl">
        {/* Header */}
        <div className="shrink-0 flex items-center justify-between border-b border-slate-100 px-4 sm:px-6 py-3">
          <div className="flex items-center gap-2">
            <MapPin className="h-5 w-5 text-emerald-600 shrink-0" />
            <h3 className="text-base sm:text-lg font-bold text-slate-900 truncate">
              Pick Delivery Location from Map
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition cursor-pointer shrink-0"
            aria-label="Close modal"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 space-y-2.5 p-3 sm:p-4">
          {/* Controls Bar */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2">
            <button
              type="button"
              onClick={handleUseMyLocation}
              className="flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-100 transition cursor-pointer"
            >
              <Navigation className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
              Use My Current Location
            </button>
            <span className="text-[11px] text-slate-400 text-center sm:text-right">
              Click anywhere on map or drag pin to set location
            </span>
          </div>

          <div className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2.5 text-xs leading-relaxed text-amber-800">
            <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            <span>We currently operate in <strong>Rawalpindi and Islamabad only</strong>. You may also select locations along the borders of these cities.</span>
          </div>

          {/* Out-of-bounds error */}
          {outOfBoundsError && (
            <div className="flex items-start gap-2 rounded-2xl border border-red-200 bg-red-50 p-3 text-xs text-red-700">
              <span className="text-base leading-none shrink-0">📍</span>
              <span className="font-semibold">
                This location is outside our service area. We currently only serve <strong>Rawalpindi &amp; Islamabad</strong>. Please move the pin.
              </span>
            </div>
          )}

          {/* Map Area */}
          <div className="relative h-[min(42dvh,360px)] min-h-[190px] w-full overflow-hidden rounded-xl border border-slate-200 shadow-inner">
            <LeafletMapComponent
              position={position}
              onPositionChange={handlePositionChange}
            />
          </div>

          {/* Selected Address Display */}
          <div className="rounded-2xl bg-emerald-50/60 border border-emerald-100 p-2.5 sm:p-3">
            <p className="text-[10px] uppercase font-bold tracking-wider text-emerald-700">
              Selected Address
            </p>
            <p className="text-xs font-semibold text-slate-800 mt-0.5 flex items-center gap-1.5 truncate">
              {isGeocoding ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin text-emerald-600 shrink-0" />
                  <span>Fetching address details...</span>
                </>
              ) : (
                <span className="truncate">{formattedAddress || "Click on the map to choose a location"}</span>
              )}
            </p>
          </div>
        </div>

        {/* Footer Buttons */}
        <div className="shrink-0 p-4 border-t border-slate-100 bg-white flex items-center gap-3">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 rounded-xl border border-slate-200 py-2.5 sm:py-3 text-xs font-bold text-slate-700 hover:bg-slate-50 transition cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            className="flex-1 flex items-center justify-center gap-1.5 rounded-xl bg-emerald-600 py-2.5 sm:py-3 text-xs font-bold text-white shadow-md shadow-emerald-600/20 hover:bg-emerald-700 transition cursor-pointer"
          >
            <Check className="h-4 w-4" />
            Confirm Location
          </button>
        </div>
      </div>
    </div>
  );
}
