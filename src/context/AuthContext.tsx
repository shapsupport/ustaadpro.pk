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
  signupUser,
  verifySignupOtp as apiVerifySignupOtp,
  loginUser,
  loginWithPhone as apiLoginWithPhone,
  requestPasswordResetOtp,
  resetPasswordWithOtp,
  type AuthUser,
  type SignupPayload,
} from "@/services/authService";
import axios from "axios";

// ── Types ──────────────────────────────────────────────────────────────────

export type { AuthUser as User };

export type OtpModalMode =
  | "signup-verify"
  | "forgot-password-verify"
  | null;

export interface OtpModalState {
  mode: OtpModalMode;
  /** Masked contact string to display, e.g. "a***@gmail.com" */
  maskedContact: string;
  /** Raw email used as OTP identifier */
  email?: string;
  /** Raw phone used as OTP identifier */
  phone?: string;
  /** Channel used for this OTP */
  verificationChannel: "email" | "phone";
  /** Set when email delivery failed — OTP is printed in backend console */
  emailWarning?: string;
}

interface AuthContextValue {
  user: AuthUser | null;
  isLoading: boolean;

  // ── Modal routing ──────────────────────────────────────────────────────
  /** null = closed, "login" | "signup" | "forgot" = open */
  authModalMode: "login" | "signup" | "forgot" | null;
  setAuthModalMode: (mode: "login" | "signup" | "forgot" | null) => void;

  // ── OTP modal ──────────────────────────────────────────────────────────
  otpModal: OtpModalState | null;
  closeOtpModal: () => void;

  // ── Auth actions ───────────────────────────────────────────────────────
  signup: (data: SignupPayload) => Promise<void>;
  verifySignupOtp: (code: string) => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  loginWithPhone: (phone: string) => Promise<void>;
  requestPasswordReset: (email: string, channel?: "email" | "phone") => Promise<void>;
  resetPassword: (code: string, newPassword: string) => Promise<void>;
  logout: () => void;
}

// ── Helpers ────────────────────────────────────────────────────────────────

function maskEmail(email: string): string {
  const [local, domain] = email.split("@");
  if (!domain) return email;
  const visible = local.charAt(0);
  return `${visible}${"*".repeat(Math.max(local.length - 1, 2))}@${domain}`;
}

function persistSession(token: string, user: AuthUser) {
  try {
    localStorage.setItem("ustaadpro_token", token);
    localStorage.setItem("ustaadpro_user", JSON.stringify(user));
  } catch { /* storage full / private browsing */ }
}

function clearSession() {
  try {
    localStorage.removeItem("ustaadpro_token");
    localStorage.removeItem("ustaadpro_user");
  } catch { }
}

/** Extract a user-friendly message from an API error */
export function extractApiError(err: unknown): string {
  if (axios.isAxiosError(err)) {
    return (
      (err.response?.data as { message?: string })?.message ??
      err.message ??
      "Something went wrong. Please try again."
    );
  }
  if (err instanceof Error) return err.message;
  return "Something went wrong. Please try again.";
}

