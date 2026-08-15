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
      _sum: { totalCOP: true },
    }),
    prisma.donation.count({ where: { status: "confirmed" } }),
  ]);

  const manualAdjustCOP = settings?.manualAdjustCOP ?? 0;
  const raisedCOP =
    (donations._sum.amountCOP ?? 0) +
    (paidOrders._sum.totalCOP ?? 0) +
    manualAdjustCOP;

  return { raisedCOP, donorCount: donationCount };
}

export default async function Page() {
  const [thermo, events, stories, partners, products] = await Promise.all([
    getThermometerSnapshot(),
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
      partners={partners.map((p) => ({ id: p.id, name: p.name }))}
      products={products.map((p) => ({
        id: p.id,
        name: p.name,
        description: p.description,
        priceCOP: p.priceCOP,
        imageUrl: p.imageUrl,
        soldOut: p.soldOut,
      }))}
    />
  );
}
