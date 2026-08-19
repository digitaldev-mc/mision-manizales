"use client";

import Link from "next/link";
import { ProductCard } from "@/components/tienda/ProductCard";
import type { StoreProduct } from "@/components/tienda/CartProvider";

export function TiendaCatalog({
  products,
  showHeader = true,
}: {
  products: StoreProduct[];
  showHeader?: boolean;
}) {
  return (
    <>
      {showHeader ? (
        <div className="tienda-top reveal">
          <div className="section-head" style={{ marginBottom: 0 }}>
            <span className="kicker">Merch solidario</span>
            <h2>Tienda Misión Comparte</h2>
            <p>Cada producto es también un aporte a la reconstrucción.</p>
          </div>
          <Link href="/tienda" className="btn btn-outline">
            Ver tienda completa
          </Link>
        </div>
      ) : null}
      <div className="product-grid">
        {products.length === 0 ? (
          <div className="empty-state store-empty">Pronto habrá productos disponibles.</div>
        ) : (
          products.map((p) => <ProductCard key={p.id} product={p} compact={showHeader} />)
        )}
      </div>
    </>
  );
}
