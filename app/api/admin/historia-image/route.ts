import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { appendHistoriaImageByUrl } from "@/lib/admin/historia-gallery";

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  try {
    const body = (await request.json()) as { imageUrl?: string };
    const imageUrl = String(body.imageUrl ?? "").trim();
    if (!imageUrl) {
      return NextResponse.json({ error: "imageUrl requerido" }, { status: 400 });
    }

    await appendHistoriaImageByUrl(imageUrl, session.user.id);
    return NextResponse.json({ ok: true, url: imageUrl });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Error al agregar imagen" },
      { status: 400 },
    );
  }
}
