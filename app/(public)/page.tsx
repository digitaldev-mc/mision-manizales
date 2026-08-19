import { HomePage } from "@/components/v2/HomePage";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

async function getThermometerSnapshot() {
  const [donations, settings, paidOrders, donationCount] = await Promise.all([
    prisma.donation.aggregate({
      where: { status: "confirmed" },
      _sum: { amountCOP: true },
    }),
    prisma.thermometerSetting.findUnique({ where: { id: 1 } }),
    prisma.order.aggregate({
      where: { status: { in: ["paid", "preparing", "shipped", "delivered"] } },
      _sum: { thermometerContributionCOP: true },
    }),
    prisma.donation.count({ where: { status: "confirmed" } }),
  ]);

  const manualAdjustCOP = settings?.manualAdjustCOP ?? 0;
  const raisedCOP =
    (donations._sum.amountCOP ?? 0) +
    (paidOrders._sum.thermometerContributionCOP ?? 0) +
    manualAdjustCOP;

  return { raisedCOP, donorCount: donationCount };
}

async function getHistoriaGallery() {
  const block = await prisma.contentBlock.findUnique({ where: { section: "historia_galeria" } });
  const data = (block?.data ?? {}) as { images?: string[]; tag?: string };
  const images =
    Array.isArray(data.images) && data.images.length > 0
      ? data.images
      : ["/assets/empanada-foto.png"];
  return { images, tag: data.tag ?? "🫓 Un gesto compartido" };
}

export default async function Page() {
  const [thermo, historia, events, stories, partners, products] = await Promise.all([
    getThermometerSnapshot(),
    getHistoriaGallery(),
    prisma.event.findMany({
      where: { published: true },
      orderBy: { date: "asc" },
      take: 12,
    }),
    prisma.story.findMany({
      where: { published: true },
      orderBy: { order: "asc" },
      take: 12,
    }),
    prisma.partner.findMany({
      where: { active: true },
      orderBy: { order: "asc" },
    }),
    prisma.product.findMany({
      where: { active: true },
      orderBy: { createdAt: "desc" },
      take: 8,
    }),
  ]);

  return (
    <HomePage
      raisedCOP={thermo.raisedCOP}
      donorCount={thermo.donorCount}
      historiaImages={historia.images}
      historiaTag={historia.tag}
      events={events.map((e) => ({
        id: e.id,
        title: e.title,
        date: e.date.toISOString(),
        place: e.place,
        description: e.description,
      }))}
      stories={stories.map((s) => ({
        id: s.id,
        title: s.title,
        videoUrl: s.videoUrl,
        description: s.description,
      }))}
      partners={partners.map((p) => ({ id: p.id, name: p.name, logoUrl: p.logoUrl }))}
      products={products.map((p) => ({
        id: p.id,
        name: p.name,
        description: p.description,
        priceCOP: p.priceCOP,
        imageUrl: p.imageUrl,
        soldOut: p.soldOut,
        thermometerPercent: p.thermometerPercent,
      }))}
    />
  );
}
