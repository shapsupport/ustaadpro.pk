import axios from "axios";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE ?? "http://localhost:5000";

const bookingClient = axios.create({
  baseURL: `${API_BASE}/api`,
  headers: {
    "Content-Type": "application/json",
  },
});

bookingClient.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("ustaadpro_token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

export interface ServiceItemInput {
  serviceId: string | number;
  serviceTitle?: string;
  servicePrice?: number;
  workPriceId?: number;
  workTitle?: string;
  quantity?: number;
}

export interface CreateBookingPayload {
  name: string;
  phone: string;
  address: string;
  date: string;
  time: string;
  requirements?: string;
  items: ServiceItemInput[];
  paymentMethod?: string;
  inspectionFee?: number;
  tax?: number;
  recurringOccurrences?: number;
  receiptDataUrl?: string;
  addressId?: number;
  addressLat?: number;
  addressLng?: number;
  useRewardPoints?: boolean;
  useWalletBalance?: boolean;
  loyaltyDiscount?: number;
  discount?: number;
  walletUsed?: number;
  servicesSubtotal?: number;
  platformCharges?: number;
  amountPayable?: number;
  billingBreakdown?: {
    servicesSubtotal: number;
    inspectionFee: number;
    platformCharges: number;
    originalTotal: number;
    discount: number;
    amountPayable: number;
  };
}

export interface BookingResponseOrder {
  id: string;
  total: number;
  status: string;
  bookedFor: string;
  paymentMethod: string;
  address: string;
  specialInstructions?: string;
  inspectionFee: number;
  tax: number;
  createdAt: string;
  originalTotal?: number;
  rewardDiscount?: number;
  loyaltyDiscount?: number;
  discount?: number;
  walletUsed?: number;
  items?: any[];
}

export interface BookingResponse {
  message: string;
  order: BookingResponseOrder;
  user?: any;
}

function normalizeServicePayment(method?: string): "Rs 200 Advance" | "Full Payment in Advance" {
  return method === "Full Payment in Advance" ? method : "Rs 200 Advance";
}

function formatBookedFor(date: string, time: string): string {
  const value = new Date(`${date}T${time || "10:00"}:00+05:00`);
  if (Number.isNaN(value.getTime())) return `${date} ${time}`.trim();
  const datePart = value.toLocaleDateString("en-US", {
    timeZone: "Asia/Karachi",
    weekday: "short",
    month: "short",
    day: "2-digit",
    year: "numeric",
  });
  const timePart = value.toLocaleTimeString("en-US", {
    timeZone: "Asia/Karachi",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
  return `${datePart.toUpperCase()} - ${timePart}`;
}

export async function createBooking(data: CreateBookingPayload): Promise<BookingResponse> {
  const firstItem = data.items[0];
  if (!firstItem?.serviceId) throw new Error("Please select a service before checkout.");

  const payload = {
    cart: data.items.map((item) => ({
      service: {
        id: item.serviceId,
        title: item.serviceTitle || "Selected Service",
        price: Number(item.servicePrice || 0),
        ...(item.workPriceId ? { selectedWorkPriceId: item.workPriceId } : {}),
        ...(item.workTitle ? { selectedWorkTitle: item.workTitle } : {}),
      },
      quantity: Math.max(1, Number(item.quantity || 1)),
      unitPrice: Number(item.servicePrice || 0),
      amount: Number(item.servicePrice || 0) * Math.max(1, Number(item.quantity || 1)),
    })),
    bookedFor: formatBookedFor(data.date, data.time),
    paymentMethod: normalizeServicePayment(data.paymentMethod),
    address: data.address,
    specialInstructions: data.requirements || "",
    recurringOccurrences: Math.max(1, Number(data.recurringOccurrences || 1)),
    useRewardPoints: Boolean(data.useRewardPoints),
    useWalletBalance: Boolean(data.useWalletBalance),
    loyaltyDiscount: Math.max(0, Number(data.loyaltyDiscount || 0)),
    discount: Math.max(0, Number(data.discount || 0)),
    inspectionFee: Math.max(0, Number(data.inspectionFee || 0)),
    tax: Math.max(0, Number(data.tax || 0)),
  };

  try {
    console.log("[service-checkout] POST /api/orders/checkout", JSON.stringify(payload, null, 2));
    const res = await bookingClient.post<BookingResponse>("/orders/checkout", payload);
    console.log("[service-checkout] response", JSON.stringify(res.data, null, 2));
    return res.data;
  } catch (err: any) {
    const serverMessage = err.response?.data?.message || err.response?.data?.error || err.message || "";

    // Handle stale user token (foreign key constraint failure)
    if (serverMessage.includes("foreign key constraint") || serverMessage.includes("orders_user_id_fkey")) {
      if (typeof window !== "undefined") {
        localStorage.removeItem("ustaadpro_token");
        localStorage.removeItem("ustaadpro_user");
      }
      throw new Error("Your login session has expired. Please sign in again to complete your booking.");
    }

    if (serverMessage) {
      throw new Error(serverMessage);
    }
    throw err;
  }
}

export async function uploadPaymentReceipt(
  orderId: string,
  dataUrl: string,
  amount: number,
  filename = "payment-receipt.jpg"
): Promise<{ message: string; receiptUrl: string }> {
  const res = await bookingClient.post<{ message: string; receiptUrl: string }>(
    `/orders/${orderId}/payment-receipt`,
    { dataUrl, filename, amount }
  );
  return res.data;
}

export async function getUserOrders(limit = 50, offset = 0): Promise<BookingResponseOrder[]> {
  const res = await bookingClient.get<BookingResponseOrder[] | { orders?: BookingResponseOrder[]; data?: BookingResponseOrder[] }>("/orders", {
    params: { limit, offset },
  });
  if (Array.isArray(res.data)) return res.data;
  return res.data.orders || res.data.data || [];
}

export async function getAdminOrders(): Promise<any[]> {
  const res = await bookingClient.get<any[]>("/admin/orders");
  return res.data;
}
