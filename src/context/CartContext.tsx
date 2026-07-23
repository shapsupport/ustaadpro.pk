"use client";

import {
  createContext,
  useContext,
  useReducer,
  useEffect,
  useCallback,
  type ReactNode,
} from "react";
import type { ApiProduct } from "@/lib/api-types";

// ── Types ──────────────────────────────────────────────────────────────────

export interface CartItem {
  product: ApiProduct;
  quantity: number;
}

interface CartState {
  items: CartItem[];
}

type CartAction =
  | { type: "ADD_ITEM"; product: ApiProduct; quantity?: number }
  | { type: "REMOVE_ITEM"; productId: string }
  | { type: "UPDATE_QUANTITY"; productId: string; quantity: number }
  | { type: "CLEAR_CART" }
  | { type: "HYDRATE"; items: CartItem[] };

interface CartContextValue {
  items: CartItem[];
  totalItems: number;
  subtotal: number;
  addItem: (product: ApiProduct, quantity?: number) => void;
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  isInCart: (productId: string) => boolean;
  getQuantity: (productId: string) => number;
}

// ── Helpers ────────────────────────────────────────────────────────────────

const STORAGE_KEY = "ustaadpro_cart";

function saveToStorage(items: CartItem[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch {
    // storage full / private browsing
  }
}

function loadFromStorage(): CartItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (item: unknown) =>
        item &&
        typeof item === "object" &&
        "product" in (item as object) &&
        "quantity" in (item as object)
    );
  } catch {
    return [];
  }
}

// ── Reducer ────────────────────────────────────────────────────────────────

function cartReducer(state: CartState, action: CartAction): CartState {
  switch (action.type) {
    case "HYDRATE": {
      return { items: action.items };
    }

    case "ADD_ITEM": {
      const existing = state.items.find(
        (item) => item.product.id === action.product.id
      );
      const addQty = action.quantity ?? 1;

      if (existing) {
        const newQty = Math.min(
          existing.quantity + addQty,
          action.product.stock || 99
        );
        const updated = state.items.map((item) =>
          item.product.id === action.product.id
            ? { ...item, quantity: newQty }
            : item
        );
        return { items: updated };
      }

      return {
        items: [
          ...state.items,
          {
            product: action.product,
            quantity: Math.min(addQty, action.product.stock || 99),
          },
        ],
      };
    }

    case "REMOVE_ITEM": {
      return {
        items: state.items.filter(
          (item) => item.product.id !== action.productId
        ),
      };
    }

    case "UPDATE_QUANTITY": {
      if (action.quantity <= 0) {
        return {
          items: state.items.filter(
            (item) => item.product.id !== action.productId
          ),
        };
      }
      const updated = state.items.map((item) =>
        item.product.id === action.productId
          ? {
            ...item,
            quantity: Math.min(action.quantity, item.product.stock || 99),
          }
          : item
      );
      return { items: updated };
    }

    case "CLEAR_CART": {
      return { items: [] };
    }

    default:
      return state;
  }
}

// ── Context ────────────────────────────────────────────────────────────────

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(cartReducer, { items: [] });

  // Hydrate from localStorage on mount (client only)
  useEffect(() => {
    const stored = loadFromStorage();
    if (stored.length > 0) {
      dispatch({ type: "HYDRATE", items: stored });
    }
  }, []);

  // Persist on every change
  useEffect(() => {
    saveToStorage(state.items);
  }, [state.items]);

  const addItem = useCallback((product: ApiProduct, quantity = 1) => {
    dispatch({ type: "ADD_ITEM", product, quantity });
  }, []);

  const removeItem = useCallback((productId: string) => {
    dispatch({ type: "REMOVE_ITEM", productId });
  }, []);

  const updateQuantity = useCallback(
    (productId: string, quantity: number) => {
      dispatch({ type: "UPDATE_QUANTITY", productId, quantity });
    },
    []
  );

  const clearCart = useCallback(() => {
    dispatch({ type: "CLEAR_CART" });
  }, []);

  const isInCart = useCallback(
    (productId: string) =>
      state.items.some((item) => item.product.id === productId),
    [state.items]
  );

  const getQuantity = useCallback(
    (productId: string) =>
      state.items.find((item) => item.product.id === productId)?.quantity ?? 0,
    [state.items]
  );

  const totalItems = state.items.reduce((sum, item) => sum + item.quantity, 0);
  const subtotal = state.items.reduce(
    (sum, item) => sum + Number(item.product.price) * item.quantity,
    0
  );

  return (
    <CartContext.Provider
      value={{
        items: state.items,
        totalItems,
        subtotal,
        addItem,
        removeItem,
        updateQuantity,
        clearCart,
        isInCart,
        getQuantity,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used inside <CartProvider>");
  return ctx;
}
