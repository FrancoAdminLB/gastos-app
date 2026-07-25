import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

// Categories are now created automatically per-user when they first log in.
// This seed is kept for reference but is no longer needed in production.

async function main() {
  console.log("Categories are now auto-created per user on first login.");
  console.log("No seeding needed.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
