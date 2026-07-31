"use client";

import Link from "next/link";
import { X, Mail, Phone, LogOut, CheckCircle2, Wallet, CalendarDays, MessageCircle, ChevronRight } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

interface UserProfileModalProps {
  open: boolean;
  onClose: () => void;
}

export function UserProfileModal({ open, onClose }: UserProfileModalProps) {
  const { user, logout } = useAuth();

  if (!open || !user) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Modal Card */}
      <div
        role="dialog"
        className="fixed inset-x-4 top-1/2 z-[110] max-w-sm mx-auto -translate-y-1/2 bg-white rounded-3xl shadow-2xl overflow-hidden border border-slate-100 animate-in fade-in zoom-in-95 duration-200"
      >
        <button
          onClick={onClose}
          className="absolute right-4 top-4 p-1.5 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors z-10"
          aria-label="Close dialog"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="p-6">
          {/* User Initial Avatar */}
          <div className="flex flex-col items-center text-center pb-6 border-b border-slate-100">
            <div className="h-16 w-16 bg-gradient-to-br from-primary to-emerald-700 rounded-full flex items-center justify-center font-black text-2xl text-white shadow-md mb-3">
              {user.name.charAt(0).toUpperCase()}
            </div>
            <h3 className="text-lg font-bold text-slate-900">{user.name}</h3>
            <p className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-2.5 py-0.5 rounded-full mt-1.5 flex items-center gap-1">
              <CheckCircle2 className="h-3 w-3" /> Verified Member
            </p>
          </div>

          {/* Details list */}
          <div className="py-6 space-y-4">
            <Link href="/wallet" onClick={onClose} className="flex items-center gap-3 rounded-2xl bg-emerald-50 p-3 transition hover:bg-emerald-100">
              <div className="h-9 w-9 bg-white rounded-xl flex items-center justify-center text-emerald-600 shrink-0">
                <Wallet className="h-4 w-4" />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider">Wallet Balance</p>
                <p className="text-sm font-bold text-emerald-900">PKR {Number(user.walletBalance || 0).toLocaleString("en-PK")}</p>
              </div>
            </Link>
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 bg-slate-50 rounded-xl flex items-center justify-center text-slate-400 shrink-0">
                <Mail className="h-4 w-4" />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Email Address</p>
                <p className="text-sm font-medium text-slate-700 truncate">{user.email}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="h-9 w-9 bg-slate-50 rounded-xl flex items-center justify-center text-slate-400 shrink-0">
                <Phone className="h-4 w-4" />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Phone Number</p>
                <p className="text-sm font-medium text-slate-700 truncate">{user.phone || "Not set"}</p>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="space-y-2 pt-2 border-t border-slate-100">
            <Link href="/track-booking" onClick={onClose} className="flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-sm font-bold text-slate-700 transition hover:bg-emerald-50 hover:text-emerald-700">
              <span className="grid h-9 w-9 place-items-center rounded-xl bg-blue-50 text-blue-600"><CalendarDays className="h-4 w-4" /></span>
              <span className="flex-1 text-left">My Bookings</span><ChevronRight className="h-4 w-4 text-slate-300" />
            </Link>
            <Link href="/contact" onClick={onClose} className="flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-sm font-bold text-slate-700 transition hover:bg-emerald-50 hover:text-emerald-700">
              <span className="grid h-9 w-9 place-items-center rounded-xl bg-amber-50 text-amber-600"><MessageCircle className="h-4 w-4" /></span>
              <span className="flex-1 text-left">Contact Us</span><ChevronRight className="h-4 w-4 text-slate-300" />
            </Link>
            <button
              onClick={() => {
                logout();
                onClose();
              }}
              className="w-full flex items-center justify-center gap-2 bg-rose-50 hover:bg-rose-100 text-rose-600 font-bold py-3 rounded-2xl text-sm transition-all"
            >
              <LogOut className="h-4 w-4" />
              Sign Out
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
