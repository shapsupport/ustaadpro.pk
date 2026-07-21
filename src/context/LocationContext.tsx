"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from "react";
import {
  type LocationState,
  type Coords,
  isInServiceArea,
  reverseGeocode,
  LOCATION_STORAGE_KEY,
} from "@/lib/location";

interface LocationContextValue {
  location: LocationState;
  geoError: string;
  detectLocation: () => Promise<void>;
  setManualLocation: (coords: Coords, label: string, city: string, area?: string) => void;
  resetLocation: () => void;
  skipLocation: () => void;
  showPicker: boolean;
  setShowPicker: (v: boolean) => void;
}

const LocationContext = createContext<LocationContextValue | null>(null);

export function LocationProvider({ children }: { children: ReactNode }) {
  const [location, setLocation] = useState<LocationState>({ status: "idle" });
  const [showPicker, setShowPicker] = useState(false);
  const [geoError, setGeoError] = useState("");

  // Rehydrate from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(LOCATION_STORAGE_KEY);
      if (saved) {
        const parsed: LocationState = JSON.parse(saved);
        const restoreTimer = setTimeout(() => setLocation(parsed), 0);
        return () => clearTimeout(restoreTimer);
      }
    } catch {}
    // No saved location — show the picker after a short delay
    const timer = setTimeout(() => setShowPicker(true), 800);
    return () => clearTimeout(timer);
  }, []);

  const persist = (state: LocationState) => {
    setLocation(state);
    try {
      localStorage.setItem(LOCATION_STORAGE_KEY, JSON.stringify(state));
    } catch {}
  };

  const detectLocation = useCallback(async () => {
    if (!navigator.geolocation) {
      setGeoError("Your browser does not support location detection. Please search manually.");
      return;
    }
    setGeoError("");
    setLocation({ status: "loading" });
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const coords: Coords = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        const { city, area, label } = await reverseGeocode(coords);
        const serviceable = isInServiceArea(coords);
        const next: LocationState = {
          status: serviceable ? "serviceable" : "not-serviceable",
          coords,
          city,
          area,
          label,
          shortLabel: area ? `${area}, ${city}` : city,
        };
        persist(next);
        setShowPicker(false);
      },
      (err: GeolocationPositionError) => {
        setLocation({ status: "idle" });
        if (err.code === 1 /* PERMISSION_DENIED */) {
          setGeoError("Location access denied. Please allow location permission or search manually.");
        } else if (err.code === 2 /* POSITION_UNAVAILABLE */) {
          setGeoError("Could not determine your position. Please search manually.");
        } else {
          setGeoError("Location timed out. Please try again or search manually.");
        }
      },
      { timeout: 10000, enableHighAccuracy: false }
    );
  }, []);

  const setManualLocation = useCallback(
    (coords: Coords, label: string, city: string, area?: string) => {
      const serviceable = isInServiceArea(coords);
      const next: LocationState = {
        status: serviceable ? "serviceable" : "not-serviceable",
        coords,
        city,
        area,
        label,
        shortLabel: area ? `${area}, ${city}` : city,
      };
      persist(next);
      setShowPicker(false);
    },
    []
  );

  const resetLocation = useCallback(() => {
    localStorage.removeItem(LOCATION_STORAGE_KEY);
    setLocation({ status: "idle" });
    setGeoError("");
    setShowPicker(true);
  }, []);

  // Closing a later picker keeps the user's saved selection. First-time skips are
  // persisted too, so navigation into checkout never loses the chosen state.
  const skipLocation = useCallback(() => {
    setShowPicker(false);
    if (location.label) return;
    const fallback: LocationState = { status: "serviceable", city: "Rawalpindi / Islamabad", label: "Rawalpindi / Islamabad", shortLabel: "Rawalpindi / Islamabad" };
    setLocation(fallback);
    try { localStorage.setItem(LOCATION_STORAGE_KEY, JSON.stringify(fallback)); } catch {}
  }, [location.label]);

  return (
    <LocationContext.Provider
      value={{ location, geoError, detectLocation, setManualLocation, resetLocation, skipLocation, showPicker, setShowPicker }}
    >
      {children}
    </LocationContext.Provider>
  );
}

export function useLocation(): LocationContextValue {
  const ctx = useContext(LocationContext);
  if (!ctx) throw new Error("useLocation must be used inside <LocationProvider>");
  return ctx;
}
