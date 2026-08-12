import api from "./api";

// ── Shared types ───────────────────────────────────────────────────────────

export interface AuthUser {
  id: number;
  name: string;
  email: string;
  phone: string;
  walletBalance: number;
  coins: number;
  rewardPoints: number;
  createdAt: string;
}

export interface AuthResponse {
  token: string;
  user: AuthUser;
}

// ── Signup ─────────────────────────────────────────────────────────────────

export interface SignupPayload {
  name: string;
  email: string;
  phone: string;
  password: string;
  /** "email" | "phone" — defaults to "email" */
  verificationChannel?: "email" | "phone";
}

export interface SignupOtpSentResponse {
  message: string;
  email: string;
  phone: string;
  verificationChannel: "email" | "phone";
  expiresInMinutes: number;
  /** Present only when email delivery fails — OTP is in the server console */
  emailWarning?: string;
}

export async function signupUser(data: SignupPayload): Promise<SignupOtpSentResponse> {
  const res = await api.post<SignupOtpSentResponse>("/signup", data);
  return res.data;
}

// ── Verify signup OTP ──────────────────────────────────────────────────────

export interface VerifySignupOtpPayload {
  email?: string;
  phone?: string;
  otp: string;
  verificationChannel?: "email" | "phone";
}

export async function verifySignupOtp(data: VerifySignupOtpPayload): Promise<AuthResponse> {
  const res = await api.post<AuthResponse>("/verify-signup-otp", data);
  return res.data;
}

// ── Login (email + password) ───────────────────────────────────────────────

export interface LoginPayload {
  email?: string;
  phone?: string;
  password: string;
}

export async function loginUser(data: LoginPayload): Promise<AuthResponse> {
  const res = await api.post<AuthResponse>("/login", data);
  return res.data;
}

// ── Request login OTP (phone) ──────────────────────────────────────────────

export interface RequestLoginOtpResponse {
  message: string;
  phone: string;
  expiresInMinutes: number;
}

export async function requestLoginOtp(phone: string): Promise<RequestLoginOtpResponse> {
  const res = await api.post<RequestLoginOtpResponse>("/request-login-otp", { phone });
  return res.data;
}

// ── Verify login OTP ───────────────────────────────────────────────────────

export interface VerifyLoginOtpPayload {
  phone: string;
  otp: string;
}

export async function verifyLoginOtp(data: VerifyLoginOtpPayload): Promise<AuthResponse> {
  const res = await api.post<AuthResponse>("/verify-login-otp", data);
  return res.data;
}

// ── Request password reset OTP ─────────────────────────────────────────────

export interface RequestPasswordResetPayload {
  identifier?: string;
  email?: string;
  phone?: string;
  channel?: "email" | "phone";
}

export interface RequestPasswordResetResponse {
  message: string;
  verificationChannel: "email" | "phone";
  expiresInMinutes: number;
}

export async function requestPasswordResetOtp(
  data: RequestPasswordResetPayload,
): Promise<RequestPasswordResetResponse> {
  const identifier = data.identifier ?? data.email ?? data.phone ?? "";
  const res = await api.post<RequestPasswordResetResponse>("/forgot-password/request-otp", {
    ...data,
    identifier,
  });
  return res.data;
}

// ── Reset password with OTP ────────────────────────────────────────────────

export interface ResetPasswordPayload {
  identifier?: string;
  email?: string;
  phone?: string;
  otp: string;
  code?: string;
  verificationCode?: string;
  newPassword: string;
  channel?: "email" | "phone";
}

export interface ResetPasswordResponse {
  message: string;
}

export async function resetPasswordWithOtp(
  data: ResetPasswordPayload,
): Promise<ResetPasswordResponse> {
  const identifier = data.identifier ?? data.email ?? data.phone ?? "";
  const verificationCode = data.verificationCode ?? data.otp;
  const res = await api.post<ResetPasswordResponse>("/forgot-password/reset", {
    ...data,
    identifier,
    // The current reset controller calls this field `code`; keep the other
    // names as aliases for API deployments using the older contract.
    code: data.code ?? verificationCode,
    verificationCode,
  });
  return res.data;
}

// ── Login with phone (no password, no OTP) ────────────────────────────────

export interface LoginWithPhonePayload {
  phone: string;
}

export async function loginWithPhone(data: LoginWithPhonePayload): Promise<AuthResponse> {
  const res = await api.post<AuthResponse>("/login-phone", data);
  return res.data;
}

// ── Get profile (authenticated) ────────────────────────────────────────────

export async function getProfile(): Promise<AuthUser> {
  const res = await api.get<AuthUser>("/profile");
  return res.data;
}

// ── Delete account (authenticated) ─────────────────────────────────────────

export async function deleteAccountUser(): Promise<{ message: string }> {
  const res = await api.delete<{ message: string }>("/account");
  return res.data;
}

