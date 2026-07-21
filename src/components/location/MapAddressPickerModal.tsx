"use client";

import React, { useState, useEffect } from "react";
import { X, MapPin, Check, Loader2, Navigation } from "lucide-react";
import dynamic from "next/dynamic";

// Dynamically import Leaflet map components with ssr: false
const LeafletMapComponent = dynamic(
  () => import("./LeafletMapCore"),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-[350px] w-full items-center justify-center bg-slate-100 rounded-2xl">
        <div className="flex flex-col items-center gap-2 text-slate-500">
          <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
          <span className="text-xs font-semibold">Loading Leaflet Map...</span>
        </div>
      </div>
    ),
  }
);

interface MapAddressPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectAddress: (address: string, lat: number, lng: number) => void;
  initialAddress?: string;
}

// Default center: Islamabad / Rawalpindi (33.6844, 73.0479)
const DEFAULT_LAT = 33.6844;
const DEFAULT_LNG = 73.0479;

export default function MapAddressPickerModal({
  isOpen,
  onClose,
  onSelectAddress,
  initialAddress = "",
}: MapAddressPickerModalProps) {
  const [position, setPosition] = useState<{ lat: number; lng: number }>({
    lat: DEFAULT_LAT,
    lng: DEFAULT_LNG,
  });
  const [formattedAddress, setFormattedAddress] = useState(initialAddress);
  const [isGeocoding, setIsGeocoding] = useState(false);

  // Reverse geocode lat/lng to human address via OpenStreetMap Nominatim API
  const reverseGeocode = async (lat: number, lng: number) => {
    setIsGeocoding(true);
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`
      );
      if (res.ok) {
        const data = await res.json();
        const display = data.display_name || "";
        const parts = display.split(",").slice(0, 4).join(",").trim();
        const addrString = parts
          ? `${parts} (Lat: ${lat.toFixed(4)}, Lng: ${lng.toFixed(4)})`
          : `Point (${lat.toFixed(4)}, ${lng.toFixed(4)})`;
        setFormattedAddress(addrString);
      } else {
        setFormattedAddress(`Location (${lat.toFixed(4)}, ${lng.toFixed(4)})`);
      }
    } catch {
      setFormattedAddress(`Location (${lat.toFixed(4)}, ${lng.toFixed(4)})`);
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
    reverseGeocode(lat, lng);
  };

  const handleConfirm = () => {
    const finalAddr =
      formattedAddress ||
      `Selected Location (Lat: ${position.lat.toFixed(4)}, Lng: ${position.lng.toFixed(4)})`;
    onSelectAddress(finalAddr, position.lat, position.lng);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl overflow-hidden rounded-3xl bg-white shadow-2xl transition-all">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
          <div className="flex items-center gap-2">
            <MapPin className="h-5 w-5 text-emerald-600" />
            <h3 className="text-lg font-bold text-slate-900">Pick Service Location from Map</h3>
          </div>
          <button
            onClick={onClose}
            className="rounded-full p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4">
          {/* Controls Bar */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2">
            <button
              type="button"
              onClick={handleUseMyLocation}
              className="flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-100 transition"
            >
              <Navigation className="h-3.5 w-3.5 text-emerald-600" />
              Use My Current Location
            </button>
            <span className="text-[11px] text-slate-400 text-center sm:text-right">
              Click anywhere on the map or drag the pin to drop location
            </span>
          </div>

          {/* Leaflet Map */}
          <div className="relative overflow-hidden rounded-2xl border border-slate-200 shadow-inner">
            <LeafletMapComponent
              position={position}
              onPositionChange={handlePositionChange}
            />
          </div>

          {/* Selected Address Display */}
          <div className="rounded-2xl bg-emerald-50/60 border border-emerald-100 p-3.5">
            <p className="text-[10px] uppercase font-bold tracking-wider text-emerald-700">
              Selected Address
            </p>
            <p className="text-xs font-semibold text-slate-800 mt-1 flex items-center gap-1.5">
              {isGeocoding ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin text-emerald-600 shrink-0" />
                  <span>Fetching address details...</span>
                </>
              ) : (
                <span>{formattedAddress || "Click on the map to choose a location"}</span>
              )}
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 border-t border-slate-100 px-6 py-4 bg-slate-50/50">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl px-4 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-200/60 transition"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            className="flex items-center gap-1.5 rounded-xl bg-emerald-600 px-5 py-2.5 text-xs font-bold text-white shadow-md shadow-emerald-600/20 hover:bg-emerald-700 transition"
          >
            <Check className="h-4 w-4" />
            Confirm Location
          </button>
        </div>
      </div>
    </div>
  );
}
