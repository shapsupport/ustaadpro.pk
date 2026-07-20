import axios from "axios";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE ?? "http://localhost:5000";

const api = axios.create({
  baseURL: `${API_BASE}/api/auth`,
  headers: {
    "Content-Type": "application/json",
  },
});

// ── Token expiry check helper ──────────────────────────────────────────────
function isTokenExpired(token: string): boolean {
  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    if (!payload.exp) return false;
    return Date.now() >= payload.exp * 1000;
  } catch {
    return true;
  }
}

// ── Request interceptor: attach JWT token ──────────────────────────────────
api.interceptors.request.use(
  (config) => {
    if (typeof window !== "undefined") {
      const token = localStorage.getItem("ustaadpro_token");
      if (token) {
        if (isTokenExpired(token)) {
          localStorage.removeItem("ustaadpro_token");
          localStorage.removeItem("ustaadpro_user");
          window.location.href = "/";
          return Promise.reject(new Error("Session expired"));
        }
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => Promise.reject(error),
);

// ── Response interceptor: handle 401 ──────────────────────────────────────
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (
      error.response?.status === 401 &&
      typeof window !== "undefined"
    ) {
      const token = localStorage.getItem("ustaadpro_token");
      if (token) {
        localStorage.removeItem("ustaadpro_token");
        localStorage.removeItem("ustaadpro_user");
        window.location.href = "/";
      }
    }
    return Promise.reject(error);
  },
);

export default api;