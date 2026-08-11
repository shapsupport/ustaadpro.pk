import axios from "axios";
import { ensureAddress } from "./addressService";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE ?? "http://localhost:5000";

const shopClient = axios.create({
  baseURL: `${API_BASE}/api`,
  headers: {
    "Content-Type": "application/json",
  },
});

// Attach bearer token on every request (mirrors bookingService pattern)
shopClient.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("ustaadpro_token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

export interface ShopOrderItem {
  productId: string;
  quantity: number;
}

export interface CheckoutShopPayload {
  items: ShopOrderItem[];
  address: string;
  paymentMethod?: string;
  useRewardPoints?: boolean;
  addressId?: number;
  addressLat?: number;
  addressLng?: number;
}

export interface ShopOrder {
  id: string;
  total: number;
  shippingCost: number;
  status: string;
  paymentMethod: string;
  address: string;
  createdAt: string;
  items?: {
    quantity: number;
    price: number;
    product: {
      id: string;
      title: string;
      category: string;
      description: string;
      imageUrl: string;
    };
  }[];
}

export interface CheckoutShopResponse {
  message: string;
  order: ShopOrder;
  user?: unknown;
}

export async function checkoutShopOrder(
  payload: CheckoutShopPayload
): Promise<CheckoutShopResponse> {
  try {
    const addressId = payload.addressId ?? (await ensureAddress({
      address: payload.address,
      lat: payload.addressLat,
      lng: payload.addressLng,
    })).id;
    const res = await shopClient.post<CheckoutShopResponse>("/shop/checkout", {
      items: payload.items,
      addressId,
      // Some deployed API versions still validate the delivery address on the
      // checkout request even when a saved address ID is supplied.
      address: payload.address,
      deliveryAddress: payload.address,
      paymentMethod: (payload.paymentMethod ?? "cod").toLowerCase().includes("cash")
        ? "cod"
        : payload.paymentMethod,
    });
    console.log("[UstaadPro] Shop order API response:\n", JSON.stringify(res.data, null, 2));
    return res.data;
  } catch (err: unknown) {
    const axiosErr = err as {
      response?: { data?: { message?: string }; status?: number };
      message?: string;
    };
    const serverMsg =
      axiosErr.response?.data?.message ?? axiosErr.message ?? "";

    // Handle expired session
    if (
      axiosErr.response?.status === 401 ||
      serverMsg.includes("foreign key constraint") ||
      serverMsg.includes("session")
    ) {
      if (typeof window !== "undefined") {
        localStorage.removeItem("ustaadpro_token");
        localStorage.removeItem("ustaadpro_user");
      }
      throw new Error(
        "Your login session has expired. Please sign in again to complete your order."
      );
    }

    if (serverMsg) throw new Error(serverMsg);
    throw err;
  }
}

export async function getMyShopOrders(): Promise<ShopOrder[]> {
  const res = await shopClient.get<ShopOrder[]>("/shop/orders");
  return res.data;
}
