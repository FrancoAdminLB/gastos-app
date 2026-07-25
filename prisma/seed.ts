import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

interface CategorySeed {
  id: string;
  nombre: string;
  icono: string;
  color: string;
  tipo: "gasto_diario" | "viaje" | "ambos" | "ingreso";
  children?: Omit<CategorySeed, "children" | "tipo">[];
}

const incomeCategories: CategorySeed[] = [
  { id: "ingreso-sueldo", nombre: "Sueldo", icono: "briefcase", color: "#4ADE80", tipo: "ingreso" },
  { id: "ingreso-freelance", nombre: "Freelance", icono: "laptop", color: "#38BDF8", tipo: "ingreso" },
  { id: "ingreso-alquiler", nombre: "Alquiler", icono: "home", color: "#FBBF24", tipo: "ingreso" },
  { id: "ingreso-inversiones", nombre: "Inversiones", icono: "trending-up", color: "#A78BFA", tipo: "ingreso" },
  { id: "ingreso-otros", nombre: "Otros ingresos", icono: "plus-circle", color: "#6B7280", tipo: "ingreso" },
];

const expenseCategories: CategorySeed[] = [
  {
    id: "servicios", nombre: "Servicios", icono: "zap", color: "#F97316", tipo: "gasto_diario",
    children: [
      { id: "servicios-electricidad", nombre: "Electricidad", icono: "zap", color: "#F97316" },
      { id: "servicios-gas", nombre: "Gas", icono: "flame", color: "#EF4444" },
      { id: "servicios-agua", nombre: "Agua", icono: "droplets", color: "#3B82F6" },
      { id: "servicios-internet", nombre: "Internet / Cable", icono: "wifi", color: "#8B5CF6" },
      { id: "servicios-telefono", nombre: "Telefono", icono: "phone", color: "#06B6D4" },
      { id: "servicios-impuestos", nombre: "Impuestos y Tasas", icono: "file-text", color: "#6B7280" },
    ],
  },
  {
    id: "comida", nombre: "Comida", icono: "utensils", color: "#EF4444", tipo: "ambos",
    children: [
      { id: "comida-restaurantes", nombre: "Restaurantes", icono: "utensils", color: "#EF4444" },
      { id: "comida-delivery", nombre: "Delivery", icono: "bike", color: "#F97316" },
      { id: "comida-cafe", nombre: "Cafe / Bar", icono: "coffee", color: "#92400E" },
    ],
  },
  {
    id: "transporte", nombre: "Transporte", icono: "car", color: "#3B82F6", tipo: "ambos",
    children: [
      { id: "transporte-combustible", nombre: "Combustible", icono: "fuel", color: "#F59E0B" },
      { id: "transporte-publico", nombre: "Transporte publico", icono: "bus", color: "#3B82F6" },
      { id: "transporte-taxi", nombre: "Taxi / Uber", icono: "car", color: "#1D4ED8" },
      { id: "transporte-estacionamiento", nombre: "Estacionamiento", icono: "parking", color: "#6B7280" },
    ],
  },
  { id: "supermercado", nombre: "Supermercado", icono: "shopping-cart", color: "#10B981", tipo: "gasto_diario" },
  {
    id: "entretenimiento", nombre: "Entretenimiento", icono: "gamepad", color: "#F59E0B", tipo: "ambos",
    children: [
      { id: "entretenimiento-streaming", nombre: "Streaming", icono: "tv", color: "#7C3AED" },
      { id: "entretenimiento-salidas", nombre: "Salidas", icono: "music", color: "#F59E0B" },
      { id: "entretenimiento-deportes", nombre: "Deportes", icono: "dumbbell", color: "#22C55E" },
    ],
  },
  {
    id: "salud", nombre: "Salud", icono: "heart-pulse", color: "#06B6D4", tipo: "ambos",
    children: [
      { id: "salud-farmacia", nombre: "Farmacia", icono: "pill", color: "#06B6D4" },
      { id: "salud-medico", nombre: "Medico", icono: "stethoscope", color: "#0891B2" },
      { id: "salud-prepaga", nombre: "Prepaga / Obra social", icono: "shield", color: "#14B8A6" },
    ],
  },
  { id: "compras", nombre: "Compras", icono: "shopping-bag", color: "#EC4899", tipo: "ambos" },
  { id: "alojamiento", nombre: "Alojamiento", icono: "bed", color: "#8B5CF6", tipo: "viaje" },
  { id: "excursiones", nombre: "Excursiones", icono: "mountain", color: "#14B8A6", tipo: "viaje" },
  { id: "otros", nombre: "Otros", icono: "receipt", color: "#6B7280", tipo: "ambos" },
];

async function main() {
  console.log("Seeding categories...");

  // Income categories
  for (const cat of incomeCategories) {
    await prisma.category.upsert({
      where: { id: cat.id },
      update: { nombre: cat.nombre, tipo: cat.tipo },
      create: { id: cat.id, nombre: cat.nombre, icono: cat.icono, color: cat.color, tipo: cat.tipo },
    });
  }

  // Expense categories with children
  for (const cat of expenseCategories) {
    await prisma.category.upsert({
      where: { id: cat.id },
      update: { nombre: cat.nombre, tipo: cat.tipo },
      create: { id: cat.id, nombre: cat.nombre, icono: cat.icono, color: cat.color, tipo: cat.tipo },
    });

    if (cat.children) {
      for (const child of cat.children) {
        await prisma.category.upsert({
          where: { id: child.id },
          update: { nombre: child.nombre, parentId: cat.id },
          create: {
            id: child.id,
            nombre: child.nombre,
            icono: child.icono,
            color: child.color,
            tipo: cat.tipo,
            parentId: cat.id,
          },
        });
      }
    }
  }

  console.log("Seed completed.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
