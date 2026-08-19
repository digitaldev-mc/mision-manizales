"use client";

import { useCart } from "@/components/tienda/CartProvider";

export function CartFab() {
  const { itemCount, setCartOpen } = useCart();

  return (
    <button type="button" className="cart-fab" onClick={() => setCartOpen(true)} aria-label="Abrir carrito">
      <span aria-hidden>🛒</span>
      <span>Carrito</span>
      {itemCount > 0 ? <span className="cart-badge">{itemCount}</span> : null}
    </button>
  );
}
