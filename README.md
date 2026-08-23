# El-Kasir — Sistem Kasir Multi-Cabang

Sistem Point of Sale (POS) berbasis web yang dibangun dengan Next.js, TypeScript, dan Prisma ORM dengan database **SQLite lokal** (`dev.db`). Berjalan 100% offline tanpa server database eksternal. Dirancang untuk bisnis dengan satu atau lebih outlet/cabang, dengan pemisahan data dan akses per peran pengguna.

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
| **Prisma ORM** | 7.x | Database ORM dengan driver adapter `@prisma/adapter-better-sqlite3` |
| **SQLite** | — | Database lokal dalam satu file (`dev.db`), tanpa server |
| **NextAuth.js** | 4.x | Autentikasi JWT credentials-based |
| **Recharts** | 3.x | Chart & analytics |
| **Lucide React** | 1.x | Icon library |
| **bcryptjs** | 3.x | Password hashing |
| **ioredis** | 5.x | Redis untuk rate limiting & caching (opsional) |

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
- Transaksi terbaru & alert stok rendah
- Kasir: badge nama dan cabang tempat bertugas, data hanya miliknya sendiri

**POS / Kasir**
- Grid produk dengan filter kategori & pencarian
- Keranjang belanja dengan update jumlah realtime
- Pilih customer (opsional) — poin loyalty otomatis bertambah saat checkout
- Input nominal bayar dengan format Rupiah otomatis
- Kalkulasi kembalian otomatis
- Struk digital memuat nama cabang & nama customer
- Cetak struk thermal

**Transaksi**
- Riwayat transaksi dengan filter rentang tanggal
- Kasir hanya melihat transaksinya sendiri, admin melihat semua
- Detail transaksi: daftar item, customer, kasir, dan kembalian

**Laporan**
- Filter rentang tanggal
- Ringkasan: pendapatan, jumlah transaksi, modal, keuntungan bersih
- Tabel detail per transaksi dengan kolom customer
- Kasir hanya melihat laporan dari transaksinya sendiri

**Customer & Loyalty**
- CRUD customer
- Kasir hanya melihat customer di cabangnya, admin melihat semua
- Poin bertambah otomatis saat checkout di POS
- Total belanja terakumulasi per customer

**Produk**
- CRUD produk dengan kategori
- Harga jual + harga modal (untuk kalkulasi profit di laporan)
- Stok berkurang otomatis saat ada transaksi
- Filter berdasarkan status aktif, kategori, dan pencarian nama

**Supplier**
- CRUD supplier dengan informasi kontak lengkap
- Setiap supplier memiliki daftar bahan baku yang disediakan beserta harga khusus
- Tampilan expand/collapse untuk melihat bahan baku per supplier

**Bahan Baku**
- CRUD bahan baku dengan satuan, stok saat ini, harga per unit, dan stok minimum
- Stok bertambah otomatis saat Purchase Order berstatus Received

**Purchase Order**
- Buat PO dengan memilih supplier — hanya bahan baku dari supplier tersebut yang ditampilkan
- Harga per unit otomatis ter-isi dari harga khusus supplier
- Alur status: Draft → Dikirim ke Supplier → Diterima / Dibatalkan
- Saat status Diterima, stok bahan baku bertambah otomatis
- Nomor PO unik dibuat otomatis (format: PO202506-0001)

**Pengguna**
- CRUD pengguna dengan role Admin atau Kasir
- Satu pengguna hanya boleh ditugaskan ke satu cabang
- Ringkasan jumlah pengguna per cabang ditampilkan di halaman pengguna

**Cabang**
- CRUD cabang dengan alamat dan nomor telepon
- Statistik jumlah pengguna, produk, dan transaksi per cabang

**Audit Log**
- Semua aktivitas CRUD tercatat otomatis
- Filter berdasarkan jenis entitas dan aksi
- Tampilan dengan pagination

---

## Database Schema

### Model & Relasi

```
Branch ──────────────── User (banyak)
Branch ──────────────── Product (banyak)
Branch ──────────────── Transaction (banyak)
Branch ──────────────── Customer (banyak)
Branch ──────────────── Supplier (banyak)
Branch ──────────────── RawMaterial (banyak)
Branch ──────────────── PurchaseOrder (banyak)

User ────────────────── Transaction (banyak)
User ────────────────── PurchaseOrder (banyak)

Category ────────────── Product (banyak)

Product ─────────────── TransactionItem (banyak)

Transaction ─────────── TransactionItem (banyak)
Transaction ──(opsional) Customer

Supplier ────────────── PurchaseOrder (banyak)
Supplier ── SupplierMaterial ── RawMaterial  (many-to-many)

RawMaterial ─────────── PurchaseOrderItem (banyak)
```

