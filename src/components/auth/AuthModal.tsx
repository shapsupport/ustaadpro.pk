"use client";

import { useState } from "react";
import { X, Mail, Lock, User, Phone, Loader2, ArrowRight } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

export function AuthModal() {
  const { authModalMode, setAuthModalMode, login, signup } = useAuth();
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");

  if (!authModalMode) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      if (authModalMode === "login") {
        login(email);
      } else {
        signup(name, email, phone);
      }
      setLoading(false);
      // Reset form
      setName("");
      setEmail("");
      setPhone("");
      setPassword("");
    }, 800);
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm transition-opacity"
        onClick={() => setAuthModalMode(null)}
      />

      {/* Modal */}
      <div
        role="dialog"
        aria-modal="true"
        className="fixed inset-x-4 top-1/2 z-[110] max-w-md mx-auto -translate-y-1/2 bg-white rounded-3xl shadow-2xl overflow-hidden border border-slate-100 animate-in fade-in zoom-in-95 duration-200"
      >
        {/* Close Button */}
        <button
          onClick={() => setAuthModalMode(null)}
          className="absolute right-4 top-4 p-1.5 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors z-10"
          aria-label="Close dialog"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="p-8">
          {/* Header */}
          <div className="text-center mb-6">
            <h2 className="text-2xl font-black text-slate-900">
              {authModalMode === "login" ? "Welcome Back" : "Create Account"}
            </h2>
            <p className="text-sm text-slate-500 mt-1.5">
              {authModalMode === "login"
                ? "Sign in to access your Ustaad Pro bookings & store orders"
                : "Join Ustaad Pro to get professional home services at your doorstep"}
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {authModalMode === "signup" && (
              <>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                    Full Name
                  </label>
                  <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-2xl px-4 py-1.5 focus-within:border-primary focus-within:ring-1 focus-within:ring-primary transition-all">
                    <User className="h-4 w-4 text-slate-400 shrink-0" />
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g. Abdullah Siraj"
                      className="flex-1 bg-transparent h-11 text-sm outline-none text-slate-800 placeholder:text-slate-400"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                    Phone Number
                  </label>
                  <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-2xl px-4 py-1.5 focus-within:border-primary focus-within:ring-1 focus-within:ring-primary transition-all">
                    <Phone className="h-4 w-4 text-slate-400 shrink-0" />
                    <input
                      type="tel"
                      required
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="e.g. +92 300 1234567"
                      className="flex-1 bg-transparent h-11 text-sm outline-none text-slate-800 placeholder:text-slate-400"
                    />
                  </div>
                </div>
              </>
            )}

            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                Email Address
              </label>
              <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-2xl px-4 py-1.5 focus-within:border-primary focus-within:ring-1 focus-within:ring-primary transition-all">
                <Mail className="h-4 w-4 text-slate-400 shrink-0" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="flex-1 bg-transparent h-11 text-sm outline-none text-slate-800 placeholder:text-slate-400"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                Password
              </label>
              <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-2xl px-4 py-1.5 focus-within:border-primary focus-within:ring-1 focus-within:ring-primary transition-all">
                <Lock className="h-4 w-4 text-slate-400 shrink-0" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="flex-1 bg-transparent h-11 text-sm outline-none text-slate-800 placeholder:text-slate-400"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 bg-primary hover:bg-emerald-700 text-white font-bold py-3.5 rounded-2xl text-sm transition-all shadow-lg shadow-primary/20 disabled:opacity-50 mt-2"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Please wait…
                </>
              ) : (
                <>
                  {authModalMode === "login" ? "Sign In" : "Sign Up"}
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </form>

          {/* Toggle Link */}
          <div className="text-center mt-6 pt-5 border-t border-slate-100">
            <button
              onClick={() => setAuthModalMode(authModalMode === "login" ? "signup" : "login")}
              className="text-xs font-semibold text-primary hover:text-emerald-700 transition-colors"
            >
              {authModalMode === "login"
                ? "New to Ustaad Pro? Create an account"
                : "Already have an account? Sign in"}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
