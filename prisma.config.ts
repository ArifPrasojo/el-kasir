import "dotenv/config";
import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "npx tsx prisma/seed.ts",
  },
  datasource: {
    // For migrations, use DIRECT_URL (port 5432, session mode)
    // For runtime, prisma.ts uses DATABASE_URL (port 6543, transaction pooler)
    url: process.env["DIRECT_URL"] || process.env["DATABASE_URL"],
  },
});
