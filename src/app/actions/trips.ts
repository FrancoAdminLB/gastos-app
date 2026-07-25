"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { getCurrentUser } from "./auth";

export async function getTrips() {
  const user = await getCurrentUser();
  if (!user) return [];

  return prisma.trip.findMany({
    where: user.rol === "owner" ? { ownerId: user.id } : {},
    include: {
      _count: { select: { expenses: true } },
    },
    orderBy: { fechaInicio: "desc" },
  });
}

export async function createTrip(formData: FormData) {
  const user = await getCurrentUser();
  if (!user) throw new Error("No autenticado");

  const nombre = formData.get("nombre") as string;
  const fechaInicio = new Date(formData.get("fechaInicio") as string);
  const fechaFinStr = formData.get("fechaFin") as string;
  const fechaFin = fechaFinStr ? new Date(fechaFinStr) : null;
  const monedaBase = (formData.get("monedaBase") as string) || "USD";
  const presupuestoStr = formData.get("presupuestoTotal") as string;
  const presupuestoTotal = presupuestoStr ? parseFloat(presupuestoStr) : null;

  await prisma.trip.create({
    data: {
      nombre,
      fechaInicio,
      fechaFin,
      monedaBase,
      presupuestoTotal,
      ownerId: user.id,
    },
  });

  revalidatePath("/viajes");
}

export async function deleteTrip(id: string) {
  const user = await getCurrentUser();
  if (!user) throw new Error("No autenticado");

  const trip = await prisma.trip.findUnique({ where: { id } });
  if (!trip) throw new Error("Viaje no encontrado");
  if (user.rol === "owner" && trip.ownerId !== user.id) {
    throw new Error("No autorizado");
  }

  // Delete associated expenses first
  await prisma.expense.deleteMany({ where: { tripId: id } });
  await prisma.budget.deleteMany({ where: { tripId: id } });
  await prisma.trip.delete({ where: { id } });

  revalidatePath("/viajes");
  revalidatePath("/gastos");
}

export async function getTripWithExpenses(id: string) {
  const user = await getCurrentUser();
  if (!user) return null;

  const trip = await prisma.trip.findUnique({
    where: { id },
    include: {
      expenses: {
        include: { category: true, trip: true, familyMember: true, creditCard: true },
        orderBy: { fecha: "desc" },
      },
      budgets: { include: { category: true } },
    },
  });

  if (!trip) return null;
  if (user.rol === "owner" && trip.ownerId !== user.id) return null;

  return trip;
}
