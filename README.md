# El-Kasir — Sistem Kasir Multi-Cabang

Sistem Point of Sale (POS) berbasis web yang dibangun dengan Next.js, TypeScript, Prisma ORM, dan PostgreSQL (Supabase). Dirancang untuk bisnis dengan satu atau lebih outlet/cabang.

---

## Screenshots

| Login | Dashboard |
|-------|-----------|
| ![Login](public/screenshots/login.png) | ![Dashboard](public/screenshots/dashboard.png) |

| POS / Kasir | Manajemen Produk |
|-------------|-----------------|
| ![POS](public/screenshots/pos.png) | ![Produk](public/screenshots/products.png) |

| Transaksi | Laporan |
|-----------|---------|
| ![Transaksi](public/screenshots/transactions.png) | ![Laporan](public/screenshots/reports.png) |

---

## Tech Stack

| Teknologi | Versi | Fungsi |
|-----------|-------|--------|
| **Next.js** | 16.x | Framework full-stack (App Router + Turbopack) |
| **TypeScript** | 5.x | Type-safety |
| **React** | 19.x | UI library |
| **Tailwind CSS** | 4.x | Styling utility-first |
| **Prisma ORM** | 7.x | Database ORM dengan PostgreSQL adapter |
| **PostgreSQL** | - | Database via Supabase |
| **NextAuth.js** | 4.x | Autentikasi JWT credentials-based |
| **Recharts** | 3.x | Chart & analytics |
| **Lucide React** | 1.x | Icon library |
| **bcryptjs** | 3.x | Password hashing |
| **ioredis** | 5.x | Redis untuk rate limiting & caching |
| **AWS S3 SDK** | 3.x | Upload gambar produk |

---

## Fitur

### Role & Hak Akses

| Fitur | Admin | Kasir |
|-------|:-----:|:-----:|
| Dashboard Analytics | ✅ Semua cabang | ✅ Data sendiri |
| Kasir / POS | ✅ | ✅ |
| Transaksi | ✅ Semua | ✅ Milik sendiri |
| Customer | ✅ Semua cabang | ✅ Cabang sendiri |
| Laporan | ✅ Semua | ✅ Data sendiri |
| Produk & Kategori | ✅ | ❌ |
| Supplier | ✅ | ❌ |
| Bahan Baku | ✅ | ❌ |
| Purchase Order | ✅ | ❌ |
| Cabang | ✅ | ❌ |
| Pengguna | ✅ | ❌ |
| Audit Log | ✅ | ❌ |

### Fitur Per Modul

**Dashboard**
- KPI: penjualan hari ini vs kemarin, transaksi, revenue bulanan, estimasi profit
- Area chart tren 30 hari (toggle Pendapatan / Profit)
- Donut chart penjualan per kategori
- Tabel produk terlaris dengan margin %
- Bar chart distribusi penjualan per jam
- Transaksi terbaru
- Alert stok rendah
- Kasir: menampilkan badge nama & cabang tempat bertugas

**POS / Kasir**
- Grid produk dengan filter kategori & pencarian
- Keranjang belanja dengan update jumlah realtime
- Pilih customer (opsional) — poin loyalty otomatis bertambah
- Input nominal bayar dengan format Rupiah otomatis
- Kalkulasi kembalian otomatis
- Struk digital dengan nama cabang & nama customer
- Cetak struk thermal (window.print)

**Transaksi**
- Riwayat transaksi dengan filter rentang tanggal
- Kasir hanya lihat transaksinya sendiri
- Admin lihat semua transaksi
- Modal detail transaksi: item, customer, kasir, kembalian

**Laporan**
- Filter rentang tanggal
- Summary: pendapatan, jumlah transaksi, modal, keuntungan bersih
- Tabel detail per transaksi dengan kolom customer & kasir
- Kasir hanya laporan dirinya sendiri

