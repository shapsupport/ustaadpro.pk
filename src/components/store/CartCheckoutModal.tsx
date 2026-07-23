"use client";

import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import Image from "next/image";
import {
  X,
  MapPin,
  Map as MapIcon,
  User,
  Phone,
  CheckCircle2,
  AlertCircle,
  Loader2,
  LogIn,
  ShoppingCart,
  Package,
  Trash2,
  ShoppingBag,
} from "lucide-react";
import { checkoutShopOrder } from "@/services/shopService";
import { useAuth } from "@/context/AuthContext";
import { useCart } from "@/context/CartContext";
import MapAddressPickerModal from "../location/MapAddressPickerModal";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE || "";

function buildImageUrl(url?: string) {
  if (!url) return null;
  if (url.startsWith("http://") || url.startsWith("https://")) return url;
  return `${API_BASE_URL}${url.startsWith("/") ? url : `/${url}`}`;
}

function formatPrice(amount: number) {
  return `Rs ${amount.toLocaleString("en-PK")}`;
}

interface CartCheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function CartCheckoutModal({
  isOpen,
  onClose,
}: CartCheckoutModalProps) {
  const { user, setAuthModalMode } = useAuth();
  const { items, subtotal, clearCart } = useCart();

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [isMapOpen, setIsMapOpen] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [orderSuccess, setOrderSuccess] = useState<{
    orderId: string;
    total: number;
  } | null>(null);

  // Portal mount guard (avoids SSR "document is not defined" issues)
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  // Auto-fill user details if logged in
  useEffect(() => {
    if (user) {
      if (user.name && !name) setName(user.name);
      if (user.phone && !phone) setPhone(user.phone);
    }
  }, [user]);

  if (!isOpen || !mounted) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    // Auth check
    const token =
      typeof window !== "undefined"
        ? localStorage.getItem("ustaadpro_token")
        : null;
    if (!user || !token) {
      setError("Please sign in to complete your order.");
      setAuthModalMode("login");
      return;
    }

    // Cart check
    if (items.length === 0) {
      setError("Your cart is empty.");
      return;
    }

    // Field validation
    if (!name.trim()) {
      setError("Please enter your full name.");
      return;
    }
    if (!phone.trim()) {
      setError("Please enter your phone number.");
      return;
    }

    const addressValue = address.trim();
    if (!addressValue) {
      setError("Please enter your delivery address.");
      return;
    }
    if (addressValue.length < 15) {
      setError(
        "Please enter your complete address with house number, street, area and city."
      );
      return;
    }
    if (!/\d/.test(addressValue)) {
      setError("Please include your house or street number in the address.");
      return;
    }
    const addressWords = addressValue.split(/\s+/).filter((w) => w.length > 1);
    if (addressWords.length < 4) {
      setError(
        "Please enter a complete address: house number, street, area/colony, and city."
      );
      return;
    }

    setLoading(true);
    try {
      const response = await checkoutShopOrder({
        items: items.map((item) => ({
          productId: item.product.id,
          quantity: item.quantity,
        })),
        address: `Name: ${name.trim()} | Phone: ${phone.trim()} | ${addressValue}`,
        paymentMethod: "Cash on Delivery",
        useRewardPoints: false,
      });

      if (response?.order) {
        setOrderSuccess({
          orderId: response.order.id,
          total: response.order.total,
        });
        clearCart();
      } else {
        throw new Error("Failed to receive order confirmation.");
      }
    } catch (err: unknown) {
      const msg =
        err instanceof Error
          ? err.message
          : "Could not place order. Please try again.";
      const isSessionError =
        msg.includes("session") ||
        msg.includes("sign in") ||
        msg.includes("401");
      if (isSessionError) {
        setAuthModalMode("login");
      }
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setOrderSuccess(null);
    setError("");
    onClose();
  };

  return createPortal(
    <>
      <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm">
        <div className="relative w-full max-w-xl max-h-[90vh] mx-2 sm:mx-0 overflow-y-auto rounded-2xl sm:rounded-3xl bg-white shadow-2xl transition-all booking-modal-scrollbar">
          {/* Header */}
          <div className="sticky top-0 z-20 flex items-center justify-between border-b border-slate-100 bg-white/95 px-4 sm:px-6 py-3 sm:py-4 backdrop-blur-md">
            <div>
              <h2 className="text-lg sm:text-xl font-black text-slate-900">
                Checkout
              </h2>
              <p className="text-xs font-bold text-lime-600">
                {items.length} item{items.length !== 1 ? "s" : ""} •{" "}
                {formatPrice(subtotal)}
              </p>
            </div>
            <button
              type="button"
              onClick={handleClose}
              className="rounded-full p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Success Screen */}
          {orderSuccess ? (
            <div className="p-6 sm:p-8 text-center space-y-4">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 shadow-lg shadow-emerald-600/10">
                <CheckCircle2 className="h-10 w-10" />
              </div>
              <h3 className="text-2xl font-black text-slate-900">
                Order Placed!
              </h3>
              <p className="text-sm text-slate-600 max-w-md mx-auto">
                Your order has been received. Our team will contact you shortly to
                confirm delivery details.
              </p>

              <div className="my-4 rounded-2xl border border-emerald-200 bg-emerald-50/60 p-4 space-y-1">
                <p className="text-xs uppercase font-bold tracking-wider text-slate-400">
                  Order Reference ID
                </p>
                <p className="text-2xl font-black text-emerald-700">
                  {orderSuccess.orderId}
                </p>
                <p className="text-xs font-bold text-slate-700 pt-1">
                  Total Payable:{" "}
                  <span className="text-emerald-700">
                    {formatPrice(orderSuccess.total)}
                  </span>
                </p>
                <p className="text-xs text-slate-500 pt-1">
                  Payment: Cash on Delivery
                </p>
              </div>

              <button
                type="button"
                onClick={handleClose}
                className="w-full rounded-2xl bg-emerald-600 py-3.5 text-sm font-bold text-white shadow-lg shadow-emerald-600/20 hover:bg-emerald-700 transition"
              >
                Done & Close
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4 sm:space-y-5">
              {/* Auth Notice */}
              {!user && (
                <div className="flex items-center justify-between gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-3.5 text-xs text-amber-900">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 shrink-0 text-amber-600" />
                    <span>Sign in required to place your order.</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setAuthModalMode("login")}
                    className="flex items-center gap-1 shrink-0 rounded-xl bg-amber-600 px-3 py-1.5 font-bold text-white hover:bg-amber-700 transition"
                  >
                    <LogIn className="h-3.5 w-3.5" /> Sign In
                  </button>
                </div>
              )}

              {/* Error Alert */}
              {error && (
                <div className="flex items-center gap-2 rounded-2xl border border-red-200 bg-red-50 p-3 text-xs text-red-700">
                  <AlertCircle className="h-4 w-4 shrink-0 text-red-500" />
                  <span>{error}</span>
                </div>
              )}

              {/* Order Summary */}
              <div className="rounded-2xl border border-slate-200 bg-slate-50 overflow-hidden">
                <p className="px-4 pt-3 pb-2 text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                  ORDER SUMMARY
                </p>
                <div className="divide-y divide-slate-100 max-h-44 overflow-y-auto">
                  {items.map((item) => {
                    const imgSrc = buildImageUrl(item.product.imageUrl);
                    return (
                      <div
                        key={item.product.id}
                        className="flex items-center gap-3 px-4 py-2.5"
                      >
                        <div className="h-10 w-10 shrink-0 rounded-xl overflow-hidden bg-slate-200 flex items-center justify-center">
                          {imgSrc ? (
                            <Image
                              src={imgSrc}
                              alt={item.product.title}
                              width={40}
                              height={40}
                              unoptimized
                              className="h-10 w-10 object-cover"
                            />
                          ) : (
                            <Package className="h-5 w-5 text-slate-400" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-slate-800 truncate">
                            {item.product.title}
                          </p>
                          <p className="text-xs text-slate-500">
                            {formatPrice(item.product.price)} × {item.quantity}
                          </p>
                        </div>
                        <p className="text-sm font-black text-slate-900 shrink-0">
                          {formatPrice(item.product.price * item.quantity)}
                        </p>
                      </div>
                    );
                  })}
                </div>
                <div className="flex items-center justify-between border-t border-slate-200 px-4 py-3">
                  <span className="text-sm font-bold text-slate-700">Total</span>
                  <span className="text-lg font-black text-emerald-600">
                    {formatPrice(subtotal)}
                  </span>
                </div>
              </div>

              {/* Contact Information */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">
                    Full Name *
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g. Muhammad Ali"
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-9 pr-3 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">
                    Phone Number *
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                    <input
                      type="tel"
                      required
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+923176379977"
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-9 pr-3 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                    />
                  </div>
                </div>
              </div>

              {/* Delivery Address & Map Picker */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-bold text-slate-600">
                    Delivery Address *
                  </label>
                  <button
                    type="button"
                    onClick={() => setIsMapOpen(true)}
                    className="flex items-center gap-1 text-xs font-bold text-emerald-600 hover:text-emerald-700 hover:underline cursor-pointer"
                  >
                    <MapIcon className="h-3.5 w-3.5" />
                    Pick from Map
                  </button>
                </div>
                <div className="relative">
                  <MapPin className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                  <input
                    type="text"
                    required
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="House #, Street #, Area or click 'Pick from Map'"
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-9 pr-3 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                </div>
              </div>

              {/* Payment Method */}
              <div className="flex items-center justify-between rounded-2xl border border-emerald-200 bg-emerald-50/60 px-4 py-3">
                <div className="flex items-center gap-2">
                  <ShoppingCart className="h-4 w-4 text-emerald-700" />
                  <span className="text-sm font-bold text-emerald-900">
                    Payment Method
                  </span>
                </div>
                <span className="rounded-xl bg-emerald-600 px-3 py-1 text-xs font-bold text-white">
                  Cash on Delivery
                </span>
              </div>

              {/* Submit */}
              <div className="pt-1">
                {!user ? (
                  <button
                    type="button"
                    onClick={() => setAuthModalMode("login")}
                    className="flex w-full items-center justify-center gap-2 rounded-2xl bg-amber-600 py-3.5 font-bold text-white shadow-lg shadow-amber-600/20 hover:bg-amber-700 transition"
                  >
                    <LogIn className="h-5 w-5" />
                    Sign In to Complete Order
                  </button>
                ) : (
                  <button
                    type="submit"
                    disabled={loading || items.length === 0}
                    className="flex w-full items-center justify-center gap-2 rounded-2xl bg-emerald-600 py-4 font-bold text-white shadow-lg shadow-emerald-600/25 hover:bg-emerald-700 transition disabled:opacity-50 text-sm sm:text-base cursor-pointer"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="h-5 w-5 animate-spin" />
                        Placing Order...
                      </>
                    ) : (
                      <>
                        <ShoppingBag className="h-5 w-5" />
                        {`Place Order — ${formatPrice(subtotal)}`}
                      </>
                    )}
                  </button>
                )}
              </div>
            </form>
          )}
        </div>
      </div>

      {/* Leaflet Map Modal */}
      <MapAddressPickerModal
        isOpen={isMapOpen}
        onClose={() => setIsMapOpen(false)}
        initialAddress={address}
        onSelectAddress={(newAddress) => {
          setAddress(newAddress);
        }}
      />
    </>,
    document.body
  );
}