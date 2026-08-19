import { prisma } from "@/lib/prisma";
import { AdminProductosPanel } from "@/components/admin/AdminProductosPanel";

export const dynamic = "force-dynamic";

export default async function AdminProductosPage() {
  const products = await prisma.product.findMany({ orderBy: { createdAt: "desc" } });

  return (
    <AdminProductosPanel
      initialProducts={products.map((p) => ({
        id: p.id,
        name: p.name,
        slug: p.slug,
        priceCOP: p.priceCOP,
        imageUrl: p.imageUrl,
        thermometerPercent: p.thermometerPercent,
        stock: p.stock,
        active: p.active,
      }))}
    />
  );
}
