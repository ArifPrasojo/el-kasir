import { PrismaClient, Role } from "../src/generated/prisma/client"
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3"
import bcrypt from "bcryptjs"
import path from "path"

const dbPath = path.join(process.cwd(), "dev.db")
const adapter = new PrismaBetterSqlite3({ url: `file:${dbPath}` })
const prisma = new PrismaClient({ adapter })

async function main() {
  // Create admin user
  const hashedPassword = await bcrypt.hash("admin123", 10)
  await prisma.user.upsert({
    where: { email: "admin@elkasir.com" },
    update: {},
    create: {
      name: "Administrator",
      email: "admin@elkasir.com",
      password: hashedPassword,
      role: Role.ADMIN,
    },
  })

  // Create cashier user
  const cashierPassword = await bcrypt.hash("kasir123", 10)
  await prisma.user.upsert({
    where: { email: "kasir@elkasir.com" },
    update: {},
    create: {
      name: "Kasir 1",
      email: "kasir@elkasir.com",
      password: cashierPassword,
      role: Role.CASHIER,
    },
  })

  // Create sample categories
  const categories = ["Makanan", "Minuman", "Snack", "Household", "Lainnya"]
  for (const catName of categories) {
    await prisma.category.upsert({
      where: { name: catName },
      update: {},
      create: {
        name: catName,
        description: `Kategori ${catName}`,
      },
    })
  }

  console.log("Seed data created successfully!")
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
