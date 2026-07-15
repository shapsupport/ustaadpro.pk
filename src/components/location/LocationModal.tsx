"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { MapPin, Navigation, Search, X, Loader2, AlertCircle } from "lucide-react";
import { useLocation } from "@/context/LocationContext";
import { searchLocations, type LocationSuggestion } from "@/lib/location";

const POPULAR_AREAS = [
  { label: "Bahria Town", sublabel: "Rawalpindi", query: "Bahria Town, Rawalpindi, Pakistan" },
  { label: "DHA Phase 2", sublabel: "Islamabad", query: "DHA Phase 2, Islamabad, Pakistan" },
  { label: "Satellite Town", sublabel: "Rawalpindi", query: "Satellite Town, Rawalpindi, Pakistan" },
  { label: "F-10 Markaz", sublabel: "Islamabad", query: "F-10 Islamabad, Pakistan" },
  { label: "G-9", sublabel: "Islamabad", query: "G-9 Islamabad, Pakistan" },
  { label: "Saddar", sublabel: "Rawalpindi", query: "Saddar, Rawalpindi, Pakistan" },
  { label: "Blue Area", sublabel: "Islamabad", query: "Blue Area Islamabad, Pakistan" },
  { label: "Chaklala", sublabel: "Rawalpindi", query: "Chaklala, Rawalpindi, Pakistan" },
];

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
      const results = await searchLocations(value);
      setSuggestions(results);
      setFetching(false);
    }, 350);
  }, []);

  const handleSelect = (s: LocationSuggestion) => {
    setSelecting(true);
    const city = s.sublabel.split(",")[0].trim();
    setManualLocation(s.coords, `${s.label}, ${s.sublabel}`, city);
    setQuery("");
    setSuggestions([]);
    setSelecting(false);
  };

  const handlePopular = async (q: string, city: string, label: string) => {
    setSelecting(true);
    const results = await searchLocations(q.split(",")[0]);
    if (results.length > 0) {
      setManualLocation(results[0].coords, label, city);
    } else {
      // Fallback coords for the twin cities center if geocoding fails
      setManualLocation({ lat: 33.6007, lng: 73.0679 }, label, city);
    }
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
        className="fixed inset-x-4 top-1/2 z-[70] max-w-md mx-auto -translate-y-1/2 bg-white rounded-3xl shadow-2xl overflow-hidden"
      >
        {/* Header */}
        <div className="bg-gradient-to-br from-primary to-emerald-700 p-6 text-white relative">
          <button
            onClick={skipLocation}
            className="absolute right-4 top-4 p-1.5 rounded-full hover:bg-white/20 transition-colors"
            aria-label="Skip and continue"
          >
            <X className="h-5 w-5" />
          </button>

          <div className="flex items-center gap-3 mb-4">
            <div className="h-11 w-11 bg-white/20 rounded-2xl flex items-center justify-center shrink-0">
              <MapPin className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold">Where are you?</h2>
              <p className="text-emerald-100 text-sm">We serve Rawalpindi &amp; Islamabad</p>
            </div>
          </div>

          <button
            onClick={detectLocation}
            disabled={isLoading}
            className="w-full flex items-center justify-center gap-2 bg-white text-primary font-semibold py-3 px-5 rounded-2xl shadow-lg hover:bg-emerald-50 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
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

        <div className="p-5 space-y-4">
          {/* ── Autocomplete search ── */}
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
              Search your area
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
                  placeholder="Type area, sector or colony…"
                  autoComplete="off"
                  className="flex-1 bg-transparent h-11 text-sm outline-none placeholder:text-slate-400 text-slate-800"
                  aria-autocomplete="list"
                  aria-haspopup="listbox"
                />
                {fetching && <Loader2 className="h-4 w-4 animate-spin text-primary shrink-0" />}
                {selecting && <Loader2 className="h-4 w-4 animate-spin text-primary shrink-0" />}
              </div>

              {/* Dropdown suggestions */}
              {suggestions.length > 0 && (
                <ul
                  role="listbox"
                  className="absolute top-full left-0 right-0 mt-1.5 bg-white border border-slate-200 rounded-2xl shadow-xl overflow-hidden z-10 divide-y divide-slate-50"
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
                <p className="flex items-center gap-1.5 text-xs text-slate-400 mt-2 px-1">
                  <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                  No areas found in Rawalpindi / Islamabad for &ldquo;{query}&rdquo;
                </p>
              )}
            </div>
          </div>

          {/* ── Popular quick picks ── */}
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
              Popular areas
            </p>
            <div className="grid grid-cols-2 gap-2">
              {POPULAR_AREAS.map((area) => (
                <button
                  key={area.label}
                  onClick={() => handlePopular(area.query, area.sublabel, `${area.label}, ${area.sublabel}`)}
                  disabled={selecting || isLoading}
                  className="flex items-start gap-2 text-left bg-slate-50 hover:bg-emerald-50 border border-slate-200 hover:border-emerald-200 rounded-xl px-3 py-2.5 transition-all disabled:opacity-50 group"
                >
                  <MapPin className="h-3.5 w-3.5 shrink-0 text-slate-400 group-hover:text-primary mt-0.5 transition-colors" />
                  <div>
                    <p className="text-xs font-semibold text-slate-700 group-hover:text-primary transition-colors leading-tight">{area.label}</p>
                    <p className="text-[10px] text-slate-400">{area.sublabel}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={skipLocation}
            className="w-full text-center text-xs text-slate-400 hover:text-slate-600 py-1 transition-colors"
          >
            Skip for now — browse as Rawalpindi / Islamabad
          </button>
        </div>
      </div>
    </>
  );
}
