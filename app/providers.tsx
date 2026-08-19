"use client";

import { SessionProvider } from "next-auth/react";
import { CartProvider } from "@/components/tienda/CartProvider";
import { CartUi } from "@/components/tienda/CartUi";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <CartProvider>
        {children}
        <CartUi />
      </CartProvider>
    </SessionProvider>
  );
}
