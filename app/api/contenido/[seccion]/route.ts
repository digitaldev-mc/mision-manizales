import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ seccion: string }> },
) {
  const { seccion } = await params;
  const block = await prisma.contentBlock.findUnique({ where: { section: seccion } });
  if (!block) {
    return NextResponse.json({ section: seccion, data: null });
  }
  return NextResponse.json(block);
}
