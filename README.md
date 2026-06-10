# El-Kasir - Panduan Lengkap Sistem Kasir

## Daftar Isi
1. [Tentang Proyek](#tentang-proyek)
2. [Tech Stack](#tech-stack)
3. [Persyaratan Sistem](#persyaratan-sistem)
4. [Instalasi](#instalasi)
5. [Struktur Proyek](#struktur-proyek)
6. [Database Schema](#database-schema)
7. [Fitur Utama](#fitur-utama)
8. [Panduan Penggunaan](#panduan-penggunaan)
9. [Deployment ke Vercel](#deployment-ke-vercel)
10. [Troubleshooting](#troubleshooting)

---

## Tentang Proyek

**El-Kasir** adalah sistem kasir (Point of Sale) modern berbasis web yang dibangun menggunakan Next.js, TypeScript, dan Prisma ORM dengan database SQLite. Sistem ini dirancang untuk membantu bisnis kecil dan menengah dalam mengelola penjualan, stok produk, dan laporan keuangan.

### Tujuan
- Menyediakan sistem kasir yang mudah digunakan
- Manajemen produk dan stok secara real-time
- Laporan penjualan dan keuntungan otomatis
- Dukungan multi-user dengan role-based access

---

## Tech Stack

| Teknologi | Versi | Fungsi |
|-----------|-------|--------|
| **Next.js** | 16.x | Framework React full-stack (App Router) |
| **TypeScript** | 5.x | Type-safe JavaScript |
| **React** | 19.x | Library UI |
| **Tailwind CSS** | 4.x | Utility-first CSS framework |
| **Prisma ORM** | 7.x | Database ORM dengan type-safety |
| **SQLite** | - | Database lokal (via better-sqlite3) |
| **NextAuth.js** | 4.x | Authentication (credentials-based) |
| **Recharts** | 3.x | Library chart untuk analytics |
| **Lucide React** | 1.x | Icon library |
| **bcryptjs** | 3.x | Password hashing |
| **date-fns** | 4.x | Date formatting utilities |

---

## Persyaratan Sistem

### Wajib
- **Node.js** >= 18.x (direkomendasikan 20.x+)
- **npm** >= 9.x
- **Git**

### Direkomendasikan
- RAM minimal 4GB
- Browser modern (Chrome, Firefox, Edge)
- Koneksi internet untuk instalasi package

---

## Instalasi

### Step 1: Clone / Buat Proyek

```bash
# Buat proyek Next.js baru
npx create-next-app@latest el-kasir \
  --typescript \
  --tailwind \
  --eslint \
  --app \
  --src-dir \
  --use-npm

# Masuk ke direktori proyek
cd el-kasir
```

### Step 2: Install Dependencies

```bash
# Dependencies utama
npm install prisma @prisma/client next-auth bcryptjs recharts lucide-react date-fns dotenv

# Adapter SQLite untuk Prisma v7
npm install better-sqlite3 @prisma/adapter-better-sqlite3

# Type definitions
npm install -D @types/bcryptjs @types/better-sqlite3 tsx
```

### Step 3: Inisialisasi Prisma

```bash
npx prisma init --datasource-provider sqlite
```

### Step 4: Konfigurasi Environment

Buat file `.env` di root proyek:

```env
# Database
DATABASE_URL="file:./dev.db"

# NextAuth
NEXTAUTH_SECRET="ganti-dengan-random-string-yang-panjang"
NEXTAUTH_URL="http://localhost:3000"
```

> **Penting:** Generate secret yang aman menggunakan:
> ```bash
> node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
> ```

### Step 5: Setup Database Schema

Edit file `prisma/schema.prisma` (lihat bagian [Database Schema](#database-schema)).

### Step 6: Migrasi Database

```bash
# Jalankan migrasi
npx prisma migrate dev --name init

# Generate Prisma Client
npx prisma generate
```

### Step 7: Seed Data Awal

Buat file `prisma/seed.ts` dan jalankan:

```bash
npx prisma db seed
```

### Step 8: Konfigurasi Tambahan

**`prisma.config.ts`:**
```typescript
import "dotenv/config";
import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "npx tsx prisma/seed.ts",
  },
  datasource: {
    url: process.env["DATABASE_URL"],
  },
});
```

**`next.config.ts`:**
```typescript
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["better-sqlite3", "@prisma/adapter-better-sqlite3"],
};

export default nextConfig;
```

**`package.json`** - tambahkan seed config:
```json
{
  "prisma": {
    "seed": "npx tsx prisma/seed.ts"
  }
}
```

### Step 9: Jalankan Development Server

```bash
npm run dev
```

Buka browser di `http://localhost:3000`

---

## Struktur Proyek

```
el-kasir/
├── prisma/
│   ├── schema.prisma          # Database schema
│   ├── seed.ts                # Data seeding
│   └── migrations/            # Migration files
├── public/
│   └── logo.svg               # Logo aplikasi
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── auth/[...nextauth]/route.ts   # NextAuth API
│   │   │   ├── products/route.ts             # CRUD Produk
│   │   │   ├── categories/route.ts           # CRUD Kategori
│   │   │   ├── transactions/route.ts         # Transaksi
│   │   │   ├── reports/route.ts              # Laporan
│   │   │   └── users/route.ts                # CRUD User
│   │   ├── dashboard/
│   │   │   ├── layout.tsx                    # Dashboard layout wrapper
│   │   │   ├── page.tsx                      # Dashboard utama
│   │   │   ├── pos/page.tsx                  # Halaman kasir/POS
│   │   │   ├── products/page.tsx             # Manajemen produk
│   │   │   ├── categories/page.tsx           # Manajemen kategori
│   │   │   ├── transactions/page.tsx         # Riwayat transaksi
│   │   │   ├── reports/page.tsx              # Laporan penjualan
│   │   │   └── users/page.tsx                # Manajemen user
│   │   ├── login/page.tsx                    # Halaman login
│   │   ├── layout.tsx                        # Root layout
│   │   ├── page.tsx                          # Redirect ke dashboard
│   │   ├── globals.css                       # Global styles
│   │   └── favicon.ico                       # Favicon
│   ├── components/
│   │   ├── Logo.tsx          # Komponen logo SVG
│   │   ├── Providers.tsx     # SessionProvider wrapper
│   │   └── Sidebar.tsx       # Sidebar navigasi
│   ├── lib/
│   │   ├── auth.ts           # NextAuth configuration
│   │   └── prisma.ts         # Prisma client singleton
│   ├── types/
│   │   └── next-auth.d.ts    # NextAuth type declarations
│   └── generated/
│       └── prisma/           # Generated Prisma client
├── .env                      # Environment variables
├── .env.example              # Template environment
├── next.config.ts            # Next.js config
├── prisma.config.ts          # Prisma config
├── tsconfig.json             # TypeScript config
└── package.json              # Dependencies & scripts
```

---

## Database Schema

### ERD (Entity Relationship Diagram)

```
┌──────────┐     ┌──────────────┐     ┌─────────────────┐
│   User   │     │   Category   │     │     Product     │
├──────────┤     ├──────────────┤     ├─────────────────┤
│ id       │     │ id           │     │ id              │
│ name     │     │ name         │     │ name            │
│ email    │     │ description  │     │ description     │
│ password │     │ createdAt    │     │ price           │
│ role     │     └──────┬───────┘     │ cost            │
│ createdAt│            │             │ stock           │
└────┬─────┘            │ 1:N         │ categoryId (FK) │
     │                  └────────────►│ isActive        │
     │                                │ createdAt       │
     │                                └────────┬────────┘
     │                                         │
     │ 1:N                                     │ 1:N
     │                                         │
     ▼                                         ▼
┌──────────────┐     ┌─────────────────────────────┐
│ Transaction  │     │      TransactionItem         │
├──────────────┤     ├─────────────────────────────┤
│ id           │     │ id                          │
│ transNumber  │     │ transactionId (FK)          │
│ totalAmount  │     │ productId (FK)              │
│ paymentAmount│     │ productName                 │
│ changeAmount │     │ quantity                    │
│ userId (FK)  │────►│ price                       │
│ createdAt    │ 1:N │ subtotal                    │
└──────────────┘     └─────────────────────────────┘
```

### Schema Prisma

```prisma
generator client {
  provider = "prisma-client"
  output   = "../src/generated/prisma"
}

datasource db {
  provider = "sqlite"
}

enum Role {
  ADMIN
  CASHIER
}

model User {
  id           String        @id @default(cuid())
  name         String
  email        String        @unique
  password     String
  role         Role          @default(CASHIER)
  createdAt    DateTime      @default(now())
  transactions Transaction[]
}

model Category {
  id          String    @id @default(cuid())
  name        String    @unique
  description String    @default("")
  products    Product[]
  createdAt   DateTime  @default(now())
}

model Product {
  id               String            @id @default(cuid())
  name             String
  description      String            @default("")
  price            Float
  cost             Float             @default(0)
  stock            Int               @default(0)
  categoryId       String
  category         Category          @relation(fields: [categoryId], references: [id])
  isActive         Boolean           @default(true)
  createdAt        DateTime          @default(now())
  transactionItems TransactionItem[]
}

model Transaction {
  id                String            @id @default(cuid())
  transactionNumber String            @unique
  totalAmount       Float
  paymentAmount     Float
  changeAmount      Float
  userId            String
  user              User              @relation(fields: [userId], references: [id])
  createdAt         DateTime          @default(now())
  items             TransactionItem[]
}

model TransactionItem {
  id            String      @id @default(cuid())
  transactionId String
  transaction   Transaction @relation(fields: [transactionId], references: [id], onDelete: Cascade)
  productId     String
  product       Product     @relation(fields: [productId], references: [id])
  productName   String
  quantity      Int
  price         Float
  subtotal      Float
}
```

---

## Fitur Utama & Panduan Penggunaan

### 1. Login & Pemilihan Cabang

![Login Page](public/screenshots/login.png)

Saat login, user memilih **cabang mana mereka bekerja hari ini**. Ini memastikan transaksi tercatat di cabang yang benar.

**Flow:**
1. Masukkan email dan password
2. Pilih cabang tempat bekerja
3. Klik "Masuk" → Redirect ke Dashboard

**Akun Demo:**
| Role | Email | Password |
|------|-------|----------|
| Admin | admin@elkasir.com | admin123 |
| Kasir | kasir@elkasir.com | kasir123 |

**Role:**
- **Admin**: Akses semua fitur (Cabang, Audit Log, User, dll)
- **Kasir**: Akses POS, Produk, Transaksi, Shift

---

### 2. Dashboard Analytics

![Dashboard Analytics](public/screenshots/dashboard.png)

Dashboard menampilkan ringkasan bisnis secara real-time.

**Yang ditampilkan:**
- KPI Cards: Penjualan hari ini, transaksi, penjualan bulanan, estimasi profit
- Tren Penjualan 30 Hari (area chart dengan toggle Pendapatan/Profit)
- Penjualan per Kategori (donut chart)
- Produk Terlaris (tabel dengan margin %)
- Distribusi Penjualan per Jam
- Transaksi Terbaru
- Peringatan Stok Rendah

---

### 3. Kasir / POS (Point of Sale)

![POS / Kasir](public/screenshots/pos.png)

Halaman utama untuk bertransaksi. Produk ditampilkan dalam grid, klik untuk menambah ke keranjang.

**Flow:**
1. Buka Shift terlebih dahulu (lihat fitur Shift Kasir)
2. Buka menu "Kasir / POS"
3. Cari/filter produk → Klik produk untuk tambah ke keranjang
4. Atur jumlah (+/-) di panel keranjang kanan
5. Masukkan jumlah bayar (format Rp otomatis)
6. Klik "Bayar" → Struk muncul otomatis
7. Cetak struk (format thermal 80mm)

**Fitur:** Input Rp otomatis, kalkulasi kembalian, cetak struk thermal, validasi stok

---

### 4. Manajemen Cabang (Admin Only)

**Fungsi:** Mengelola lokasi toko/outlet. Setiap cabang memiliki produk, kasir, dan data terpisah.

**Flow:**
1. Buat Cabang baru → Input nama, alamat, telepon
2. Tugaskan User ke cabang tersebut (centang user yang ditugaskan)
3. Tambah Produk per cabang
4. Kasir login dan memilih cabang tersebut

**Siapa yang bisa akses:** Hanya Admin

---

### 5. Shift Kasir

**Fungsi:** Mengatur jadwal kerja kasir dan melacak uang di laci kasir per shift.

**Tipe Shift:**
- **Shift Pagi** (06:00 - 18:00) 
- **Shift Malam** (18:00 - 06:00)

**Flow:**
1. **Buka Shift** → Pilih tipe (Pagi/Malam) → Input saldo awal (uang di laci)
2. **Bertransaksi** → Sistem otomatis menghitung total penjualan
3. **Tutup Shift** → Input uang aktual di laci → Sistem hitung selisih
4. **Laporan** → Lihat apakah uang sesuai atau ada selisih

**Catatan:** Kasir HARUS buka shift sebelum bisa bertransaksi. Satu user = satu shift aktif.

---

### 6. Supplier

**Fungsi:** Mendaftar pemasok/perusahaan yang menyediakan barang untuk toko.

**Flow:**
1. Tambah Supplier → Input nama perusahaan, kontak, alamat
2. Supplier terdaftar → Bisa dipilih saat membuat Purchase Order
3. Lihat jumlah PO per supplier di tabel

**Hubungan:** Supplier → Purchase Order → Stok Produk

---

### 7. Purchase Order (PO)

**Fungsi:** Surat pesanan resmi ke supplier untuk membeli barang. Data produk dan supplier diambil dari yang sudah terdaftar.

**Flow Lengkap:**
1. **Buat PO (Draft)** → Pilih Supplier → Tambah item produk yang ingin dipesan → Input jumlah & harga modal
2. **Kirim ke Supplier (Sent)** → Klik "Kirim" pada PO yang sudah dibuat
3. **Barang Datang (Received)** → Klik "Terima" → Konfirmasi → **Stok produk otomatis bertambah**
4. **Batal (Cancelled)** → Jika PO dibatalkan

**Status PO:**
| Status | Keterangan |
|--------|-----------|
| Draft | PO baru dibuat, belum dikirim |
| Sent | PO sudah dikirim ke supplier |
| Received | Barang sudah diterima, stok bertambah |
| Cancelled | PO dibatalkan |

---

### 8. Customer & Loyalty

**Fungsi:** Mendaftar pelanggan dan mengelola program loyalty/poin.

**Flow:**
1. Tambah Customer → Input nama, telepon, email
2. Customer terdaftar → Bisa dipilih saat checkout di POS
3. Setiap transaksi → Poin otomatis bertambah (sesuai Loyalty Rule)
4. Lihat total belanja dan poin per customer

**Loyalty Rule:** 1 poin per Rp 10.000 belanja (bisa dikonfigurasi)

---

### 9. Manajemen Produk (Admin Only)

![Manajemen Produk](public/screenshots/products.png)

**Flow:**
1. Buat Kategori dulu (Makanan, Minuman, dll)
2. Tambah Produk → Input nama, harga jual, harga modal, stok, kategori
3. Produk aktif → Muncul di POS untuk dijual
4. Stok berkurang otomatis saat ada transaksi
5. Stok bertambah otomatis saat PO diterima

---

### 10. Riwayat Transaksi

![Riwayat Transaksi](public/screenshots/transactions.png)

Daftar semua transaksi yang pernah terjadi dengan filter tanggal.

**Fitur:** Filter tanggal, detail per transaksi (item, kasir, jumlah), nomor transaksi unik

---

### 11. Laporan Penjualan

![Laporan Penjualan](public/screenshots/reports.png)

**Fitur:**
- Filter rentang tanggal
- Ringkasan: Total Pendapatan, Transaksi, Modal, Keuntungan
- Detail per transaksi
- Keuntungan dihitung otomatis (Pendapatan - Modal)

---

### 12. Audit Log (Admin Only)

**Fungsi:** Mencatat SEMUA aktivitas penting di sistem secara otomatis: siapa, apa, kapan, dari IP mana.

**Contoh yang tercatat:**
- Admin menambah/mengedit/menghapus produk, cabang, user
- PO dibuat, dikirim, diterima
- Login berhasil/gagal

**Kegunaan:** Keamanan, pelacakan perubahan, investigasi masalah

**Fitur:** Filter berdasarkan entity (Produk, User, dll) dan aksi (Create, Update, Delete), pagination

---

### 13. Manajemen User (Admin Only)

**Fitur:** CRUD user, role assignment (Admin/Kasir), password complexity (min 8 char, kapital, angka, spesial)

---

## Panduan Penggunaan

### Akun Demo

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@elkasir.com | admin123 |
| Kasir | kasir@elkasir.com | kasir123 |

### Alur Kerja Kasir

1. **Login** → Masuk dengan akun kasir
2. **Buka POS** → Klik menu "Kasir / POS"
3. **Tambah Produk** → Klik produk untuk menambahkan ke keranjang
4. **Atur Jumlah** → Gunakan tombol +/- untuk mengubah kuantitas
5. **Bayar** → Masukkan jumlah bayar (format otomatis Rp)
6. **Checkout** → Klik tombol "Bayar"
7. **Cetak Struk** → Struk otomatis muncul, bisa dicetak

### Alur Kerja Admin

1. **Login** → Masuk dengan akun admin
2. **Setup Kategori** → Menu "Kategori" → Tambah kategori produk
3. **Tambah Produk** → Menu "Produk" → Input nama, harga, stok, kategori
4. **Monitor Dashboard** → Lihat ringkasan penjualan dan produk terlaris
5. **Cek Laporan** → Menu "Laporan" → Filter tanggal → Lihat keuntungan
6. **Kelola User** → Menu "Pengguna" → Tambah/edit/hapus kasir

---

## Deployment ke Vercel

### Catatan Penting

> ⚠️ **SQLite tidak bisa digunakan langsung di Vercel** karena environment serverless.
> Untuk production, ganti dengan **Turso** (cloud SQLite) atau database lain.

### Opsi 1: Menggunakan Turso (Cloud SQLite)

1. Daftar akun di [turso.tech](https://turso.tech)
2. Buat database baru:
   ```bash
   turso db create el-kasir
   turso db show el-kasir --url
   turso db tokens create el-kasir
   ```
3. Update `.env`:
   ```env
   DATABASE_URL="libsql://your-db-url"
   TURSO_TOKEN="your-token"
   ```
4. Install adapter Turso:
   ```bash
   npm install @prisma/adapter-libsql @libsql/client
   ```
5. Update `src/lib/prisma.ts` untuk menggunakan Turso adapter

### Opsi 2: Menggunakan Vercel Postgres

1. Aktifkan Vercel Postgres di dashboard Vercel
2. Install: `npm install @prisma/adapter-pg pg`
3. Update schema provider ke `postgresql`
4. Migrasi ulang

### Langkah Deploy

```bash
# Install Vercel CLI
npm install -g vercel

# Login ke Vercel
vercel login

# Deploy
vercel --prod
```

### Environment Variables di Vercel

Set di dashboard Vercel → Settings → Environment Variables:
- `DATABASE_URL`
- `NEXTAUTH_SECRET`
- `NEXTAUTH_URL` (URL production)

---

## Troubleshooting

### Error: "Cannot find module '@/generated/prisma'"

```bash
npx prisma generate
```

### Error: "Table does not exist"

```bash
npx prisma migrate dev --name init
npx prisma db seed
```

### Error: "PrismaClient needs adapter"

Pastikan `src/lib/prisma.ts` menggunakan adapter:
```typescript
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3"
const adapter = new PrismaBetterSqlite3({ url: `file:${dbPath}` })
const prisma = new PrismaClient({ adapter })
```

### Error: PowerShell Execution Policy

```powershell
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
```

### Port 3000 Already in Use

```bash
npm run dev -- -p 3001
```

### Build Error saat Production

```bash
# Bersihkan cache dan rebuild
rm -rf .next node_modules
npm install
npx prisma generate
npm run build
```

---

## Scripts yang Tersedia

```bash
npm run dev       # Development server (localhost:3000)
npm run build     # Production build
npm run start     # Jalankan production server
npm run lint      # Jalankan ESLint

# Prisma commands
npx prisma studio           # Buka database GUI
npx prisma migrate dev      # Jalankan migrasi
npx prisma generate         # Generate Prisma client
npx prisma db seed          # Seed database
npx prisma db push          # Push schema ke database
```

---

## Lisensi

Proyek ini dibuat untuk keperluan pembelajaran dan bisa digunakan secara bebas.
