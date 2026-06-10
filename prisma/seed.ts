import { PrismaClient, Role } from "../src/generated/prisma/client"
import { PrismaPg } from "@prisma/adapter-pg"
import bcrypt from "bcryptjs"
import "dotenv/config"

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! })
const prisma = new PrismaClient({ adapter })

async function main() {
  console.log("🌱 Seeding database...")

  // ============================================================
  // CABANG
  // ============================================================
  const branchUtama = await prisma.branch.upsert({
    where: { id: "branch-utama" },
    update: { name: "Cabang Utama", address: "Jl. Merdeka No. 1, Jakarta Pusat", phone: "021-1234567" },
    create: {
      id: "branch-utama",
      name: "Cabang Utama",
      address: "Jl. Merdeka No. 1, Jakarta Pusat",
      phone: "021-1234567",
      isActive: true,
    },
  })

  const branchBandung = await prisma.branch.upsert({
    where: { id: "branch-bandung" },
    update: { name: "Cabang Bandung", address: "Jl. Asia Afrika No. 55, Bandung", phone: "022-4567890" },
    create: {
      id: "branch-bandung",
      name: "Cabang Bandung",
      address: "Jl. Asia Afrika No. 55, Bandung",
      phone: "022-4567890",
      isActive: true,
    },
  })

  const branchSurabaya = await prisma.branch.upsert({
    where: { id: "branch-surabaya" },
    update: { name: "Cabang Surabaya", address: "Jl. Pemuda No. 10, Surabaya", phone: "031-9876543" },
    create: {
      id: "branch-surabaya",
      name: "Cabang Surabaya",
      address: "Jl. Pemuda No. 10, Surabaya",
      phone: "031-9876543",
      isActive: true,
    },
  })

  console.log("✅ Cabang selesai")

  // ============================================================
  // PENGGUNA
  // ============================================================
  const adminPass = await bcrypt.hash("admin123", 10)
  const kasirPass = await bcrypt.hash("kasir123", 10)

  await prisma.user.upsert({
    where: { email: "admin@elkasir.com" },
    update: { branchId: branchUtama.id },
    create: {
      name: "Administrator",
      email: "admin@elkasir.com",
      password: adminPass,
      role: Role.ADMIN,
      branchId: branchUtama.id,
    },
  })

  await prisma.user.upsert({
    where: { email: "kasir1@elkasir.com" },
    update: { branchId: branchUtama.id },
    create: {
      name: "Budi Santoso",
      email: "kasir1@elkasir.com",
      password: kasirPass,
      role: Role.CASHIER,
      branchId: branchUtama.id,
    },
  })

  // backward compat
  await prisma.user.upsert({
    where: { email: "kasir@elkasir.com" },
    update: { branchId: branchUtama.id },
    create: {
      name: "Kasir 1",
      email: "kasir@elkasir.com",
      password: kasirPass,
      role: Role.CASHIER,
      branchId: branchUtama.id,
    },
  })

  await prisma.user.upsert({
    where: { email: "kasir2@elkasir.com" },
    update: { branchId: branchBandung.id },
    create: {
      name: "Siti Rahayu",
      email: "kasir2@elkasir.com",
      password: kasirPass,
      role: Role.CASHIER,
      branchId: branchBandung.id,
    },
  })

  await prisma.user.upsert({
    where: { email: "kasir3@elkasir.com" },
    update: { branchId: branchSurabaya.id },
    create: {
      name: "Rudi Hermawan",
      email: "kasir3@elkasir.com",
      password: kasirPass,
      role: Role.CASHIER,
      branchId: branchSurabaya.id,
    },
  })

  console.log("✅ Pengguna selesai")

  // ============================================================
  // KATEGORI
  // ============================================================
  const categoryData = [
    { name: "Makanan Berat",   description: "Nasi, mie, dan makanan utama" },
    { name: "Makanan Ringan",  description: "Snack, keripik, kue" },
    { name: "Minuman",         description: "Minuman dingin, hangat, dan jus" },
    { name: "Kopi & Teh",      description: "Berbagai varian kopi dan teh" },
    { name: "Dessert",         description: "Puding, es krim, dan kue manis" },
    { name: "Paket Hemat",     description: "Bundling makanan dan minuman" },
  ]

  const categories: Record<string, { id: string; name: string }> = {}
  for (const cat of categoryData) {
    const c = await prisma.category.upsert({
      where: { name: cat.name },
      update: { description: cat.description },
      create: cat,
    })
    categories[cat.name] = c
  }

  // backward compat categories
  for (const name of ["Makanan", "Minuman", "Snack", "Household", "Lainnya"]) {
    const c = await prisma.category.upsert({
      where: { name },
      update: {},
      create: { name, description: `Kategori ${name}` },
    })
    categories[name] = c
  }

  console.log("✅ Kategori selesai")

  // ============================================================
  // PRODUK
  // ============================================================
  const productData = [
    // Makanan Berat
    { name: "Nasi Goreng Spesial",   price: 25000, cost: 12000, stock: 50,  category: "Makanan Berat",  desc: "Nasi goreng dengan telur, ayam, dan sayuran" },
    { name: "Mie Ayam Bakso",        price: 22000, cost: 10000, stock: 40,  category: "Makanan Berat",  desc: "Mie ayam lengkap dengan bakso dan pangsit" },
    { name: "Nasi Rendang",          price: 30000, cost: 15000, stock: 30,  category: "Makanan Berat",  desc: "Nasi dengan rendang sapi" },
    { name: "Nasi Ayam Geprek",      price: 20000, cost: 9000,  stock: 60,  category: "Makanan Berat",  desc: "Ayam geprek dengan sambal dan nasi" },
    { name: "Soto Ayam",             price: 18000, cost: 8000,  stock: 35,  category: "Makanan Berat",  desc: "Soto ayam bening dengan pelengkap" },
    // Makanan Ringan
    { name: "Kentang Goreng",        price: 12000, cost: 5000,  stock: 80,  category: "Makanan Ringan", desc: "Kentang goreng crispy" },
    { name: "Pisang Goreng",         price: 10000, cost: 4000,  stock: 60,  category: "Makanan Ringan", desc: "Pisang goreng crispy dengan keju" },
    { name: "Roti Bakar Keju",       price: 15000, cost: 6000,  stock: 45,  category: "Makanan Ringan", desc: "Roti bakar isi keju mozzarella" },
    { name: "Cireng Isi",            price: 8000,  cost: 3000,  stock: 100, category: "Makanan Ringan", desc: "Cireng dengan isian keju" },
    // Minuman
    { name: "Es Teh Manis",          price: 5000,  cost: 1500,  stock: 150, category: "Minuman",        desc: "Teh manis dingin segar" },
    { name: "Es Jeruk",              price: 8000,  cost: 3000,  stock: 100, category: "Minuman",        desc: "Jeruk peras segar dengan es" },
    { name: "Jus Alpukat",           price: 15000, cost: 6000,  stock: 50,  category: "Minuman",        desc: "Jus alpukat creamy dengan susu" },
    { name: "Jus Mangga",            price: 12000, cost: 5000,  stock: 60,  category: "Minuman",        desc: "Jus mangga harum manis" },
    { name: "Air Mineral",           price: 4000,  cost: 2000,  stock: 200, category: "Minuman",        desc: "Air mineral botol 600ml" },
    { name: "Es Kelapa Muda",        price: 15000, cost: 7000,  stock: 40,  category: "Minuman",        desc: "Kelapa muda segar dengan es" },
    // Kopi & Teh
    { name: "Kopi Hitam",            price: 8000,  cost: 2500,  stock: 120, category: "Kopi & Teh",    desc: "Kopi hitam robusta pilihan" },
    { name: "Kopi Susu Gula Aren",   price: 18000, cost: 7000,  stock: 80,  category: "Kopi & Teh",    desc: "Espresso dengan susu dan gula aren" },
    { name: "Matcha Latte",          price: 22000, cost: 9000,  stock: 50,  category: "Kopi & Teh",    desc: "Teh matcha premium dengan susu" },
    { name: "Teh Tarik",             price: 12000, cost: 4500,  stock: 70,  category: "Kopi & Teh",    desc: "Teh tarik ala mamak" },
    { name: "Cappuccino",            price: 20000, cost: 8000,  stock: 60,  category: "Kopi & Teh",    desc: "Espresso dengan foam susu" },
    // Dessert
    { name: "Pudding Coklat",        price: 12000, cost: 4500,  stock: 40,  category: "Dessert",        desc: "Puding coklat lembut dengan saus vanilla" },
    { name: "Es Krim 2 Scoop",       price: 18000, cost: 7000,  stock: 50,  category: "Dessert",        desc: "Es krim 2 rasa pilihan" },
    { name: "Waffle Keju Madu",      price: 25000, cost: 10000, stock: 30,  category: "Dessert",        desc: "Waffle dengan topping keju dan madu" },
    // Paket Hemat
    { name: "Paket Nasi + Minuman",  price: 28000, cost: 13000, stock: 30,  category: "Paket Hemat",    desc: "Nasi goreng + es teh manis" },
    { name: "Paket Kopi + Snack",    price: 22000, cost: 9500,  stock: 25,  category: "Paket Hemat",    desc: "Kopi hitam + pisang goreng" },
  ]

  for (const p of productData) {
    const cat = categories[p.category]
    if (!cat) continue
    // Check if exists by name + branchId (nullable)
    const existing = await prisma.product.findFirst({ where: { name: p.name, branchId: branchUtama.id } })
    if (!existing) {
      await prisma.product.create({
        data: {
          name: p.name,
          description: p.desc,
          price: p.price,
          cost: p.cost,
          stock: p.stock,
          categoryId: cat.id,
          branchId: branchUtama.id,
          isActive: true,
        },
      })
    }
  }

  console.log("✅ Produk selesai")

  // ============================================================
  // BAHAN BAKU
  // ============================================================
  const rawMaterialData = [
    { name: "Beras Premium",        unit: "kg",     stock: 100, costPerUnit: 14000, minStock: 20 },
    { name: "Minyak Goreng",        unit: "liter",  stock: 20,  costPerUnit: 18000, minStock: 5  },
    { name: "Telur Ayam",           unit: "butir",  stock: 200, costPerUnit: 2500,  minStock: 50 },
    { name: "Ayam Potong",          unit: "kg",     stock: 30,  costPerUnit: 35000, minStock: 10 },
    { name: "Daging Sapi",          unit: "kg",     stock: 15,  costPerUnit: 120000, minStock: 5 },
    { name: "Tepung Terigu",        unit: "kg",     stock: 25,  costPerUnit: 12000, minStock: 10 },
    { name: "Gula Pasir",           unit: "kg",     stock: 30,  costPerUnit: 16000, minStock: 10 },
    { name: "Gula Aren",            unit: "kg",     stock: 10,  costPerUnit: 25000, minStock: 5  },
    { name: "Susu Full Cream",      unit: "liter",  stock: 20,  costPerUnit: 20000, minStock: 5  },
    { name: "Kopi Robusta",         unit: "kg",     stock: 10,  costPerUnit: 80000, minStock: 3  },
    { name: "Kopi Arabika",         unit: "kg",     stock: 5,   costPerUnit: 150000, minStock: 2 },
    { name: "Matcha Powder",        unit: "kg",     stock: 3,   costPerUnit: 200000, minStock: 1 },
    { name: "Keju Mozzarella",      unit: "kg",     stock: 5,   costPerUnit: 80000, minStock: 2  },
    { name: "Mentega",              unit: "kg",     stock: 8,   costPerUnit: 55000, minStock: 3  },
    { name: "Coklat Batang",        unit: "kg",     stock: 5,   costPerUnit: 65000, minStock: 2  },
    { name: "Santan Kelapa",        unit: "liter",  stock: 15,  costPerUnit: 18000, minStock: 5  },
    { name: "Pisang Kepok",         unit: "sisir",  stock: 20,  costPerUnit: 20000, minStock: 5  },
    { name: "Mangga Harum Manis",   unit: "kg",     stock: 15,  costPerUnit: 25000, minStock: 5  },
    { name: "Alpukat",              unit: "kg",     stock: 10,  costPerUnit: 30000, minStock: 3  },
    { name: "Kelapa Muda",          unit: "buah",   stock: 30,  costPerUnit: 10000, minStock: 10 },
    { name: "Kentang",              unit: "kg",     stock: 20,  costPerUnit: 12000, minStock: 5  },
    { name: "Garam Dapur",          unit: "kg",     stock: 10,  costPerUnit: 8000,  minStock: 3  },
    { name: "Kecap Manis",          unit: "botol",  stock: 12,  costPerUnit: 12000, minStock: 4  },
    { name: "Saus Sambal",          unit: "botol",  stock: 15,  costPerUnit: 10000, minStock: 4  },
    { name: "Air Mineral Galon",    unit: "galon",  stock: 10,  costPerUnit: 20000, minStock: 3  },
  ]

  const rawMaterials: Record<string, { id: string }> = {}
  for (const rm of rawMaterialData) {
    const existing = await prisma.rawMaterial.findFirst({ where: { name: rm.name, branchId: branchUtama.id } })
    if (existing) {
      rawMaterials[rm.name] = existing
    } else {
      const created = await prisma.rawMaterial.create({
        data: { ...rm, branchId: branchUtama.id, isActive: true },
      })
      rawMaterials[rm.name] = created
    }
  }

  console.log("✅ Bahan baku selesai")

  // ============================================================
  // SUPPLIER + BAHAN BAKU PER SUPPLIER
  // ============================================================
  const supplierData = [
    {
      id: "supplier-pangan",
      name: "PT Sumber Pangan Sejahtera",
      email: "order@sumberpangan.co.id",
      phone: "021-8887766",
      address: "Jl. Raya Pasar Induk No. 12, Jakarta Timur",
      materials: [
        { name: "Beras Premium",      price: 13500 },
        { name: "Minyak Goreng",      price: 17500 },
        { name: "Tepung Terigu",      price: 11500 },
        { name: "Gula Pasir",         price: 15500 },
        { name: "Garam Dapur",        price: 7500  },
        { name: "Kecap Manis",        price: 11500 },
        { name: "Saus Sambal",        price: 9500  },
      ],
    },
    {
      id: "supplier-ternak",
      name: "UD Maju Ternak",
      email: "penjualan@majuternak.com",
      phone: "0812-3456-7890",
      address: "Jl. Kandang Ayam No. 5, Bogor",
      materials: [
        { name: "Ayam Potong",        price: 34000 },
        { name: "Telur Ayam",         price: 2400  },
        { name: "Daging Sapi",        price: 118000 },
      ],
    },
    {
      id: "supplier-dairy",
      name: "CV Dairy Nusantara",
      email: "sales@dairynusantara.com",
      phone: "022-5544332",
      address: "Jl. Pasteur No. 88, Bandung",
      materials: [
        { name: "Susu Full Cream",    price: 19500 },
        { name: "Keju Mozzarella",    price: 78000 },
        { name: "Mentega",            price: 53000 },
      ],
    },
    {
      id: "supplier-kopi",
      name: "Toko Kopi Nusantara",
      email: "info@kopinusantara.id",
      phone: "0813-9988-7766",
      address: "Jl. Kopi No. 7, Lampung",
      materials: [
        { name: "Kopi Robusta",       price: 78000 },
        { name: "Kopi Arabika",       price: 145000 },
        { name: "Matcha Powder",      price: 195000 },
        { name: "Gula Aren",          price: 24000  },
        { name: "Coklat Batang",      price: 63000  },
      ],
    },
    {
      id: "supplier-buah",
      name: "Pasar Buah Segar",
      email: "buahsegar@gmail.com",
      phone: "0877-1234-5678",
      address: "Pasar Induk Kramat Jati, Jakarta Timur",
      materials: [
        { name: "Pisang Kepok",       price: 19000 },
        { name: "Mangga Harum Manis", price: 24000 },
        { name: "Alpukat",            price: 28000 },
        { name: "Kelapa Muda",        price: 9500  },
        { name: "Kentang",            price: 11500 },
      ],
    },
    {
      id: "supplier-bumbu",
      name: "Toko Bumbu Dapur Ibu",
      email: "bumbuidapur@gmail.com",
      phone: "0821-5555-4444",
      address: "Pasar Senen Blok III, Jakarta Pusat",
      materials: [
        { name: "Santan Kelapa",      price: 17000 },
        { name: "Gula Aren",          price: 24500 },
        { name: "Garam Dapur",        price: 7800  },
        { name: "Kecap Manis",        price: 11800 },
        { name: "Saus Sambal",        price: 9800  },
        { name: "Minyak Goreng",      price: 17800 },
      ],
    },
    {
      id: "supplier-minuman",
      name: "Distributor Minuman Prima",
      email: "order@minumanprima.co.id",
      phone: "031-2233445",
      address: "Jl. Raya Darmo No. 44, Surabaya",
      materials: [
        { name: "Air Mineral Galon",  price: 19500 },
        { name: "Susu Full Cream",    price: 19800 },
      ],
    },
  ]

  for (const sup of supplierData) {
    const { materials, ...supData } = sup

    // Upsert supplier
    const supplier = await prisma.supplier.upsert({
      where: { id: supData.id },
      update: { name: supData.name, email: supData.email, phone: supData.phone, address: supData.address },
      create: { ...supData, isActive: true, branchId: branchUtama.id },
    })

    // Hapus lama, buat ulang supplierMaterials
    await prisma.supplierMaterial.deleteMany({ where: { supplierId: supplier.id } })

    for (const mat of materials) {
      const rm = rawMaterials[mat.name]
      if (!rm) continue
      await prisma.supplierMaterial.create({
        data: {
          supplierId: supplier.id,
          rawMaterialId: rm.id,
          pricePerUnit: mat.price,
        },
      })
    }
  }

  console.log("✅ Supplier & bahan baku supplier selesai")

  // ============================================================
  // CUSTOMER
  // ============================================================
  const customerData = [
    { name: "Andi Pratama",      phone: "0812-1111-2222", email: "andi@gmail.com",     points: 150, spent: 350000 },
    { name: "Dewi Kusuma",       phone: "0813-2222-3333", email: "dewi@gmail.com",     points: 320, spent: 780000 },
    { name: "Hendra Gunawan",    phone: "0814-3333-4444", email: "hendra@yahoo.com",   points: 85,  spent: 210000 },
    { name: "Fitri Handayani",   phone: "0815-4444-5555", email: "fitri@gmail.com",    points: 550, spent: 1250000 },
    { name: "Rizky Maulana",     phone: "0816-5555-6666", email: "rizky@gmail.com",    points: 200, spent: 490000 },
    { name: "Maya Sari",         phone: "0817-6666-7777", email: "maya@hotmail.com",   points: 75,  spent: 185000 },
    { name: "Bagas Wicaksono",   phone: "0818-7777-8888", email: "",                   points: 420, spent: 1050000 },
    { name: "Nurul Hidayah",     phone: "0819-8888-9999", email: "nurul@gmail.com",    points: 130, spent: 315000 },
    { name: "Agus Setiawan",     phone: "0821-1234-5678", email: "",                   points: 260, spent: 640000 },
    { name: "Lestari Wulandari", phone: "0822-9876-5432", email: "lestari@gmail.com",  points: 480, spent: 1180000 },
  ]

  for (const c of customerData) {
    const existing = await prisma.customer.findFirst({ where: { phone: c.phone } })
    if (!existing) {
      await prisma.customer.create({
        data: {
          name: c.name,
          phone: c.phone,
          email: c.email,
          totalPoints: c.points,
          totalSpent: c.spent,
          branchId: branchUtama.id,
        },
      })
    }
  }

  console.log("✅ Customer selesai")

  // ============================================================
  // LOYALTY RULE
  // ============================================================
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

  // ============================================================
  // RINGKASAN
  // ============================================================
  const [branchCount, userCount, catCount, productCount, rmCount, supplierCount, customerCount] = await Promise.all([
    prisma.branch.count(),
    prisma.user.count(),
    prisma.category.count(),
    prisma.product.count(),
    prisma.rawMaterial.count(),
    prisma.supplier.count(),
    prisma.customer.count(),
  ])

  console.log("\n🎉 Seed selesai! Ringkasan:")
  console.log(`   🏢 Cabang     : ${branchCount}`)
  console.log(`   👤 Pengguna   : ${userCount}`)
  console.log(`   📂 Kategori   : ${catCount}`)
  console.log(`   📦 Produk     : ${productCount}`)
  console.log(`   🧪 Bahan Baku : ${rmCount}`)
  console.log(`   🚚 Supplier   : ${supplierCount}`)
  console.log(`   🧑 Customer   : ${customerCount}`)
  console.log("\n🔑 Login:")
  console.log("   Admin  : admin@elkasir.com   / admin123")
  console.log("   Kasir  : kasir1@elkasir.com  / kasir123  (Cabang Utama)")
  console.log("   Kasir  : kasir2@elkasir.com  / kasir123  (Cabang Bandung)")
  console.log("   Kasir  : kasir3@elkasir.com  / kasir123  (Cabang Surabaya)")
}

main()
  .catch((e) => {
    console.error("❌ Seed gagal:", e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
