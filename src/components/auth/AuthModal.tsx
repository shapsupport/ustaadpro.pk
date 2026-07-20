"use client";

import { useState, useCallback } from "react";
import {
  X,
  Mail,
  Lock,
  User,
  Phone,
  Loader2,
  ArrowRight,
  Eye,
  EyeOff,
  ChevronLeft,
} from "lucide-react";
import { useAuth, extractApiError } from "@/context/AuthContext";
import type { SignupPayload } from "@/services/authService";

// ── Validation helpers ─────────────────────────────────────────────────────

function isValidEmail(v: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim());
}

/** Accepts: 03XX-XXXXXXX, +923XXXXXXXXX, 923XXXXXXXXX, 03XXXXXXXXX … */
function isValidPakistaniPhone(v: string): boolean {
  const digits = v.replace(/\D/g, "");
  // After stripping country code we need exactly 10 digits starting with 3
  if (digits.startsWith("0092")) return /^00923\d{9}$/.test(digits);
  if (digits.startsWith("92")) return /^923\d{9}$/.test(digits);
  if (digits.startsWith("0")) return /^03\d{9}$/.test(digits);
  return false;
}

function isValidPassword(v: string): boolean {
  return v.length >= 6 && /[A-Z]/.test(v);
}

// ── Field wrapper ──────────────────────────────────────────────────────────

interface FieldProps {
  label: string;
  error?: string;
  children: React.ReactNode;
}
function Field({ label, error, children }: FieldProps) {
  return (
    <div>
      <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">
        {label}
      </label>
      {children}
      {error && (
        <p className="mt-1 text-xs text-red-500 font-medium">{error}</p>
      )}
    </div>
  );
}

// ── Input row ──────────────────────────────────────────────────────────────

