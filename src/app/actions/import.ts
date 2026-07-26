"use server";

import { parseExpenseText } from "@/lib/expense-parser";
import { createExpenseFromImport } from "./expenses";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { getCurrentUser } from "./auth";

export async function parseAndPreview(text: string) {
  const user = await getCurrentUser();
  if (!user) throw new Error("No autorizado");
  const parsed = parseExpenseText(text);
  if (!parsed) return null;

  // Get user's non-income categories for matching
  const categories = await prisma.category.findMany({
    where: { userId: user.id, tipo: { not: "ingreso" } },
  });
  const categoryMatch = autoMatchCategory(parsed.comercio, categories);

  return {
    ...parsed,
    fecha: parsed.fecha.toISOString(),
    suggestedCategoryId: categoryMatch?.id || null,
    suggestedCategoryName: categoryMatch?.nombre || null,
  };
}

export async function confirmImport(data: {
  monto: number;
  moneda: string;
  categoryId: string;
  fecha: string;
  descripcion: string;
  medioPago: "efectivo" | "cheque" | "transferencia_bancaria" | "cripto" | "tarjeta_credito";
}) {
  const user = await getCurrentUser();
  if (!user) throw new Error("No autorizado");
  await createExpenseFromImport({
    monto: data.monto,
    moneda: data.moneda,
    categoryId: data.categoryId,
    fecha: new Date(data.fecha),
    descripcion: data.descripcion,
    medioPago: data.medioPago,
  });

  revalidatePath("/");
  revalidatePath("/movimientos");
}

// Simple keyword-based category matching
function autoMatchCategory(
  merchant: string,
  categories: { id: string; nombre: string }[]
) {
  const lower = merchant.toLowerCase();

  const keywords: Record<string, string[]> = {
    comida: ["restaurant", "restó", "resto", "bar", "cafe", "cafetería", "pizz", "hamburgues", "sushi", "mcdonald", "burger", "subway", "starbucks", "rappi", "pedidosya"],
    supermercado: ["carrefour", "coto", "disco", "jumbo", "dia", "chango", "maxiconsumo", "walmart", "changomas", "super"],
    transporte: ["ypf", "shell", "axion", "nafta", "combustible", "uber", "cabify", "didi", "peaje", "autopist", "subte", "sube"],
    entretenimiento: ["cine", "netflix", "spotify", "steam", "disney", "hbo", "amazon", "prime", "youtube"],
    salud: ["farmacia", "farmacity", "hospital", "clinica", "medic", "doctor", "dentist"],
    compras: ["mercadolibre", "amazon", "zara", "nike", "adidas", "fravega", "garbarino", "musimundo"],
    servicios: ["edenor", "edesur", "metrogas", "aysa", "telecom", "movistar", "claro", "personal", "internet"],
    alojamiento: ["hotel", "hostel", "airbnb", "booking"],
  };

  for (const [catName, words] of Object.entries(keywords)) {
    if (words.some((w) => lower.includes(w))) {
      const match = categories.find(
        (c) => c.nombre.toLowerCase() === catName
      );
      if (match) return match;
    }
  }

  return null;
}
