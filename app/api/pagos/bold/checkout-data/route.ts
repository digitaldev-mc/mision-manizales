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
    const { donationId, orderId } = (await request.json()) as {
      donationId?: string;
      orderId?: string;
    };

    const apiKey = boldIdentityKey();
    if (!apiKey) {
      return NextResponse.json({ error: "Bold no está configurado" }, { status: 503 });
    }

    if (orderId) {
      const order = await prisma.order.findUnique({ where: { id: orderId } });
      if (!order || order.paymentMethod !== "pse") {
        return NextResponse.json({ error: "Pedido no encontrado" }, { status: 404 });
      }

      const orderIdBold = order.referenceCode.slice(0, 60);
      const amount = order.totalCOP;
      const currency = "COP";
      const integritySignature = boldIntegritySignature(orderIdBold, amount, currency);
      const phone = safeDecrypt(order.phone).replace(/\D/g, "");
      const site = boldSiteUrl();

      return NextResponse.json({
        apiKey,
        orderId: orderIdBold,
        amount,
        currency,
        integritySignature,
        redirectionUrl: `${site}/gracias?ref=${encodeURIComponent(order.referenceCode)}&metodo=bold&tipo=tienda`,
        originUrl: `${site}/tienda`,
        description: `Compra Misión Comparte · ${order.referenceCode}`,
        customerData: JSON.stringify({
          email: order.email,
          fullName: order.fullName,
          phone: phone.slice(-10),
          dialCode: "+57",
          documentNumber: safeDecrypt(order.documentNumber),
          documentType: boldDocumentType(order.documentType),
        }),
        billingAddress: JSON.stringify({
          address: safeDecrypt(order.address),
          country: "CO",
        }),
      });
    }

    if (!donationId) {
      return NextResponse.json({ error: "donationId u orderId requerido" }, { status: 400 });
    }

    const donation = await prisma.donation.findUnique({ where: { id: donationId } });
    if (!donation || donation.paymentMethod !== "pse") {
      return NextResponse.json({ error: "Donación no encontrada" }, { status: 404 });
    }

    const orderIdBold = donation.referenceCode.slice(0, 60);
    const amount = donation.amountCOP;
    const currency = "COP";
    const integritySignature = boldIntegritySignature(orderIdBold, amount, currency);
    const phone = safeDecrypt(donation.phone).replace(/\D/g, "");
    const site = boldSiteUrl();

    return NextResponse.json({
      apiKey,
      orderId: orderIdBold,
      amount,
      currency,
      integritySignature,
      redirectionUrl: `${site}/gracias?ref=${encodeURIComponent(donation.referenceCode)}&metodo=bold`,
      originUrl: `${site}/donar`,
      description: `Donación Misión Comparte · ${donation.referenceCode}`,
      customerData: JSON.stringify({
        email: donation.email,
        fullName: donation.fullName,
        phone: phone.slice(-10),
        dialCode: "+57",
        documentNumber: safeDecrypt(donation.documentNumber),
        documentType: boldDocumentType(donation.documentType),
      }),
      billingAddress: JSON.stringify({
        address: safeDecrypt(donation.address),
        country: "CO",
      }),
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Error al preparar Bold" },
      { status: 500 },
    );
  }
}
