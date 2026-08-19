"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { CART_STORAGE_KEY } from "@/lib/cart/constants";
import type { CartLine, CartProduct } from "@/lib/cart/types";
import { calcOrderTotals } from "@/lib/orders/calc";

export type StoreProduct = CartProduct & {
  description: string;
  slug?: string;
};

type CartContextValue = {
  items: CartLine[];
  itemCount: number;
  subtotalCOP: number;
  shippingCOP: number;
  totalCOP: number;
  thermometerEstimateCOP: number;
  addItem: (product: StoreProduct, qty?: number) => void;
  removeItem: (productId: string) => void;
  setQuantity: (productId: string, qty: number) => void;
  clearCart: () => void;
  cartOpen: boolean;
  setCartOpen: (open: boolean) => void;
  checkoutOpen: boolean;
  setCheckoutOpen: (open: boolean) => void;
  previewProduct: StoreProduct | null;
  openPreview: (product: StoreProduct) => void;
  closePreview: () => void;
};

const CartContext = createContext<CartContextValue | null>(null);

function loadStoredItems(): CartLine[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(CART_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as CartLine[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartLine[]>([]);
  const [hydrated, setHydrated] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [previewProduct, setPreviewProduct] = useState<StoreProduct | null>(null);

  useEffect(() => {
    setItems(loadStoredItems());
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
  }, [items, hydrated]);

  const addItem = useCallback((product: StoreProduct, qty = 1) => {
    if (product.soldOut) return;
    setItems((prev) => {
      const existing = prev.find((i) => i.productId === product.id);
      if (existing) {
        return prev.map((i) =>
          i.productId === product.id ? { ...i, quantity: Math.min(99, i.quantity + qty) } : i,
        );
      }
      return [
        ...prev,
        {
          productId: product.id,
          name: product.name,
          priceCOP: product.priceCOP,
          imageUrl: product.imageUrl,
          quantity: qty,
          thermometerPercent: product.thermometerPercent,
        },
      ];
    });
    setCartOpen(true);
  }, []);

  const removeItem = useCallback((productId: string) => {
    setItems((prev) => prev.filter((i) => i.productId !== productId));
  }, []);

  const setQuantity = useCallback((productId: string, qty: number) => {
    if (qty <= 0) {
      setItems((prev) => prev.filter((i) => i.productId !== productId));
      return;
    }
    setItems((prev) =>
      prev.map((i) => (i.productId === productId ? { ...i, quantity: Math.min(99, qty) } : i)),
    );
  }, []);

  const clearCart = useCallback(() => setItems([]), []);

  const totals = useMemo(() => calcOrderTotals(items), [items]);
  const itemCount = useMemo(() => items.reduce((n, i) => n + i.quantity, 0), [items]);

  const value = useMemo<CartContextValue>(
    () => ({
      items,
      itemCount,
      subtotalCOP: totals.subtotalCOP,
      shippingCOP: totals.shippingCOP,
      totalCOP: totals.totalCOP,
      thermometerEstimateCOP: totals.thermometerContributionCOP,
      addItem,
      removeItem,
      setQuantity,
      clearCart,
      cartOpen,
      setCartOpen,
      checkoutOpen,
      setCheckoutOpen,
      previewProduct,
      openPreview: setPreviewProduct,
      closePreview: () => setPreviewProduct(null),
    }),
    [
      items,
      itemCount,
      totals,
      addItem,
      removeItem,
      setQuantity,
      clearCart,
      cartOpen,
      checkoutOpen,
      previewProduct,
    ],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart debe usarse dentro de CartProvider");
  return ctx;
}
