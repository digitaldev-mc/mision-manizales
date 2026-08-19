"use client";

import { fmtCOP } from "@/lib/format";
import { useCart, type StoreProduct } from "@/components/tienda/CartProvider";

type ProductCardProps = {
  product: StoreProduct;
  compact?: boolean;
};

export function ProductCard({ product, compact = false }: ProductCardProps) {
  const { addItem, openPreview } = useCart();

  return (
    <article
      className={`product-card product-card-interactive ${compact ? "product-card-compact" : ""}`}
      onClick={() => openPreview(product)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          openPreview(product);
        }
      }}
      role="button"
      tabIndex={0}
      aria-label={`Ver ${product.name}`}
    >
      <div className="product-media product-media-zoom">
        {product.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={product.imageUrl} alt={product.name} loading="lazy" />
        ) : (
          <span className="product-emoji">🛍️</span>
        )}
        {product.soldOut ? <span className="product-badge-sold">Agotado</span> : null}
        <div className="product-media-shine" aria-hidden />
      </div>
      <div className="product-body">
        <h3>{product.name}</h3>
        {!compact ? <p>{product.description}</p> : null}
        <div className="product-footer">
          <div className="product-price">{fmtCOP(product.priceCOP)}</div>
          <button
            type="button"
            className="btn btn-primary btn-sm product-add-btn"
            disabled={product.soldOut}
            onClick={(e) => {
              e.stopPropagation();
              addItem(product);
            }}
          >
            {product.soldOut ? "Agotado" : "Agregar"}
          </button>
        </div>
      </div>
    </article>
  );
}
