# Suzuki BSB Semarang — Website Dealer Resmi (sales-proto-4)

> **Dokumen handover proyek.** Ditulis untuk developer yang baru menerima proyek ini
> (junior atau siapa pun). Baca dari atas ke bawah sekali — setelah itu kamu akan
> paham struktur, sistem, cara kustomisasi, cara deploy, dan kebiasaan-kebiasaan
> penting proyek ini. Kalau bingung, cek [worklog.md](./worklog.md) — catatan
> kerja detail seluruh fase pengembangan (dibaca dari bawah untuk yang terbaru).

---

## Daftar Isi

1. [Apa Isi Proyek Ini](#1-apa-isi-proyek-ini)
2. [Tech Stack](#2-tech-stack)
3. [Arsitektur & Cara Kerja](#3-arsitektur--cara-kerja)
4. [Struktur Folder](#4-struktur-folder)
5. [Peta Route](#5-peta-route)
6. [Model Data](#6-model-data)
7. [Setup Lokal](#7-setup-lokal)
8. [Alur Kerja Konten (Tugas Sehari-hari)](#8-alur-kerja-konten-tugas-sehari-hari)
9. [Panduan Kustomisasi](#9-panduan-kustomisasi)
10. [Deploy ke Produksi](#10-deploy-ke-produksi)
11. [Operasional & Pemulihan (PENTING)](#11-operasional--pemulihan-penting)
12. [Testing & QA](#12-testing--qa)
13. [Keputusan Desain, Batasan & Utang Teknis](#13-keputusan-desain-batasan--utang-teknis)
14. [Pelacakan Proyek & Aturan Dokumentasi](#14-pelacakan-proyek--aturan-dokumentasi)

---

## 1. Apa Isi Proyek Ini

Website fullstack untuk **dealer Suzuki "BSB Semarang"** (fiktif untuk prototipe,
siap di-customize untuk dealer sungguhan): website publik + panel admin dalam
**satu aplikasi Next.js**.

**Sisi publik** (`#/` …):

| Fitur | Keterangan |
|---|---|
| Katalog mobil | Daftar + filter kategori (passenger/commercial), halaman detail (spesifikasi, galeri, pilihan warna), quick-view |
| Bandingkan mobil | Pilih 2–3 mobil, tabel perbandingan dengan highlight perbedaan |
| Simulasi kredit | Kalkulator DP/tenor/angsuran di halaman detail mobil |
| Artikel / Berita / Promo | Daftar + filter kategori (`?tipe=PROMO\|BERITA\|KEGIATAN`), halaman detail dengan daftar isi (TOC), progress baca, share, print |
| Test drive & Booking servis | Form + captcha matematika + status booking bisa dicek publik |
| Testimoni pelanggan | Kirim testimoni → dimoderasi admin → tampil publik |
| Kontak & Pesan | Form kontak, FAQ, pencarian (Ctrl+K), newsletter |
| SEO | JSON-LD schema.org, sitemap, robots.txt, PWA manifest |

**Panel admin** (`#/admin`, wajib login):

Dashboard statistik + tren · Katalog mobil (CRUD + upload gambar + warna) ·
Artikel (editor rich-text Tiptap, draft/terjadwal/publikasi) · Pesan masuk ·
Test drive · Booking servis · Testimoni (moderasi) · FAQ · Ganti password ·
ekspor CSV untuk tabel-tabel utama.

---

## 2. Tech Stack

| Layer | Teknologi | Catatan |
|---|---|---|
| Framework | **Next.js 16 (App Router) + React 19 + TypeScript 5** | Semua halaman = 1 route `/` (lihat arsitektur) |
| Styling | **Tailwind CSS 4 + shadcn/ui (New York) + Lucide icons** | Komponen UI siap pakai di `src/components/ui/` |
| Database | **Prisma ORM + SQLite** (dev) | Schema portabel ke PostgreSQL — keterangan di §10 |
| Server state | **TanStack Query v5** | Semua fetch lewat `src/lib/api.ts` |
| Editor konten | **Tiptap v3** (`@tiptap/react`, `starter-kit`, `extension-image`, `extension-link`) | Output HTML, disanitasi server-side |
| Sanitizer | **sanitize-html** | Allowlist ketat, dijalankan saat **menyimpan** artikel |
| Validasi | **Zod v4** | Semua API route divalidasi (`src/lib/validations.ts`) |
| Auth | Custom (tanpa library) | Cookie sesi HMAC + scrypt — lihat §3.4 |
| Runtime | **Bun** (dev sandbox) / Node (produksi) | `bun run dev` di sandbox |

Tanpa: Redux, CSS-in-JS, dark mode (sengaja dihapus — lihat §13), library state lain.

---

## 3. Arsitektur & Cara Kerja

### 3.1 Satu route `/` + hash router (KONSEP PALING PENTING)

Preview sandbox hanya mengekspos **satu route** (`/`). Karena itu seluruh website
adalah **SPA di dalam `src/app/page.tsx`** dengan **hash router** buatan sendiri
(`src/lib/router.tsx`):

```
URL:  https://domain/#/mobil/ertiga?tipe=...
                     ^^^^^^^^^^^^^^
                     dibaca useHashRoute()
```

- `src/app/page.tsx` = tabel routing: parse segmen hash → render `View` dari
  `src/views/public/*` atau `src/views/admin/*`.
- **JANGAN** membuat file route baru di `src/app/` (selain API). Halaman baru =
  view baru + tambah case di `page.tsx`.
- API routes (`src/app/api/**`) adalah route server **biasa** — tidak pakai hash.
- `useSyncExternalStore` dipakai untuk sinkronisasi supaya tidak hydration mismatch.
- `navigate("/admin/artikel")` = pengganti `router.push` (lihat `src/lib/router.tsx`).

> Konsekuensi: URL halaman publik punya `#` (mis. `doman.tld/#/artikel/slug`).
> Untuk produksi normal (domain sendiri), ini boleh dipertahankan, atau
> dimigrasi ke route Next.js asli — lihat §13 (utang teknis).

### 3.2 Pola API (backend)

Semua endpoint di `src/app/api/`, pola seragam:

```
Request  → parseJsonBody (max 7MB) → Zod safeParse → logika → Prisma
Response → ok(data)   { ok: true,  data: {...} }
         → fail(msg)  { ok: false, error, message }
```

Helper di `src/lib/api-helpers.ts`. Konvensi HTTP:

| Method | Arti |
|---|---|
| `GET` | Baca data (query param untuk filter) |
| `POST` | Buat baru |
| `PUT` | Update (id di dalam body) |
| `PATCH` | Update kecil/status (tunggal atau massal `ids`) |
| `DELETE` | Hapus (`?id=` tunggal, `?ids=a,b,c` massal) |

Endpoint publik: `/api/cars`, `/api/cars/[slug]`, `/api/articles`,
`/api/articles/[slug]`, `/api/faqs`, `/api/testimonials`, `/api/contact`,
`/api/test-drive`, `/api/service-booking`, `/api/booking-status`,
`/api/newsletter`, `/api/newsletter/unsubscribe`, `/api/search`, `/api/captcha`,
`/api/files/[...path]` (serve gambar upload).

Endpoint admin (proteksi `requireAdmin`): `/api/admin/login|logout|me`,
`/api/admin/stats`, `/api/admin/cars`, `/api/admin/articles`,
`/api/admin/upload`, `/api/admin/messages`, `/api/admin/test-drives`,
`/api/admin/service-bookings`, `/api/admin/testimonials`, `/api/admin/faqs`,
`/api/admin/newsletter`, `/api/admin/change-password`.

### 3.3 Alur konten artikel (paste → editor → DB → publik)

Ini jalur yang paling sering ditanya — hafalkan:

```
Admin paste dari web lain
   → Tiptap parse HTML ke schema-nya sendiri
     (heading h1–h6, img [https & base64 di editor], list, link, hr lolos;
      script/style/table/figure di-unwrap atau ditolak)
   → Klik simpan: editor.getHTML() dikirim ke PUT/POST /api/admin/articles
   → SERVER: sanitizeArticleHtml() [src/lib/sanitize.ts] — INI SATU-SATUNYA PENJAGA
     • Allowlist tag: p, h1–h6, strong/em/u/s, ul/ol/li, a, img, figure,
       figcaption, code/pre, blockquote, hr, table, span/div
     • Atribut img: hanya src/alt/title/width/height/loading
     • img src WAJIB http(s)  → base64 DIBUANG saat simpan (anti bloat DB)
     • <a> dipaksa rel="noopener noreferrer nofollow" + target="_blank"
     • script/iframe/style/inline-style dibuang total
   → Prisma simpan ke tabel artikel.konten (String/TEXT berisi HTML)
   → Halaman publik: <div className="prose-artikel" dangerouslySetInnerHTML>
     — AMAN karena konten sudah disanitasi SAAT DISIMPAN, bukan saat render.
     TOC (daftar isi) hanya menanam id pada h2/h3 via DOMParser (client).
```

CSS konten artikel: class `.prose-artikel` di `src/app/globals.css`
(h1–h6, p, list, blockquote, img block-centered, figure/figcaption, hr).
Class yang sama dipakai area ketikan editor → WYSIWYG konsisten.
**Styling konten cukup lewat class CSS `.prose-artikel`** — inline `style=""`
dibuang sanitizer, jangan pakai.

### 3.4 Auth admin (custom, tanpa NextAuth)

- Login: `POST /api/admin/login` → verifikasi scrypt (`src/lib/password.ts`)
  → set cookie **`suzuki_admin_session`** (HttpOnly, SameSite=Lax, TTL **7 hari**).
- Token = `payload.signature` dengan HMAC-SHA256 (`ADMIN_SESSION_SECRET`).
- Semua route `/api/admin/**` membuka dengan baris yang sama:

  ```ts
  const denied = requireAdmin(req);   // dari @/lib/auth
  if (denied) return denied;          // 401 JSON kalau tidak valid
  ```

- Rate limit login: 5 percobaan / 15 menit / IP.
- **Satu-satunya akun** = baris di tabel `admins`. Tidak ada registrasi publik.

### 3.5 Upload gambar

```
Komponen admin (image-uploader / artikel-editor / warna-image-input)
  → POST /api/admin/upload { contentBase64, contentType, category }
  → requireAdmin → validasi tipe (PNG/JPG/WebP/GIF) & ukuran (maks 5MB)
  → saveUploadedImage() [src/lib/storage.ts] → tulis file ke db/uploads/<category>/<tahun-bulan>/<uuid>.<ext>
  → balas { url: "/api/files/cars/2026-04/uuid.png" }
  → publik membaca via GET /api/files/[...path] (anti path-traversal di storage.ts)
```

Folder `db/uploads/` adalah **data runtime** (gitignored). Kontrak
`saveUploadedImage`/`readUploadedFile` didesain agar mudah ditukar dengan
Supabase Storage saat produksi (§10) tanpa mengubah UI.

### 3.6 Anti-spam form publik

Tiga lapis (`src/lib/rate-limit.ts`, `src/lib/captcha.ts`, validasi Zod):

1. **Captcha matematika** server-side (`/api/captcha`, TTL 5 menit) — challenge id + jawaban disimpan in-memory.
2. **Honeypot** field `website` (disembunyikan CSS; terisi = bot, ditolak diam-diam).
3. **Rate limit per IP in-memory**: form kontak/test-drive/servis = 5x/10 menit; login = 5x/15 menit.

Siap Turnstile (Cloudflare): tinggal set `TURNSTILE_SECRET_KEY` dan sambungkan
di `src/lib/captcha.ts` (komentar sudah ada). Sandbox sengaja skip karena butuh key.

### 3.7 Publikasi terjadwal artikel

Status artikel: `DRAFT` → `TERJADWAL` (+ `scheduled_at`) → `PUBLISHED`.
Tidak ada cron job — **lazy publish**: setiap query artikel publik
(`src/lib/serializers.ts`) artikel terjadwal yang sudah lewat waktunya otomatis
di-flip jadi PUBLISHED sekali jalan.

---

## 4. Struktur Folder

```
├── prisma/schema.prisma        # Definisi tabel (snake_case, alasan di §13)
├── db/
│   ├── custom.db               # SQLite RUNTIME (DILARANG di-commit — §11)
│   └── uploads/                # Gambar upload RUNTIME (DILARANG di-commit — §11)
├── src/
│   ├── app/
│   │   ├── page.tsx            # ★ ENTRY seluruh website (tabel routing SPA)
│   │   ├── layout.tsx          # Root layout, font, metadata global
│   │   ├── globals.css         # ★ Semua CSS kustom: token warna, .prose-artikel, dsb.
│   │   ├── sitemap.ts          # Sitemap dinamis (pakai NEXT_PUBLIC_SITE_URL)
│   │   └── api/                # Semua backend (lihat §3.2)
│   ├── lib/                    # ★ "Otak" proyek — semua logika & helper
│   │   ├── router.tsx          # Hash router + <Link> + navigate()
│   │   ├── api.ts              # apiGet/apiPost/apiPut/apiPatch/apiDelete (fetch wrapper)
│   │   ├── auth.ts             # Sesi admin (HMAC) + requireAdmin
│   │   ├── password.ts         # scrypt hash/verify
│   │   ├── db.ts               # Prisma client singleton (PRISMA_CACHE_KEY — §11)
│   │   ├── storage.ts          # Upload/serve gambar (kontrak Supabase-ready)
│   │   ├── sanitize.ts         # ★ Sanitizer HTML artikel (allowlist)
│   │   ├── validations.ts      # Semua skema Zod
│   │   ├── serializers.ts      # DTO publik + lazy publish terjadwal
│   │   ├── captcha.ts / rate-limit.ts
│   │   ├── jsonld.ts / site-utils.ts  # SEO + konstanta identitas dealer (§9)
│   │   └── compare-store.ts / use-compare.ts  # Zustand store bandingkan mobil
│   ├── views/
│   │   ├── public/             # 1 view per halaman publik (home, mobil, artikel, ...)
│   │   └── admin/              # 1 view per halaman admin (dashboard, katalog, ...)
│   ├── components/
│   │   ├── site/               # Komponen publik (header, footer, hero, car-card, ...)
│   │   ├── admin/              # Komponen admin (artikel-editor, image-uploader, ...)
│   │   ├── forms/              # Form publik (kontak, test-drive, servis, captcha)
│   │   └── ui/                 # shadcn/ui (JANGAN edit manual — §9)
│   └── hooks/                  # use-mobile, use-toast
├── scripts/                    # Skrip operasional (§11)
│   ├── restore-uploads.py      # Pulihkan db/uploads dari download/uploads-backup.tar.gz
│   ├── localize-images.py      # Audit/unduh ulang gambar remote → db/uploads
│   ├── seed-servis.ts          # Seed data demo booking servis (sekali jalan)
│   └── dbcount.ts              # Cepat cek jumlah baris semua tabel
├── public/                     # Aset statis: logo, favicon, icon PWA, manifest, robots
├── .env                        # Rahasia lokal (GITIGNORED — jangan pernah commit!)
├── .env.example                # Template variabel environment
├── worklog.md                  # ★ Log kerja detail seluruh fase (dibaca dari bawah)
└── README.md                   # Dokumen ini
```

Folder **spesifik sandbox** (tidak relevan di luar sandbox ini, biarkan):
`.zscripts/`, `Caddyfile`, `start-dev-daemon.py`, `examples/`, `mini-services/`
(kosong, placeholder layanan tambahan), `tests/`, `tool-results/`, `download/`
(termasuk backup uploads).

---

## 5. Peta Route

### Publik (hash router)

| URL | View | Keterangan |
|---|---|---|
| `#/` | `HomeView` | Beranda: hero, USP, katalog unggulan, promo, testimoni, FAQ |
| `#/mobil` | `MobilView` | Katalog + filter kategori |
| `#/mobil/:slug` | `MobilDetailView` | Detail: spesifikasi, galeri, warna, simulasi kredit |
| `#/bandingkan` | `BandingkanView` | Perbandingan 2–3 mobil |
| `#/artikel` | `ArtikelView` | Daftar artikel + tab filter (`?tipe=PROMO\|BERITA\|KEGIATAN`) |
| `#/artikel/:slug` | `ArtikelDetailView` | Detail: TOC, progress baca, share, print, artikel terkait |
| `#/tentang-kami` | `TentangKamiView` | Profil dealer |
| `#/kontak` | `KontakView` | Form kontak + info + peta |
| lainnya | `NotFoundView` | 404 |

### Admin (hash router, login di luar shell)

| URL | View |
|---|---|
| `#/admin/login` | `AdminLoginView` |
| `#/admin` | `AdminDashboardView` (statistik + tren + antrean) |
| `#/admin/katalog` · `/tambah` · `/:id/edit` | `AdminKatalogView` / `AdminKatalogFormView` |
| `#/admin/artikel` · `/tambah` · `/:id/edit` | `AdminArtikelView` / `AdminArtikelFormView` |
| `#/admin/pesan` | `AdminPesanView` |
| `#/admin/test-drive` | `AdminTestDriveView` |
| `#/admin/servis` | `AdminServisView` |
| `#/admin/testimoni` | `AdminTestimoniView` |
| `#/admin/faq` | `AdminFaqView` |

---

## 6. Model Data

Semua tabel di `prisma/schema.prisma`. Field **snake_case** mengikuti kode legacy
(porting dari repo lama) — jangan rename kecuali siap migrasi menyeluruh.

| Tabel | Isi | Field penting |
|---|---|---|
| `admins` | Akun admin (tunggal) | `email`, `passwordHash` (scrypt) |
| `mobil_katalog` (`Mobil`) | Katalog mobil | `slug`, `kategori` (passenger/commercial), `harga_mulai` (Int, rupiah), `spesifikasi`/`galeri_gambar`/`warna` (JSON **string**), `is_published`, `urutan` |
| `artikel` | Artikel/berita/promo | `slug`, `konten` (HTML TEXT — lihat §3.3), `tipe` (PROMO/BERITA/KEGIATAN), `status` (DRAFT/TERJADWAL/PUBLISHED), `scheduled_at`, `views` |
| `pesan_masuk` | Form kontak | `status` (BARU/DIBACA/DIBALAS/SELESAI), `ip_address` |
| `test_drive` | Booking test drive | `mobil_id` (FK nullable), `status` (PENDING/CONFIRMED/CANCELLED/DONE) |
| `booking_servis` | Booking servis bengkel | `jenis_servis`, `status` |
| `testimoni` | Testimoni pelanggan | `rating` 1–5, `status` (PENDING/APPROVED/REJECTED) — harus di-approve admin dulu |
| `faqs` | FAQ | `kategori` (umum/pembelian/purnajual), `urutan`, `is_published` |
| `newsletter_subscribers` | Subscriber | `email` unik, `status` (AKTIF/BERHENTI) |

Catatan JSON-string: field `spesifikasi`, `galeri_gambar`, `warna`, `tags`
disimpan sebagai **string JSON** (keterbatasan SQLite sandbox). Di PostgreSQL
produksi boleh dimigrasi ke tipe native (`Json`, `String[]`) — §10.

---

## 7. Setup Lokal

Prasyarat: **Bun** (atau Node 20+ dengan npm — ganti `bun run` → `npm run`),
Python 3 (hanya untuk skrip operasional opsional).

```bash
# 1. Install dependency
bun install

# 2. Siapkan environment (lihat tabel env di bawah)
cp .env.example .env
#    → isi DATABASE_URL; untuk sandbox: file:/abs/path/ke/db/custom.db

# 3. Buat/diperbarui skema database (SQLite: buat file db/custom.db)
bun run db:push        # PERINGATAN SENSITIF — baca §11 dulu!

# 4. Jalankan dev server
bun run dev            # http://localhost:3000

# 5. Buat akun admin pertama (sekali saja — skrip sekali jalan):
bun -e '
import { db } from "./src/lib/db";
import { hashPassword } from "./src/lib/password";
await db.admin.create({
  data: { email: "admin@dealer.id", name: "Admin Dealer",
          passwordHash: await hashPassword("PasswordKuat#123") },
});
console.log("admin dibuat"); await db.$disconnect();'

# 6. (Opsional) seed data demo booking servis
bun run scripts/seed-servis.ts
```

**Variabel environment** (`.env`):

| Var | Wajib? | Isi |
|---|---|---|
| `DATABASE_URL` | ✅ | SQLite: `file:/path/db/custom.db` · Produksi: connection string PostgreSQL/Supabase |
| `ADMIN_SESSION_SECRET` | ✅ (produksi) | String acak panjang untuk HMAC sesi admin (min. 32 char) |
| `NEXT_PUBLIC_SITE_URL` | ✅ (produksi) | URL publik situs, dipakai sitemap + JSON-LD (mis. `https://suzukibsb.co.id`) |
| `TURNSTILE_SECRET_KEY` | ⬜ | Secret Cloudflare Turnstile (captcha alternatif) |

Akun admin sandbox yang sedang aktif: `admin@suzukibsb.id` / `SuzukiBSB#2025`
**(wajib diganti via UI admin → Ganti Password sebelum produksi!)**.

Perintah `package.json`: `dev` (dev server), `lint` (ESLint), `db:push`,
`db:generate`, `db:migrate`, `db:reset` (**hati-hati — reset menghapus data**),
`build` & `start` (produksi standalone).

---

## 8. Alur Kerja Konten (Tugas Sehari-hari)

### Menulis artikel (`#/admin/artikel/tambah`)

1. Isi judul → slug terisi otomatis (bisa diedit).
2. Pilih jenis: Promo / Berita / Kegiatan.
3. Isi ringkasan (muncul di daftar & pencarian) + cover image (upload/URL).
4. Ketik / **paste konten** di editor Tiptap. Paste dari website lain (mis.
   situs resmi Suzuki) aman: heading, gambar (URL https), list, link, bold/italic
   ikut terbawa. Gambar base64 tampil di editor tapi **dibuang saat disimpan**
   (kebijakan sanitizer §3.3) — gambar internal sebaiknya di-upload lewat tombol
   upload agar tersimpan di `db/uploads`.
5. Pilih status: Draft / Terjadwal (+ jam tayang) / Publikasikan.
6. Preview → Simpan.

### Mengelola katalog (`#/admin/katalog`)

Tambah/edit mobil: nama, slug, kategori, harga (angka rupiah), spesifikasi
(berulang label–nilai), gambar utama + galeri (upload/URL), warna (nama + hex +
gambar varian), status tampil, urutan tampil.

### Moderasi harian

- **Pesan masuk**: tandai dibaca/dibalas/selesai.
- **Test drive & Servis**: konfirmasi jadwal, ubah status.
- **Testimoni**: approve (tampil publik) / reject.

---

## 9. Panduan Kustomisasi

### Ganti identitas dealer (nama, WA, alamat, dsb.)

Semua konstanta identitas ada di **`src/lib/site-utils.ts`** (nomor WhatsApp
`WHATSAPP_NUMBER`, nama dealer, dll.) — grep `dealer` di sana. Teks sebarisan
ada di masing-masing view. Cek juga `src/lib/jsonld.ts` (SEO) dan
`public/manifest.webmanifest`.

### Ganti warna brand

Token warna ada di **`src/app/globals.css`** (`:root { --suzuki-red,
--suzuki-navy, --suzuki-light, ... }`). Semua komponen memakai variabel ini —
ubah sekali, berubah semua. (Jangan pakai warna biru/indigo — konvensi proyek.)

### Menambah halaman publik

1. Buat view `src/views/public/foo-view.tsx` (bungkus dengan `<SiteLayout>`).
2. Daftarkan case di `src/app/page.tsx` (switch segmen).
3. Tambahkan link di `src/components/site/header.tsx` (+ footer bila perlu).

### Menambah endpoint API

Salin pola route yang ada (mis. `src/app/api/faqs/route.ts`): `requireAdmin`
untuk admin / rate-limit + captcha untuk form publik, Zod dari
`validations.ts`, respons `ok()`/`fail()`. Frontend memanggil lewat helper
`src/lib/api.ts`.

### Menambah modul admin (mis. halaman "Galeri")

1. View list + form di `src/views/admin/`.
2. Route API `src/app/api/admin/galeri/`.
3. Case routing di `page.tsx` + menu di `src/views/admin/admin-shell.tsx`.
4. Entri badge/counter di dashboard bila relevan (`/api/admin/stats`).

### Komponen UI

Pakai yang ada di `src/components/ui/` (shadcn/ui). Jangan edit manual — kalau
butuh varian, buat komponen baru yang membungkusnya. Tambah komponen shadcn
baru: `bunx shadcn@latest add <nama>`.

### Editor artikel

Extension Tiptap didaftarkan di `src/components/admin/artikel-editor.tsx`
(`TIPTAP_EXTENSIONS`). Saat ini: StarterKit (minus link bawaan), Image
(`allowBase64: true` — agar paste base64 tampil di editor), Link
(autolink + linkOnPaste). **Menambah node baru (mis. Tabel) = tambahkan
extension + wajib perbarui allowlist `src/lib/sanitize.ts`** — kalau tidak,
hasilnya dibuang diam-diam saat simpan.

---

## 10. Deploy ke Produksi

Urutan yang benar (target referensi: **Vercel + Supabase**, bisa diganti):

1. **Database — PostgreSQL**:
   - Buat project Supabase → ambil connection string (mode *session pooler*).
   - `prisma/schema.prisma`: ganti `provider = "sqlite"` → `"postgresql"`.
   - (Opsional) migrasi field JSON-string ke tipe native.
   - `bun run db:push` (atau `db:migrate`) ke database produksi.
2. **Storage gambar**:
   - Buat bucket publik di Supabase Storage, ganti isi `saveUploadedImage` /
     `readUploadedFile` di `src/lib/storage.ts` dengan Supabase Storage SDK —
     bentuk return (`{ url: "/api/files/..." }`) adalah kontraknya; sesuaikan
     juga route `src/app/api/files/[...path]/route.ts` (bisa jadi redirect ke
     URL publik bucket).
3. **Deploy aplikasi** (Vercel):
   - Import repo → framework Next.js terdeteksi otomatis.
   - Set environment variables (§7): `DATABASE_URL`, `ADMIN_SESSION_SECRET`
     (generate: `openssl rand -base64 48`), `NEXT_PUBLIC_SITE_URL`, opsional
     `TURNSTILE_SECRET_KEY`.
   - Deploy. `next.config.ts` sudah `output: "standalone"` (aman untuk Vercel).
4. **Pasca-deploy (CHECKLIST WAJIB)**:
   - [ ] Buat akun admin pertama (skrip di §7) & **ganti password**.
   - [ ] Uji: login, tambah artikel (paste + upload gambar), submit form publik
         dengan captcha, upload katalog.
   - [ ] Set `NEXT_PUBLIC_SITE_URL` final → cek `/sitemap.xml` & JSON-LD.
   - [ ] Pertimbangkan pertegas CSP `frame-ancestors` (saat ini `*` demi preview
         sandbox iframe — lihat komentar di `next.config.ts`).
   - [ ] Ganti nilai default fallback domain di `jsonld.ts`/`sitemap.ts` sudah
         tidak terpakai (env terisi).
   - [ ] `robots.txt` & domain map Google Business sesuaikan.

**Jangan** deploy membawa `db/custom.db` — dia data lokal sandbox.

---

## 11. Operasional & Pemulihan (PENTING)

Bagian ini adalah pengalaman nyata dari insiden — baca dua kali.

### 11.1 Data runtime & filosofi backup

| Artefak | Lokasi | Sifat |
|---|---|---|
| Database | `db/custom.db` | Runtime, **gitignored** — jangan pernah commit |
| Gambar upload | `db/uploads/` | Runtime, **gitignored** |
| Backup uploads | `download/uploads-backup.tar.gz` | Salinan aset upload (24 file) |

Sandbox ini pernah **menghapus `db/uploads/` 4x** dan **mengosongkan database 1x**
(kronologi: worklog). Karena itu:

- Backup DB secara berkala: `cp db/custom.db db/backup-$(date +%F).db`
  (atau export via `scripts/`).
- Setelah **setiap reset sandbox**: jalankan
  `python3 scripts/restore-uploads.py` lalu audit `python3 scripts/localize-images.py`
  (harus laporan `missing after run: 0`).
- Kalau database kosong tetapi riwayat git masih memuat `db/custom.db` (kasus
  lama sebelum file ini di-untrack), ia bisa dipulihkan:
  `git show <commit>:db/custom.db > db/custom.db` — lalu restart dev server.

### 11.2 `db:push` itu PENTAK — baca dulu

`bun run db:push` menjalankan `prisma db push --accept-data-loss`. Pada SQLite
ini bisa **membuang data** bila prisma menganggap perlu re-create tabel.
Aturan aman:

1. `db:push` hanya saat setup awal atau setelah mengubah `schema.prisma`.
2. Sebelum menjalankannya: pastikan tidak ada data penting yang belum dibackup.
3. Setelah `db:push`: **naikkan `PRISMA_CACHE_KEY`** di `src/lib/db.ts`
   (mis. `prisma_v6` → `prisma_v7`) dan **restart dev server** — client lama
   masih menempel di memori dengan bentuk tabel lama.

### 11.3 Dev server di sandbox

- Dijalankan lewat daemon: `python3 start-dev-daemon.py` (log: `dev.log`).
- Port **3000** saja. Kemungkinan `EADDRINUSE` = instance kembar:
  `pkill -f "next dev"` lalu start ulang.
- Setelah edit `globals.css` bila tampilan tidak berubah (stale): stop, hapus
  `.next`, start ulang.

### 11.4 Perintah cepat operasional

```bash
bun run lint                    # cek kualitas kode (0 error = standar)
bun run scripts/dbcount.ts      # jumlah baris semua tabel
bun run scripts/seed-servis.ts  # seed demo booking servis (idempoten)
python3 scripts/restore-uploads.py    # pulihkan db/uploads dari backup
python3 scripts/localize-images.py    # audit + unduh ulang gambar remote
```

---

## 12. Testing & QA

Tidak ada suite test otomatis (keputusan sadar untuk prototipe — §13). Standar
verifikasi manual yang dipakai selama pengembangan:

1. `bun run lint` — nol error.
2. Cek `dev.log` — tidak ada error runtime saat halaman dibuka.
3. QA browser (agent-browser/headless): buka `#/`, navigasi semua menu utama,
   login admin, CRUD artikel & katalog, submit form publik (captcha muncul),
   cek mobile 375px tanpa horizontal scroll, gambar tidak 404.
4. Untuk paste artikel: paste HTML asli dari situs lain, pastikan heading &
   gambar https masuk, simpan, cek halaman publik.

---

## 13. Keputusan Desain, Batasan & Utang Teknis

Baca ini agar tidak "memperbaiki" sesuatu yang memang disengaja:

| Keputusan | Alasan | Kalau mau diubah |
|---|---|---|
| **Hash router** (semua di route `/`) | Batasan preview sandbox (hanya 1 route tampil) | Migrasi ke route Next.js asli: pindahkan tiap view ke `app/(site)/.../page.tsx`, ganti `navigate`/`Link` dari `lib/router.tsx` bertahap |
| **SQLite** di dev | Tanpa server DB di sandbox | Produksi = PostgreSQL (§10) |
| Field **snake_case** | Porting minim dari kode legacy | Rename menyeluruh + migrasi |
| JSON sebagai **String** | Keterbatasan SQLite sandbox | Tipe native di PostgreSQL |
| **Tanpa dark mode** | Permintaan eksplisit owner (performa & simple); kelas `dark:` di ui/ sengaja dibiarkan inert | Jangan dihidupkan lagi tanpa izin |
| **Tanpa animasi scroll-reveal/page-transition** | Dihapus (permintaan owner — "kembali ke gaya asli") | Jangan ditambah ulang |
| Halaman **promo dihapus** | Filter kategori di halaman artikel dianggap cukup | — |
| `typescript.ignoreBuildErrors: true` di next.config | Sisa masa porting (tsc lokal sudah bersih) | Hapus flag ini lalu bereskan error TS yang muncul |
| Sanitizer **membuang img base64 & inline style** | Keamanan + ukuran DB | Longgarkan `exclusiveFilter` di `sanitize.ts` (hanya `data:image/*`) bila butuh |
| Tabel hasil paste di-unwrap jadi paragraf | Tiptap tanpa extension Table (sengaja, YAGNI) | Tambah `@tiptap/extension-table` + allowlist sanitizer |
| `next/image` belum dipakai | URL gambar campuran (remote CMS + lokal) | Optimasi produksi |
| Tanpa unit test | Prototipe cepat, QA manual terstruktur | Testimonial/e2e pertama: form captcha + alur artikel |
| 1 akun admin tunggal | Kebutuhan memang satu operator | Role field di tabel admins |

---

## 14. Pelacakan Proyek & Aturan Dokumentasi

**Aturan tetap (berlaku untuk siapa pun yang mengerjakan repo ini):**

> Setiap kali ada perubahan pada proyek — fitur baru, perbaikan bug, perubahan
> perilaku, perubahan setup — **WAJIB memperbarui:**
> 1. Bagian README yang terdampak (misal route baru → §5, tabel baru → §6).
> 2. `worklog.md` (append di bawah, dengan format Task ID + ringkasan).
> 3. Tabel changelog di bawah ini.

Dua sumber kebenaran yang saling melengkapi:

- **README.md** (file ini) = kondisi *terkini* & cara kerja (selalu dijaga akurat).
- **worklog.md** = *sejarah* pengerjaan detail per fase (tidak pernah diubah
  isinya yang lama, hanya ditambah).

### Changelog

| Tanggal | Task | Ringkasan |
|---|---|---|
| 2026-10-04 | 16 | Dokumentasi handover lengkap (README ini) + perbaikan bug route upload 404 + pemulihan insiden DB kosong |
| 2026-10-04 | 15 | Push pertama ke GitHub (untrack file runtime; `main` = 17 commit) |
| 2026-10-04 | 14 | Paste Tiptap: `allowBase64:true` + h5/h6 lolos sanitizer; CSS `.prose-artikel` diperkuat |
| 2026-10-03 | 13 | Rollback styling/animasi ke gaya asli, hapus dark mode total, hapus halaman promo |
| 2026-10-03 | 1–12 | Porting penuh dari repo lama → fullstack Next.js 16: SPA hash-router, auth, katalog, artikel+Tiptap, form publik+captcha, admin panel lengkap, TOC/print/share, SEO (detail di worklog) |

---

*Dokumen ini dibuat sebagai bagian dari handover proyek. Kalau menemukan
ketidaksesuaian antara dokumen dan kode — **kodenya yang benar**, lalu
perbarui dokumen ini (aturan §14).*
