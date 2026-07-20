"use client";

import {
  useState,
  useRef,
  useCallback,
  useEffect,
  type ClipboardEvent,
  type KeyboardEvent,
} from "react";
import {
  X,
  Loader2,
  ShieldCheck,
  Lock,
  Eye,
  EyeOff,
  RefreshCw,
} from "lucide-react";
import { useAuth, extractApiError } from "@/context/AuthContext";
import { signupUser, requestPasswordResetOtp } from "@/services/authService";

const OTP_LENGTH = 6;
const RESEND_SECONDS = 180; // 3 minutes

// ── Validation ─────────────────────────────────────────────────────────────

function isValidPassword(v: string): boolean {
  return v.length >= 6 && /[A-Z]/.test(v);
}

// ── Component ──────────────────────────────────────────────────────────────

export function OtpModal() {
  const {
    otpModal,
    closeOtpModal,
    verifySignupOtp,
    resetPassword,
    isLoading,
  } = useAuth();

  // 6-digit OTP inputs
  const [otp, setOtp] = useState<string[]>(Array(OTP_LENGTH).fill(""));
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // New-password field (forgot-password mode)
  const [newPassword, setNewPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [passwordError, setPasswordError] = useState("");

  // Resend timer
  const [resendTimer, setResendTimer] = useState(RESEND_SECONDS);
  const [canResend, setCanResend] = useState(false);
  const [resending, setResending] = useState(false);
  const [resendSuccess, setResendSuccess] = useState("");

  // API / submit errors
  const [apiError, setApiError] = useState("");

  // Focus first input when modal opens
  useEffect(() => {
    if (otpModal) {
      setOtp(Array(OTP_LENGTH).fill(""));
      setApiError("");
      setNewPassword("");
      setPasswordError("");
      setResendTimer(RESEND_SECONDS);
      setCanResend(false);
      setResendSuccess("");
      setTimeout(() => inputRefs.current[0]?.focus(), 80);
    }
  }, [otpModal?.mode]); // re-init when mode changes

  // Countdown timer
  useEffect(() => {
    if (!otpModal || resendTimer <= 0) {
      setCanResend(true);
      return;
    }
    setCanResend(false);
    const id = setInterval(() => {
      setResendTimer((t) => {
        if (t <= 1) {
          setCanResend(true);
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [otpModal, resendTimer > 0]);

  // ── Resend OTP (must be above early-return to obey Rules of Hooks) ───────

  const handleResend = useCallback(async () => {
    if (!canResend || resending || !otpModal) return;
    setResending(true);
    setApiError("");
    setResendSuccess("");
    try {
      setCanResend(false);
      setResendTimer(RESEND_SECONDS);
      setOtp(["", "", "", "", "", ""]);
      setTimeout(() => inputRefs.current[0]?.focus(), 50);

      if (otpModal.mode === "signup-verify") {
        // await authService.signupUser(pendingSignup)
        setResendSuccess(`A new verification code has been sent to your ${otpModal.verificationChannel === "phone" ? "phone" : "email"}.`);
      } else if (otpModal.mode === "forgot-password-verify") {
        await requestPasswordResetOtp({
          email: otpModal.email,
          channel: otpModal.verificationChannel,
        });
        setResendSuccess(`A new code has been sent to your ${otpModal.verificationChannel === "phone" ? "phone" : "email"}.`);
      }
    } catch (err) {
      setApiError(extractApiError(err));
    } finally {
      setResending(false);
    }
  }, [canResend, resending, otpModal]);

  if (!otpModal) return null;

  // ── OTP input handlers ────────────────────────────────────────────────

  function updateDigit(index: number, value: string) {
    const cleaned = value.replace(/\D/g, "").slice(-1);
    const next = [...otp];
    next[index] = cleaned;
    setOtp(next);
    setApiError("");
    if (cleaned && index < OTP_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  }

  function handleKeyDown(index: number, e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Backspace") {
      if (otp[index]) {
        const next = [...otp];
        next[index] = "";
        setOtp(next);
      } else if (index > 0) {
        inputRefs.current[index - 1]?.focus();
      }
    } else if (e.key === "ArrowLeft" && index > 0) {
      inputRefs.current[index - 1]?.focus();
    } else if (e.key === "ArrowRight" && index < OTP_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  }

  function handlePaste(e: ClipboardEvent<HTMLInputElement>) {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, OTP_LENGTH);
    if (!pasted) return;
    const next = Array(OTP_LENGTH).fill("");
    pasted.split("").forEach((ch, i) => { next[i] = ch; });
    setOtp(next);
    // focus last filled or last input
    const focusIdx = Math.min(pasted.length, OTP_LENGTH - 1);
    setTimeout(() => inputRefs.current[focusIdx]?.focus(), 0);
  }

  // ── Resend handler is defined above the early return (Rules of Hooks) ───

  // ── Submit ────────────────────────────────────────────────────────────

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setApiError("");
    setPasswordError("");

    const currentModal = otpModal;
    if (!currentModal) return;

    const code = otp.join("");
    if (code.length < OTP_LENGTH) {
      setApiError("Please enter all 6 digits.");
      return;
    }

    if (currentModal.mode === "forgot-password-verify") {
      if (!isValidPassword(newPassword)) {
        setPasswordError("Min 6 characters with at least 1 uppercase letter.");
        return;
      }
    }

    try {
      if (currentModal.mode === "signup-verify") {
        await verifySignupOtp(code);
      } else if (currentModal.mode === "forgot-password-verify") {
        await resetPassword(code, newPassword);
      }
    } catch (err) {
      setApiError(extractApiError(err));
      // Clear OTP digits on error so user can re-enter
      setOtp(Array(OTP_LENGTH).fill(""));
      setTimeout(() => inputRefs.current[0]?.focus(), 50);
    }
  }

  // ── Headings ──────────────────────────────────────────────────────────

  const isForgot = otpModal.mode === "forgot-password-verify";
  const heading = isForgot ? "Reset Password" : "Verify Your Account";
  const subtext = isForgot
    ? "Enter the code sent to reset your password"
    : "Enter the verification code we sent to";

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-[120] bg-black/60 backdrop-blur-sm"
        onClick={closeOtpModal}
      />

      {/* Modal */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label={heading}
        className="fixed inset-x-4 top-1/2 z-[130] max-w-md mx-auto -translate-y-1/2 bg-white rounded-3xl shadow-2xl overflow-hidden border border-slate-100 animate-in fade-in zoom-in-95 duration-200"
      >
        {/* Close button */}
        <button
          onClick={closeOtpModal}
          className="absolute right-4 top-4 p-1.5 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors z-10"
          aria-label="Close"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="p-8">
          {/* Icon + Header */}
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-primary/10 mb-4">
              {isForgot ? (
                <Lock className="h-7 w-7 text-primary" />
              ) : (
                <ShieldCheck className="h-7 w-7 text-primary" />
              )}
            </div>
            <h2 className="text-2xl font-black text-slate-900">{heading}</h2>
            <p className="text-sm text-slate-500 mt-1.5">
              {subtext}{" "}
              {!isForgot && (
                <span className="font-semibold text-slate-700">
                  {otpModal.maskedContact}
                </span>
              )}
            </p>
            {isForgot && (
              <p className="text-sm text-slate-500 mt-0.5">
                Sent to{" "}
                <span className="font-semibold text-slate-700">
                  {otpModal.maskedContact}
                </span>
              </p>
            )}
          </div>

          {/* API error */}
          {apiError && (
            <div className="mb-4 px-4 py-3 bg-red-50 border border-red-200 rounded-2xl text-sm text-red-600 font-medium">
              {apiError}
            </div>
          )}

          {/* Email/SMS delivery warning — shown when delivery failed, OTP is in backend console */}
          {otpModal.emailWarning && (
            <div className="mb-4 px-4 py-3 bg-amber-50 border border-amber-300 rounded-2xl text-sm text-amber-800 font-medium">
              ⚠️ {otpModal.emailWarning.replace("email", otpModal.verificationChannel === "phone" ? "SMS" : "email")}
            </div>
          )}

          {/* Resend success */}
          {resendSuccess && (
            <div className="mb-4 px-4 py-3 bg-green-50 border border-green-200 rounded-2xl text-sm text-green-700 font-medium">
              {resendSuccess}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* ── 6 digit inputs ── */}
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 text-center">
                Verification Code
              </label>
              <div className="flex gap-2 justify-center">
                {otp.map((digit, i) => (
                  <input
                    key={i}
                    ref={(el) => { inputRefs.current[i] = el; }}
                    id={`otp-digit-${i}`}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => updateDigit(i, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(i, e)}
                    onPaste={handlePaste}
                    onFocus={(e) => e.target.select()}
                    aria-label={`Digit ${i + 1}`}
                    className={`w-11 h-14 text-center text-xl font-black rounded-2xl border-2 outline-none transition-all bg-slate-50 text-slate-800 caret-transparent
                      ${digit
                        ? "border-primary bg-primary/5 text-primary"
                        : "border-slate-200 focus:border-primary focus:ring-1 focus:ring-primary"
                      }`}
                  />
                ))}
              </div>
            </div>

            {/* ── New password (forgot mode) ── */}
            {isForgot && (
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                  New Password
                </label>
                <div
                  className={`flex items-center gap-2 bg-slate-50 border rounded-2xl px-4 py-1.5 transition-all focus-within:ring-1 ${passwordError
                    ? "border-red-400 focus-within:ring-red-400"
                    : "border-slate-200 focus-within:border-primary focus-within:ring-primary"
                  }`}
                >
                  <Lock className="h-4 w-4 text-slate-400 shrink-0" />
                  <input
                    id="otp-new-password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="new-password"
                    value={newPassword}
                    onChange={(e) => { setNewPassword(e.target.value); setPasswordError(""); }}
                    placeholder="New password"
                    className="flex-1 bg-transparent h-11 text-sm outline-none text-slate-800 placeholder:text-slate-400"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((p) => !p)}
                    className="text-slate-400 hover:text-slate-600 shrink-0"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {passwordError && (
                  <p className="mt-1 text-xs text-red-500 font-medium">{passwordError}</p>
                )}
                <p className="mt-1.5 text-xs text-slate-400">
                  Min 6 characters, at least 1 uppercase letter.
                </p>
              </div>
            )}

            {/* ── Submit ── */}
            <button
              type="submit"
              id="otp-submit"
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-2 bg-primary hover:bg-emerald-700 text-white font-bold py-3.5 rounded-2xl text-sm transition-all shadow-lg shadow-primary/20 disabled:opacity-60"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Verifying…
                </>
              ) : isForgot ? (
                "Reset Password"
              ) : (
                "Verify & Continue"
              )}
            </button>
          </form>

          {/* ── Resend ── */}
          <div className="mt-5 text-center">
            {resendTimer > 0 ? (
              <p className="text-xs text-slate-400">
                Resend code in{" "}
                <span className="font-bold text-slate-600 tabular-nums">
                  {Math.floor(resendTimer / 60)}:{(resendTimer % 60).toString().padStart(2, '0')}
                </span>
              </p>
            ) : (
              <button
                type="button"
                onClick={handleResend}
                disabled={resending}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:text-emerald-700 transition-colors disabled:opacity-50"
              >
                <RefreshCw className={`h-3.5 w-3.5 ${resending ? "animate-spin" : ""}`} />
                Resend Code
              </button>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
