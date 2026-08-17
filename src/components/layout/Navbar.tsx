"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { navItems } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { Menu, MapPin, ChevronDown, UserRound, ShoppingCart, ShoppingBag, Wallet, Wrench } from "lucide-react";
import { MobileNav } from "./MobileNav";
import { useLocation } from "@/context/LocationContext";
import { useAuth } from "@/context/AuthContext";
import { useCart } from "@/context/CartContext";
import CartDropdown from "../store/CartDropdown";
import { UniversalSearch } from "@/components/search/UniversalSearch";


export function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);
  const { totalItems } = useCart();

  const pathname = usePathname();
  const { location, setShowPicker } = useLocation();
  const { user, setAuthModalMode } = useAuth();
  const searchScope = pathname.startsWith("/store") ? "shop_product" : "service";
  const visibleNavItems = navItems.filter((item) => item.href !== "/track-booking" || Boolean(user));

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });

    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <>
      <header
        className={cn(
          "fixed inset-x-0 top-0 z-50 py-2 transition-[background-color,border-color,box-shadow] duration-300",
          scrolled
            ? "border-b border-slate-100 bg-white/95 shadow-sm backdrop-blur-md"
            : "bg-white/80 backdrop-blur-sm"
        )}
      >
        <nav
          className="mx-auto flex h-16 max-w-[1760px] items-center justify-between gap-3 px-3 sm:px-5 lg:px-6"
          aria-label="Main navigation"
        >
          {/* Logo */}
          <Link
            href="/"
            className="flex shrink-0 items-center gap-2"
            aria-label="Ustaad Pro Home"
          >
            <Image
              src="/brand/ustaad-pro-mark.webp"
              alt=""
              width={40}
              height={40}
              priority
              className="h-10 w-10 rounded-xl object-contain shadow-md shadow-primary/15"
            />
            <span className="hidden text-xl font-black tracking-tight text-slate-900 min-[480px]:inline">
              Ustaad<span className="font-bold text-primary">Pro</span>
            </span>
          </Link>

          {/* Search bar — hero owns search below lg; navbar owns it from lg up. */}
          <div className="hidden min-w-0 flex-1 lg:block xl:mx-4">
            <UniversalSearch key={searchScope} defaultScope={searchScope} />
          </div>

          {/* Desktop Navigation links — show from lg upwards */}
          <div className="hidden items-center gap-0.5 lg:flex">
            {visibleNavItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "rounded-xl px-3 py-2 text-sm font-bold transition-all hover:bg-emerald-50 hover:text-primary whitespace-nowrap",
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
          <div className="flex min-w-0 shrink-0 items-center gap-1.5 sm:gap-2">
            {/* Mobile quick destinations — icons on narrow phones, labels when space allows. */}
            <Link
              href="/services"
              aria-label="Browse services"
              title="Services"
              className={cn(
                "group relative flex h-10 items-center justify-center gap-1.5 rounded-xl border px-2.5 text-xs font-bold shadow-sm transition sm:px-3 lg:hidden",
                pathname.startsWith("/services")
                  ? "border-emerald-500 bg-emerald-600 text-white"
                  : "border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
              )}
            >
              <Wrench className="h-4.5 w-4.5 shrink-0" />
              <span className="hidden sm:inline">Services</span>
              <span className="pointer-events-none absolute left-1/2 top-full z-[60] mt-2 -translate-x-1/2 rounded-lg bg-slate-950 px-2.5 py-1.5 text-[10px] font-bold text-white opacity-0 shadow-lg transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100 sm:hidden">
                Services
              </span>
            </Link>
            <Link
              href="/store"
              aria-label="Browse shop products"
              title="Shop"
              className={cn(
                "group relative flex h-10 items-center justify-center gap-1.5 rounded-xl border px-2.5 text-xs font-bold shadow-sm transition sm:px-3 lg:hidden",
                pathname.startsWith("/store")
                  ? "border-slate-950 bg-slate-950 text-lime-300"
                  : "border-slate-300 bg-white text-slate-800 hover:border-lime-400 hover:bg-lime-50"
              )}
            >
              <ShoppingBag className="h-4.5 w-4.5 shrink-0" />
              <span className="hidden sm:inline">Shop</span>
              <span className="pointer-events-none absolute left-1/2 top-full z-[60] mt-2 -translate-x-1/2 rounded-lg bg-slate-950 px-2.5 py-1.5 text-[10px] font-bold text-white opacity-0 shadow-lg transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100 sm:hidden">
                Shop
              </span>
            </Link>

            {/* Location — show from xl upwards to avoid crowding on 1024–1280px */}
            <button
              onClick={() => setShowPicker(true)}
              className="hidden cursor-pointer items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-600 shadow-sm transition-all hover:border-primary hover:text-primary xl:flex"
            >
              <MapPin className="h-4 w-4 shrink-0 text-primary" />
              <span className="max-w-[120px] truncate font-semibold text-slate-700">
                {location.shortLabel || location.label || "Set location"}
              </span>
              <ChevronDown className="h-3 w-3 opacity-60" />
            </button>

            {/* Desktop User/Profile — show from lg upwards */}
            <Link
              href="/wallet"
              aria-label={user ? "Open wallet and rewards" : "View wallet benefits"}
              title="Wallet & Rewards"
              className="hidden h-10 w-10 items-center justify-center rounded-xl border border-emerald-200 bg-emerald-50 text-emerald-700 shadow-sm transition hover:border-emerald-400 hover:bg-emerald-100 lg:flex"
            >
              <Wallet className="h-5 w-5" strokeWidth={2.25} />
            </Link>
            {user ? (
              <Link
                href="/profile"
                aria-label="Open my profile"
                title="My account"
                className="hidden h-10 w-10 cursor-pointer items-center justify-center rounded-xl bg-gradient-to-br from-primary to-emerald-700 text-white shadow-md shadow-primary/10 transition-all hover:opacity-90 lg:flex"
              >
                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-white/20">
                  <UserRound className="h-4 w-4" />
                </div>
              </Link>
            ) : (
              <button
                onClick={() => setAuthModalMode("login")}
                className="hidden h-10 items-center gap-1.5 rounded-xl bg-primary px-4 text-sm font-bold text-white shadow-md shadow-primary/20 transition-all hover:bg-emerald-700 lg:flex"
              >
                <UserRound className="h-4 w-4" />
                Account
              </button>
            )}

            {/* Mobile Hamburger — hidden on lg+ */}
            <button
              className="inline-flex h-10 w-10 cursor-pointer items-center justify-center rounded-xl border border-slate-200 text-slate-600 transition hover:bg-slate-50 lg:hidden"
              onClick={() => setMobileOpen(true)}
              aria-label="Open menu"
            >
              <Menu className="h-5 w-5" />
            </button>

            {/* Store cart appears only after a product has been added. */}
            {totalItems > 0 && <div className="relative">
              <button
                type="button"
                onClick={() => setCartOpen((prev) => !prev)}
                aria-label={`Shopping cart, ${totalItems} item${totalItems !== 1 ? "s" : ""}`}
                className="relative flex h-10 w-10 cursor-pointer items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 shadow-sm transition hover:border-lime-400 hover:text-lime-600"
              >
                <ShoppingCart className="h-5 w-5" />
                <span className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-lime-500 text-[10px] font-black text-white shadow">{totalItems > 99 ? "99+" : totalItems}</span>
              </button>
              <CartDropdown isOpen={cartOpen} onClose={() => setCartOpen(false)} />
            </div>}
          </div>
        </nav>
      </header>

      <MobileNav
        open={mobileOpen}
        onClose={() => setMobileOpen(false)}
      />
    </>
  );
}