### Tabel Utama

| Model | Keterangan |
|-------|-----------|
| `Branch` | Data cabang/outlet |
| `User` | Pengguna sistem (Admin / Kasir), wajib punya cabang |
| `Category` | Kategori produk |
| `Product` | Produk dengan harga jual, harga modal, dan stok |
| `Transaction` | Transaksi penjualan |
| `TransactionItem` | Item dalam satu transaksi |
| `Customer` | Data pelanggan dengan poin dan total belanja |
| `Supplier` | Data pemasok bahan baku |
| `SupplierMaterial` | Relasi Supplier ↔ RawMaterial, menyimpan harga khusus per supplier |
| `RawMaterial` | Bahan baku dengan stok dan harga per satuan |
| `PurchaseOrder` | Surat pesanan ke supplier |
| `PurchaseOrderItem` | Item dalam satu PO |
| `LoyaltyRule` | Konfigurasi program poin pelanggan |
| `AuditLog` | Catatan aktivitas sistem |

---

## Instalasi

### Prasyarat

- Node.js >= 18.x
- npm >= 9.x

> Tidak perlu install atau setup server database apapun — SQLite berjalan langsung dari file lokal.

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
# Database SQLite lokal (file dibuat otomatis oleh Prisma)
DATABASE_URL="file:./dev.db"

# NextAuth
NEXTAUTH_SECRET="isi-dengan-random-string-minimal-32-karakter"
NEXTAUTH_URL="http://localhost:3000"

# Redis (opsional, untuk rate limiting)
REDIS_URL=""
```

> Generate `NEXTAUTH_SECRET`:
> ```bash
> node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
> ```

### 3. Setup Database

```bash
# Generate Prisma client
npx prisma generate

# Sync schema ke file dev.db (dibuat otomatis)
npx prisma db push

# Isi data awal
npx prisma db seed
```

### 4. Jalankan

```bash
npm run dev
```

Buka `http://localhost:3000`

---

## Akun Demo

Tersedia setelah menjalankan `npx prisma db seed`:

| Role | Email | Password | Cabang |
|------|-------|----------|--------|
| Admin | admin@elkasir.com | admin123 | Cabang Utama |
| Kasir | kasir1@elkasir.com | kasir123 | Cabang Utama |
| Kasir | kasir2@elkasir.com | kasir123 | Cabang Bandung |
| Kasir | kasir3@elkasir.com | kasir123 | Cabang Surabaya |

---

## Data Seed

| Data | Jumlah | Keterangan |
|------|--------|-----------|
| Cabang | 3 | Utama (Jakarta), Bandung, Surabaya |
| Pengguna | 5 | 1 Admin + 4 Kasir di cabang berbeda |
| Kategori | 6 | Makanan Berat, Makanan Ringan, Minuman, Kopi & Teh, Dessert, Paket Hemat |
| Produk | 25 | Lengkap dengan harga jual, harga modal, dan stok awal |
| Bahan Baku | 25 | Dengan satuan, stok, harga per unit, dan stok minimum |
| Supplier | 7 | Masing-masing dengan daftar bahan baku dan harga khusus |
| Customer | 10 | Dengan data poin dan riwayat total belanja |

Contoh supplier dan bahan baku yang tersedia:

| Supplier | Bahan Baku yang Disediakan |
|----------|--------------------------|
| PT Sumber Pangan Sejahtera | Beras, minyak goreng, tepung, gula, garam, kecap, saus |
| UD Maju Ternak | Ayam potong, telur, daging sapi |
| CV Dairy Nusantara | Susu, keju mozzarella, mentega |
| Toko Kopi Nusantara | Kopi robusta, kopi arabika, matcha, coklat, gula aren |
| Pasar Buah Segar | Pisang, mangga, alpukat, kelapa muda, kentang |
| Toko Bumbu Dapur Ibu | Santan, bumbu dapur, minyak |
| Distributor Minuman Prima | Air mineral galon, susu |

---

## Struktur Proyek

