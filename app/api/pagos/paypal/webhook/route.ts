import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { paypalProvider } from "@/lib/payments/paypal";
import {
  sendAdminDonationNotify,
  sendDonationConfirmedEmail,
} from "@/lib/email/resend";

export async function POST(request: NextRequest) {
  const rawBody = await request.text();

  const verified = await paypalProvider.verifyWebhookSignature(
    request.headers,
    rawBody,
  );
  if (!verified) {
    return NextResponse.json({ error: "Firma inválida" }, { status: 403 });
  }

  const parsed = paypalProvider.parseWebhookEvent(rawBody);

  const existing = await prisma.webhookEvent.findUnique({
    where: { eventId: parsed.eventId },
  });
  if (existing) {
    return NextResponse.json({ ok: true, duplicate: true });
  }

  await prisma.webhookEvent.create({
    data: {
      provider: "paypal",
      eventId: parsed.eventId,
      eventType: parsed.eventType,
      payload: JSON.parse(rawBody),
    },
  });

  if (parsed.status === "approved" && parsed.providerOrderId) {
    await paypalProvider.captureOrder(parsed.providerOrderId);

    const donation = await prisma.donation.findFirst({
      where: { providerOrderId: parsed.providerOrderId },
    });

    if (donation && donation.status === "pending") {
      await prisma.$transaction(async (tx) => {
        await tx.donation.update({
          where: { id: donation.id },
          data: { status: "confirmed", confirmedAt: new Date() },
        });
      });

      try {
        await sendDonationConfirmedEmail({
          to: donation.email,
          fullName: donation.fullName,
          amountCOP: donation.amountCOP,
          referenceCode: donation.referenceCode,
        });
        await sendAdminDonationNotify({
          fullName: donation.fullName,
          amountCOP: donation.amountCOP,
          referenceCode: donation.referenceCode,
          paymentMethod: donation.paymentMethod,
        });
      } catch (emailErr) {
        console.error("Email error:", emailErr);
      }
    }
  }

  if (parsed.status === "failed" && parsed.providerOrderId) {
    await prisma.donation.updateMany({
      where: { providerOrderId: parsed.providerOrderId, status: "pending" },
      data: { status: "failed" },
    });
  }

  return NextResponse.json({ ok: true });
}
