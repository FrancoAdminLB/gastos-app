"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { getCurrentUser } from "./auth";

export async function getBudgets() {
  return prisma.budget.findMany({
    include: { category: true, trip: true },
    orderBy: { createdAt: "desc" },
  });
}

export async function createBudget(formData: FormData) {
  const user = await getCurrentUser();
  if (!user || !["admin", "owner"].includes(user.rol)) throw new Error("No autorizado");

  const categoryId = (formData.get("categoryId") as string) || null;
  const tripId = (formData.get("tripId") as string) || null;
  const montoLimite = parseFloat(formData.get("montoLimite") as string);
  const periodo = (formData.get("periodo") as string) || "mensual";

  await prisma.budget.create({
    data: {
      categoryId: categoryId || null,
      tripId: tripId || null,
      montoLimite,
      periodo: periodo as "mensual" | "viaje",
    },
  });

  revalidatePath("/categorias");
  revalidatePath("/");
}

export async function deleteBudget(id: string) {
  const user = await getCurrentUser();
  if (!user || !["admin", "owner"].includes(user.rol)) throw new Error("No autorizado");

  await prisma.budget.delete({ where: { id } });
  revalidatePath("/categorias");
  revalidatePath("/");
}
