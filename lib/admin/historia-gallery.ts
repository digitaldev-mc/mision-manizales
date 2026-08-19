import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

type HistoriaGalleryData = { images: string[]; tag?: string };

const defaultHistoriaGallery: HistoriaGalleryData = {
  images: ["/assets/empanada-foto.png"],
  tag: "🫓 Un gesto compartido",
};

export async function getHistoriaGalleryData(): Promise<HistoriaGalleryData> {
  const block = await prisma.contentBlock.findUnique({ where: { section: "historia_galeria" } });
  if (!block?.data) return defaultHistoriaGallery;
  return { ...defaultHistoriaGallery, ...(block.data as HistoriaGalleryData) };
}

export async function appendHistoriaImageByUrl(imageUrl: string, userId: string) {
  const current = await getHistoriaGalleryData();
  const images = [...current.images.filter((u) => u !== imageUrl), imageUrl];

  await prisma.contentBlock.upsert({
    where: { section: "historia_galeria" },
    create: { section: "historia_galeria", data: { ...current, images }, updatedBy: userId },
    update: { data: { ...current, images }, updatedBy: userId },
  });

  revalidatePath("/admin/contenido");
  revalidatePath("/");
}
