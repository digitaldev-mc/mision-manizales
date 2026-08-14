import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export async function writeAuditLog(input: {
  entity: string;
  entityId: string;
  action: string;
  actorId: string;
  diff?: Record<string, unknown>;
}) {
  await prisma.auditLog.create({
    data: {
      entity: input.entity,
      entityId: input.entityId,
      action: input.action,
      actorId: input.actorId,
      diff: input.diff as Prisma.InputJsonValue | undefined,
    },
  });
}
