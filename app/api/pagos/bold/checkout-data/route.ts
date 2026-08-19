import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { decryptPII } from "@/lib/crypto";
import {
  boldDocumentType,
  boldIdentityKey,
  boldIntegritySignature,
  boldSiteUrl,
} from "@/lib/payments/bold";

function safeDecrypt(value: string): string {
  try {
    return decryptPII(value);
  } catch {
    return value;
  }
}

export async function POST(request: NextRequest) {
  try {
    const { donationId } = (await request.json()) as { donationId?: string };
    if (!donationId) {
      return NextResponse.json({ error: "donationId requerido" }, { status: 400 });
    }

    const apiKey = boldIdentityKey();
    if (!apiKey) {
      return NextResponse.json({ error: "Bold no está configurado" }, { status: 503 });
    }

    const donation = await prisma.donation.findUnique({ where: { id: donationId } });
    if (!donation || donation.paymentMethod !== "pse") {
      return NextResponse.json({ error: "Donación no encontrada" }, { status: 404 });
    }

    const orderId = donation.referenceCode.slice(0, 60);
    const amount = donation.amountCOP;
    const currency = "COP";
    const integritySignature = boldIntegritySignature(orderId, amount, currency);

    const phone = safeDecrypt(donation.phone).replace(/\D/g, "");
    const customerData = JSON.stringify({
      email: donation.email,
      fullName: donation.fullName,
      phone: phone.slice(-10),
      dialCode: "+57",
      documentNumber: safeDecrypt(donation.documentNumber),
      documentType: boldDocumentType(donation.documentType),
    });

    const address = safeDecrypt(donation.address);
    const billingAddress = JSON.stringify({
      address,
      country: "CO",
    });

    const site = boldSiteUrl();
    const redirectionUrl = `${site}/gracias?ref=${encodeURIComponent(donation.referenceCode)}&metodo=bold`;

    return NextResponse.json({
      apiKey,
      orderId,
      amount,
      currency,
      integritySignature,
      redirectionUrl,
      originUrl: `${site}/donar`,
      description: `Donación Misión Comparte · ${donation.referenceCode}`,
      customerData,
      billingAddress,
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Error al preparar Bold" },
      { status: 500 },
    );
  }
}