**Customer & Loyalty**
- CRUD customer
- Kasir hanya lihat customer di cabangnya
- Admin: lihat semua, bisa hapus
- Poin otomatis bertambah saat checkout POS
- Total belanja terakumulasi

**Produk**
- CRUD produk dengan kategori
- Harga jual + harga modal (untuk kalkulasi profit)
- Manajemen stok — berkurang otomatis saat transaksi
- Filter aktif/nonaktif, kategori, pencarian

**Supplier**
- CRUD supplier dengan kontak lengkap
- **Assign bahan baku per supplier** — setiap supplier punya daftar bahan baku + harga khusus
- Expand/collapse untuk lihat daftar bahan baku per supplier

**Bahan Baku**
- CRUD bahan baku dengan satuan, stok, harga per unit, stok minimum
- Stok bertambah otomatis saat PO status RECEIVED

**Purchase Order**
- Buat PO → pilih supplier → **hanya bahan baku milik supplier itu yang tampil**
- Harga otomatis ter-fill dari harga supplier
- Flow status: Draft → Sent → Received / Cancelled
- Terima barang → stok bahan baku otomatis bertambah
- Nomor PO unik otomatis (PO202506-0001)

**Pengguna**
- CRUD user dengan role (Admin / Kasir)
- **1 user = 1 cabang** — cabang wajib dipilih saat tambah/edit user
- Summary assignment cabang di atas tabel
- Alert "belum ditugaskan" jika user tanpa cabang

**Cabang**
- CRUD cabang
- Statistik: jumlah user, produk, transaksi per cabang

**Audit Log**
- Semua aktivitas CRUD tercatat otomatis
- Filter berdasarkan entity & aksi
- Pagination

---

## Database Schema

```
Branch ─────────────────────────── banyak User
Branch ─────────────────────────── banyak Product
Branch ─────────────────────────── banyak Transaction
Branch ─────────────────────────── banyak Customer
Branch ─────────────────────────── banyak Supplier
Branch ─────────────────────────── banyak RawMaterial
Branch ─────────────────────────── banyak PurchaseOrder

User ───────────────────────────── banyak Transaction
User ───────────────────────────── banyak PurchaseOrder

Category ───────────────────────── banyak Product
Product ────────────────────────── banyak TransactionItem
Product ────────────────────────── banyak PurchaseOrderItem (opsional)

Transaction ────────────────────── banyak TransactionItem
Transaction ─── optional ──────── Customer

Supplier ───────────────────────── banyak PurchaseOrder
Supplier ── via SupplierMaterial ─ banyak RawMaterial
RawMaterial ── via SupplierMaterial ─ banyak Supplier
RawMaterial ────────────────────── banyak PurchaseOrderItem

SupplierMaterial (join table)
  - supplierId + rawMaterialId (unique)
  - pricePerUnit (harga khusus dari supplier ini)
```

---

## Instalasi

### Prasyarat

