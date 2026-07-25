"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { getCurrentUser } from "./auth";

export async function getFinancialEvents() {
  const user = await getCurrentUser();
  if (!user) throw new Error("No autorizado");
  return prisma.financialEvent.findMany({
    where: { userId: user.id },
    orderBy: { dia: "asc" },
  });
}

export async function createFinancialEvent(formData: FormData) {
  const user = await getCurrentUser();
  if (!user) throw new Error("No autorizado");

  const nombre = formData.get("nombre") as string;
  if (!nombre?.trim()) throw new Error("Nombre requerido");
  const tipo = (formData.get("tipo") as string) || "otro";
  const dia = parseInt(formData.get("dia") as string);
  if (isNaN(dia) || dia < 1 || dia > 31) throw new Error("Día inválido (1-31)");
  const montoStr = formData.get("monto") as string;
  const monto = montoStr ? parseFloat(montoStr) : null;
  if (monto !== null && isNaN(monto)) throw new Error("Monto inválido");
  const recurrente = formData.get("recurrente") !== "false";
  const color = (formData.get("color") as string) || "#3B82F6";
  const notas = (formData.get("notas") as string) || null;

  await prisma.financialEvent.create({
    data: { userId: user.id, nombre, tipo, dia, monto, recurrente, color, notas },
  });

  revalidatePath("/");
  revalidatePath("/categorias");
}

export async function updateFinancialEvent(id: string, formData: FormData) {
  const user = await getCurrentUser();
  if (!user) throw new Error("No autorizado");

  const event = await prisma.financialEvent.findUnique({ where: { id } });
  if (!event || event.userId !== user.id) throw new Error("No autorizado");

  const data: Record<string, unknown> = {};
  const nombre = formData.get("nombre") as string | null;
  if (nombre) data.nombre = nombre;
  const tipo = formData.get("tipo") as string | null;
  if (tipo) data.tipo = tipo;
  const dia = formData.get("dia") as string | null;
  if (dia) {
    const parsed = parseInt(dia);
    if (!isNaN(parsed) && parsed >= 1 && parsed <= 31) data.dia = parsed;
  }
  const monto = formData.get("monto") as string | null;
  if (monto !== null) data.monto = monto ? parseFloat(monto) : null;
  const color = formData.get("color") as string | null;
  if (color) data.color = color;
  const notas = formData.get("notas") as string | null;
  if (notas !== null) data.notas = notas || null;

  await prisma.financialEvent.update({ where: { id }, data });
  revalidatePath("/");
  revalidatePath("/categorias");
}

export async function deleteFinancialEvent(id: string) {
  const user = await getCurrentUser();
  if (!user) throw new Error("No autorizado");

  const event = await prisma.financialEvent.findUnique({ where: { id } });
  if (!event || event.userId !== user.id) throw new Error("No autorizado");

  await prisma.financialEvent.delete({ where: { id } });
  revalidatePath("/");
  revalidatePath("/categorias");
}