```
el-kasir/
├── prisma/
│   ├── schema.prisma          # Schema database SQLite
│   └── seed.ts                # Data awal lengkap
├── public/
│   ├── logo.svg
│   └── screenshots/
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── auth/[...nextauth]/    # Autentikasi NextAuth
│   │   │   ├── audit/                 # Audit log
│   │   │   ├── branches/              # Manajemen cabang
│   │   │   ├── categories/            # Manajemen kategori
│   │   │   ├── customers/             # Customer (scoped per cabang/user)
│   │   │   ├── products/              # Manajemen produk
│   │   │   ├── purchase-orders/       # Purchase Order & bahan baku supplier
│   │   │   ├── raw-materials/         # Manajemen bahan baku
│   │   │   ├── realtime/              # Server-Sent Events
│   │   │   ├── reports/               # Laporan & dashboard (scoped per user)
│   │   │   ├── suppliers/             # Supplier & SupplierMaterial
│   │   │   ├── transactions/          # Transaksi (scoped per user)
│   │   │   ├── upload/                # Upload gambar lokal (public/uploads)
│   │   │   └── users/                 # Manajemen pengguna
│   │   ├── dashboard/
│   │   │   ├── audit/
│   │   │   ├── branches/
│   │   │   ├── categories/
│   │   │   ├── customers/
│   │   │   ├── pos/                   # Kasir / POS
│   │   │   ├── products/
│   │   │   ├── purchase-orders/
│   │   │   ├── raw-materials/
│   │   │   ├── reports/
│   │   │   ├── suppliers/
│   │   │   ├── transactions/
│   │   │   ├── users/
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
│   │   ├── api-client.ts             # Helper fetch & URL parsing
│   │   ├── audit.ts                  # Audit log helper
│   │   ├── auth.ts                   # NextAuth config (JWT dengan branchId/branchName)
│   │   ├── cache.ts                  # Redis cache
│   │   ├── events.ts                 # SSE event emitter
│   │   ├── pagination.ts             # Helper pagination
│   │   ├── prisma.ts                 # Prisma client singleton
│   │   ├── rate-limit.ts             # Rate limiting
│   │   ├── redis.ts                  # Redis client
│   │   ├── storage.ts                # AWS S3 helper
│   │   └── validate.ts               # Sanitisasi & validasi input
│   ├── types/
│   │   └── next-auth.d.ts            # Deklarasi tipe: id, role, branchId, branchName
│   ├── generated/
│   │   └── prisma/                   # Prisma client hasil generate
│   └── middleware.ts                 # Guard autentikasi & kontrol akses berbasis role
├── .env                              # Environment variables (tidak di-commit)
├── dev.db                            # File database SQLite lokal
├── next.config.ts                    # Konfigurasi Next.js
├── prisma.config.ts                  # Konfigurasi Prisma (DATABASE_URL untuk migrasi)
├── package.json
└── tsconfig.json
```

---

## Kontrol Akses

`src/middleware.ts` menangani:

- Redirect ke `/login` jika belum autentikasi
- Redirect ke `/dashboard` jika sudah login dan mencoba akses `/login`
- Proteksi halaman admin-only: `/dashboard/users`, `/dashboard/branches`, `/dashboard/audit`
- Pembatasan akses kasir: `/dashboard/products`, `/dashboard/categories`, `/dashboard/suppliers`, `/dashboard/raw-materials`, `/dashboard/purchase-orders`

---

## Alur Kerja

### Kasir

```
Login → Dashboard (ringkasan data sendiri + badge cabang)
     → POS: pilih produk → pilih customer → bayar → cetak struk
     → Transaksi: riwayat transaksi sendiri
     → Customer: kelola customer di cabang sendiri
     → Laporan: laporan penjualan sendiri
```

### Admin

```
Login → Dashboard (ringkasan semua cabang)
     → Cabang: kelola outlet
     → Pengguna: tambah kasir, assign ke cabang
     → Produk & Kategori: kelola katalog produk
     → Supplier: tambah supplier + daftar bahan baku yang disediakan
     → Bahan Baku: pantau stok bahan baku
     → Purchase Order: pesan bahan baku dari supplier → terima → stok bertambah
     → Customer: lihat semua customer lintas cabang
     → Laporan: laporan penjualan semua kasir
     → Audit Log: pantau seluruh aktivitas sistem
```

### Alur Purchase Order

```
1. Buat data Supplier → tambahkan bahan baku yang disediakan + harga
2. Buat PO → pilih Supplier → hanya bahan baku supplier itu yang muncul
3. Harga otomatis ter-isi dari data supplier
4. PO dibuat (Draft) → Kirim ke Supplier → Konfirmasi Terima Barang
5. Status Received → stok bahan baku bertambah otomatis
```

