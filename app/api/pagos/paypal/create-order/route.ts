import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { paypalProvider } from "@/lib/payments/paypal";

export async function POST(request: NextRequest) {
  try {
    const { donationId } = (await request.json()) as { donationId?: string };
    if (!donationId) {
      return NextResponse.json({ error: "donationId requerido" }, { status: 400 });
    }

    const donation = await prisma.donation.findUnique({ where: { id: donationId } });
    if (!donation || donation.paymentMethod !== "paypal") {
      return NextResponse.json({ error: "Donación no encontrada" }, { status: 404 });
    }

    const currency = donation.currencyOriginal === "USD" ? "USD" : "COP";
    const amount =
      currency === "USD"
        ? Math.round(donation.amountOriginal)
        : donation.amountCOP;

    const order = await paypalProvider.createOrder({
      amount: currency === "USD" ? amount : amount,
      currency,
      referenceCode: donation.referenceCode,
    });

    await prisma.donation.update({
      where: { id: donation.id },
      data: { providerOrderId: order.providerOrderId },
    });

    return NextResponse.json({ orderID: order.redirectOrClientToken });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "No se pudo crear la orden PayPal" }, { status: 500 });
  }
}