interface InputRowProps extends React.InputHTMLAttributes<HTMLInputElement> {
  icon: React.ReactNode;
  hasError?: boolean;
  suffix?: React.ReactNode;
}
function InputRow({ icon, hasError, suffix, ...rest }: InputRowProps) {
  return (
    <div
      className={`flex items-center gap-2 bg-slate-50 border rounded-2xl px-4 py-1.5 transition-all focus-within:ring-1 ${hasError
        ? "border-red-400 focus-within:border-red-400 focus-within:ring-red-400"
        : "border-slate-200 focus-within:border-primary focus-within:ring-primary"
        }`}
    >
      <span className="text-slate-400 shrink-0">{icon}</span>
      <input
        className="flex-1 bg-transparent h-11 text-sm outline-none text-slate-800 placeholder:text-slate-400"
        {...rest}
      />
      {suffix}
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────────────────

export function AuthModal() {
  const {
    authModalMode,
    setAuthModalMode,
    isLoading,
    login,
    signup,
    requestPasswordReset,
  } = useAuth();

  // Form state
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [verificationChannel, setVerificationChannel] = useState<"email" | "phone">("email");

  // Validation errors
  const [errors, setErrors] = useState<Record<string, string>>({});

  // API error banner
  const [apiError, setApiError] = useState("");

  const resetForm = useCallback(() => {
    setName(""); setEmail(""); setPhone(""); setPassword("");
    setErrors({}); setApiError(""); setShowPassword(false);
    setVerificationChannel("email");
  }, []);

  const switchMode = useCallback(
    (mode: "login" | "signup" | "forgot") => {
      resetForm();
      setAuthModalMode(mode);
    },
    [resetForm, setAuthModalMode],
  );

  const handleClose = useCallback(() => {
    setAuthModalMode(null);
    resetForm();
  }, [setAuthModalMode, resetForm]);

  if (!authModalMode) return null;

  // ── Validation ──────────────────────────────────────────────────────────

  function validateLogin() {
    const e: Record<string, string> = {};
    if (!email.trim()) e.email = "Email is required.";
    else if (!isValidEmail(email)) e.email = "Enter a valid email address.";
    if (!password) e.password = "Password is required.";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function validateSignup() {
    const e: Record<string, string> = {};
    if (!name.trim()) e.name = "Full name is required.";
    if (!phone.trim()) e.phone = "Phone number is required.";
    else if (!isValidPakistaniPhone(phone))
      e.phone = "Enter a valid Pakistani number (e.g. 0300 1234567).";
    if (!email.trim()) e.email = "Email is required.";
    else if (!isValidEmail(email)) e.email = "Enter a valid email address.";
    if (!password) e.password = "Password is required.";
    else if (!isValidPassword(password))
      e.password = "Min 6 characters with at least 1 uppercase letter.";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function validateForgot() {
    const e: Record<string, string> = {};
    if (!email.trim()) e.email = "Email is required.";
    else if (!isValidEmail(email)) e.email = "Enter a valid email address.";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  // ── Submit ──────────────────────────────────────────────────────────────

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setApiError("");

    try {
      if (authModalMode === "login") {
        if (!validateLogin()) return;
        await login(email, password);
        resetForm();
      } else if (authModalMode === "signup") {
        if (!validateSignup()) return;
        const payload: SignupPayload = {
          name: name.trim(),
          email,
          phone,
          password,
          verificationChannel,
        };
        await signup(payload);
        resetForm();
      } else if (authModalMode === "forgot") {
        if (!validateForgot()) return;
        await requestPasswordReset(email);
        resetForm();
      }
    } catch (err) {
      setApiError(extractApiError(err));
    }
  }

  // ── Headings ────────────────────────────────────────────────────────────

  const headings = {
    login: { title: "Welcome Back", sub: "Sign in to access your bookings & store orders" },
    signup: { title: "Create Account", sub: "Join Ustaad Pro to get professional home services" },
    forgot: { title: "Forgot Password", sub: "Enter your email and we'll send a reset code" },
  };
  const { title, sub } = headings[authModalMode];

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm transition-opacity"
        onClick={handleClose}
      />

      {/* Modal */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="fixed inset-x-4 top-1/2 z-[110] max-w-md mx-auto -translate-y-1/2 bg-white rounded-3xl shadow-2xl overflow-hidden border border-slate-100 animate-in fade-in zoom-in-95 duration-200"
      >
        {/* Back button (forgot mode) */}
        {authModalMode === "forgot" && (
          <button
            onClick={() => switchMode("login")}
            className="absolute left-4 top-4 p-1.5 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors z-10"
            aria-label="Back to login"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
        )}

        {/* Close button */}
        <button
          onClick={handleClose}
          className="absolute right-4 top-4 p-1.5 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors z-10"
          aria-label="Close dialog"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="p-8">
          {/* Header */}
          <div className="text-center mb-6">
            <h2 className="text-2xl font-black text-slate-900">{title}</h2>
            <p className="text-sm text-slate-500 mt-1.5">{sub}</p>
          </div>

          {/* API error banner */}
          {apiError && (
            <div className="mb-4 px-4 py-3 bg-red-50 border border-red-200 rounded-2xl text-sm text-red-600 font-medium">
              {apiError}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            {/* ── Signup-only fields ── */}
            {authModalMode === "signup" && (
              <>
                <Field label="Full Name" error={errors.name}>
                  <InputRow
                    id="auth-name"
                    icon={<User className="h-4 w-4" />}
                    type="text"
                    autoComplete="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Abdullah Siraj"
                    hasError={!!errors.name}
                  />
                </Field>

                <Field label="Phone Number" error={errors.phone}>
                  <InputRow
                    id="auth-phone"
                    icon={<Phone className="h-4 w-4" />}
                    type="tel"
                    autoComplete="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="e.g. 0300 1234567"
                    hasError={!!errors.phone}
                  />
                </Field>
              </>
            )}

            {/* ── Email ── */}
            <Field label="Email Address" error={errors.email}>
              <InputRow
                id="auth-email"
                icon={<Mail className="h-4 w-4" />}
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                hasError={!!errors.email}
              />
            </Field>

            {/* ── Password (login & signup only) ── */}
            {authModalMode !== "forgot" && (
              <Field label="Password" error={errors.password}>
                <InputRow
                  id="auth-password"
                  icon={<Lock className="h-4 w-4" />}
                  type={showPassword ? "text" : "password"}
                  autoComplete={authModalMode === "login" ? "current-password" : "new-password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  hasError={!!errors.password}
                  suffix={
                    <button
                      type="button"
                      onClick={() => setShowPassword((p) => !p)}
                      className="text-slate-400 hover:text-slate-600 shrink-0"
                      aria-label={showPassword ? "Hide password" : "Show password"}
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  }
                />
              </Field>
            )}

            {/* ── Channel Selector (signup only) ── */}
            {authModalMode === "signup" && (
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                  Verification Channel
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setVerificationChannel("email")}
                    className={`flex flex-col items-center justify-center p-3 rounded-2xl border-2 text-center transition-all ${verificationChannel === "email"
                      ? "border-primary bg-primary/5 text-primary"
                      : "border-slate-200 hover:border-slate-300 text-slate-500"
                      }`}
                  >
                    <Mail className="h-5 w-5 mb-1" />
                    <span className="text-sm font-bold">Email</span>
                    <span className="text-[10px] text-slate-400">OTP via Email</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setVerificationChannel("phone")}
                    className={`flex flex-col items-center justify-center p-3 rounded-2xl border-2 text-center transition-all ${verificationChannel === "phone"
                      ? "border-primary bg-primary/5 text-primary"
                      : "border-slate-200 hover:border-slate-300 text-slate-500"
                      }`}
                  >
                    <Phone className="h-5 w-5 mb-1" />
                    <span className="text-sm font-bold">SMS</span>
                    <span className="text-[10px] text-slate-400">OTP via SMS</span>
                  </button>
                </div>
              </div>
            )}

            {/* ── Forgot password link (login mode) ── */}
            {authModalMode === "login" && (
              <div className="text-right -mt-1">
                <button
                  type="button"
                  onClick={() => switchMode("forgot")}
                  className="text-xs font-semibold text-primary hover:text-emerald-700 transition-colors"
                >
                  Forgot password?
                </button>
              </div>
            )}

            {/* ── Submit button ── */}
            <button
              type="submit"
              id="auth-submit"
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-2 bg-primary hover:bg-emerald-700 text-white font-bold py-3.5 rounded-2xl text-sm transition-all shadow-lg shadow-primary/20 disabled:opacity-60 mt-2"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Please wait…
                </>
              ) : (
                <>
                  {authModalMode === "login"
                    ? "Sign In"
                    : authModalMode === "signup"
                      ? "Create Account"
                      : "Send Reset Code"}
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </form>

          {/* ── Footer toggle ── */}
          <div className="text-center mt-6 pt-5 border-t border-slate-100">
            {authModalMode === "login" ? (
              <button
                onClick={() => switchMode("signup")}
                className="text-xs font-semibold text-primary hover:text-emerald-700 transition-colors"
              >
                New to Ustaad Pro? Create an account
              </button>
            ) : authModalMode === "signup" ? (
              <button
                onClick={() => switchMode("login")}
                className="text-xs font-semibold text-primary hover:text-emerald-700 transition-colors"
              >
                Already have an account? Sign in
              </button>
            ) : (
              <button
                onClick={() => switchMode("login")}
                className="text-xs font-semibold text-primary hover:text-emerald-700 transition-colors"
              >
                Back to Sign In
              </button>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
