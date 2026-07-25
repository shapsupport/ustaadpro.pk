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
  Check,
  Circle,
} from "lucide-react";
import { useAuth, extractApiError } from "@/context/AuthContext";
import type { SignupPayload } from "@/services/authService";

// ── Validation helpers ─────────────────────────────────────────────────────

function isValidEmail(v: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim());
}

function formatNameInput(v: string): string {
  return v.replace(/[^\p{L}\s]/gu, "");
}

function hasMinimumNameLength(v: string): boolean {
  return v.replace(/\s/g, "").length >= 3;
}

/** Accepts Pakistani mobile numbers as 03XXXXXXXXX, +923XXXXXXXXX, or 3XXXXXXXXX. */
function isValidPakistaniPhone(v: string): boolean {
  return /^(?:03\d{9}|\+923\d{9}|3\d{9})$/.test(v.trim());
}

function formatPakistaniPhoneInput(v: string): string {
  const cleaned = v.replace(/[^\d+]/g, "");
  const withSingleLeadingPlus = cleaned.startsWith("+")
    ? `+${cleaned.slice(1).replace(/\+/g, "")}`
    : cleaned.replace(/\+/g, "");

  if (withSingleLeadingPlus.startsWith("+")) {
    return withSingleLeadingPlus.slice(0, 13);
  }
  if (withSingleLeadingPlus.startsWith("0")) {
    return withSingleLeadingPlus.slice(0, 11);
  }
  return withSingleLeadingPlus.slice(0, 10);
}

function getPakistaniPhoneInputError(v: string): string | undefined {
  if (!v) return undefined;
  if (isValidPakistaniPhone(v)) return undefined;

  const hasPossiblePrefix =
    "03".startsWith(v) ||
    "+923".startsWith(v) ||
    (v.startsWith("03") && v.length <= 11) ||
    (v.startsWith("+923") && v.length <= 13) ||
    (v.startsWith("3") && v.length <= 10);

  return hasPossiblePrefix
    ? "Complete the Pakistani mobile number."
    : "Start with 03, +923, or 3 (without the leading 0).";
}

function isValidPassword(v: string): boolean {
  return (
    v.length >= 6 &&
    /[A-Z]/.test(v) &&
    /[a-z]/.test(v) &&
    /\d/.test(v)
  );
}

