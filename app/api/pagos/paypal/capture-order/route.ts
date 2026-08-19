import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { paypalProvider } from "@/lib/payments/paypal";
import { donationToMailInput, notifyDonationConfirmed } from "@/lib/email/notify-donation";
import { confirmStoreOrderByReference } from "@/lib/orders/confirm";

export async function POST(request: NextRequest) {
  try {
    const { orderID, donationId, orderId } = (await request.json()) as {
      orderID?: string;
      donationId?: string;
      orderId?: string;
    };

    if (!orderID) {
      return NextResponse.json({ error: "orderID requerido" }, { status: 400 });
    }

    if (orderId) {
      const order = await prisma.order.findUnique({ where: { id: orderId } });
      if (!order || order.paymentMethod !== "paypal") {
        return NextResponse.json({ error: "Pedido no encontrado" }, { status: 404 });
      }

      if (order.providerOrderId && order.providerOrderId !== orderID) {
        return NextResponse.json({ error: "Orden no coincide" }, { status: 400 });
      }

      const capture = await paypalProvider.captureOrder(orderID);
      if (!capture.captured) {
        return NextResponse.json({ error: "No se pudo capturar el pago" }, { status: 502 });
      }

      await confirmStoreOrderByReference(order.referenceCode, orderID);

      return NextResponse.json({ ok: true, referenceCode: order.referenceCode, type: "order" });
    }

    if (!donationId) {
      return NextResponse.json({ error: "donationId u orderId requerido" }, { status: 400 });
    }

    const donation = await prisma.donation.findUnique({ where: { id: donationId } });
    if (!donation || donation.paymentMethod !== "paypal") {
      return NextResponse.json({ error: "Donación no encontrada" }, { status: 404 });
    }

    if (donation.providerOrderId && donation.providerOrderId !== orderID) {
      return NextResponse.json({ error: "Orden no coincide" }, { status: 400 });
    }

    const capture = await paypalProvider.captureOrder(orderID);
    if (!capture.captured) {
      return NextResponse.json({ error: "No se pudo capturar el pago" }, { status: 502 });
    }

    await prisma.donation.update({
      where: { id: donation.id },
      data: {
        status: "confirmed",
        providerOrderId: orderID,
        confirmedAt: new Date(),
      },
    });

    try {
      await notifyDonationConfirmed(donationToMailInput(donation));
    } catch (emailErr) {
      console.error("Email donación:", emailErr);
    }

    return NextResponse.json({ ok: true, referenceCode: donation.referenceCode, type: "donation" });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Error al capturar pago PayPal" }, { status: 500 });
  }
}
