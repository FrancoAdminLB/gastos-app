"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { getCurrentUser } from "./auth";

export async function getCreditCards() {
  const user = await getCurrentUser();
  if (!user) throw new Error("No autorizado");
  return prisma.creditCard.findMany({
    where: { userId: user.id },
    orderBy: { nombre: "asc" },
  });
}

export async function createCreditCard(formData: FormData) {
  const user = await getCurrentUser();
  if (!user) throw new Error("No autorizado");

  const nombre = formData.get("nombre") as string;
  if (!nombre?.trim()) throw new Error("Nombre requerido");
  const ultimos4 = (formData.get("ultimos4") as string) || null;
  const diaCierreStr = formData.get("diaCierre") as string;
  const diaVencimientoStr = formData.get("diaVencimiento") as string;
  const color = (formData.get("color") as string) || "#3B82F6";

  const diaCierre = diaCierreStr ? parseInt(diaCierreStr) : null;
  const diaVencimiento = diaVencimientoStr ? parseInt(diaVencimientoStr) : null;

  if (diaCierre !== null && (isNaN(diaCierre) || diaCierre < 1 || diaCierre > 31)) {
    throw new Error("Día de cierre inválido (1-31)");
  }
  if (diaVencimiento !== null && (isNaN(diaVencimiento) || diaVencimiento < 1 || diaVencimiento > 31)) {
    throw new Error("Día de vencimiento inválido (1-31)");
  }

  await prisma.creditCard.create({
    data: {
      userId: user.id,
      nombre,
      ultimos4,
      diaCierre,
      diaVencimiento,
      color,
    },
  });

  revalidatePath("/categorias");
  revalidatePath("/");
  revalidatePath("/movimientos");
}

export async function updateCreditCard(id: string, formData: FormData) {
  const user = await getCurrentUser();
  if (!user) throw new Error("No autorizado");

  const card = await prisma.creditCard.findUnique({ where: { id } });
  if (!card || card.userId !== user.id) throw new Error("No autorizado");

  const data: Record<string, unknown> = {};
  const nombre = formData.get("nombre") as string | null;
  if (nombre) data.nombre = nombre;
  const ultimos4 = formData.get("ultimos4") as string | null;
  if (ultimos4 !== null) data.ultimos4 = ultimos4 || null;

  const diaCierreStr = formData.get("diaCierre") as string | null;
  if (diaCierreStr !== null) {
    const diaCierre = diaCierreStr ? parseInt(diaCierreStr) : null;
    if (diaCierre !== null && (isNaN(diaCierre) || diaCierre < 1 || diaCierre > 31)) {
      throw new Error("Día de cierre inválido (1-31)");
    }
    data.diaCierre = diaCierre;
  }
  const diaVencimientoStr = formData.get("diaVencimiento") as string | null;
  if (diaVencimientoStr !== null) {
    const diaVencimiento = diaVencimientoStr ? parseInt(diaVencimientoStr) : null;
    if (diaVencimiento !== null && (isNaN(diaVencimiento) || diaVencimiento < 1 || diaVencimiento > 31)) {
      throw new Error("Día de vencimiento inválido (1-31)");
    }
    data.diaVencimiento = diaVencimiento;
  }

  const color = formData.get("color") as string | null;
  if (color) data.color = color;

  await prisma.creditCard.update({ where: { id }, data });
  revalidatePath("/categorias");
  revalidatePath("/");
  revalidatePath("/movimientos");
}

export async function deleteCreditCard(id: string) {
  const user = await getCurrentUser();
  if (!user) throw new Error("No autorizado");

  const card = await prisma.creditCard.findUnique({ where: { id } });
  if (!card || card.userId !== user.id) throw new Error("No autorizado");

  await prisma.creditCard.delete({ where: { id } });
  revalidatePath("/categorias");
  revalidatePath("/");
  revalidatePath("/movimientos");
}
