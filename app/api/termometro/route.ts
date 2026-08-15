import { unstable_cache } from "next/cache";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

async function computeThermometer() {
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

  const goalCOP = settings?.goalCOP ?? 500_000_000;
  const manualAdjustCOP = settings?.manualAdjustCOP ?? 0;
  const raisedCOP =
    (donations._sum.amountCOP ?? 0) +
    (paidOrders._sum.totalCOP ?? 0) +
    manualAdjustCOP;

  return {
    goalCOP,
    raisedCOP,
    donationCount,
    percent: goalCOP > 0 ? Math.min(100, Math.round((raisedCOP / goalCOP) * 100)) : 0,
  };
}

const getCachedThermometer = unstable_cache(computeThermometer, ["termometro"], {
  revalidate: 10,
});

export async function GET() {
  const data = await getCachedThermometer();
  return NextResponse.json(data);
}