---

## Commands

```bash
# Development
npm run dev               # Dev server di localhost:3000
npm run build             # Build production
npm run start             # Jalankan production server
npm run lint              # Jalankan ESLint

# Database
npx prisma db push        # Sync schema ke database
npx prisma generate       # Generate Prisma client
npx prisma db seed        # Isi data awal
npx prisma studio         # Buka GUI database di browser
npx prisma migrate dev    # Buat migration baru
```

---

## Deployment

### Penggunaan Lokal / Komputer Toko (Rekomendasi)

Sistem ini sangat cocok dijalankan langsung di komputer toko / POS:

```bash
# Build aplikasi
npm run build

# Jalankan server produksi
npm run start
```

Buka `http://localhost:3000` pada browser komputer lokal atau perangkat yang terhubung dalam satu jaringan LAN.

> **Catatan Serverless / Vercel:** SQLite menyimpan data dalam file lokal `dev.db`. Platform *serverless* seperti Vercel tidak menyimpan state file secara permanen (ephemeral filesystem). Jika ingin deploy ke cloud publik secara permanen, gunakan VPS (seperti DigitalOcean, AWS EC2, Hetzner) atau kembalikan provider Prisma ke PostgreSQL (Supabase/Neon).

---

## Catatan Database

Proyek ini menggunakan **SQLite lokal** melalui driver adapter `@prisma/adapter-better-sqlite3` dan **Prisma ORM v7**.

Poin penting:
- **`DATABASE_URL="file:./dev.db"`** — Menyimpan seluruh data aplikasi ke dalam satu file lokal `dev.db`
- Prisma client di-generate ke `src/generated/prisma/` (custom output path)
- SQLite tidak mendukung enum bawaan; semua tipe role dan status disimpan sebagai `String`
- Backup data sangat mudah: cukup buat salinan/copy dari file `dev.db`

Untuk reset total dan isi ulang database dari nol:

```bash
npx prisma db push --force-reset
npx prisma generate
npx prisma db seed
```

---

## Catatan Perubahan

### Versi Terbaru

**Migrasi ke SQLite Lokal & Cleanup**
- Mengganti PostgreSQL (Supabase) dengan SQLite lokal (`dev.db`)
- Menghitung ulang total transaksi di server (mencegah manipulasi harga dari client)
- Menghapus sisa-sisa fitur Shift (model `CashierShift`, rute API, dan folder UI terkait)
- Mengubah upload file dari AWS S3 menjadi sistem penyimpanan lokal (`public/uploads`)
- Mengubah tipe `Enum` pada schema menjadi `String` biasa agar kompatibel dengan SQLite
- Sistem berjalan 100% offline tanpa ketergantungan server cloud eksternal

**Fitur Shift dihapus**
- Menu Shift Kasir tidak lagi tersedia
- Akses ke `/dashboard/shifts` otomatis diarahkan ke Dashboard

**Scoping data per pengguna**
- Kasir hanya melihat transaksi, laporan, dan customer miliknya sendiri / cabangnya
- Admin tetap melihat semua data lintas cabang

**Informasi cabang di session**
- Nama dan ID cabang tersimpan di JWT
- Badge cabang tampil di sidebar dan header
- Dashboard kasir menampilkan informasi cabang aktif

**Navigasi per role**
- Admin: semua menu tersedia
- Kasir: hanya Dashboard, POS, Transaksi, Customer, Laporan

**1 Pengguna = 1 Cabang**
- Setiap pengguna wajib ditugaskan ke satu cabang saat dibuat atau diedit
- Halaman pengguna menampilkan ringkasan assignment per cabang

**POS dengan pilihan Customer**
- Dropdown pencarian customer tersedia saat checkout
- Nama customer tercantum di struk
- Poin loyalty bertambah otomatis

**Supplier & Bahan Baku terintegrasi**
- Tabel `SupplierMaterial` menghubungkan supplier dengan bahan baku yang mereka sediakan
- Setiap supplier dapat memiliki harga khusus per bahan baku
- Saat membuat PO, hanya bahan baku dari supplier yang dipilih yang ditampilkan

**Kalkulasi kembalian di server**
- Nilai kembalian dihitung di sisi server, bukan dari input client

**Data awal lengkap**
- Seed mencakup 3 cabang, 5 pengguna, 25 produk, 25 bahan baku, 7 supplier, dan 10 customer
