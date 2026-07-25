"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { getCurrentUser } from "./auth";

export async function getSavingsGoals() {
  return prisma.savingsGoal.findMany({
    orderBy: { createdAt: "asc" },
  });
}

export async function createSavingsGoal(formData: FormData) {
  const user = await getCurrentUser();
  if (!user || !["admin", "owner"].includes(user.rol)) throw new Error("No autorizado");

  const nombre = formData.get("nombre") as string;
  const montoTarget = parseFloat(formData.get("montoTarget") as string);
  const montoActual = parseFloat((formData.get("montoActual") as string) || "0");
  const plazo = (formData.get("plazo") as string) || "mediano";
  const fechaLimiteStr = formData.get("fechaLimite") as string;
  const moneda = (formData.get("moneda") as string) || "ARS";
  const color = (formData.get("color") as string) || "#7B61FF";
  const icono = (formData.get("icono") as string) || "target";

  await prisma.savingsGoal.create({
    data: {
      nombre,
      montoTarget,
      montoActual,
      moneda,
      plazo,
      fechaLimite: fechaLimiteStr ? new Date(fechaLimiteStr) : null,
      color,
      icono,
    },
  });

  revalidatePath("/");
  revalidatePath("/categorias");
}

export async function updateSavingsGoalAmount(id: string, monto: number) {
  const user = await getCurrentUser();
  if (!user || !["admin", "owner"].includes(user.rol)) throw new Error("No autorizado");

  await prisma.savingsGoal.update({
    where: { id },
    data: { montoActual: monto },
  });

  revalidatePath("/");
  revalidatePath("/categorias");
}

export async function updateSavingsGoal(id: string, formData: FormData) {
  const user = await getCurrentUser();
  if (!user || !["admin", "owner"].includes(user.rol)) throw new Error("No autorizado");

  const data: Record<string, unknown> = {};
  const nombre = formData.get("nombre") as string | null;
  if (nombre) data.nombre = nombre;
  const montoTarget = formData.get("montoTarget") as string | null;
  if (montoTarget) data.montoTarget = parseFloat(montoTarget);
  const montoActual = formData.get("montoActual") as string | null;
  if (montoActual !== null && montoActual !== "") data.montoActual = parseFloat(montoActual);
  const plazo = formData.get("plazo") as string | null;
  if (plazo) data.plazo = plazo;
  const color = formData.get("color") as string | null;
  if (color) data.color = color;
  const icono = formData.get("icono") as string | null;
  if (icono) data.icono = icono;
  const fechaLimiteStr = formData.get("fechaLimite") as string | null;
  if (fechaLimiteStr !== null) data.fechaLimite = fechaLimiteStr ? new Date(fechaLimiteStr) : null;

  await prisma.savingsGoal.update({ where: { id }, data });
  revalidatePath("/");
  revalidatePath("/categorias");
}

export async function deleteSavingsGoal(id: string) {
  const user = await getCurrentUser();
  if (!user || !["admin", "owner"].includes(user.rol)) throw new Error("No autorizado");

  await prisma.savingsGoal.delete({ where: { id } });
  revalidatePath("/");
  revalidatePath("/categorias");
}
