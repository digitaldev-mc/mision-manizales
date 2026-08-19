"use client";

import { TiendaCatalog } from "@/components/tienda/TiendaCatalog";
import type { StoreProduct } from "@/components/tienda/CartProvider";

export function TiendaSection({ products }: { products: StoreProduct[] }) {
  return (
    <section className="tienda" id="tienda">
      <div className="wrap">
        <TiendaCatalog products={products} />
      </div>
    </section>
  );
}
