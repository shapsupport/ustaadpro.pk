import axios from "axios";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE ?? "http://localhost:5000";

const addressClient = axios.create({ baseURL: `${API_BASE}/api` });

addressClient.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("ustaadpro_token");
    if (token) config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export interface AddressRecord {
  id: number;
  title: string;
  address: string;
  lat?: number;
  lng?: number;
}

export interface CreateAddressPayload {
  title?: string;
  address: string;
  lat?: number;
  lng?: number;
}

function unwrapAddress(data: unknown): AddressRecord {
  const payload = data as { address?: AddressRecord; data?: AddressRecord };
  const address = payload?.address ?? payload?.data ?? (data as AddressRecord);
  if (!address || !Number.isFinite(Number(address.id))) {
    throw new Error("The address was saved, but the server did not return its ID.");
  }
  return { ...address, id: Number(address.id) };
}

export async function createAddress(payload: CreateAddressPayload): Promise<AddressRecord> {
  try {
    const res = await addressClient.post("/addresses", {
      title: payload.title ?? "Checkout address",
      address: payload.address,
      ...(Number.isFinite(payload.lat) ? { lat: payload.lat } : {}),
      ...(Number.isFinite(payload.lng) ? { lng: payload.lng } : {}),
    });
    return unwrapAddress(res.data);
  } catch (error) {
    if (axios.isAxiosError(error)) {
      const data = error.response?.data as { message?: string; error?: string } | undefined;
      throw new Error(data?.message || data?.error || "The address could not be saved. Please check it and try again.");
    }
    throw error;
  }
}

export async function getMyAddresses(): Promise<AddressRecord[]> {
  const res = await addressClient.get("/addresses");
  const data = res.data as AddressRecord[] | { addresses?: AddressRecord[]; data?: AddressRecord[] };
  return Array.isArray(data) ? data : data.addresses ?? data.data ?? [];
}

export async function ensureAddress(payload: CreateAddressPayload): Promise<AddressRecord> {
  try {
    const existing = (await getMyAddresses()).find(
      (item) => item.address.trim().toLowerCase() === payload.address.trim().toLowerCase()
    );
    if (existing) return existing;
  } catch {
    // Checkout can still proceed by creating the address when listing fails.
  }
  return createAddress(payload);
}
