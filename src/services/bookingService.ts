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
  items?: any[];
}

export interface BookingResponse {
  message: string;
  order: BookingResponseOrder;
  user?: any;
}

function formatBookedForDate(dateStr: string, timeStr: string, recurringOccurrences: number = 1): string {
  if (!dateStr) return "Today, 6:00 PM";
  try {
    const parts = dateStr.split("-").map(Number);
    const timeParts = (timeStr || "10:00").split(":").map(Number);
    if (parts.length === 3) {
      const year = parts[0];
      const month = parts[1] - 1;
      const day = parts[2];
      const hours = timeParts[0] || 10;
      const minutes = timeParts[1] || 0;

      const d = new Date(year, month, day, hours, minutes);

      const formattedDate = d.toLocaleDateString("en-PK", {
        day: "numeric",
        month: "short",
        year: "numeric",
      });

      const formattedTime = d.toLocaleTimeString("en-PK", {
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      });

      const baseString = `${formattedDate} at ${formattedTime}`;
      if (recurringOccurrences > 1) {
        return `${baseString} (${recurringOccurrences} Days Recurring Service)`;
      }
      return baseString;
    }
  } catch {
    // fallback
  }
  return `${dateStr} ${timeStr || ""}`.trim();
}

export async function createBooking(data: CreateBookingPayload): Promise<BookingResponse> {
  const recurringOccurrences = Math.max(1, Number(data.recurringOccurrences || 1));
  const bookedFor = formatBookedForDate(data.date, data.time, recurringOccurrences);

  const cart = data.items.map((item) => {
    const serviceObj: any = {
      id: item.serviceId,
      title: item.serviceTitle || "Selected Service",
      price: item.servicePrice || 0,
    };

    const hasWorkId = Boolean(item.workPriceId && Number(item.workPriceId) > 0);
    if (hasWorkId) {
      serviceObj.selectedWorkPriceId = Number(item.workPriceId);
    }
    if (item.workTitle) {
      serviceObj.selectedWorkTitle = item.workTitle;
    }

    return {
      service: serviceObj,
      quantity: item.quantity || 1,
      ...(hasWorkId ? { workPriceId: Number(item.workPriceId) } : {}),
    };
  });

  const payload = {
    cart,
    bookedFor,
    paymentMethod: data.paymentMethod || "Cash After Work Done",
    address: data.address,
    specialInstructions: data.requirements || "",
    inspectionFee: data.inspectionFee || 0,
    tax: data.tax || 0,
    recurringOccurrences,
    useRewardPoints: false,
    customerName: data.name,
    customerPhone: data.phone,
  };

  try {
    const res = await bookingClient.post<BookingResponse>("/orders/checkout", payload);
    return res.data;
  } catch (err: any) {
    const serverMessage = err.response?.data?.message || err.response?.data?.error || err.message || "";
    
    // If backend reports work price ID not found in DB, retry without workPriceId
    if (serverMessage.includes("work price") || serverMessage.includes("Selected service work price")) {
      const sanitizedCart = payload.cart.map((cartItem) => {
        const copyService = { ...cartItem.service };
        delete copyService.selectedWorkPriceId;
        delete copyService.workPriceId;
        const newCartItem = { ...cartItem, service: copyService };
        delete (newCartItem as any).workPriceId;
        delete (newCartItem as any).serviceWorkPriceId;
        return newCartItem;
      });

      try {
        const retryRes = await bookingClient.post<BookingResponse>("/orders/checkout", {
          ...payload,
          cart: sanitizedCart,
        });
        return retryRes.data;
      } catch (retryErr: any) {
        const retryMsg = retryErr.response?.data?.message || retryErr.response?.data?.error || retryErr.message;
        if (retryMsg) throw new Error(retryMsg);
        throw retryErr;
      }
    }

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
  amount: number = 0
): Promise<{ message: string; receiptUrl: string }> {
  const res = await bookingClient.post<{ message: string; receiptUrl: string }>(
    `/orders/${orderId}/payment-receipt`,
    {
      dataUrl,
      amount,
    }
  );
  return res.data;
}

export async function getUserOrders(): Promise<BookingResponseOrder[]> {
  const res = await bookingClient.get<BookingResponseOrder[]>("/orders");
  return res.data;
}

export async function getAdminOrders(): Promise<any[]> {
  const res = await bookingClient.get<any[]>("/admin/orders");
  return res.data;
}
