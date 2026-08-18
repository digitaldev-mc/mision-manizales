import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { paypalProvider } from "@/lib/payments/paypal";

export async function POST(request: NextRequest) {
  try {
    const { orderID, donationId } = (await request.json()) as {
      orderID?: string;
      donationId?: string;
    };

    if (!orderID || !donationId) {
      return NextResponse.json({ error: "orderID y donationId requeridos" }, { status: 400 });
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

    return NextResponse.json({ ok: true, referenceCode: donation.referenceCode });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Error al capturar pago PayPal" }, { status: 500 });
  }
}
