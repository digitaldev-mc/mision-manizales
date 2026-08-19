import { prisma } from "@/lib/prisma";

export async function confirmStoreOrderByReference(
  referenceCode: string,
  providerOrderId?: string,
): Promise<boolean> {
  const order = await prisma.order.findFirst({
    where: { referenceCode, status: "pending" },
    include: { items: true },
  });

  if (!order) return false;

  if (order.status !== "pending") return true;

  await prisma.$transaction(async (tx) => {
    await tx.order.update({
      where: { id: order.id },
      data: {
        status: "paid",
        confirmedAt: new Date(),
        providerOrderId: providerOrderId ?? order.providerOrderId,
      },
    });

    for (const item of order.items) {
      await tx.product.update({
        where: { id: item.productId },
        data: { stock: { decrement: item.quantity } },
      });
    }
  });

  return true;
}

export async function failStoreOrderByReference(referenceCode: string): Promise<void> {
  await prisma.order.updateMany({
    where: { referenceCode, status: "pending" },
    data: { status: "cancelled" },
  });
}
