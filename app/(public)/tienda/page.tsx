import Link from "next/link";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function TiendaPage() {
  let products: Awaited<ReturnType<typeof prisma.product.findMany>> = [];
  try {
    products = await prisma.product.findMany({
      where: { active: true },
      orderBy: { createdAt: "desc" },
    });
  } catch {
    products = [];
  }

  return (
    <div className="wrap" style={{ padding: "48px 24px" }}>
      <Link href="/" style={{ display: "inline-block", marginBottom: 24 }}>
        ← Volver al inicio
      </Link>
      <h1>Tienda Misión Manizales</h1>
      <p style={{ margin: "12px 0 32px", color: "#5a6875" }}>
        Cada producto es también un aporte a la reconstrucción.
      </p>
      {products.length === 0 ? (
        <p style={{ color: "#8a97a3" }}>Pronto habrá productos disponibles.</p>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: 20 }}>
          {products.map((p) => (
            <article
              key={p.id}
              style={{
                background: "#fff",
                borderRadius: 16,
                padding: 20,
                boxShadow: "var(--shadow)",
              }}
            >
              <h3>{p.name}</h3>
              <p style={{ margin: "8px 0", color: "#5a6875", fontSize: "0.9rem" }}>
                {p.description.slice(0, 120)}
              </p>
              <p className="mono" style={{ fontWeight: 700 }}>
                ${p.priceCOP.toLocaleString("es-CO")} COP
              </p>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
