"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin, signOut } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { writeAuditLog } from "@/lib/audit";
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
  await prisma.donation.update({
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
  revalidatePath("/admin/donaciones");
  revalidatePath("/admin");
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
  const imageUrl = String(formData.get("imageUrl") ?? "").trim() || "/assets/empanada-foto.png";

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
  if (!name) throw new Error("Nombre requerido");
  await prisma.partner.create({ data: { name, active: true } });
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
