import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { donationToMailInput, notifyDonationConfirmed } from "@/lib/email/notify-donation";
import { confirmStoreOrderByReference } from "@/lib/orders/confirm";

export async function POST(request: NextRequest) {
  try {
    const { referenceCode, txStatus } = (await request.json()) as {
      referenceCode?: string;
      txStatus?: string;
    };

    if (!referenceCode) {
      return NextResponse.json({ error: "referenceCode requerido" }, { status: 400 });
    }

    const isStoreOrder = referenceCode.startsWith("MM-ORD");

    if (isStoreOrder) {
      const order = await prisma.order.findFirst({
        where: { referenceCode, paymentMethod: "pse" },
      });

      if (!order) {
        return NextResponse.json({ error: "Pedido no encontrado" }, { status: 404 });
      }

      if (order.status === "paid") {
        return NextResponse.json({ ok: true, status: "confirmed", type: "order" });
      }

      const approved = (txStatus ?? "").toLowerCase() === "approved";
      if (!approved) {
        return NextResponse.json({ ok: true, status: order.status, type: "order" });
      }

      await confirmStoreOrderByReference(referenceCode);
      return NextResponse.json({ ok: true, status: "confirmed", type: "order" });
    }

    const donation = await prisma.donation.findFirst({
      where: { referenceCode, paymentMethod: "pse" },
    });

    if (!donation) {
      return NextResponse.json({ error: "Donación no encontrada" }, { status: 404 });
    }

    if (donation.status === "confirmed") {
      return NextResponse.json({ ok: true, status: "confirmed", type: "donation" });
    }

    const approved = (txStatus ?? "").toLowerCase() === "approved";
    if (!approved) {
      return NextResponse.json({ ok: true, status: donation.status, type: "donation" });
    }

    const updated = await prisma.donation.update({
      where: { id: donation.id },
      data: { status: "confirmed", confirmedAt: new Date() },
    });

    try {
      await notifyDonationConfirmed(donationToMailInput(updated));
    } catch (emailErr) {
      console.error("Email donación Bold:", emailErr);
    }

    return NextResponse.json({ ok: true, status: "confirmed", type: "donation" });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Error al confirmar" }, { status: 500 });
  }
}
