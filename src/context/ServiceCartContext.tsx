"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { showSuccessToast } from "@/context/ToastContext";

export interface ServiceCartItem {
  key: string;
  id: string | number;
  title: string;
  price: number;
  quantity: number;
  imageUrl?: string | null;
  selectedWorkPriceId?: number;
  selectedWorkTitle?: string;
  unitDescription?: string;
}

interface ServiceCartValue {
  items: ServiceCartItem[];
  total: number;
  addService: (item: Omit<ServiceCartItem, "key">) => void;
  updateQuantity: (key: string, quantity: number) => void;
  removeService: (key: string) => void;
  clearServices: () => void;
}

const STORAGE_KEY = "ustaadpro_service_cart";
const ServiceCartContext = createContext<ServiceCartValue | null>(null);

export function ServiceCartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ServiceCartItem[]>([]);

  useEffect(() => {
    try {
      const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
      if (Array.isArray(stored)) setItems(stored);
    } catch { /* ignore invalid local storage */ }
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }, [items]);

  const addService = useCallback((item: Omit<ServiceCartItem, "key">) => {
    const key = `${item.id}:${item.selectedWorkPriceId || "service"}`;
    setItems((current) => {
      const existing = current.find((entry) => entry.key === key);
      if (existing) return current.map((entry) => entry.key === key ? { ...entry, quantity: Math.min(10, entry.quantity + item.quantity) } : entry);
      return [...current, { ...item, key, quantity: Math.max(1, Math.min(10, item.quantity)) }];
    });
    showSuccessToast(`${item.selectedWorkTitle || item.title} added to your service cart.`);
  }, []);

  const updateQuantity = useCallback((key: string, quantity: number) => {
    setItems((current) => current.map((item) => item.key === key ? { ...item, quantity: Math.max(1, Math.min(10, quantity)) } : item));
  }, []);
  const removeService = useCallback((key: string) => setItems((current) => current.filter((item) => item.key !== key)), []);
  const clearServices = useCallback(() => setItems([]), []);
  const total = useMemo(() => items.reduce((sum, item) => sum + item.price * item.quantity, 0), [items]);

  return <ServiceCartContext.Provider value={{ items, total, addService, updateQuantity, removeService, clearServices }}>{children}</ServiceCartContext.Provider>;
}

export function useServiceCart() {
  const value = useContext(ServiceCartContext);
  if (!value) throw new Error("useServiceCart must be used inside ServiceCartProvider");
  return value;
}
