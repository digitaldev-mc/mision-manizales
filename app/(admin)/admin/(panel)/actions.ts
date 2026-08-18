"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin, signOut } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { writeAuditLog } from "@/lib/audit";
import { donationToMailInput, notifyDonationConfirmed } from "@/lib/email/notify-donation";
import { generateReferenceCode } from "@/lib/validation/donation";
import { readUploadFile, savePublicUpload } from "@/lib/upload/save";
import type { OrderStatus } from "@prisma/client";

function slugify(text: string) {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export async function confirmDonationAction(id: string) {
  const user = await requireAdmin(["SUPERADMIN", "FINANZAS"]);
  const donation = await prisma.donation.update({
    where: { id },
    data: {
      status: "confirmed",
      confirmedAt: new Date(),
      confirmedBy: user.id,
    },
  });
  await writeAuditLog({
    entity: "Donation",
    entityId: id,
    action: "confirm",
    actorId: user.id,
  });
  try {
    await notifyDonationConfirmed(donationToMailInput(donation));
  } catch (err) {
    console.error("Email donación:", err);
  }
  revalidatePath("/admin/donaciones");
  revalidatePath("/admin");
  revalidatePath("/");
}

export async function deleteDonationAction(formData: FormData) {
  const user = await requireAdmin(["SUPERADMIN", "FINANZAS"]);
  const id = String(formData.get("id") ?? "");
  const confirmText = String(formData.get("confirmText") ?? "");

  if (confirmText !== "ELIMINAR") {
    throw new Error('Debes escribir ELIMINAR (en mayúsculas) para confirmar.');
  }

  const donation = await prisma.donation.findUnique({ where: { id } });
  if (!donation) {
    throw new Error("Donación no encontrada");
  }

  await prisma.donation.delete({ where: { id } });
  await writeAuditLog({
    entity: "Donation",
    entityId: id,
    action: "delete",
    actorId: user.id,
    diff: {
      referenceCode: donation.referenceCode,
      amountCOP: donation.amountCOP,
      status: donation.status,
    },
  });

  revalidatePath("/admin/donaciones");
  revalidatePath("/admin");
  revalidatePath("/admin/termometro");
  revalidatePath("/");
}

export async function addManualDonationAction(formData: FormData) {
  const user = await requireAdmin(["SUPERADMIN", "FINANZAS"]);
  const amountCOP = Number(formData.get("amountCOP"));
  const fullName = String(formData.get("fullName") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim() || "sin-correo@misionmanizales.org";
  const phone = String(formData.get("phone") ?? "").trim() || "N/A";
  const note = String(formData.get("note") ?? "").trim();
  const paymentMethod = String(formData.get("paymentMethod") ?? "transferencia") as
    | "paypal"
    | "transferencia"
    | "pse";

  if (!Number.isFinite(amountCOP) || amountCOP <= 0 || !fullName) {
    throw new Error("Monto y nombre son obligatorios");
  }

  const now = new Date();
  await prisma.donation.create({
    data: {
      referenceCode: generateReferenceCode("MM-MAN"),
      amountCOP,
      amountOriginal: amountCOP,
      currencyOriginal: "COP",
      documentType: "CC",
      documentNumber: "MANUAL",
      fullName,
      phone,
      email,
      address: note || "Registro manual admin",
      dataConsentAt: now,
      dataConsentIp: "admin",
      licitOriginDeclaredAt: now,
      paymentMethod: ["paypal", "transferencia", "pse"].includes(paymentMethod)
        ? paymentMethod
        : "transferencia",
      status: "confirmed",
      confirmedAt: now,
      confirmedBy: user.id,
    },
  });

  await writeAuditLog({
    entity: "Donation",
    entityId: "manual",
    action: "create_manual",
    actorId: user.id,
    diff: { amountCOP, fullName },
  });

  revalidatePath("/admin/donaciones");
  revalidatePath("/admin");
  revalidatePath("/admin/termometro");
  revalidatePath("/");
}

export async function updateThermometerAction(formData: FormData) {
  const user = await requireAdmin(["SUPERADMIN"]);
  const goalCOP = Number(formData.get("goalCOP"));
  const manualAdjustCOP = Number(formData.get("manualAdjustCOP"));

  if (!Number.isFinite(goalCOP) || goalCOP <= 0) {
    throw new Error("Meta inválida");
  }

  await prisma.thermometerSetting.upsert({
    where: { id: 1 },
    create: { id: 1, goalCOP, manualAdjustCOP: manualAdjustCOP || 0 },
    update: { goalCOP, manualAdjustCOP: manualAdjustCOP || 0, updatedBy: user.id },
  });

  await writeAuditLog({
    entity: "ThermometerSetting",
    entityId: "1",
    action: "update",
    actorId: user.id,
    diff: { goalCOP, manualAdjustCOP },
  });

  revalidatePath("/admin/termometro");
  revalidatePath("/");
}

type PagosData = {
  paypalLink: string;
  boldLink: string;
  banco: {
    banco: string;
    tipoCuenta: string;
    numeroCuenta: string;
    titular: string;
    nit: string;
  };
};

const defaultPagos: PagosData = {
  paypalLink: "",
  boldLink: "",
  banco: { banco: "", tipoCuenta: "", numeroCuenta: "", titular: "", nit: "" },
};

export async function savePagosAction(formData: FormData) {
  const user = await requireAdmin(["SUPERADMIN", "FINANZAS"]);
  const data: PagosData = {
    paypalLink: String(formData.get("paypalLink") ?? "").trim(),
    boldLink: String(formData.get("boldLink") ?? "").trim(),
    banco: {
      banco: String(formData.get("banco") ?? "").trim(),
      tipoCuenta: String(formData.get("tipoCuenta") ?? "").trim(),
      numeroCuenta: String(formData.get("numeroCuenta") ?? "").trim(),
      titular: String(formData.get("titular") ?? "").trim(),
      nit: String(formData.get("nit") ?? "").trim(),
    },
  };

  await prisma.contentBlock.upsert({
    where: { section: "pagos" },
    create: { section: "pagos", data, updatedBy: user.id },
    update: { data, updatedBy: user.id },
  });

  revalidatePath("/admin/pagos");
}

export async function getPagosData(): Promise<PagosData> {
  const block = await prisma.contentBlock.findUnique({ where: { section: "pagos" } });
  if (!block?.data) return defaultPagos;
  return { ...defaultPagos, ...(block.data as PagosData) };
}

export async function addProductAction(formData: FormData) {
  await requireAdmin(["SUPERADMIN", "CONTENIDO"]);
  const name = String(formData.get("name") ?? "").trim();
  const priceCOP = Number(formData.get("priceCOP"));
  const description = String(formData.get("description") ?? "").trim();
  let imageUrl = String(formData.get("imageUrl") ?? "").trim();

  const file = await readUploadFile(formData, "image");
  if (file) {
    imageUrl = await savePublicUpload(file, "productos");
  }
  if (!imageUrl) imageUrl = "/assets/empanada-foto.png";

  if (!name || !Number.isFinite(priceCOP)) throw new Error("Datos inválidos");

  let slug = slugify(name);
  const existing = await prisma.product.findUnique({ where: { slug } });
  if (existing) slug = `${slug}-${Date.now().toString(36)}`;

  await prisma.product.create({
    data: { name, slug, priceCOP, description, imageUrl, active: true },
  });
  revalidatePath("/admin/productos");
  revalidatePath("/");
}

export async function toggleProductAction(id: string) {
  await requireAdmin(["SUPERADMIN", "CONTENIDO"]);
  const p = await prisma.product.findUnique({ where: { id } });
  if (!p) return;
  await prisma.product.update({ where: { id }, data: { active: !p.active } });
  revalidatePath("/admin/productos");
  revalidatePath("/");
}

export async function addStoryAction(formData: FormData) {
  await requireAdmin(["SUPERADMIN", "CONTENIDO"]);
  const title = String(formData.get("title") ?? "").trim();
  const videoUrl = String(formData.get("videoUrl") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  if (!title) throw new Error("Título requerido");
  await prisma.story.create({ data: { title, videoUrl, description, published: true } });
  revalidatePath("/admin/contenido");
  revalidatePath("/");
}

export async function addEventAction(formData: FormData) {
  await requireAdmin(["SUPERADMIN", "CONTENIDO"]);
  const title = String(formData.get("title") ?? "").trim();
  const place = String(formData.get("place") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const dateStr = String(formData.get("date") ?? "");
  if (!title || !dateStr) throw new Error("Título y fecha requeridos");
  await prisma.event.create({
    data: { title, place, description, date: new Date(dateStr), published: true },
  });
  revalidatePath("/admin/contenido");
  revalidatePath("/");
}

export async function addPartnerAction(formData: FormData) {
  await requireAdmin(["SUPERADMIN", "CONTENIDO"]);
  const name = String(formData.get("name") ?? "").trim();
  let logoUrl = String(formData.get("logoUrl") ?? "").trim() || null;
  const file = await readUploadFile(formData, "logo");
  if (file) logoUrl = await savePublicUpload(file, "aliados");
  if (!name) throw new Error("Nombre requerido");
  await prisma.partner.create({ data: { name, logoUrl, active: true } });
  revalidatePath("/admin/contenido");
  revalidatePath("/");
}

export async function deleteStoryAction(id: string) {
  await requireAdmin(["SUPERADMIN", "CONTENIDO"]);
  await prisma.story.delete({ where: { id } });
  revalidatePath("/admin/contenido");
  revalidatePath("/");
}

export async function deleteEventAction(id: string) {
  await requireAdmin(["SUPERADMIN", "CONTENIDO"]);
  await prisma.event.delete({ where: { id } });
  revalidatePath("/admin/contenido");
  revalidatePath("/");
}

export async function deletePartnerAction(id: string) {
  await requireAdmin(["SUPERADMIN", "CONTENIDO"]);
  await prisma.partner.delete({ where: { id } });
  revalidatePath("/admin/contenido");
  revalidatePath("/");
}

export async function updateOrderStatusAction(formData: FormData) {
  await requireAdmin(["SUPERADMIN", "FINANZAS"]);
  const id = String(formData.get("id") ?? "");
  const status = String(formData.get("status") ?? "");
  const valid: OrderStatus[] = ["pending", "paid", "preparing", "shipped", "delivered", "cancelled"];
  if (!id || !valid.includes(status as OrderStatus)) throw new Error("Datos inválidos");

  await prisma.order.update({ where: { id }, data: { status: status as OrderStatus } });
  revalidatePath("/admin/pedidos");
  revalidatePath("/admin");
  revalidatePath("/");
}

export async function logoutAction() {
  await signOut({ redirectTo: "/admin/login" });
}

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

export async function appendHistoriaImageAction(formData: FormData) {
  const user = await requireAdmin(["SUPERADMIN", "CONTENIDO"]);
  let imageUrl = String(formData.get("imageUrl") ?? "").trim();
  const file = await readUploadFile(formData, "image");
  if (file) imageUrl = await savePublicUpload(file, "historia");
  if (!imageUrl) throw new Error("Imagen requerida");

  const current = await getHistoriaGalleryData();
  const images = [...current.images.filter((u) => u !== imageUrl), imageUrl];

  await prisma.contentBlock.upsert({
    where: { section: "historia_galeria" },
    create: { section: "historia_galeria", data: { ...current, images }, updatedBy: user.id },
    update: { data: { ...current, images }, updatedBy: user.id },
  });

  revalidatePath("/admin/contenido");
  revalidatePath("/");
}

export async function deleteHistoriaImageAction(formData: FormData) {
  const user = await requireAdmin(["SUPERADMIN", "CONTENIDO"]);
  const imageUrl = String(formData.get("imageUrl") ?? "").trim();
  const current = await getHistoriaGalleryData();
  const images = current.images.filter((u) => u !== imageUrl);
  if (images.length === 0) images.push("/assets/empanada-foto.png");

  await prisma.contentBlock.upsert({
    where: { section: "historia_galeria" },
    create: { section: "historia_galeria", data: { ...current, images }, updatedBy: user.id },
    update: { data: { ...current, images }, updatedBy: user.id },
  });

  revalidatePath("/admin/contenido");
  revalidatePath("/");
}

export async function saveHistoriaTagAction(formData: FormData) {
  const user = await requireAdmin(["SUPERADMIN", "CONTENIDO"]);
  const tag = String(formData.get("tag") ?? "").trim() || defaultHistoriaGallery.tag;
  const current = await getHistoriaGalleryData();

  await prisma.contentBlock.upsert({
    where: { section: "historia_galeria" },
    create: { section: "historia_galeria", data: { ...current, tag }, updatedBy: user.id },
    update: { data: { ...current, tag }, updatedBy: user.id },
  });

  revalidatePath("/admin/contenido");
  revalidatePath("/");
}
