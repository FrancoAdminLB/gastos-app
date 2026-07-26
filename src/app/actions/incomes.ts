"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { getCurrentUser } from "./auth";

function revalidateAll() {
  revalidatePath("/");
  revalidatePath("/movimientos");
  revalidatePath("/reportes");
}

export async function getIncomes(filters?: { month?: number; year?: number }) {
  const user = await getCurrentUser();
  if (!user) return [];

  const where: Record<string, unknown> = { userId: user.id };

  if (filters?.month !== undefined && filters?.year !== undefined) {
    const startDate = new Date(filters.year, filters.month, 1);
    const endDate = new Date(filters.year, filters.month + 1, 1);
    where.fecha = { gte: startDate, lt: endDate };
  }

  return prisma.income.findMany({
    where,
    include: { category: true },
    orderBy: { fecha: "desc" },
  });
}

export async function createIncome(formData: FormData) {
  const user = await getCurrentUser();
  if (!user) throw new Error("No autenticado");

  const monto = parseFloat(formData.get("monto") as string);
  if (isNaN(monto) || monto <= 0) throw new Error("Monto inválido");
  const moneda = (formData.get("moneda") as string) || "ARS";
  const categoryId = formData.get("categoryId") as string;
  if (!categoryId) throw new Error("Categoría requerida");
  const fecha = new Date(formData.get("fecha") as string);
  if (isNaN(fecha.getTime())) throw new Error("Fecha inválida");
  const descripcion = (formData.get("descripcion") as string) || null;
  const medioPago = (formData.get("medioPago") as string) || "efectivo";

  await prisma.income.create({
    data: {
      userId: user.id,
      categoryId,
      monto,
      moneda,
      fecha,
      descripcion,
      medioPago: medioPago as "efectivo" | "cheque" | "transferencia_bancaria" | "cripto" | "tarjeta_credito",
    },
  });

  revalidateAll();
}

export async function deleteIncome(id: string) {
  const user = await getCurrentUser();
  if (!user) throw new Error("No autenticado");

  const income = await prisma.income.findUnique({ where: { id } });
  if (!income) throw new Error("Ingreso no encontrado");
  if (income.userId !== user.id) throw new Error("No autorizado");

  await prisma.income.delete({ where: { id } });
  revalidateAll();
}

export async function updateIncome(id: string, formData: FormData) {
  const user = await getCurrentUser();
  if (!user) throw new Error("No autenticado");

  const income = await prisma.income.findUnique({ where: { id } });
  if (!income) throw new Error("Ingreso no encontrado");
  if (income.userId !== user.id) throw new Error("No autorizado");

  const monto = parseFloat(formData.get("monto") as string);
  if (isNaN(monto) || monto <= 0) throw new Error("Monto inválido");
  const moneda = (formData.get("moneda") as string) || "ARS";
  const categoryId = formData.get("categoryId") as string;
  if (!categoryId) throw new Error("Categoría requerida");
  const fecha = new Date(formData.get("fecha") as string);
  if (isNaN(fecha.getTime())) throw new Error("Fecha inválida");
  const descripcion = (formData.get("descripcion") as string) || null;
  const medioPago = (formData.get("medioPago") as string) || "efectivo";

  await prisma.income.update({
    where: { id },
    data: {
      categoryId,
      monto,
      moneda,
      fecha,
      descripcion,
      medioPago: medioPago as "efectivo" | "cheque" | "transferencia_bancaria" | "cripto" | "tarjeta_credito",
    },
  });

  revalidateAll();
}
