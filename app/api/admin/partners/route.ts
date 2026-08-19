import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { savePublicUpload } from "@/lib/upload/save";

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const role = session.user.role;
  if (role !== "SUPERADMIN" && role !== "CONTENIDO") {
    return NextResponse.json({ error: "Sin permiso" }, { status: 403 });
  }

  try {
    const formData = await request.formData();
    const name = String(formData.get("name") ?? "").trim();
    const file = formData.get("file");
    let logoUrl = String(formData.get("logoUrl") ?? "").trim() || null;

    if (file instanceof File && file.size > 0) {
      logoUrl = await savePublicUpload(file, "aliados", { optimize: "logo" });
    }

    if (!name) {
      return NextResponse.json({ error: "Nombre requerido" }, { status: 400 });
    }

    const partner = await prisma.partner.create({
      data: { name, logoUrl, active: true },
    });

    revalidatePath("/admin/contenido");
    revalidatePath("/");

    return NextResponse.json({ ok: true, partner });
  } catch (error) {
    console.error("Create partner:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Error al crear aliado" },
      { status: 400 },
    );
  }
}
