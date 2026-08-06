import axios from "axios";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE ?? "http://localhost:5000";

export interface ComplaintPayload {
  name: string;
  phone?: string;
  email?: string;
  bookingId: string;
  bookingLabel: string;
  description: string;
  image?: File;
}

export async function submitComplaint(payload: ComplaintPayload): Promise<{ message: string }> {
  const body = new FormData();
  body.append("name", payload.name);
  body.append("phone", payload.phone || "Not provided");
  body.append("email", payload.email || "");
  body.append("service", payload.bookingLabel);
  body.append("description", `Order #${payload.bookingId}: ${payload.description.trim()}`);
  if (payload.image) body.append("images", payload.image, payload.image.name);

  try {
    const token = typeof window !== "undefined" ? localStorage.getItem("ustaadpro_token") : null;
    const response = await axios.post<{ message?: string }>(`${API_BASE}/api/complaints`, body, {
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    });
    return { message: response.data.message || "Your complaint has been submitted." };
  } catch (error) {
    if (axios.isAxiosError(error)) {
      const data = error.response?.data as { message?: string; error?: string } | undefined;
      throw new Error(data?.message || data?.error || "Your complaint could not be submitted.");
    }
    throw error;
  }
}
