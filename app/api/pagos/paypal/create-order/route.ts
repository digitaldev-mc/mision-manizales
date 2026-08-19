import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { paypalProvider } from "@/lib/payments/paypal";

/** PayPal en Colombia suele operar en USD; convertimos desde COP con TRM configurable. */
function paypalAmountFromDonation(amountCOP: number) {
  const trm = Number(process.env.PAYPAL_USD_TRM || "4200");
  const safeTrm = Number.isFinite(trm) && trm > 0 ? trm : 4200;
  const usd = Math.max(1, amountCOP / safeTrm);
  return { amount: usd, currency: "USD" as const };
}

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

    const { amount, currency } = paypalAmountFromDonation(donation.amountCOP);

    const order = await paypalProvider.createOrder({
      amount,
      currency,
      referenceCode: donation.referenceCode,
    });

    await prisma.donation.update({
      where: { id: donation.id },
      data: {
        providerOrderId: order.providerOrderId,
        amountOriginal: Math.round(amount * 100),
        currencyOriginal: currency,
      },
    });

    return NextResponse.json({ orderID: order.redirectOrClientToken, currency, amount });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "No se pudo crear la orden PayPal" },
      { status: 500 },
    );
  }
}
