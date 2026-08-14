import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { writeAuditLog } from "@/lib/audit";
import { z } from "zod";

const schema = z.object({
  manualAdjustCOP: z.number().int(),
});

export async function PATCH(request: NextRequest) {
  try {
    const user = await requireAdmin(["SUPERADMIN"]);
    const body = schema.parse(await request.json());

    const current = await prisma.thermometerSetting.upsert({
      where: { id: 1 },
      create: { id: 1, goalCOP: 500_000_000, manualAdjustCOP: body.manualAdjustCOP },
      update: { manualAdjustCOP: body.manualAdjustCOP, updatedBy: user.id },
    });

    await writeAuditLog({
      entity: "ThermometerSetting",
      entityId: "1",
      action: "manual_adjust",
      actorId: user.id,
      diff: { manualAdjustCOP: body.manualAdjustCOP },
    });

    return NextResponse.json(current);
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }
    if (error instanceof Error && error.message === "FORBIDDEN") {
      return NextResponse.json({ error: "Prohibido" }, { status: 403 });
    }
    return NextResponse.json({ error: "Error al ajustar termómetro" }, { status: 500 });
  }
}
