import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { savePublicUpload } from "@/lib/upload/save";

function slugify(text: string) {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

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
    const priceCOP = Number(formData.get("priceCOP"));
    const description = String(formData.get("description") ?? "").trim();
    const file = formData.get("file");
    let imageUrl = String(formData.get("imageUrl") ?? "").trim();

    if (file instanceof File && file.size > 0) {
      imageUrl = await savePublicUpload(file, "productos", { optimize: "product" });
    }

    if (!name || !Number.isFinite(priceCOP) || priceCOP <= 0) {
      return NextResponse.json({ error: "Nombre y precio válidos son obligatorios" }, { status: 400 });
    }

    if (!imageUrl) {
      return NextResponse.json({ error: "La imagen del producto es obligatoria" }, { status: 400 });
    }

    let slug = slugify(name);
    const existing = await prisma.product.findUnique({ where: { slug } });
    if (existing) slug = `${slug}-${Date.now().toString(36)}`;

    const product = await prisma.product.create({
      data: { name, slug, priceCOP, description, imageUrl, active: true },
    });

    revalidatePath("/admin/productos");
    revalidatePath("/");

    return NextResponse.json({ ok: true, product, imageUrl });
  } catch (error) {
    console.error("Create product:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Error al crear producto" },
      { status: 400 },
    );
  }
}
