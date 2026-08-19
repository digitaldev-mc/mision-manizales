"use client";

import Link from "next/link";
import { SiteFooter } from "@/components/v2/SiteFooter";
import { SiteNav } from "@/components/v2/SiteNav";
import { ScrollProgress } from "@/components/v2/SiteLoader";
import { useScrollReveal } from "@/components/v2/useScrollReveal";
import { TiendaCatalog } from "@/components/tienda/TiendaCatalog";
import type { StoreProduct } from "@/components/tienda/CartProvider";

export function TiendaPageClient({ products }: { products: StoreProduct[] }) {
  useScrollReveal();

  return (
    <>
      <ScrollProgress />
      <SiteNav />
      <main className="store-page">
        <section className="store-hero">
          <div className="wrap store-hero-inner reveal">
            <Link href="/" className="store-back-link">
              ← Volver al inicio
            </Link>
            <span className="kicker">Merch solidario</span>
            <h1>Tienda Misión Comparte</h1>
            <p>
              Cada compra impulsa la reconstrucción. Domicilio fijo en Manizales:{" "}
              <strong>$7.000 COP</strong>.
            </p>
          </div>
        </section>
        <section className="tienda store-catalog-section">
          <div className="wrap">
            <TiendaCatalog products={products} showHeader={false} />
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
