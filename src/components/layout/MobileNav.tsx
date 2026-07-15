"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { navItems, quickAccessMenu } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { X, LogOut, LogIn, UserPlus } from "lucide-react";
import * as LucideIcons from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

function getIcon(iconName: string): LucideIcon {
  return (LucideIcons as unknown as Record<string, LucideIcon>)[iconName] || LucideIcons.FileText;
}

interface MobileNavProps {
  open: boolean;
  onClose: () => void;
}

export function MobileNav({ open, onClose }: MobileNavProps) {
  const pathname = usePathname();
  const { user, setAuthModalMode, logout } = useAuth();

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent side="right" className="w-full max-w-sm p-0">
        <SheetHeader className="flex flex-row items-center justify-between border-b px-6 py-4">
          <SheetTitle>
            <Link href="/" onClick={onClose} className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-lime-500">
                <span className="text-base font-black text-white">U</span>
              </div>
              <span className="text-lg font-bold text-gray-900">
                Ustaad <span className="text-lime-500">Pro</span>
              </span>
            </Link>
          </SheetTitle>
          <button
            onClick={onClose}
            className="rounded-lg p-2 hover:bg-gray-100"
            aria-label="Close menu"
          >
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </SheetHeader>

        <div className="flex flex-col px-4 py-6 overflow-y-auto h-[calc(100vh-80px)]">
          {/* User Profile Info / Auth Trigger */}
          {user ? (
            <div className="mb-6 flex items-center gap-4 rounded-xl bg-slate-50 p-4 border border-slate-100">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary text-lg font-bold text-white uppercase shadow-sm">
                {user.name.charAt(0)}
              </div>
              <div className="flex-1 overflow-hidden">
                <p className="truncate font-semibold text-slate-900">{user.name}</p>
                <p className="truncate text-sm text-slate-500">{user.email}</p>
              </div>
            </div>
          ) : (
            <div className="mb-6 grid grid-cols-2 gap-2">
              <button
                onClick={() => {
                  onClose();
                  setAuthModalMode("login");
                }}
                className="flex items-center justify-center gap-1.5 border border-slate-200 hover:border-slate-300 font-semibold py-2.5 rounded-xl text-sm text-slate-700 transition-colors"
              >
                <LogIn className="h-4 w-4" />
                Sign In
              </button>
              <button
                onClick={() => {
                  onClose();
                  setAuthModalMode("signup");
                }}
                className="flex items-center justify-center gap-1.5 bg-primary hover:bg-emerald-700 font-semibold py-2.5 rounded-xl text-sm text-white transition-colors"
              >
                <UserPlus className="h-4 w-4" />
                Sign Up
              </button>
            </div>
          )}

          {/* Quick Access Menu */}
          {user && (
            <div className="flex flex-col space-y-1">
              {quickAccessMenu.map((item) => {
                const Icon = getIcon(item.icon);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={onClose}
                    className={cn(
                      "flex items-center gap-4 rounded-xl px-4 py-3 text-sm font-medium transition-colors",
                      pathname === item.href
                        ? "bg-lime-50 text-lime-700"
                        : "text-slate-700 hover:bg-slate-50"
                    )}
                  >
                    <Icon className="h-5 w-5 text-slate-500" />
                    {item.label}
                  </Link>
                );
              })}

              <button
                onClick={() => {
                  logout();
                  onClose();
                }}
                className="flex items-center gap-4 rounded-xl px-4 py-3 text-sm font-medium text-rose-600 hover:bg-rose-50 transition-colors text-left"
              >
                <LogOut className="h-5 w-5 text-rose-500" />
                Sign out
              </button>
            </div>
          )}

          <Separator className="my-6" />

          {/* Nav Items */}
          <div className="flex flex-col space-y-1 mb-6">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                className={cn(
                  "rounded-xl px-4 py-3 text-sm font-semibold transition-all hover:bg-emerald-50 hover:text-primary",
                  pathname === item.href ? "bg-emerald-50 text-primary" : "text-slate-600"
                )}
              >
                {item.label}
              </Link>
            ))}
          </div>

          <Button
            render={<Link href="/services" onClick={onClose} />}
            nativeButton={false}
            className="w-full bg-lime-500 text-white hover:bg-lime-600"
            size="lg"
          >
            Book a Service
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
