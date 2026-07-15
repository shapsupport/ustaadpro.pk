"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { navItems } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { Menu, MapPin, ChevronDown, UserRound, LogIn, LogOut, Settings } from "lucide-react";
import { MobileNav } from "./MobileNav";
import { useLocation } from "@/context/LocationContext";
import { useAuth } from "@/context/AuthContext";
import { UserProfileModal } from "@/components/auth/UserProfileModal";

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const pathname = usePathname();
  const { location, setShowPicker } = useLocation();
  const { user, setAuthModalMode } = useAuth();

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <>
      <header
        className={cn(
          "fixed top-0 left-0 right-0 z-50 transition-all duration-300",
          scrolled
            ? "border-b border-slate-100 bg-white/95 shadow-sm backdrop-blur-md py-1"
            : "bg-white/80 backdrop-blur-sm py-2"
        )}
      >
        <nav
          className="max-w-7xl mx-auto flex h-20 items-center justify-between px-4 sm:px-6 lg:px-8"
          aria-label="Main navigation"
        >
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3 shrink-0" aria-label="Ustaad Pro Home">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-emerald-700 shadow-md shadow-primary/20">
              <span className="text-xl font-black text-white">U</span>
            </div>
            <span className="text-2xl font-black tracking-tight text-slate-900">
              Ustaad<span className="text-primary font-bold">Pro</span>
            </span>
          </Link>

          {/* Center Links - cleaner, spaced out */}
          <div className="hidden items-center gap-2 lg:flex">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "rounded-xl px-4 py-2.5 text-sm font-semibold transition-all hover:bg-emerald-50 hover:text-primary",
                  pathname === item.href ? "bg-emerald-50 text-primary" : "text-slate-600"
                )}
              >
                {item.label}
              </Link>
            ))}
          </div>

          {/* Right Actions */}
          <div className="flex items-center gap-3">
            {/* Location selector */}
            <button
              onClick={() => setShowPicker(true)}
              className="hidden items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2.5 text-xs font-semibold text-slate-600 shadow-sm hover:border-primary hover:text-primary transition-all md:flex cursor-pointer"
            >
              <MapPin className="h-4 w-4 text-primary" />
              <span className="max-w-[150px] truncate font-semibold text-slate-700">{location.shortLabel || location.label || "Set location"}</span>
              <ChevronDown className="h-3 w-3 opacity-60" />
            </button>

            {/* Auth section */}
            {user ? (
              <button
                onClick={() => setProfileOpen(true)}
                className="flex items-center gap-2 bg-gradient-to-br from-primary to-emerald-700 text-white font-bold h-11 px-4 rounded-2xl shadow-md shadow-primary/10 hover:opacity-90 transition-all cursor-pointer"
              >
                <div className="h-8 w-8 bg-white/20 rounded-full flex items-center justify-center">
                  <UserRound className="h-4 w-4" />
                </div>
                <span className="text-xs max-w-[80px] truncate hidden sm:inline">{user.name}</span>
              </button>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setAuthModalMode("login")}
                  className="px-4 h-11 text-xs font-bold text-slate-700 hover:text-primary transition-colors cursor-pointer"
                >
                  Sign In
                </button>
                <button
                  onClick={() => setAuthModalMode("signup")}
                  className="bg-primary hover:bg-emerald-700 text-white font-bold h-11 px-5 rounded-2xl text-xs shadow-md shadow-primary/20 transition-all cursor-pointer"
                >
                  Sign Up
                </button>
              </div>
            )}

            {/* Mobile menu button */}
            <button
              className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-200 text-slate-600 hover:bg-slate-50 lg:hidden cursor-pointer"
              onClick={() => setMobileOpen(true)}
              aria-label="Open menu"
            >
              <Menu className="h-5 w-5" />
            </button>
          </div>
        </nav>
      </header>

      {/* User profile details modal */}
      <UserProfileModal open={profileOpen} onClose={() => setProfileOpen(false)} />

      <MobileNav open={mobileOpen} onClose={() => setMobileOpen(false)} />
    </>
  );
}
