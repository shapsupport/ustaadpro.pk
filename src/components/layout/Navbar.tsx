"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { navItems } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { Menu, MapPin, ChevronDown, UserRound, ShoppingCart } from "lucide-react";
import { MobileNav } from "./MobileNav";
import { useLocation } from "@/context/LocationContext";
import { useAuth } from "@/context/AuthContext";
import { UserProfileModal } from "@/components/auth/UserProfileModal";
import { useCart } from "@/context/CartContext";
import CartDropdown from "../store/CartDropdown";
import { UniversalSearch } from "@/components/search/UniversalSearch";


export function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [navHidden, setNavHidden] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);
  const lastScrollY = useRef(0);
  const { totalItems } = useCart();

  const pathname = usePathname();
  const { location, setShowPicker } = useLocation();
  const { user, setAuthModalMode } = useAuth();
  const isDetailPage = /^\/(services|store)\/[^/]+$/.test(pathname);
  const searchScope = pathname.startsWith("/store") ? "shop_product" : "service";
  const visibleNavItems = navItems.filter((item) => item.href !== "/track-booking" || Boolean(user));

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
          className="mx-auto flex h-20 max-w-[1760px] items-center justify-between px-3 sm:px-5 lg:px-6"
          aria-label="Main navigation"
        >
          {/* Logo */}
          <Link
            href="/"
            className="flex shrink-0 items-center gap-3"
            aria-label="Ustaad Pro Home"
          >
            <Image
              src="/brand/ustaad-pro-mark.webp"
              alt=""
              width={44}
              height={44}
              priority
              className="h-11 w-11 rounded-xl object-contain shadow-md shadow-primary/15"
            />

            <span className="text-2xl font-black tracking-tight text-slate-900">
              Ustaad<span className="font-bold text-primary">Pro</span>
            </span>
          </Link>

          <div className="mx-3 hidden min-w-0 max-w-[1000px] flex-1 lg:block xl:mx-5">
            <UniversalSearch key={searchScope} defaultScope={searchScope} />
          </div>

          {/* Desktop Navigation */}
          <div className="hidden items-center gap-1 2xl:flex">
            {visibleNavItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "rounded-xl px-3.5 py-2.5 text-sm font-bold transition-all hover:bg-emerald-50 hover:text-primary",
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
              className="hidden cursor-pointer items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-600 shadow-sm transition-all hover:border-primary hover:text-primary xl:flex"
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
                className="hidden xl:flex items-center gap-2 rounded-xl bg-gradient-to-br from-primary to-emerald-700 px-5 h-11 font-bold text-white shadow-md shadow-primary/10 transition-all hover:opacity-90 cursor-pointer"
              >
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/20">
                  <UserRound className="h-4 w-4" />
                </div>

                <span className="max-w-[80px] truncate text-sm">
                  {user.name}
                </span>
              </button>
            ) : (
              <button
                onClick={() => setAuthModalMode("login")}
                className="hidden h-10 items-center gap-1.5 rounded-xl bg-primary px-3.5 text-xs font-bold text-white shadow-md shadow-primary/20 transition-all hover:bg-emerald-700 xl:flex"
              >
                <UserRound className="h-4 w-4" />
                Account
              </button>
            )}

            {/* Mobile Hamburger */}
            <button
              className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 text-slate-600 transition hover:bg-slate-50 xl:hidden cursor-pointer"
              onClick={() => setMobileOpen(true)}
              aria-label="Open menu"
            >
              <Menu className="h-5 w-5" />
            </button>

            {/* Cart stays at the far-right edge of the navbar. */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setCartOpen((prev) => !prev)}
                aria-label={`Shopping cart, ${totalItems} item${totalItems !== 1 ? "s" : ""}`}
                className="relative flex h-10 w-10 cursor-pointer items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 shadow-sm transition hover:border-lime-400 hover:text-lime-600"
              >
                <ShoppingCart className="h-5 w-5" />
                {totalItems > 0 && <span className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-lime-500 text-[10px] font-black text-white shadow">{totalItems > 99 ? "99+" : totalItems}</span>}
              </button>
              <CartDropdown isOpen={cartOpen} onClose={() => setCartOpen(false)} />
            </div>
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
