import { PrismaClient, Role } from "../src/generated/prisma/client"
import { PrismaPg } from "@prisma/adapter-pg"
import bcrypt from "bcryptjs"
import "dotenv/config"

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! })
const prisma = new PrismaClient({ adapter })

async function main() {
  // Create default branch
  const branch = await prisma.branch.upsert({
    where: { id: "main-branch" },
    update: {},
    create: {
      id: "main-branch",
      name: "Cabang Utama",
      address: "Jl. Merdeka No. 1, Jakarta",
      phone: "021-1234567",
    },
  })

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
      branchId: branch.id,
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
      branchId: branch.id,
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

  // Create default loyalty rule
  await prisma.loyaltyRule.upsert({
    where: { id: "default-rule" },
    update: {},
    create: {
      id: "default-rule",
      pointsPerRupiah: 0.01,
      minPurchase: 50000,
      isActive: true,
    },
  })

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
