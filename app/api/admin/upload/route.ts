import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { savePublicUpload } from "@/lib/upload/save";
import { optimizeProfileForFolder } from "@/lib/upload/optimize";

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  try {
    const formData = await request.formData();
    const file = formData.get("file");
    const folder = String(formData.get("folder") ?? "misc");
    const forceOptimize = formData.get("optimize") === "1";

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "Archivo requerido" }, { status: 400 });
    }

    const url = await savePublicUpload(file, folder, {
      optimize: forceOptimize ? "carousel" : optimizeProfileForFolder(folder),
    });
    return NextResponse.json({
      url,
      optimized: optimizeProfileForFolder(folder) !== "none" || forceOptimize,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Error al subir" },
      { status: 400 },
    );
  }
}
