"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { getCurrentUser } from "./auth";

export async function getInvestmentAccounts() {
  const user = await getCurrentUser();
  if (!user) throw new Error("No autorizado");
  return prisma.investmentAccount.findMany({
    include: {
      movimientos: {
        orderBy: { fecha: "desc" },
        take: 50,
      },
    },
    orderBy: { nombre: "asc" },
  });
}

export async function getInvestmentSummary() {
  const user = await getCurrentUser();
  if (!user) throw new Error("No autorizado");
  const accounts = await prisma.investmentAccount.findMany();
  const totalInvertido = accounts.reduce((sum, a) => sum + a.saldoActual, 0);
  return { totalInvertido, cuentas: accounts.length };
}

export async function createInvestmentAccount(formData: FormData) {
  const user = await getCurrentUser();
  if (!user || !["admin", "owner"].includes(user.rol)) throw new Error("No autorizado");

  const nombre = formData.get("nombre") as string;
  const tipo = (formData.get("tipo") as string) || "otro";
  const moneda = (formData.get("moneda") as string) || "ARS";
  const color = (formData.get("color") as string) || "#F59E0B";
  const saldoInicial = parseFloat((formData.get("saldoInicial") as string) || "0");

  const account = await prisma.investmentAccount.create({
    data: { nombre, tipo, moneda, color, saldoActual: saldoInicial },
  });

  if (saldoInicial > 0) {
    await prisma.investmentMovement.create({
      data: {
        accountId: account.id,
        tipo: "deposito",
        monto: saldoInicial,
        descripcion: "Saldo inicial",
      },
    });
  }

  revalidatePath("/inversiones");
  revalidatePath("/");
}

export async function updateInvestmentAccount(id: string, formData: FormData) {
  const user = await getCurrentUser();
  if (!user || !["admin", "owner"].includes(user.rol)) throw new Error("No autorizado");

  const data: Record<string, unknown> = {};
  const nombre = formData.get("nombre") as string | null;
  if (nombre) data.nombre = nombre;
  const tipo = formData.get("tipo") as string | null;
  if (tipo) data.tipo = tipo;
  const color = formData.get("color") as string | null;
  if (color) data.color = color;

  await prisma.investmentAccount.update({ where: { id }, data });
  revalidatePath("/inversiones");
}

export async function deleteInvestmentAccount(id: string) {
  const user = await getCurrentUser();
  if (!user || !["admin", "owner"].includes(user.rol)) throw new Error("No autorizado");

  await prisma.investmentAccount.delete({ where: { id } });
  revalidatePath("/inversiones");
  revalidatePath("/");
}

export async function addInvestmentMovement(formData: FormData) {
  const user = await getCurrentUser();
  if (!user || !["admin", "owner"].includes(user.rol)) throw new Error("No autorizado");

  const accountId = formData.get("accountId") as string;
  const tipo = formData.get("tipo") as string; // deposito, retiro, ajuste
  const monto = parseFloat(formData.get("monto") as string);
  const descripcion = (formData.get("descripcion") as string) || null;
  const fechaStr = formData.get("fecha") as string;
  const fecha = fechaStr ? new Date(fechaStr) : new Date();

  const account = await prisma.investmentAccount.findUnique({ where: { id: accountId } });
  if (!account) throw new Error("Cuenta no encontrada");

  let nuevoSaldo = account.saldoActual;
  if (tipo === "deposito") {
    nuevoSaldo += monto;
  } else if (tipo === "retiro") {
    nuevoSaldo -= monto;
  } else if (tipo === "ajuste") {
    // monto is the NEW balance, calculate difference
    nuevoSaldo = monto;
  }

  await prisma.$transaction([
    prisma.investmentMovement.create({
      data: {
        accountId,
        tipo,
        monto: tipo === "ajuste" ? monto - account.saldoActual : monto,
        descripcion,
        fecha,
      },
    }),
    prisma.investmentAccount.update({
      where: { id: accountId },
      data: { saldoActual: nuevoSaldo },
    }),
  ]);

  revalidatePath("/inversiones");
  revalidatePath("/");
}

export async function deleteInvestmentMovement(id: string) {
  const user = await getCurrentUser();
  if (!user || !["admin", "owner"].includes(user.rol)) throw new Error("No autorizado");

  const mov = await prisma.investmentMovement.findUnique({ where: { id } });
  if (!mov) throw new Error("Movimiento no encontrado");

  const account = await prisma.investmentAccount.findUnique({ where: { id: mov.accountId } });
  if (!account) throw new Error("Cuenta no encontrada");

  // Reverse the movement
  let nuevoSaldo = account.saldoActual;
  if (mov.tipo === "deposito") {
    nuevoSaldo -= mov.monto;
  } else if (mov.tipo === "retiro") {
    nuevoSaldo += mov.monto;
  } else if (mov.tipo === "ajuste") {
    nuevoSaldo -= mov.monto; // reverse the adjustment delta
  }

  await prisma.$transaction([
    prisma.investmentMovement.delete({ where: { id } }),
    prisma.investmentAccount.update({
      where: { id: mov.accountId },
      data: { saldoActual: nuevoSaldo },
    }),
  ]);

  revalidatePath("/inversiones");
  revalidatePath("/");
}
