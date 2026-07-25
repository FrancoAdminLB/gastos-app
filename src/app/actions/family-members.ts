"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { getCurrentUser } from "./auth";

export async function getFamilyMembers() {
  const user = await getCurrentUser();
  if (!user) throw new Error("No autorizado");
  return prisma.familyMember.findMany({
    orderBy: { nombre: "asc" },
  });
}

export async function createFamilyMember(formData: FormData) {
  const user = await getCurrentUser();
  if (!user || !["admin", "owner"].includes(user.rol)) throw new Error("No autorizado");

  const nombre = formData.get("nombre") as string;
  const color = (formData.get("color") as string) || "#6B7280";

  await prisma.familyMember.create({
    data: { nombre, color },
  });

  revalidatePath("/categorias");
  revalidatePath("/");
  revalidatePath("/gastos");
  revalidatePath("/reportes");
}

export async function updateFamilyMember(id: string, formData: FormData) {
  const user = await getCurrentUser();
  if (!user || !["admin", "owner"].includes(user.rol)) throw new Error("No autorizado");

  const nombre = formData.get("nombre") as string;
  const data: Record<string, unknown> = {};
  if (nombre) data.nombre = nombre;

  const color = formData.get("color") as string | null;
  if (color) data.color = color;

  await prisma.familyMember.update({ where: { id }, data });
  revalidatePath("/categorias");
  revalidatePath("/");
  revalidatePath("/gastos");
  revalidatePath("/reportes");
}

export async function deleteFamilyMember(id: string) {
  const user = await getCurrentUser();
  if (!user || !["admin", "owner"].includes(user.rol)) throw new Error("No autorizado");

  await prisma.familyMember.delete({ where: { id } });
  revalidatePath("/categorias");
  revalidatePath("/");
  revalidatePath("/gastos");
  revalidatePath("/reportes");
}
