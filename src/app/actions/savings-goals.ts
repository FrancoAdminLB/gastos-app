"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { getCurrentUser } from "./auth";

export async function getSavingsGoals() {
  const user = await getCurrentUser();
  if (!user) throw new Error("No autorizado");
  return prisma.savingsGoal.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "asc" },
  });
}

export async function createSavingsGoal(formData: FormData) {
  const user = await getCurrentUser();
  if (!user) throw new Error("No autorizado");

  const nombre = formData.get("nombre") as string;
  if (!nombre?.trim()) throw new Error("Nombre requerido");
  const montoTarget = parseFloat(formData.get("montoTarget") as string);
  if (isNaN(montoTarget) || montoTarget <= 0) throw new Error("Monto objetivo inválido");
  const montoActual = parseFloat((formData.get("montoActual") as string) || "0");
  const plazo = (formData.get("plazo") as string) || "mediano";
  const fechaLimiteStr = formData.get("fechaLimite") as string;
  const moneda = (formData.get("moneda") as string) || "ARS";
  const color = (formData.get("color") as string) || "#7B61FF";
  const icono = (formData.get("icono") as string) || "target";

  await prisma.savingsGoal.create({
    data: {
      userId: user.id,
      nombre,
      montoTarget,
      montoActual: isNaN(montoActual) ? 0 : montoActual,
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
  if (!user) throw new Error("No autorizado");

  const goal = await prisma.savingsGoal.findUnique({ where: { id } });
  if (!goal || goal.userId !== user.id) throw new Error("No autorizado");
  if (isNaN(monto) || monto < 0) throw new Error("Monto inválido");

  await prisma.savingsGoal.update({
    where: { id },
    data: { montoActual: monto },
  });

  revalidatePath("/");
  revalidatePath("/categorias");
}

export async function updateSavingsGoal(id: string, formData: FormData) {
  const user = await getCurrentUser();
  if (!user) throw new Error("No autorizado");

  const goal = await prisma.savingsGoal.findUnique({ where: { id } });
  if (!goal || goal.userId !== user.id) throw new Error("No autorizado");

  const data: Record<string, unknown> = {};
  const nombre = formData.get("nombre") as string | null;
  if (nombre) data.nombre = nombre;
  const montoTarget = formData.get("montoTarget") as string | null;
  if (montoTarget) {
    const parsed = parseFloat(montoTarget);
    if (!isNaN(parsed) && parsed > 0) data.montoTarget = parsed;
  }
  const montoActual = formData.get("montoActual") as string | null;
  if (montoActual !== null && montoActual !== "") {
    const parsed = parseFloat(montoActual);
    if (!isNaN(parsed)) data.montoActual = parsed;
  }
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
  if (!user) throw new Error("No autorizado");

  const goal = await prisma.savingsGoal.findUnique({ where: { id } });
  if (!goal || goal.userId !== user.id) throw new Error("No autorizado");

  await prisma.savingsGoal.delete({ where: { id } });
  revalidatePath("/");
  revalidatePath("/categorias");
}
