"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Map, MapPin, Navigation, Search, X, Loader2, AlertCircle } from "lucide-react";
import { useLocation } from "@/context/LocationContext";
import MapAddressPickerModal from "./MapAddressPickerModal";
import { reverseGeocode, searchLocations, TWIN_CITY_LOCALITIES, type LocationSuggestion } from "@/lib/location";

export function LocationModal() {
  const {
    showPicker,
    detectLocation,
    setManualLocation,
    skipLocation,
    location,
    geoError,
  } = useLocation();

  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<LocationSuggestion[]>([]);
  const [fetching, setFetching] = useState(false);
  const [activeSuggestion, setActiveSuggestion] = useState(-1);
  const [selecting, setSelecting] = useState(false);
  const [showMap, setShowMap] = useState(false);
  const [selectedCity, setSelectedCity] = useState<keyof typeof TWIN_CITY_LOCALITIES>("Islamabad");
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (showPicker) setTimeout(() => inputRef.current?.focus(), 200);
  }, [showPicker]);

  // Debounced autocomplete
  const handleQueryChange = useCallback((value: string) => {
    setQuery(value);
    setActiveSuggestion(-1);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (value.length < 2) { setSuggestions([]); return; }

    setFetching(true);
    debounceRef.current = setTimeout(async () => {
      const results = await searchLocations(value, selectedCity);
      setSuggestions(results);
      setFetching(false);
    }, 350);
  }, [selectedCity]);

  const handleSelect = (s: LocationSuggestion) => {
    setSelecting(true);
    const city = s.sublabel.split(",")[0].trim();
    const area = s.label;
    setManualLocation(s.coords, `${area}, ${s.sublabel}`, city, area);
    setQuery("");
    setSuggestions([]);
    setSelecting(false);
  };

  const handlePopular = async (locality: string, city: keyof typeof TWIN_CITY_LOCALITIES) => {
    setSelecting(true);
    const results = await searchLocations(locality, city);
    if (results.length > 0) {
      setManualLocation(results[0].coords, `${locality}, ${city}`, city, locality);
    } else {
      const coords = city === "Islamabad" ? { lat: 33.7285, lng: 73.0938 } : { lat: 33.6007, lng: 73.0679 };
      setManualLocation(coords, `${locality}, ${city}`, city, locality);
    }
    setSelecting(false);
  };

  const handleMapSelection = async (address: string, lat?: number, lng?: number) => {
    if (lat === undefined || lng === undefined) return;
    setSelecting(true);
    const details = await reverseGeocode({ lat, lng });
    setManualLocation(
      { lat, lng },
      address || details.label,
      details.city,
      details.area,
    );
    setSelecting(false);
  };

  // Keyboard navigation in dropdown
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!suggestions.length) return;
    if (e.key === "ArrowDown") { e.preventDefault(); setActiveSuggestion(i => Math.min(i + 1, suggestions.length - 1)); }
    if (e.key === "ArrowUp") { e.preventDefault(); setActiveSuggestion(i => Math.max(i - 1, 0)); }
    if (e.key === "Enter" && activeSuggestion >= 0) { e.preventDefault(); handleSelect(suggestions[activeSuggestion]); }
    if (e.key === "Escape") { setSuggestions([]); }
  };

  if (!showPicker) return null;

  const isLoading = location.status === "loading";

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-[60] bg-black/50 backdrop-blur-sm" onClick={skipLocation} aria-hidden="true" />

      {/* Modal */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Select your location"
        className="fixed inset-x-3 top-1/2 z-[70] mx-auto max-h-[calc(100dvh-1rem)] w-auto max-w-4xl -translate-y-1/2 overflow-y-auto overscroll-contain rounded-2xl bg-white shadow-2xl booking-modal-scrollbar sm:inset-x-6 sm:rounded-3xl md:overflow-visible"
      >
        {/* Header */}
        <div className="relative rounded-t-2xl bg-gradient-to-br from-primary to-emerald-700 p-4 text-white sm:rounded-t-3xl sm:p-5">
          <button
            onClick={skipLocation}
            className="absolute right-4 top-4 p-1.5 rounded-full hover:bg-white/20 transition-colors"
            aria-label="Skip and continue"
          >
            <X className="h-5 w-5" />
          </button>

          <div className="mb-3 flex items-center gap-3 pr-9">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/20">
              <MapPin className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold sm:text-xl">Where are you?</h2>
              <p className="text-xs font-medium text-emerald-100 sm:text-sm">Serving Rawalpindi &amp; Islamabad now</p>
            </div>
          </div>

          <button
            onClick={detectLocation}
            disabled={isLoading}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-white px-5 py-2.5 text-sm font-semibold text-primary shadow-lg transition-all hover:bg-emerald-50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isLoading ? (
              <><Loader2 className="h-4 w-4 animate-spin" />Detecting location…</>
            ) : (
              <><Navigation className="h-4 w-4" />Use my current location</>
            )}
          </button>

          {geoError && (
            <p className="flex items-start gap-2 mt-3 text-xs text-amber-100 bg-black/20 px-3 py-2.5 rounded-xl leading-relaxed">
              <AlertCircle className="h-3.5 w-3.5 mt-0.5 shrink-0 text-amber-300" />
              {geoError}
            </p>
          )}
        </div>

        <div className="grid gap-3 p-3.5 sm:p-4 md:grid-cols-[minmax(0,0.9fr)_minmax(0,1.35fr)]">
          <div className="space-y-3">
          <div className="flex items-start gap-2 rounded-2xl border border-amber-200 bg-amber-50 p-3 text-xs leading-relaxed text-amber-800">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            <p>
              We currently operate in <strong>Rawalpindi and Islamabad only</strong>.
              Locations along the borders of both cities are also supported.
            </p>
          </div>

          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-400">Choose city</p>
            <div className="grid grid-cols-2 gap-2">
              {(["Islamabad", "Rawalpindi"] as const).map((city) => <button key={city} type="button" onClick={() => { if (debounceRef.current) clearTimeout(debounceRef.current); setSelectedCity(city); setQuery(""); setSuggestions([]); setFetching(false); }} className={`rounded-xl border px-4 py-2.5 text-sm font-bold transition ${selectedCity === city ? "border-primary bg-emerald-50 text-primary" : "border-slate-200 text-slate-600 hover:bg-slate-50"}`}>{city}</button>)}
            </div>
          </div>
          {/* ── Autocomplete search ── */}
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
              Search locality in {selectedCity}
            </p>

            <div className="relative">
              {/* Input */}
              <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-2xl px-4 py-1 focus-within:border-primary focus-within:ring-1 focus-within:ring-primary transition-all">
                <Search className="h-4 w-4 text-slate-400 shrink-0" />
                <input
                  ref={inputRef}
                  value={query}
                  onChange={(e) => handleQueryChange(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder={`Type an area in ${selectedCity}…`}
                  autoComplete="off"
                  className="flex-1 bg-transparent h-11 text-sm outline-none placeholder:text-slate-400 text-slate-800"
                  aria-autocomplete="list"
                  aria-haspopup="listbox"
                />
                {fetching && <Loader2 className="h-4 w-4 animate-spin text-primary shrink-0" />}
                {selecting && <Loader2 className="h-4 w-4 animate-spin text-primary shrink-0" />}
                {query && !fetching && !selecting && (
                  <button
                    type="button"
                    onClick={() => {
                      if (debounceRef.current) clearTimeout(debounceRef.current);
                      setQuery("");
                      setSuggestions([]);
                      setActiveSuggestion(-1);
                      setFetching(false);
                      inputRef.current?.focus();
                    }}
                    className="rounded-full p-1 text-slate-400 transition hover:bg-slate-200 hover:text-slate-700"
                    aria-label="Clear location search"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>

              {/* Dropdown suggestions */}
              {suggestions.length > 0 && (
                <ul
                  role="listbox"
                  className="absolute left-0 right-0 top-full z-50 mt-1.5 max-h-[min(40dvh,320px)] divide-y divide-slate-50 overflow-y-auto rounded-2xl border border-slate-200 bg-white shadow-2xl ring-1 ring-slate-900/5"
                >
                  {suggestions.map((s, i) => (
                    <li key={i} role="option" aria-selected={i === activeSuggestion}>
                      <button
                        onClick={() => handleSelect(s)}
                        className={`w-full flex items-start gap-3 px-4 py-3 text-left hover:bg-emerald-50 transition-colors ${i === activeSuggestion ? "bg-emerald-50" : ""}`}
                      >
                        <MapPin className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                        <div className="overflow-hidden">
                          <p className="text-sm font-semibold text-slate-800 truncate">{s.label}</p>
                          <p className="text-xs text-slate-400 truncate">{s.sublabel}</p>
                        </div>
                      </button>
                    </li>
                  ))}
                </ul>
              )}

              {/* No results hint */}
              {!fetching && query.length >= 2 && suggestions.length === 0 && (
                <div className="mt-2 flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2.5 text-xs leading-relaxed text-amber-800">
                  <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                  <p>
                    We couldn&apos;t find &ldquo;{query}&rdquo;. Try sharing your current
                    location, pick the point on the map, or add your house and landmark
                    manually during checkout.
                  </p>
                </div>
              )}
            </div>
          </div>

          <button
            type="button"
            onClick={() => setShowMap(true)}
            className="flex w-full items-center justify-center gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-800 transition hover:border-emerald-300 hover:bg-emerald-100"
          >
            <Map className="h-4 w-4" />
            {location.coords ? "Edit precise location on map" : "Pick precise location on map"}
          </button>
          </div>

          {/* ── Popular quick picks ── */}
          <div className="hidden rounded-2xl border border-slate-100 bg-slate-50/60 p-4 md:block">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
              Localities in {selectedCity}
            </p>
            <div className="grid grid-cols-4 gap-1.5">
              {TWIN_CITY_LOCALITIES[selectedCity].map((locality) => (
                <button
                  key={locality}
                  onClick={() => handlePopular(locality, selectedCity)}
                  disabled={selecting || isLoading}
                  className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-left transition-all hover:border-emerald-200 hover:bg-emerald-50 disabled:opacity-50 group"
                >
                  <MapPin className="h-3.5 w-3.5 shrink-0 text-slate-400 group-hover:text-primary mt-0.5 transition-colors" />
                  <p className="text-[11px] font-semibold leading-tight text-slate-700 transition-colors group-hover:text-primary">{locality}</p>
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={skipLocation}
            className="text-center text-xs text-slate-400 transition-colors hover:text-slate-600 md:col-span-2"
          >
            Skip for now — browse as Rawalpindi / Islamabad while we expand
          </button>
        </div>
      </div>

      <MapAddressPickerModal
        key={showMap ? `open-${location.coords?.lat}-${location.coords?.lng}` : "closed"}
        isOpen={showMap}
        onClose={() => setShowMap(false)}
        onSelectAddress={handleMapSelection}
        initialAddress={location.label}
        initialLat={location.coords?.lat}
        initialLng={location.coords?.lng}
      />
    </>
  );
}
