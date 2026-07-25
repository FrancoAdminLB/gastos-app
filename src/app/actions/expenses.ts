"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { getCurrentUser } from "./auth";
import { convertCurrency } from "@/lib/exchange";

type PaymentMethod = "efectivo" | "cheque" | "transferencia_bancaria" | "cripto" | "tarjeta_credito";

const BASE_CURRENCY = "ARS";

async function getConversion(monto: number, moneda: string, tripId: string | null) {
  let targetCurrency = BASE_CURRENCY;
  if (tripId) {
    const trip = await prisma.trip.findUnique({ where: { id: tripId } });
    if (trip) targetCurrency = trip.monedaBase;
  }

  if (moneda === targetCurrency) {
    return { montoConvertido: monto, tasaCambio: 1 };
  }

  const { converted, rate } = await convertCurrency(monto, moneda, targetCurrency);
  return { montoConvertido: converted, tasaCambio: rate };
}

function revalidateAll() {
  revalidatePath("/");
  revalidatePath("/movimientos");
  revalidatePath("/reportes");
  revalidatePath("/viajes");
}

export async function createExpense(formData: FormData) {
  const user = await getCurrentUser();
  if (!user) throw new Error("No autenticado");

  const monto = parseFloat(formData.get("monto") as string);
  const moneda = (formData.get("moneda") as string) || "ARS";
  const categoryId = formData.get("categoryId") as string;
  const tripId = (formData.get("tripId") as string) || null;
  const fecha = new Date(formData.get("fecha") as string);
  const descripcion = (formData.get("descripcion") as string) || null;
  const medioPago = (formData.get("medioPago") as string) || "efectivo";
  const familyMemberId = (formData.get("familyMemberId") as string) || null;
  const creditCardId = (formData.get("creditCardId") as string) || null;

  const { montoConvertido, tasaCambio } = await getConversion(monto, moneda, tripId);

  await prisma.expense.create({
    data: {
      userId: user.id,
      categoryId,
      tripId: tripId || null,
      familyMemberId: familyMemberId || null,
      creditCardId: creditCardId || null,
      monto,
      moneda,
      montoConvertido,
      tasaCambio,
      fecha,
      descripcion,
      medioPago: medioPago as PaymentMethod,
    },
  });

  revalidateAll();
}

export async function createExpenseFromImport(data: {
  monto: number;
  moneda: string;
  categoryId: string;
  fecha: Date;
  descripcion: string;
  medioPago: PaymentMethod;
}) {
  const user = await getCurrentUser();
  if (!user) throw new Error("No autenticado");

  const { montoConvertido, tasaCambio } = await getConversion(data.monto, data.moneda, null);

  await prisma.expense.create({
    data: {
      userId: user.id,
      categoryId: data.categoryId,
      monto: data.monto,
      moneda: data.moneda,
      montoConvertido,
      tasaCambio,
      fecha: data.fecha,
      descripcion: data.descripcion,
      medioPago: data.medioPago,
    },
  });

  revalidateAll();
}

export async function getExpenses(filters?: {
  tripId?: string | null;
  month?: number;
  year?: number;
  familyMemberId?: string;
}) {
  const user = await getCurrentUser();
  if (!user) return [];

  const where: Record<string, unknown> = {};

  if (user.rol === "owner") {
    where.userId = user.id;
  }

  if (filters?.tripId !== undefined) {
    where.tripId = filters.tripId;
  }

  if (filters?.familyMemberId) {
    where.familyMemberId = filters.familyMemberId;
  }

  if (filters?.month !== undefined && filters?.year !== undefined) {
    const startDate = new Date(filters.year, filters.month, 1);
    const endDate = new Date(filters.year, filters.month + 1, 1);
    where.fecha = { gte: startDate, lt: endDate };
  }

  return prisma.expense.findMany({
    where,
    include: {
      category: true,
      trip: true,
      familyMember: true,
      creditCard: true,
    },
    orderBy: { fecha: "desc" },
  });
}

export async function deleteExpense(id: string) {
  const user = await getCurrentUser();
  if (!user) throw new Error("No autenticado");

  const expense = await prisma.expense.findUnique({ where: { id } });
  if (!expense) throw new Error("Gasto no encontrado");
  if (user.rol === "owner" && expense.userId !== user.id) {
    throw new Error("No autorizado");
  }

  await prisma.expense.delete({ where: { id } });
  revalidateAll();
}

export async function updateExpense(id: string, formData: FormData) {
  const user = await getCurrentUser();
  if (!user) throw new Error("No autenticado");

  const expense = await prisma.expense.findUnique({ where: { id } });
  if (!expense) throw new Error("Gasto no encontrado");
  if (user.rol === "owner" && expense.userId !== user.id) {
    throw new Error("No autorizado");
  }

  const monto = parseFloat(formData.get("monto") as string);
  const moneda = (formData.get("moneda") as string) || "ARS";
  const categoryId = formData.get("categoryId") as string;
  const tripId = (formData.get("tripId") as string) || null;
  const fecha = new Date(formData.get("fecha") as string);
  const descripcion = (formData.get("descripcion") as string) || null;
  const medioPago = (formData.get("medioPago") as string) || "efectivo";
  const familyMemberId = (formData.get("familyMemberId") as string) || null;
  const creditCardId = (formData.get("creditCardId") as string) || null;

  const { montoConvertido, tasaCambio } = await getConversion(monto, moneda, tripId);

  await prisma.expense.update({
    where: { id },
    data: {
      categoryId,
      tripId: tripId || null,
      familyMemberId: familyMemberId || null,
      creditCardId: creditCardId || null,
      monto,
      moneda,
      montoConvertido,
      tasaCambio,
      fecha,
      descripcion,
      medioPago: medioPago as PaymentMethod,
    },
  });

  revalidateAll();
}