const passwordRequirements = [
  { label: "At least 6 characters", test: (v: string) => v.length >= 6 },
  { label: "One uppercase letter", test: (v: string) => /[A-Z]/.test(v) },
  { label: "One lowercase letter", test: (v: string) => /[a-z]/.test(v) },
  { label: "One number", test: (v: string) => /\d/.test(v) },
];

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
    loginWithPhone,
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
  const [loginMethod, setLoginMethod] = useState<"email" | "phone">("email");

  // Validation errors
  const [errors, setErrors] = useState<Record<string, string>>({});

  // API error banner
  const [apiError, setApiError] = useState("");

  const resetForm = useCallback(() => {
    setName(""); setEmail(""); setPhone(""); setPassword("");
    setErrors({}); setApiError(""); setShowPassword(false);
    setVerificationChannel("email"); setLoginMethod("email");
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

  function handlePhoneChange(value: string) {
    const nextPhone = formatPakistaniPhoneInput(value);
    setPhone(nextPhone);
    setErrors((current) => {
      const nextErrors = { ...current };
      const phoneError = getPakistaniPhoneInputError(nextPhone);
      if (phoneError) nextErrors.phone = phoneError;
      else delete nextErrors.phone;
      return nextErrors;
    });
  }

  function handleNameChange(value: string) {
    const nextName = formatNameInput(value);
    setName(nextName);
    setErrors((current) => {
      const nextErrors = { ...current };
      if (nextName && !hasMinimumNameLength(nextName)) {
        nextErrors.name = "Name must contain at least 3 letters.";
      } else {
        delete nextErrors.name;
      }
      return nextErrors;
    });
  }

  function handleSignupEmailChange(value: string) {
    setEmail(value);
    setErrors((current) => {
      const nextErrors = { ...current };
      if (value && !isValidEmail(value)) {
        nextErrors.email = "Enter a valid email address.";
      } else {
        delete nextErrors.email;
      }
      return nextErrors;
    });
  }

  if (!authModalMode) return null;

  // ── Validation ──────────────────────────────────────────────────────────

  function validateLogin() {
    const e: Record<string, string> = {};
    if (loginMethod === "email") {
      const val = email.trim();
      if (!val) e.email = "Email is required.";
      else if (!isValidEmail(val)) e.email = "Enter a valid email address.";
      if (!password) e.password = "Password is required.";
    } else {
      const val = phone.trim();
      if (!val) e.phone = "Phone number is required.";
      else if (!isValidPakistaniPhone(val))
        e.phone = "Enter a valid Pakistani number (e.g. 0300 1234567).";
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function validateSignup() {
    const e: Record<string, string> = {};
    if (!name.trim()) e.name = "Full name is required.";
    else if (!hasMinimumNameLength(name))
      e.name = "Name must contain at least 3 letters.";
    if (!phone.trim()) e.phone = "Phone number is required.";
    else if (!isValidPakistaniPhone(phone))
      e.phone = "Enter a valid Pakistani number (e.g. 0300 1234567).";
    if (!email.trim()) e.email = "Email is required.";
    else if (!isValidEmail(email)) e.email = "Enter a valid email address.";
    if (!password) e.password = "Password is required.";
    else if (!isValidPassword(password))
      e.password = "Complete all four password requirements.";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function validateForgot() {
    const e: Record<string, string> = {};
    if (verificationChannel === "phone") {
      const val = phone.trim();
      if (!val) e.phone = "Phone number is required.";
      else if (!isValidPakistaniPhone(val))
        e.phone = "Enter a valid Pakistani number (e.g. 0300 1234567).";
    } else {
      if (!email.trim()) e.email = "Email is required.";
      else if (!isValidEmail(email)) e.email = "Enter a valid email address.";
    }
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
        if (loginMethod === "phone") {
          await loginWithPhone(phone.trim());
        } else {
          await login(email.trim(), password);
        }
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
        if (verificationChannel === "phone") {
          await requestPasswordReset(phone.trim(), "phone");
        } else {
          await requestPasswordReset(email.trim(), "email");
        }
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
    forgot: { title: "Forgot Password", sub: "Enter your email and choose how to receive the reset code" },
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
        className={`fixed inset-x-3 top-1/2 z-[110] mx-auto -translate-y-1/2 overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-2xl animate-in fade-in zoom-in-95 duration-200 sm:inset-x-4 sm:rounded-3xl ${
          authModalMode === "signup" ? "max-w-2xl" : "max-w-lg"
        }`}
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

        <div className="p-4 sm:p-6">
          {/* Header */}
          <div className="mb-4 pr-8 text-center sm:pr-0">
            <h2 className="text-xl sm:text-2xl font-black text-slate-900">{title}</h2>
            <p className="text-sm text-slate-500 mt-1.5">{sub}</p>
          </div>

          {/* API error banner */}
          {apiError && (
            <div className="mb-4 px-4 py-3 bg-red-50 border border-red-200 rounded-2xl text-sm text-red-600 font-medium">
              {apiError}
            </div>
          )}

          {/* Form */}
          <form
            onSubmit={handleSubmit}
            autoComplete="on"
            className={
              authModalMode === "signup"
                ? "grid gap-3 sm:grid-cols-2 sm:gap-x-5"
                : "space-y-3 sm:space-y-4"
            }
            noValidate
          >
            {/* ── Signup-only fields ── */}
            {authModalMode === "signup" && (
              <>
                <Field label="Full Name" error={errors.name}>
                  <InputRow
                    id="auth-name"
                    icon={<User className="h-4 w-4" />}
                    type="text"
                    name="name"
                    autoComplete="name"
                    value={name}
                    onChange={(e) => handleNameChange(e.target.value)}
                    placeholder="e.g. Abdullah Siraj"
                    aria-invalid={!!errors.name}
                    hasError={!!errors.name}
                  />
                </Field>

                <Field label="Phone Number" error={errors.phone}>
                  <InputRow
                    id="auth-phone"
                    icon={<Phone className="h-4 w-4" />}
                    type="tel"
                    name="tel"
                    inputMode="tel"
                    autoComplete="tel"
                    value={phone}
                    onChange={(e) => handlePhoneChange(e.target.value)}
                    placeholder="03001234567 or +923001234567"
                    aria-invalid={!!errors.phone}
                    hasError={!!errors.phone}
                  />
                </Field>
              </>
            )}

            {/* ── Login: Email / Phone tabs ── */}
            {authModalMode === "login" && (
              <div className="flex items-center gap-1 bg-slate-100 rounded-2xl p-1 mb-1">
                <button
                  type="button"
                  id="login-tab-email"
                  onClick={() => { setLoginMethod("email"); setErrors({}); setApiError(""); }}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-sm font-semibold transition-all ${
                    loginMethod === "email"
                      ? "bg-white text-primary shadow-sm"
                      : "text-slate-500 hover:text-slate-700"
                  }`}
                >
                  <Mail className="h-3.5 w-3.5" />
                  Email
                </button>
                <button
                  type="button"
                  id="login-tab-phone"
                  onClick={() => { setLoginMethod("phone"); setErrors({}); setApiError(""); }}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-sm font-semibold transition-all ${
                    loginMethod === "phone"
                      ? "bg-white text-primary shadow-sm"
                      : "text-slate-500 hover:text-slate-700"
                  }`}
                >
                  <Phone className="h-3.5 w-3.5" />
                  Phone
                </button>
              </div>
            )}

            {/* ── Email input ── */}
            {authModalMode === "login" && loginMethod === "email" ? (
              <Field label="Email Address" error={errors.email}>
                <InputRow
                  id="auth-email"
                  icon={<Mail className="h-4 w-4" />}
                  type="email"
                  name="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  hasError={!!errors.email}
                />
              </Field>
            ) : authModalMode === "login" && loginMethod === "phone" ? (
              <Field label="Phone Number" error={errors.phone}>
                <InputRow
                  id="auth-phone-login"
                  icon={<Phone className="h-4 w-4" />}
                  type="tel"
                  name="tel"
                  autoComplete="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="e.g. 0300 1234567"
                  hasError={!!errors.phone}
                />
              </Field>
            ) : authModalMode === "signup" ? (
              <Field label="Email Address" error={errors.email}>
                <InputRow
                  id="auth-email"
                  icon={<Mail className="h-4 w-4" />}
                  type="email"
                  name="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => handleSignupEmailChange(e.target.value)}
                  placeholder="name@example.com"
                  aria-invalid={!!errors.email}
                  hasError={!!errors.email}
                />
              </Field>
            ) : null}

            {/* ── Password (login email mode & signup only) ── */}
            {(authModalMode === "signup" || (authModalMode === "login" && loginMethod === "email")) && (
              <Field label="Password" error={errors.password}>
                <InputRow
                  id="auth-password"
                  icon={<Lock className="h-4 w-4" />}
                  type={showPassword ? "text" : "password"}
                  name="password"
                  autoComplete={authModalMode === "login" ? "current-password" : "new-password"}
                  value={password}
                  onChange={(e) => {
                    const nextPassword = e.target.value;
                    setPassword(nextPassword);
                    if (authModalMode === "signup" && isValidPassword(nextPassword)) {
                      setErrors((current) => {
                        const nextErrors = { ...current };
                        delete nextErrors.password;
                        return nextErrors;
                      });
                    }
                  }}
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
                {authModalMode === "signup" && (
                  <div className="mt-2 grid grid-cols-2 gap-x-2 gap-y-1" aria-live="polite">
                    {passwordRequirements.map((requirement) => {
                      const met = requirement.test(password);
                      return (
                        <div
                          key={requirement.label}
                          className={`flex items-center gap-1.5 text-[11px] font-medium ${
                            met ? "text-emerald-600" : "text-slate-400"
                          }`}
                        >
                          {met ? (
                            <Check className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                          ) : (
                            <Circle className="h-3 w-3 shrink-0" aria-hidden="true" />
                          )}
                          <span>{requirement.label}</span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </Field>
            )}

            {/* ── Channel Selector (signup & forgot) ── */}
            {(authModalMode === "signup" || authModalMode === "forgot") && (
              <div className={`space-y-1.5 ${authModalMode === "signup" ? "sm:col-span-2" : ""}`}>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                  {authModalMode === "forgot" ? "Receive OTP via" : "Verification Channel"}
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => { setVerificationChannel("email"); setErrors({}); setApiError(""); }}
                    className={`flex flex-col items-center justify-center p-2.5 sm:p-3 rounded-2xl border-2 text-center transition-all ${verificationChannel === "email"
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
                    onClick={() => { setVerificationChannel("phone"); setErrors({}); setApiError(""); }}
                    className={`flex flex-col items-center justify-center p-2.5 sm:p-3 rounded-2xl border-2 text-center transition-all ${verificationChannel === "phone"
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

            {/* ── Forgot: dynamic input based on channel ── */}
            {authModalMode === "forgot" && verificationChannel === "phone" ? (
              <Field label="Phone Number" error={errors.phone}>
                <InputRow
                  id="auth-forgot-phone"
                  icon={<Phone className="h-4 w-4" />}
                  type="tel"
                  name="tel"
                  autoComplete="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="e.g. 0300 1234567"
                  hasError={!!errors.phone}
                />
              </Field>
            ) : authModalMode === "forgot" ? (
              <Field label="Email Address" error={errors.email}>
                <InputRow
                  id="auth-forgot-email"
                  icon={<Mail className="h-4 w-4" />}
                  type="email"
                  name="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  hasError={!!errors.email}
                />
              </Field>
            ) : null}
            {authModalMode === "login" && loginMethod === "email" && (
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
              className={`w-full flex items-center justify-center gap-2 bg-primary hover:bg-emerald-700 text-white font-bold py-3.5 rounded-2xl text-sm transition-all shadow-lg shadow-primary/20 disabled:opacity-60 mt-2 ${
                authModalMode === "signup" ? "sm:col-span-2" : ""
              }`}
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
          <div className="mt-4 border-t border-slate-100 pt-4 text-center sm:mt-6 sm:pt-5">
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
