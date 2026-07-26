"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { getCurrentUser } from "./auth";

export async function getTrips() {
  const user = await getCurrentUser();
  if (!user) return [];

  return prisma.trip.findMany({
    where: { ownerId: user.id },
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

export async function updateTrip(id: string, formData: FormData) {
  const user = await getCurrentUser();
  if (!user) throw new Error("No autenticado");

  const trip = await prisma.trip.findUnique({ where: { id } });
  if (!trip || trip.ownerId !== user.id) throw new Error("No autorizado");

  const data: Record<string, unknown> = {};
  const nombre = formData.get("nombre") as string | null;
  if (nombre) data.nombre = nombre;
  const fechaInicioStr = formData.get("fechaInicio") as string | null;
  if (fechaInicioStr) data.fechaInicio = new Date(fechaInicioStr);
  const fechaFinStr = formData.get("fechaFin") as string | null;
  if (fechaFinStr !== null) data.fechaFin = fechaFinStr ? new Date(fechaFinStr) : null;
  const monedaBase = formData.get("monedaBase") as string | null;
  if (monedaBase) data.monedaBase = monedaBase;
  const presupuestoStr = formData.get("presupuestoTotal") as string | null;
  if (presupuestoStr !== null) data.presupuestoTotal = presupuestoStr ? parseFloat(presupuestoStr) : null;

  await prisma.trip.update({ where: { id }, data });
  revalidatePath("/viajes");
}

export async function deleteTrip(id: string) {
  const user = await getCurrentUser();
  if (!user) throw new Error("No autenticado");

  const trip = await prisma.trip.findUnique({ where: { id } });
  if (!trip) throw new Error("Viaje no encontrado");
  if (trip.ownerId !== user.id) throw new Error("No autorizado");

  // Delete associated expenses first
  await prisma.expense.deleteMany({ where: { tripId: id } });
  await prisma.budget.deleteMany({ where: { tripId: id } });
  await prisma.trip.delete({ where: { id } });

  revalidatePath("/viajes");
  revalidatePath("/movimientos");
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
  if (trip.ownerId !== user.id) return null;

  return trip;
}
