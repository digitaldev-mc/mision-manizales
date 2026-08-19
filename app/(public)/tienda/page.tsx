import { prisma } from "@/lib/prisma";
import { TiendaPageClient } from "@/components/tienda/TiendaPageClient";

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
    <TiendaPageClient
      products={products.map((p) => ({
        id: p.id,
        name: p.name,
        description: p.description,
        priceCOP: p.priceCOP,
        imageUrl: p.imageUrl,
        soldOut: p.soldOut,
        thermometerPercent: p.thermometerPercent,
        slug: p.slug,
      }))}
    />
  );
}
