"use server";

import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";

const DEFAULT_CATEGORIES = [
  // Expense categories
  { id: "comida", nombre: "Comida", tipo: "ambos", color: "#F59E0B", children: [
    { id: "comida-restaurantes", nombre: "Restaurantes", color: "#FB923C" },
    { id: "comida-delivery", nombre: "Delivery", color: "#FBBF24" },
    { id: "comida-cafe", nombre: "Cafe / Bar", color: "#F97316" },
  ]},
  { id: "transporte", nombre: "Transporte", tipo: "ambos", color: "#3B82F6", children: [
    { id: "transporte-combustible", nombre: "Combustible", color: "#60A5FA" },
    { id: "transporte-publico", nombre: "Transporte publico", color: "#93C5FD" },
    { id: "transporte-taxi", nombre: "Taxi / Uber", color: "#2563EB" },
    { id: "transporte-estacionamiento", nombre: "Estacionamiento", color: "#1D4ED8" },
  ]},
  { id: "servicios", nombre: "Servicios", tipo: "gasto_diario", color: "#8B5CF6", children: [
    { id: "servicios-electricidad", nombre: "Electricidad", color: "#A78BFA" },
    { id: "servicios-gas", nombre: "Gas", color: "#C4B5FD" },
    { id: "servicios-agua", nombre: "Agua", color: "#7C3AED" },
    { id: "servicios-internet", nombre: "Internet / Cable", color: "#6D28D9" },
    { id: "servicios-telefono", nombre: "Telefono", color: "#5B21B6" },
    { id: "servicios-impuestos", nombre: "Impuestos y Tasas", color: "#4C1D95" },
  ]},
  { id: "salud", nombre: "Salud", tipo: "ambos", color: "#EF4444", children: [
    { id: "salud-medico", nombre: "Medico", color: "#F87171" },
    { id: "salud-farmacia", nombre: "Farmacia", color: "#FCA5A5" },
    { id: "salud-prepaga", nombre: "Prepaga / Obra social", color: "#DC2626" },
  ]},
  { id: "entretenimiento", nombre: "Entretenimiento", tipo: "ambos", color: "#EC4899", children: [
    { id: "entretenimiento-salidas", nombre: "Salidas", color: "#F472B6" },
    { id: "entretenimiento-streaming", nombre: "Suscripciones", color: "#F9A8D4" },
    { id: "entretenimiento-deportes", nombre: "Deportes", color: "#DB2777" },
  ]},
  { id: "supermercado", nombre: "Supermercado", tipo: "gasto_diario", color: "#10B981", children: [] },
  { id: "compras", nombre: "Compras", tipo: "ambos", color: "#14B8A6", children: [] },
  { id: "alojamiento", nombre: "Alojamiento", tipo: "viaje", color: "#06B6D4", children: [] },
  { id: "excursiones", nombre: "Excursiones", tipo: "viaje", color: "#0EA5E9", children: [] },
  { id: "otros", nombre: "Otros", tipo: "ambos", color: "#6B7280", children: [] },
  // Income categories
  { id: "ingreso-sueldo", nombre: "Sueldo", tipo: "ingreso", color: "#22C55E", children: [] },
  { id: "ingreso-freelance", nombre: "Freelance", tipo: "ingreso", color: "#4ADE80", children: [] },
  { id: "ingreso-alquiler", nombre: "Alquiler", tipo: "ingreso", color: "#16A34A", children: [] },
  { id: "ingreso-inversiones", nombre: "Inversiones", tipo: "ingreso", color: "#15803D", children: [] },
  { id: "ingreso-otros", nombre: "Otros ingresos", tipo: "ingreso", color: "#86EFAC", children: [] },
] as const;

async function createDefaultCategories(userId: string) {
  const existing = await prisma.category.count({ where: { userId } });
  if (existing > 0) return;

  for (const cat of DEFAULT_CATEGORIES) {
    const catId = `${userId.slice(0, 8)}-${cat.id}`;
    await prisma.category.create({
      data: {
        id: catId,
        userId,
        nombre: cat.nombre,
        tipo: cat.tipo as "gasto_diario" | "viaje" | "ambos" | "ingreso",
        color: cat.color,
      },
    });
    for (const child of cat.children) {
      await prisma.category.create({
        data: {
          id: `${userId.slice(0, 8)}-${child.id}`,
          userId,
          nombre: child.nombre,
          color: child.color,
          tipo: cat.tipo as "gasto_diario" | "viaje" | "ambos" | "ingreso",
          parentId: catId,
        },
      });
    }
  }
}

// Cached per-request: avoids repeated Supabase + DB calls within the same render
export const getCurrentUser = cache(async () => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const dbUser = await prisma.user.upsert({
    where: { id: user.id },
    update: {},
    create: {
      id: user.id,
      email: user.email!,
      nombre: user.email!.split("@")[0],
      rol: "owner",
    },
  });

  // Ensure new users get default categories
  await createDefaultCategories(dbUser.id);

  return dbUser;
});