// ── Context ────────────────────────────────────────────────────────────────

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<"login" | "signup" | "forgot" | null>(null);
  const [otpModal, setOtpModal] = useState<OtpModalState | null>(null);

  // Restore session on mount - with 30-day expiry check
  useEffect(() => {
    try {
      const savedUser = localStorage.getItem("ustaadpro_user");
      const token = localStorage.getItem("ustaadpro_token");

      if (savedUser && token) {
        try {
          const payload = JSON.parse(atob(token.split(".")[1]));
          if (payload.exp && Date.now() >= payload.exp * 1000) {
            // Token expired - clear session
            localStorage.removeItem("ustaadpro_token");
            localStorage.removeItem("ustaadpro_user");
            return;
          }
        } catch {
          localStorage.removeItem("ustaadpro_token");
          localStorage.removeItem("ustaadpro_user");
          return;
        }

        setUser(JSON.parse(savedUser));
      }
    } catch {
      localStorage.removeItem("ustaadpro_token");
      localStorage.removeItem("ustaadpro_user");
    }
  }, []);
  // ── Signup ───────────────────────────────────────────────────────────────
  const signup = useCallback(async (data: SignupPayload) => {
    setIsLoading(true);
    try {
      const res = await signupUser(data);
      // Open OTP modal — user not yet created
      setOtpModal({
        mode: "signup-verify",
        maskedContact:
          res.verificationChannel === "phone"
            ? res.phone
            : maskEmail(res.email),
        email: res.email,
        phone: res.phone,
        verificationChannel: res.verificationChannel,
        // Only set when email delivery failed — OTP is visible in backend console
        emailWarning: res.emailWarning,
      });
      setAuthModalMode(null);
    } finally {
      setIsLoading(false);
    }
  }, []);


  // ── Verify signup OTP ────────────────────────────────────────────────────
  const verifySignupOtp = useCallback(async (code: string) => {
    if (!otpModal) throw new Error("No pending OTP session.");
    setIsLoading(true);
    try {
      const { token, user: newUser } = await apiVerifySignupOtp({
        email: otpModal.email,
        phone: otpModal.phone,
        code,
        verificationChannel: otpModal.verificationChannel,
      });
      persistSession(token, newUser);
      setUser(newUser);
      setOtpModal(null);
    } finally {
      setIsLoading(false);
    }
  }, [otpModal]);

  // ── Login ────────────────────────────────────────────────────────────────
  const login = useCallback(async (identifier: string, password: string) => {
    setIsLoading(true);
    try {
      const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(identifier);
      const payload = isEmail
        ? { email: identifier, password }
        : { phone: identifier, password };

      const { token, user: loggedInUser } = await loginUser(payload);
      persistSession(token, loggedInUser);
      setUser(loggedInUser);
      setAuthModalMode(null);
    } catch (error) {
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // ── Login with phone (no password) ───────────────────────────────────────────
  const loginWithPhone = useCallback(async (phone: string) => {
    setIsLoading(true);
    try {
      const { token, user: loggedInUser } = await apiLoginWithPhone({ phone });
      persistSession(token, loggedInUser);
      setUser(loggedInUser);
      setAuthModalMode(null);
    } catch (error) {
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);
  // ── Forgot password ────────────────────────────────────────────
  const requestPasswordReset = useCallback(async (identifier: string, channel: "email" | "phone" = "email") => {
    setIsLoading(true);
    try {
      const payload =
        channel === "phone"
          ? { phone: identifier, channel }
          : { email: identifier, channel };
      const res = await requestPasswordResetOtp(payload);
      setOtpModal({
        mode: "forgot-password-verify",
        maskedContact: channel === "phone" ? identifier : maskEmail(identifier),
        email: channel === "email" ? identifier : undefined,
        phone: channel === "phone" ? identifier : undefined,
        verificationChannel: res.verificationChannel,
      });
      setAuthModalMode(null);
    } finally {
      setIsLoading(false);
    }
  }, []);
  // ── Reset password ───────────────────────────────────────────────
  const resetPassword = useCallback(async (code: string, newPassword: string) => {
    if (!otpModal) throw new Error("No pending OTP session.");
    setIsLoading(true);
    try {
      await resetPasswordWithOtp({
        email: otpModal.email,
        phone: otpModal.phone,
        code,
        newPassword,
        channel: otpModal.verificationChannel,
      });
      setOtpModal(null);
      setAuthModalMode("login");
    } finally {
      setIsLoading(false);
    }
  }, [otpModal]);

  // ── Logout ───────────────────────────────────────────────────────────────
  const logout = useCallback(() => {
    clearSession();
    setUser(null);
  }, []);

  const closeOtpModal = useCallback(() => setOtpModal(null), []);

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        authModalMode,
        setAuthModalMode,
        otpModal,
        closeOtpModal,
        signup,
        verifySignupOtp,
        login,
        loginWithPhone,
        requestPasswordReset,
        resetPassword,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}
