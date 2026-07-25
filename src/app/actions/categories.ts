"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { getCurrentUser } from "./auth";

export async function getCategories() {
  const user = await getCurrentUser();
  if (!user) throw new Error("No autorizado");
  return prisma.category.findMany({
    include: {
      children: {
        include: {
          children: true,
        },
        orderBy: { nombre: "asc" },
      },
    },
    orderBy: { nombre: "asc" },
  });
}

export async function getCategoriesFlat() {
  const user = await getCurrentUser();
  if (!user) throw new Error("No autorizado");
  return prisma.category.findMany({
    orderBy: { nombre: "asc" },
  });
}

export async function getExpenseCategories() {
  const user = await getCurrentUser();
  if (!user) throw new Error("No autorizado");
  return prisma.category.findMany({
    where: { tipo: { not: "ingreso" } },
    include: {
      children: {
        include: {
          children: true,
        },
        orderBy: { nombre: "asc" },
      },
    },
    orderBy: { nombre: "asc" },
  });
}

export async function getIncomeCategories() {
  const user = await getCurrentUser();
  if (!user) throw new Error("No autorizado");
  return prisma.category.findMany({
    where: { tipo: "ingreso" },
    orderBy: { nombre: "asc" },
  });
}

export async function createCategory(formData: FormData) {
  const user = await getCurrentUser();
  if (!user || !["admin", "owner"].includes(user.rol)) throw new Error("No autorizado");

  const nombre = formData.get("nombre") as string;
  const icono = (formData.get("icono") as string) || "receipt";
  const color = (formData.get("color") as string) || "#6B7280";
  const tipo = (formData.get("tipo") as string) || "ambos";
  const parentId = (formData.get("parentId") as string) || null;

  // Validate max 3 levels
  if (parentId) {
    const parent = await prisma.category.findUnique({
      where: { id: parentId },
      include: { parent: true },
    });
    if (parent?.parent?.parentId) {
      throw new Error("Maximo 3 niveles de categorias");
    }
  }

  await prisma.category.create({
    data: {
      nombre,
      icono,
      color,
      tipo: tipo as "gasto_diario" | "viaje" | "ambos" | "ingreso",
      parentId: parentId || null,
    },
  });

  revalidatePath("/categorias");
}

export async function updateCategory(id: string, formData: FormData) {
  const user = await getCurrentUser();
  if (!user || !["admin", "owner"].includes(user.rol)) throw new Error("No autorizado");

  const nombre = formData.get("nombre") as string;
  const color = (formData.get("color") as string) || undefined;

  const data: Record<string, unknown> = { nombre };
  if (color) data.color = color;

  await prisma.category.update({
    where: { id },
    data,
  });

  revalidatePath("/categorias");
  revalidatePath("/");
  revalidatePath("/movimientos");
}

export async function deleteCategory(id: string) {
  const user = await getCurrentUser();
  if (!user || !["admin", "owner"].includes(user.rol)) throw new Error("No autorizado");

  await prisma.category.delete({ where: { id } });
  revalidatePath("/categorias");
}
