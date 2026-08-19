"use client";

import { useEffect, useState } from "react";
import { fmtCOP } from "@/lib/format";
import { useCart } from "@/components/tienda/CartProvider";

export function ProductPreviewModal() {
  const { previewProduct, closePreview, addItem, setQuantity, items } = useCart();
  const [qty, setQty] = useState(1);

  useEffect(() => {
    if (!previewProduct) return;
    const inCart = items.find((i) => i.productId === previewProduct.id);
    setQty(inCart?.quantity ?? 1);
  }, [previewProduct, items]);

  if (!previewProduct) return null;

  const inCart = items.some((i) => i.productId === previewProduct.id);

  return (
    <div
      className="overlay show store-overlay"
      onClick={(e) => {
        if (e.target === e.currentTarget) closePreview();
      }}
      role="presentation"
    >
      <div className="modal wide store-preview-modal" role="dialog" aria-modal="true">
        <div className="modal-head">
          <div>
            <span className="kicker">Vista previa</span>
            <h3>{previewProduct.name}</h3>
          </div>
          <button type="button" className="close-x" onClick={closePreview} aria-label="Cerrar">
            ×
          </button>
        </div>
        <div className="store-preview-grid">
          <div className="store-preview-media product-media-zoom">
            {previewProduct.imageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={previewProduct.imageUrl} alt={previewProduct.name} />
            ) : (
              <span className="product-emoji">🛍️</span>
            )}
          </div>
          <div className="store-preview-info">
            <p className="store-preview-desc">{previewProduct.description}</p>
            <div className="store-preview-price">{fmtCOP(previewProduct.priceCOP)}</div>
            <p className="store-preview-meta">
              <span className="store-chip">
                🌡️ {previewProduct.thermometerPercent}% al empanadómetro
              </span>
              <span className="store-chip">🚚 Domicilio Manizales $7.000</span>
            </p>
            {!previewProduct.soldOut ? (
              <div className="store-qty-row">
                <label htmlFor="preview-qty">Cantidad</label>
                <div className="store-qty-controls">
                  <button
                    type="button"
                    className="qty-btn"
                    onClick={() => setQty((q) => Math.max(1, q - 1))}
                  >
                    −
                  </button>
                  <input
                    id="preview-qty"
                    type="number"
                    min={1}
                    max={99}
                    value={qty}
                    onChange={(e) => setQty(Math.max(1, Math.min(99, Number(e.target.value) || 1)))}
                  />
                  <button type="button" className="qty-btn" onClick={() => setQty((q) => Math.min(99, q + 1))}>
                    +
                  </button>
                </div>
              </div>
            ) : null}
            <button
              type="button"
              className="btn btn-primary btn-block"
              disabled={previewProduct.soldOut}
              onClick={() => {
                if (!inCart) addItem(previewProduct, qty);
                else setQuantity(previewProduct.id, qty);
                closePreview();
              }}
            >
              {previewProduct.soldOut ? "Producto agotado" : "Agregar al carrito"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