- Node.js >= 18.x
- npm >= 9.x
- Akun [Supabase](https://supabase.com) (PostgreSQL)

### 1. Clone & Install

```bash
git clone <repo-url>
cd el-kasir
npm install
```

### 2. Environment Variables

Buat file `.env` dari template:

```bash
cp .env.example .env
```

Isi variabel berikut:

```env
# PostgreSQL — gunakan Transaction Pooler (port 6543) untuk runtime
DATABASE_URL="postgresql://postgres.[ref]:[pass]@aws-1-ap-southeast-2.pooler.supabase.com:6543/postgres"

# PostgreSQL — gunakan Direct Connection (port 5432) untuk migrasi
DIRECT_URL="postgresql://postgres.[ref]:[pass]@aws-1-ap-southeast-2.pooler.supabase.com:5432/postgres"

# NextAuth
NEXTAUTH_SECRET="generate-random-string-32-chars"
NEXTAUTH_URL="http://localhost:3000"

# AWS S3 (opsional, untuk upload gambar)
AWS_ACCESS_KEY_ID=""
AWS_SECRET_ACCESS_KEY=""
AWS_REGION=""
AWS_BUCKET_NAME=""

# Redis (opsional, untuk rate limiting)
REDIS_URL=""
```

> Generate NEXTAUTH_SECRET:
> ```bash
> node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
> ```

### 3. Setup Database

```bash
# Push schema ke database
npx prisma db push

# Generate Prisma client
npx prisma generate

# Seed data awal
npx prisma db seed
```

### 4. Jalankan

```bash
npm run dev
```

Buka `http://localhost:3000`

---

## Akun Demo (setelah seed)

| Role | Email | Password | Cabang |
|------|-------|----------|--------|
| Admin | admin@elkasir.com | admin123 | Cabang Utama |
| Kasir | kasir1@elkasir.com | kasir123 | Cabang Utama |
| Kasir | kasir2@elkasir.com | kasir123 | Cabang Bandung |
| Kasir | kasir3@elkasir.com | kasir123 | Cabang Surabaya |

---

## Data Seed

Setelah menjalankan `npx prisma db seed`:

| Data | Jumlah | Keterangan |
|------|--------|-----------|
| Cabang | 3 | Utama (Jakarta), Bandung, Surabaya |
| Pengguna | 5 | 1 Admin + 4 Kasir (masing-masing di cabang berbeda) |
| Kategori | 6 | Makanan Berat, Makanan Ringan, Minuman, Kopi & Teh, Dessert, Paket Hemat |
| Produk | 25 | Lengkap dengan harga jual, modal, dan stok awal |
| Bahan Baku | 25 | Dengan satuan, stok, harga, dan stok minimum |
| Supplier | 7 | Masing-masing dengan daftar bahan baku yang disediakan |
| Customer | 10 | Dengan data poin dan total belanja |

---

## Struktur Proyek

```
el-kasir/
├── prisma/
│   ├── schema.prisma          # Schema database (PostgreSQL)
│   ├── seed.ts                # Seed data lengkap
│   └── migrations/            # Riwayat migrasi
├── public/
│   ├── logo.svg
│   └── screenshots/           # Screenshot untuk README
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── auth/[...nextauth]/    # NextAuth handler
│   │   │   ├── audit/                 # Audit log
│   │   │   ├── branches/              # CRUD cabang
│   │   │   ├── categories/            # CRUD kategori
│   │   │   ├── customers/             # CRUD customer (scoped)
│   │   │   ├── products/              # CRUD produk
│   │   │   ├── purchase-orders/       # Purchase Order + supplier materials
│   │   │   ├── raw-materials/         # CRUD bahan baku
│   │   │   ├── realtime/              # SSE real-time events
│   │   │   ├── reports/               # Dashboard & laporan (scoped)
│   │   │   ├── suppliers/             # CRUD supplier + SupplierMaterial
│   │   │   ├── transactions/          # CRUD transaksi (scoped)
│   │   │   ├── upload/                # Upload ke S3
│   │   │   └── users/                 # CRUD user dengan cabang
│   │   ├── dashboard/
│   │   │   ├── audit/                 # Audit log UI
│   │   │   ├── branches/              # Manajemen cabang
│   │   │   ├── categories/            # Manajemen kategori
│   │   │   ├── customers/             # Manajemen customer
│   │   │   ├── pos/                   # POS dengan customer picker
│   │   │   ├── products/              # Manajemen produk
│   │   │   ├── purchase-orders/       # Purchase Order UI
│   │   │   ├── raw-materials/         # Manajemen bahan baku
│   │   │   ├── reports/               # Laporan UI (scoped)
│   │   │   ├── suppliers/             # Supplier UI + bahan baku
│   │   │   ├── transactions/          # Riwayat transaksi (scoped)
│   │   │   ├── users/                 # Manajemen user + cabang
│   │   │   ├── layout.tsx
│   │   │   └── page.tsx               # Dashboard utama
│   │   ├── login/
│   │   ├── layout.tsx
│   │   └── page.tsx
│   ├── components/
│   │   ├── Logo.tsx
│   │   ├── Providers.tsx
│   │   └── Sidebar.tsx               # Navigasi dinamis per role + badge cabang
│   ├── lib/
│   │   ├── api-client.ts             # apiFetch + getSearchParams (fix Turbopack)
│   │   ├── audit.ts                  # Audit log helper
│   │   ├── auth.ts                   # NextAuth config (JWT + branchId/branchName)
│   │   ├── cache.ts                  # Redis cache helper
│   │   ├── events.ts                 # SSE event emitter
│   │   ├── pagination.ts             # Pagination helper
│   │   ├── prisma.ts                 # Prisma singleton dengan PrismaPg adapter
│   │   ├── rate-limit.ts             # Rate limiting
│   │   ├── redis.ts                  # Redis client
│   │   ├── storage.ts                # AWS S3 storage
│   │   └── validate.ts               # Input sanitization & validation
│   ├── types/
│   │   └── next-auth.d.ts            # Extended JWT: id, role, branchId, branchName
│   ├── generated/
│   │   └── prisma/                   # Generated Prisma client
│   └── middleware.ts                 # Auth guard + role-based redirect
├── .env                              # Environment variables
├── .env.example                      # Template
├── next.config.ts
├── prisma.config.ts                  # Prisma config (DIRECT_URL untuk migrasi)
├── package.json
└── tsconfig.json
```

---

## Middleware & Keamanan

`src/middleware.ts` menangani:

- Redirect ke `/login` jika belum autentikasi
- Redirect ke `/dashboard` jika sudah login dan akses `/login`
- Proteksi halaman admin-only: `/dashboard/users`, `/dashboard/branches`, `/dashboard/audit`
- Proteksi halaman kasir-restricted: `/dashboard/products`, `/dashboard/categories`, `/dashboard/suppliers`, `/dashboard/raw-materials`, `/dashboard/purchase-orders`
- Redirect `/dashboard/shifts` ke `/dashboard` (fitur shift sudah dihapus)

---

## Alur Kerja

### Kasir Harian

```
Login → Dashboard (lihat info cabang & ringkasan sendiri)
     → POS: pilih produk → pilih customer (opsional) → bayar → struk
     → Transaksi: lihat riwayat transaksi sendiri
     → Customer: tambah/edit customer di cabang sendiri
     → Laporan: lihat laporan penjualan sendiri
```

### Admin Harian

```
Login → Dashboard (lihat semua cabang)
     → Produk: tambah/edit produk + stok
     → Supplier: tambah supplier + assign bahan baku yang disediakan
     → Bahan Baku: lihat & kelola stok bahan baku
     → Purchase Order: buat PO → pilih supplier → pesan bahan baku → terima → stok bertambah
     → Customer: lihat semua customer semua cabang
     → Pengguna: tambah kasir, assign ke cabang
     → Laporan: lihat laporan semua kasir
     → Audit Log: monitor semua aktivitas
```

### Alur Purchase Order

```
1. Supplier dibuat → assign bahan baku yang disediakan + harga per unit
2. Buat PO → pilih supplier → hanya bahan baku supplier itu yang muncul
3. Harga otomatis ter-fill dari harga supplier
4. PO Draft → Kirim → Terima Barang → Stok Bahan Baku +
```

---

## Commands

```bash
# Development
npm run dev               # Jalankan dev server (localhost:3000)
npm run build             # Build production
npm run start             # Jalankan production server
npm run lint              # ESLint

# Database
npx prisma db push        # Sync schema ke database
npx prisma generate       # Generate Prisma client
npx prisma db seed        # Jalankan seed
npx prisma studio         # Buka GUI database
npx prisma migrate dev    # Buat migration baru (butuh DIRECT_URL)
```

---

## Deployment

### Vercel + Supabase (Recommended)

1. Push ke GitHub
2. Buat project di [Vercel](https://vercel.com)
3. Connect repo GitHub
4. Set environment variables di Vercel Dashboard:
   - `DATABASE_URL` (pooler URL port 6543)
   - `DIRECT_URL` (direct URL port 5432)
   - `NEXTAUTH_SECRET`
   - `NEXTAUTH_URL` (URL production)
5. Deploy

> **Catatan:** `DIRECT_URL` dipakai `prisma.config.ts` untuk migrasi, sedangkan `DATABASE_URL` (pooler) dipakai runtime. Ini diperlukan karena Supabase Transaction Pooler tidak support prepared statements yang dibutuhkan Prisma migrasi.

---

## Troubleshooting

### HTTP 500 di API

Tambahkan `console.error` di route untuk lihat error detail di terminal dev server. Error umum:

- **Prisma client outdated** → `npx prisma generate`
- **Tabel belum ada** → `npx prisma db push`
- **`new URL()` error (Turbopack)** → Sudah di-fix dengan helper `getSearchParams()` di `lib/api-client.ts`

### Error "Invalid URL" (Turbopack)

Sudah di-fix. Semua API route menggunakan:
```typescript
import { getSearchParams } from "@/lib/api-client"
const searchParams = getSearchParams(request.url)
```

### Session tidak ada `branchId` / `branchName`

Pastikan user sudah di-assign ke cabang. Login ulang setelah assign cabang di `/dashboard/users`.

### `npx prisma migrate dev` gagal

Pastikan `DIRECT_URL` di `.env` menggunakan port 5432 (Direct Connection), bukan port 6543 (Pooler).

### Seed ulang setelah reset database

```bash
npx prisma db push --force-reset
npx prisma generate
npx prisma db seed
```

---

## Catatan Perubahan (Changelog)

### Revisi Besar (Terbaru)

**Hapus fitur Shift**
- Halaman `/dashboard/shifts` dihapus, redirect ke dashboard
- API `/api/shifts` mengembalikan 410 Gone
- Middleware memblokir akses ke route shifts

**Scoping data per user (Kasir)**
- `GET /api/transactions` — kasir hanya lihat transaksinya sendiri
- `GET /api/reports` — dashboard & laporan kasir hanya data diri sendiri
- `GET /api/customers` — kasir hanya lihat customer di cabangnya

**Branch info di session**
- JWT menyimpan `branchId` dan `branchName`
- Sidebar menampilkan badge cabang
- Header menampilkan cabang aktif
- Dashboard kasir menampilkan info nama & cabang

**Sidebar dinamis per role**
- Admin: semua menu
- Kasir: Dashboard, POS, Transaksi Saya, Customer, Laporan Saya

**1 User = 1 Cabang**
- Form tambah/edit user wajib pilih cabang
- API validasi: cabang harus ada & aktif
- Tabel user menampilkan kolom cabang dengan badge
- Summary assignment per cabang di atas tabel

**POS dengan Customer Picker**
- Dropdown search customer saat checkout
- Customer terpilih tampil di struk
- Poin loyalty otomatis bertambah saat checkout

**Supplier + Bahan Baku (SupplierMaterial)**
- Tabel baru `SupplierMaterial` — relasi many-to-many Supplier ↔ RawMaterial
- Field `pricePerUnit` — harga khusus supplier untuk bahan baku tertentu
- Form supplier: tambah bahan baku yang disediakan + harga
- PO: saat pilih supplier, hanya bahan baku milik supplier yang tampil
- Harga otomatis ter-fill dari harga supplier

**Fix PO Number Generation**
- Ganti `count()` dengan `findFirst + sort desc` untuk menghindari duplikat nomor PO

**Fix `Failed to construct 'URL'` (Turbopack)**
- Fungsi `getSearchParams()` di `lib/api-client.ts` dengan fallback parsing manual
- Semua 11 API route sudah diupdate

**Data Seed Lengkap**
- 3 cabang, 5 user, 6 kategori, 25 produk, 25 bahan baku, 7 supplier, 10 customer
- Setiap supplier memiliki daftar bahan baku dengan harga khusus
