"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { navItems } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { Menu, MapPin, ChevronDown, UserRound } from "lucide-react";
import { MobileNav } from "./MobileNav";
import { useLocation } from "@/context/LocationContext";
import { useAuth } from "@/context/AuthContext";
import { UserProfileModal } from "@/components/auth/UserProfileModal";

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [navHidden, setNavHidden] = useState(false);
  const lastScrollY = useRef(0);

  const pathname = usePathname();
  const { location, setShowPicker } = useLocation();
  const { user, setAuthModalMode } = useAuth();
  const isDetailPage = /^\/(services|store)\/[^/]+$/.test(pathname);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      setScrolled(currentScrollY > 10);

      if (!isDetailPage || currentScrollY <= 80) {
        setNavHidden(false);
      } else if (Math.abs(currentScrollY - lastScrollY.current) > 8) {
        setNavHidden(currentScrollY > lastScrollY.current);
      }
      lastScrollY.current = currentScrollY;
    };

    lastScrollY.current = window.scrollY;
    window.addEventListener("scroll", handleScroll, { passive: true });

    return () => window.removeEventListener("scroll", handleScroll);
  }, [isDetailPage]);

  return (
    <>
      <header
        className={cn(
          "fixed top-0 left-0 right-0 z-50 transition-all duration-300",
          isDetailPage && navHidden && !mobileOpen && !profileOpen
            ? "-translate-y-full"
            : "translate-y-0",
          scrolled
            ? "border-b border-slate-100 bg-white/95 shadow-sm backdrop-blur-md py-1"
            : "bg-white/80 backdrop-blur-sm py-2"
        )}
      >
        <nav
          className="mx-auto flex h-20 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8"
          aria-label="Main navigation"
        >
          {/* Logo */}
          <Link
            href="/"
            className="flex shrink-0 items-center gap-3"
            aria-label="Ustaad Pro Home"
          >
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-emerald-700 shadow-md shadow-primary/20">
              <span className="text-xl font-black text-white">U</span>
            </div>

            <span className="text-2xl font-black tracking-tight text-slate-900">
              Ustaad<span className="font-bold text-primary">Pro</span>
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden items-center gap-2 lg:flex">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "rounded-xl px-4 py-2.5 text-sm font-semibold transition-all hover:bg-emerald-50 hover:text-primary",
                  pathname === item.href
                    ? "bg-emerald-50 text-primary"
                    : "text-slate-600"
                )}
              >
                {item.label}
              </Link>
            ))}
          </div>

          {/* Right Side */}
          <div className="flex items-center gap-3">
            {/* Location */}
            <button
              onClick={() => setShowPicker(true)}
              className="hidden cursor-pointer items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-600 shadow-sm transition-all hover:border-primary hover:text-primary md:flex"
            >
              <MapPin className="h-4 w-4 text-primary" />

              <span className="max-w-[150px] truncate font-semibold text-slate-700">
                {location.shortLabel ||
                  location.label ||
                  "Set location"}
              </span>

              <ChevronDown className="h-3 w-3 opacity-60" />
            </button>

            {/* Desktop User/Profile */}
            {user ? (
              <button
                onClick={() => setProfileOpen(true)}
                className="hidden lg:flex items-center gap-2 rounded-2xl bg-gradient-to-br from-primary to-emerald-700 px-4 h-11 font-bold text-white shadow-md shadow-primary/10 transition-all hover:opacity-90 cursor-pointer"
              >
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/20">
                  <UserRound className="h-4 w-4" />
                </div>

                <span className="max-w-[80px] truncate text-sm">
                  {user.name}
                </span>
              </button>
            ) : (
              <div className="hidden lg:flex items-center gap-2">
                <button
                  onClick={() => setAuthModalMode("login")}
                  className="h-11 px-4 text-sm font-bold text-slate-700 transition-colors hover:text-primary cursor-pointer"
                >
                  Sign In
                </button>

                <button
                  onClick={() => setAuthModalMode("signup")}
                  className="h-11 rounded-2xl bg-primary px-5 text-sm font-bold text-white shadow-md shadow-primary/20 transition-all hover:bg-emerald-700 cursor-pointer"
                >
                  Sign Up
                </button>
              </div>
            )}

            {/* Mobile Hamburger */}
            <button
              className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-200 text-slate-600 transition hover:bg-slate-50 lg:hidden cursor-pointer"
              onClick={() => setMobileOpen(true)}
              aria-label="Open menu"
            >
              <Menu className="h-5 w-5" />
            </button>
          </div>
        </nav>
      </header>

      <UserProfileModal
        open={profileOpen}
        onClose={() => setProfileOpen(false)}
      />

      <MobileNav
        open={mobileOpen}
        onClose={() => setMobileOpen(false)}
      />
    </>
  );
}
