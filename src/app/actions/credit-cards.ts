"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { getCurrentUser } from "./auth";

export async function getCreditCards() {
  const user = await getCurrentUser();
  if (!user) throw new Error("No autorizado");
  return prisma.creditCard.findMany({
    orderBy: { nombre: "asc" },
  });
}

export async function createCreditCard(formData: FormData) {
  const user = await getCurrentUser();
  if (!user || !["admin", "owner"].includes(user.rol)) throw new Error("No autorizado");

  const nombre = formData.get("nombre") as string;
  const ultimos4 = (formData.get("ultimos4") as string) || null;
  const fechaCierre = formData.get("fechaCierre") as string;
  const fechaVencimiento = formData.get("fechaVencimiento") as string;
  const color = (formData.get("color") as string) || "#3B82F6";

  await prisma.creditCard.create({
    data: {
      nombre,
      ultimos4,
      fechaCierre: fechaCierre ? new Date(fechaCierre) : null,
      fechaVencimiento: fechaVencimiento ? new Date(fechaVencimiento) : null,
      color,
    },
  });

  revalidatePath("/categorias");
  revalidatePath("/");
  revalidatePath("/gastos");
}

export async function updateCreditCard(id: string, formData: FormData) {
  const user = await getCurrentUser();
  if (!user || !["admin", "owner"].includes(user.rol)) throw new Error("No autorizado");

  const data: Record<string, unknown> = {};

  const nombre = formData.get("nombre") as string | null;
  if (nombre) data.nombre = nombre;

  const fechaCierre = formData.get("fechaCierre") as string | null;
  if (fechaCierre !== null) data.fechaCierre = fechaCierre ? new Date(fechaCierre) : null;

  const fechaVencimiento = formData.get("fechaVencimiento") as string | null;
  if (fechaVencimiento !== null) data.fechaVencimiento = fechaVencimiento ? new Date(fechaVencimiento) : null;

  const color = formData.get("color") as string | null;
  if (color) data.color = color;

  await prisma.creditCard.update({
    where: { id },
    data,
  });

  revalidatePath("/categorias");
  revalidatePath("/");
  revalidatePath("/gastos");
}

export async function deleteCreditCard(id: string) {
  const user = await getCurrentUser();
  if (!user || !["admin", "owner"].includes(user.rol)) throw new Error("No autorizado");

  await prisma.creditCard.delete({ where: { id } });
  revalidatePath("/categorias");
  revalidatePath("/");
  revalidatePath("/gastos");
}
