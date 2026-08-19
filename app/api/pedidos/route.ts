import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { encryptPII } from "@/lib/crypto";
import { calcOrderTotals } from "@/lib/orders/calc";
import { orderSchema } from "@/lib/validation/order";
import { generateReferenceCode } from "@/lib/validation/donation";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = orderSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }

    const data = parsed.data;
    const ip =
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
      request.headers.get("x-real-ip") ??
      "unknown";

    const productIds = [...new Set(data.items.map((i) => i.productId))];
    const products = await prisma.product.findMany({
      where: { id: { in: productIds }, active: true },
    });

    if (products.length !== productIds.length) {
      return NextResponse.json({ error: "Uno o más productos no están disponibles" }, { status: 400 });
    }

    const productMap = new Map(products.map((p) => [p.id, p]));
    const lineItems: {
      productId: string;
      quantity: number;
      unitPriceCOP: number;
      priceCOP: number;
      thermometerPercent: number;
    }[] = [];

    for (const item of data.items) {
      const product = productMap.get(item.productId);
      if (!product || product.soldOut) {
        return NextResponse.json(
          { error: `"${product?.name ?? "Producto"}" no está disponible` },
          { status: 400 },
        );
      }
      if (product.stock > 0 && item.quantity > product.stock) {
        return NextResponse.json(
          { error: `Stock insuficiente para "${product.name}"` },
          { status: 400 },
        );
      }
      lineItems.push({
        productId: product.id,
        quantity: item.quantity,
        unitPriceCOP: product.priceCOP,
        priceCOP: product.priceCOP,
        thermometerPercent: product.thermometerPercent,
      });
    }

    const totals = calcOrderTotals(lineItems);
    const referenceCode = generateReferenceCode("MM-ORD");
    const now = new Date();

    const order = await prisma.order.create({
      data: {
        referenceCode,
        documentType: data.documentType,
        documentNumber: encryptPII(data.documentNumber),
        fullName: data.fullName,
        phone: encryptPII(data.phone),
        email: data.email,
        address: encryptPII(data.address),
        paymentMethod: data.paymentMethod,
        status: "pending",
        subtotalCOP: totals.subtotalCOP,
        shippingCOP: totals.shippingCOP,
        thermometerContributionCOP: totals.thermometerContributionCOP,
        totalCOP: totals.totalCOP,
        dataConsentAt: now,
        dataConsentIp: ip,
        items: {
          create: lineItems.map((item) => ({
            productId: item.productId,
            quantity: item.quantity,
            unitPriceCOP: item.unitPriceCOP,
          })),
        },
      },
    });

    return NextResponse.json({
      orderId: order.id,
      referenceCode: order.referenceCode,
      totalCOP: order.totalCOP,
      subtotalCOP: order.subtotalCOP,
      shippingCOP: order.shippingCOP,
      thermometerContributionCOP: order.thermometerContributionCOP,
    });
  } catch (error) {
    console.error("Create order:", error);
    return NextResponse.json({ error: "Error al crear el pedido" }, { status: 500 });
  }
}
