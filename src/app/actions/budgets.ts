"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { getCurrentUser } from "./auth";

export async function getBudgets() {
  const user = await getCurrentUser();
  if (!user) throw new Error("No autorizado");
  return prisma.budget.findMany({
    where: { userId: user.id },
    include: { category: true, trip: true },
    orderBy: { createdAt: "desc" },
  });
}

export async function createBudget(formData: FormData) {
  const user = await getCurrentUser();
  if (!user) throw new Error("No autorizado");

  const categoryId = (formData.get("categoryId") as string) || null;
  const tripId = (formData.get("tripId") as string) || null;
  const montoLimite = parseFloat(formData.get("montoLimite") as string);
  if (isNaN(montoLimite) || montoLimite <= 0) throw new Error("Monto límite inválido");
  const periodo = (formData.get("periodo") as string) || "mensual";

  await prisma.budget.create({
    data: {
      userId: user.id,
      categoryId: categoryId || null,
      tripId: tripId || null,
      montoLimite,
      periodo: periodo as "mensual" | "viaje",
    },
  });

  revalidatePath("/categorias");
  revalidatePath("/");
}

export async function updateBudget(id: string, formData: FormData) {
  const user = await getCurrentUser();
  if (!user) throw new Error("No autorizado");

  const budget = await prisma.budget.findUnique({ where: { id } });
  if (!budget || budget.userId !== user.id) throw new Error("No autorizado");

  const data: Record<string, unknown> = {};
  const montoLimiteStr = formData.get("montoLimite") as string | null;
  if (montoLimiteStr) {
    const montoLimite = parseFloat(montoLimiteStr);
    if (isNaN(montoLimite) || montoLimite <= 0) throw new Error("Monto límite inválido");
    data.montoLimite = montoLimite;
  }
  const periodo = formData.get("periodo") as string | null;
  if (periodo) data.periodo = periodo;
  const categoryId = formData.get("categoryId") as string | null;
  if (categoryId !== null) data.categoryId = categoryId || null;

  await prisma.budget.update({ where: { id }, data });
  revalidatePath("/categorias");
  revalidatePath("/");
}

export async function deleteBudget(id: string) {
  const user = await getCurrentUser();
  if (!user) throw new Error("No autorizado");

  const budget = await prisma.budget.findUnique({ where: { id } });
  if (!budget || budget.userId !== user.id) throw new Error("No autorizado");

  await prisma.budget.delete({ where: { id } });
  revalidatePath("/categorias");
  revalidatePath("/");
}
