import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding via API endpoint...");
  console.log("Start the dev server and POST to /api/seed, or use the Settings page.");
  console.log("Alternatively, run: curl -X POST http://localhost:3000/api/seed");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
