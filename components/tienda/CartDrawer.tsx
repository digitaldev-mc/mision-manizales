"use client";

import Link from "next/link";
import { fmtCOP } from "@/lib/format";
import { useCart } from "@/components/tienda/CartProvider";

export function CartDrawer() {
  const {
    items,
    cartOpen,
    setCartOpen,
    setCheckoutOpen,
    removeItem,
    setQuantity,
    subtotalCOP,
    shippingCOP,
    totalCOP,
    thermometerEstimateCOP,
  } = useCart();

  return (
    <>
      <div
        className={`cart-drawer-backdrop ${cartOpen ? "show" : ""}`}
        onClick={() => setCartOpen(false)}
        aria-hidden={!cartOpen}
      />
      <aside className={`cart-drawer ${cartOpen ? "open" : ""}`} aria-label="Carrito de compras">
        <div className="cart-drawer-head">
          <div>
            <span className="kicker">Tu pedido</span>
            <h3>Carrito</h3>
          </div>
          <button type="button" className="close-x" onClick={() => setCartOpen(false)} aria-label="Cerrar">
            ×
          </button>
        </div>

        {items.length === 0 ? (
          <div className="cart-empty">
            <p>Tu carrito está vacío.</p>
            <Link href="/tienda" className="btn btn-outline btn-sm" onClick={() => setCartOpen(false)}>
              Ir a la tienda
            </Link>
          </div>
        ) : (
          <>
            <ul className="cart-lines">
              {items.map((item) => (
                <li key={item.productId} className="cart-line">
                  <div className="cart-line-media">
                    {item.imageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={item.imageUrl} alt="" />
                    ) : (
                      "🛍️"
                    )}
                  </div>
                  <div className="cart-line-body">
                    <strong>{item.name}</strong>
                    <span className="cart-line-price">{fmtCOP(item.priceCOP)}</span>
                    <div className="cart-line-qty">
                      <button type="button" className="qty-btn" onClick={() => setQuantity(item.productId, item.quantity - 1)}>
                        −
                      </button>
                      <span>{item.quantity}</span>
                      <button type="button" className="qty-btn" onClick={() => setQuantity(item.productId, item.quantity + 1)}>
                        +
                      </button>
                      <button type="button" className="cart-line-remove" onClick={() => removeItem(item.productId)}>
                        Quitar
                      </button>
                    </div>
                  </div>
                  <div className="cart-line-total">{fmtCOP(item.priceCOP * item.quantity)}</div>
                </li>
              ))}
            </ul>

            <div className="cart-summary">
              <div className="cart-summary-row">
                <span>Subtotal</span>
                <span>{fmtCOP(subtotalCOP)}</span>
              </div>
              <div className="cart-summary-row">
                <span>Domicilio Manizales</span>
                <span>{fmtCOP(shippingCOP)}</span>
              </div>
              <div className="cart-summary-row cart-summary-total">
                <span>Total</span>
                <span>{fmtCOP(totalCOP)}</span>
              </div>
              <p className="cart-thermo-note">
                🌡️ Aporte estimado al empanadómetro: <strong>{fmtCOP(thermometerEstimateCOP)}</strong>
              </p>
              <button
                type="button"
                className="btn btn-primary btn-block"
                onClick={() => {
                  setCartOpen(false);
                  setCheckoutOpen(true);
                }}
              >
                Finalizar compra
              </button>
            </div>
          </>
        )}
      </aside>
    </>
  );
}
