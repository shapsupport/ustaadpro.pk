"use client";

import { ShieldCheck, LogIn, UserPlus, ArrowRight } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";

export function AuthRequiredCard() {
  const { setAuthModalMode } = useAuth();

  return (
    <div className="flex min-h-[70vh] items-center justify-center px-4 py-16">
      <div className="w-full max-w-md">
        {/* Icon */}
        <div className="mb-6 flex justify-center">
          <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-emerald-50 ring-1 ring-emerald-200">
            <ShieldCheck className="h-10 w-10 text-emerald-600" />
          </div>
        </div>

        {/* Heading */}
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-black text-slate-900">Sign in to continue</h1>
          <p className="mt-2 text-sm leading-6 text-slate-500">
            Please sign in or create an account to place your booking. Your cart and service details are saved.
          </p>
        </div>

        {/* Actions */}
        <div className="space-y-3">
          <Button
            onClick={() => setAuthModalMode("login")}
            className="w-full gap-2 rounded-2xl bg-primary py-6 text-base font-bold shadow-lg shadow-primary/20 hover:bg-emerald-700"
          >
            <LogIn className="h-5 w-5" />
            Sign In
            <ArrowRight className="ml-auto h-4 w-4" />
          </Button>

          <Button
            variant="outline"
            onClick={() => setAuthModalMode("signup")}
            className="w-full gap-2 rounded-2xl border-slate-200 py-6 text-base font-bold text-slate-700 hover:bg-slate-50 hover:text-slate-900"
          >
            <UserPlus className="h-5 w-5" />
            Create Account
          </Button>
        </div>

        {/* Footer note */}
        <p className="mt-6 text-center text-xs text-slate-400">
          By continuing, you agree to our{" "}
          <a href="/terms" className="underline hover:text-slate-600">
            Terms
          </a>{" "}
          and{" "}
          <a href="/privacy-policy" className="underline hover:text-slate-600">
            Privacy Policy
          </a>
          .
        </p>
      </div>
    </div>
  );
}
