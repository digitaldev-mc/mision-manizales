import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { encryptPII } from "@/lib/crypto";
import { donationSchema, generateReferenceCode } from "@/lib/validation/donation";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = donationSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }

    const data = parsed.data;
    const ip =
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
      request.headers.get("x-real-ip") ??
      "unknown";

    const referenceCode = generateReferenceCode("MM-DON");
    const now = new Date();

    const donation = await prisma.donation.create({
      data: {
        referenceCode,
        amountCOP: data.amountCOP,
        amountOriginal: data.amountCOP,
        currencyOriginal: "COP",
        documentType: data.documentType,
        documentNumber: encryptPII(data.documentNumber),
        fullName: data.fullName,
        phone: encryptPII(data.phone),
        email: data.email,
        address: encryptPII(data.address),
        dataConsentAt: now,
        dataConsentIp: ip,
        licitOriginDeclaredAt: now,
        paymentMethod: data.paymentMethod,
        status: "pending",
      },
    });

    return NextResponse.json({
      donationId: donation.id,
      referenceCode: donation.referenceCode,
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Error al crear la donación" }, { status: 500 });
  }
}
