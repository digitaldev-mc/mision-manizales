import Link from "next/link";
import { fmtCOP } from "@/lib/format";

type ProductItem = {
  id: string;
  name: string;
  description: string;
  priceCOP: number;
  imageUrl: string;
  soldOut: boolean;
};

export function TiendaSection({ products }: { products: ProductItem[] }) {
  return (
    <section className="tienda" id="tienda">
      <div className="wrap">
        <div className="tienda-top reveal">
          <div className="section-head" style={{ marginBottom: 0 }}>
            <span className="kicker">Merch solidario</span>
            <h2>Tienda Misión Comparte</h2>
            <p>Cada producto es también un aporte a la reconstrucción.</p>
          </div>
        </div>
        <div className="product-grid" id="product-grid">
          {products.length === 0 ? (
            <div
              className="empty-state"
              style={{ gridColumn: "1/-1", color: "#8a97a3", borderColor: "#ddd" }}
            >
              Aún no hay productos publicados. Se agregarán pronto desde el panel administrativo.
            </div>
          ) : (
            products.map((p) => (
              <div className="product-card" key={p.id}>
                <div className="product-media">
                  {p.imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={p.imageUrl} alt={p.name} />
                  ) : (
                    "🛍️"
                  )}
                </div>
                <div className="product-body">
                  <h3>{p.name}</h3>
                  <p>{p.description}</p>
                  <div className="product-price">{fmtCOP(p.priceCOP)}</div>
                  <Link href="/tienda" className="btn btn-outline btn-sm" style={{ marginTop: 6 }}>
                    Ver en tienda
                  </Link>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </section>
  );
}
