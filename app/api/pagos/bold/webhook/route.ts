import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { donationToMailInput, notifyDonationConfirmed } from "@/lib/email/notify-donation";
import { confirmStoreOrderByReference, failStoreOrderByReference } from "@/lib/orders/confirm";
import { verifyBoldWebhookSignature, type BoldWebhookPayload } from "@/lib/payments/bold";

async function confirmDonationByReference(reference: string, providerOrderId?: string) {
  const donation = await prisma.donation.findFirst({
    where: { referenceCode: reference, status: "pending", paymentMethod: "pse" },
  });
  if (!donation) return false;

  await prisma.donation.update({
    where: { id: donation.id },
    data: {
      status: "confirmed",
      confirmedAt: new Date(),
      providerOrderId: providerOrderId ?? donation.providerOrderId,
    },
  });

  try {
    await notifyDonationConfirmed(donationToMailInput({ ...donation, confirmedAt: new Date() }));
  } catch (emailErr) {
    console.error("Email donación Bold:", emailErr);
  }

  return true;
}

export async function POST(request: NextRequest) {
  const rawBody = await request.text();
  const signature = request.headers.get("x-bold-signature");

  if (!verifyBoldWebhookSignature(rawBody, signature)) {
    return NextResponse.json({ error: "Firma inválida" }, { status: 403 });
  }

  let payload: BoldWebhookPayload;
  try {
    payload = JSON.parse(rawBody) as BoldWebhookPayload;
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }

  if (payload.type === "SALE_APPROVED") {
    const reference = payload.data?.metadata?.reference;
    if (reference) {
      if (reference.startsWith("MM-ORD")) {
        await confirmStoreOrderByReference(reference, payload.data?.payment_id);
      } else {
        await confirmDonationByReference(reference, payload.data?.payment_id);
      }
    }
  }

  if (payload.type === "SALE_REJECTED") {
    const reference = payload.data?.metadata?.reference;
    if (reference) {
      if (reference.startsWith("MM-ORD")) {
        await failStoreOrderByReference(reference);
      } else {
        await prisma.donation.updateMany({
          where: { referenceCode: reference, status: "pending", paymentMethod: "pse" },
          data: { status: "failed" },
        });
      }
    }
  }

  return NextResponse.json({ ok: true });
}
