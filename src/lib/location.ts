/**
 * Geofencing helpers for Ustaad Pro.
 * Serviceable region: Rawalpindi + Islamabad twin cities + 5 km buffer.
 */

export interface Coords {
  lat: number;
  lng: number;
}

export interface LocationState {
  status: "idle" | "loading" | "serviceable" | "not-serviceable";
  coords?: Coords;
  city?: string;
  area?: string;
  label?: string; // human-readable "Bahria Town, Rawalpindi"
}

// ── Reference centres ──────────────────────────────────────────────────────
const RAWALPINDI_CENTRE: Coords = { lat: 33.6007, lng: 73.0679 };
const ISLAMABAD_CENTRE: Coords  = { lat: 33.7285, lng: 73.0938 };

// The two cities span ~35 km at their widest; we add 5 km buffer on top.
const SERVICE_RADIUS_KM = 40; // covers both cities + 5 km fringe

/** Haversine distance in km */
export function haversineKm(a: Coords, b: Coords): number {
  const R = 6371;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const sinLat = Math.sin(dLat / 2);
  const sinLng = Math.sin(dLng / 2);
  const chord =
    sinLat * sinLat +
    Math.cos((a.lat * Math.PI) / 180) *
      Math.cos((b.lat * Math.PI) / 180) *
      sinLng * sinLng;
  return R * 2 * Math.atan2(Math.sqrt(chord), Math.sqrt(1 - chord));
}

export function isInServiceArea(coords: Coords): boolean {
  return (
    haversineKm(coords, RAWALPINDI_CENTRE) <= SERVICE_RADIUS_KM ||
    haversineKm(coords, ISLAMABAD_CENTRE) <= SERVICE_RADIUS_KM
  );
}

/** Reverse-geocode using OSM Nominatim (no API key required) */
export async function reverseGeocode(coords: Coords): Promise<{ city: string; area: string; label: string }> {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${coords.lat}&lon=${coords.lng}&format=json&accept-language=en`,
      { headers: { "User-Agent": "UstaadPro/1.0 (ustaadpro.pk)" } }
    );
    const data = await res.json();
    const a = data.address || {};
    const city  = a.city || a.town || a.county || a.state_district || "Unknown City";
    const area  = a.suburb || a.neighbourhood || a.village || a.road || "";
    const label = [area, city].filter(Boolean).join(", ");
    return { city, area, label };
  } catch {
    return { city: "Unknown City", area: "", label: "Unknown Location" };
  }
}

/** Forward-geocode a plain-text query using Nominatim */
export async function forwardGeocode(query: string): Promise<{ coords: Coords; label: string } | null> {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=1&accept-language=en`,
      { headers: { "User-Agent": "UstaadPro/1.0 (ustaadpro.pk)" } }
    );
    const data = await res.json();
    if (!data || data.length === 0) return null;
    return {
      coords: { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) },
      label: data[0].display_name.split(",").slice(0, 3).join(","),
    };
  } catch {
    return null;
  }
}

export interface LocationSuggestion {
  label: string;
  sublabel: string;
  coords: Coords;
}

/**
 * Search for areas/localities within the Rawalpindi-Islamabad bounding box.
 * viewbox: west,south,east,north  (approx twin cities + buffer)
 */
export async function searchLocations(query: string): Promise<LocationSuggestion[]> {
  if (!query || query.length < 2) return [];
  try {
    const viewbox = "72.85,33.45,73.45,33.90";
    const url =
      `https://nominatim.openstreetmap.org/search` +
      `?q=${encodeURIComponent(query)}` +
      `&format=json&limit=8&addressdetails=1&accept-language=en` +
      `&viewbox=${viewbox}&bounded=1`;
    const res = await fetch(url, {
      headers: { "User-Agent": "UstaadPro/1.0 (ustaadpro.pk)" },
    });
    const data: any[] = await res.json();
    if (!Array.isArray(data)) return [];

    return data.map((item) => {
      const a = item.address || {};
      const area = a.suburb || a.neighbourhood || a.village || a.road || a.quarter || "";
      const city = a.city || a.town || a.county || "Rawalpindi / Islamabad";
      return {
        label: area || item.display_name.split(",")[0],
        sublabel: [city, a.state].filter(Boolean).join(", "),
        coords: { lat: parseFloat(item.lat), lng: parseFloat(item.lon) },
      };
    }).filter((s) => s.label);
  } catch {
    return [];
  }
}

export const LOCATION_STORAGE_KEY = "ustaadpro_location";
