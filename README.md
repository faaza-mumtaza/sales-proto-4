# Suzuki BSB Semarang — Website Dealer Fullstack (sales-proto-4)

Website dealer Suzuki "BSB Semarang": situs publik (katalog, artikel/promo,
test drive, booking servis, testimoni, FAQ, newsletter) + panel admin
lengkap. Diporting dari repo lama `sales-proto-3` (TanStack Start + Supabase
REST) ke **Next.js 16 fullstack + Prisma**.

> **Dokumen ini ditulis ulang di Task 19** setelah reset sandbox menghapus
> README versi Task 16 (commit lokal yang belum ter-push). Sejarah lengkap
> ada di `worklog.md` (Task 1–15 utuh; Task 16–18 hilang bersama reset —
> rekapnya di changelog bawah).

## 1. Stack & Arsitektur

- **Next.js 16 App Router** + TypeScript + Tailwind 4 + shadcn/ui + Lucide.
- **Routing**: SPA dengan **hash router** di route `/` satu-satunya
  (`src/app/page.tsx` → `src/views/*`; router di `src/lib/router.tsx`).
  JANGAN membuat page route lain — hanya API routes (`src/app/api/**`).
- **Database**: **Supabase Postgres via Prisma** (LIVE — lihat §8). Klien
  Prisma selalu lewat `import { db } from "@/lib/db"`.
- **Auth admin**: custom — tabel `admins` + hash **scrypt**
  (`src/lib/password.ts`) + cookie sesi HMAC HttpOnly 7 hari
  (`src/lib/auth.ts`, `requireAdmin()`). **Bukan Supabase Auth** — akun di
  menu Authentication Supabase (`auth.users`) tidak dipakai aplikasi.
- **Anti-spam** form publik: math captcha server-side (`/api/captcha`,
  TTL 5 menit) + honeypot + rate limit per IP in-memory
  (`src/lib/rate-limit.ts`, sliding window).
- **Upload gambar**: `/api/admin/upload` (base64 JSON) → `db/uploads/`
  (gitignored) → diserve via `/api/files/[...path]`. Kontrak di
  `src/lib/storage.ts` agar mudah diganti Supabase Storage.
- **Artikel**: editor Tiptap v3 (paste gambar base64 didukung), status
  DRAFT/TERJADWAL/PUBLISHED dengan publish otomatis lazy saat query publik.

## 2. Menjalankan

```bash
bun run dev          # dev server di :3000 (log: dev.log)
bun run lint         # ESLint
bun run db:generate  # regenerasi Prisma Client (WAJIB setelah ubah schema)
```

- **JANGAN `bun run build`** di sandbox ini. Port hanya 3000.
- **JANGAN `bun run db:push`** — database adalah Supabase produksi
  (penjelasan di §8). Perubahan schema → edit `docs/supabase-setup.sql`.
- Setelah mengubah `.env`: `unset DATABASE_URL` dulu, lalu restart server
  (env var lama di shell menimpa `.env`).

## 3. Struktur Penting

```
prisma/schema.prisma        # 9 model (@@map ke nama tabel legacy snake_case)
docs/supabase-setup.sql     # DDL sumber kebenaran Supabase (idempoten)
scripts/seed-servis.ts      # seed demo booking servis (opsional)
scripts/seed-supabase.ts    # pastikan akun admin ada (create-only, aman diulang)
scripts/restore-uploads.py  # pulihkan db/uploads dari backup (jika ada)
public/car-imgs/             # aset gambar mobil (statis, git-tracked) —
                            # path /car-imgs/* dipakai kolom gambar_utama di DB
src/lib/                    # db, auth, password, storage, rate-limit, captcha,
                            # serializers (JSON-string ↔ tampilan), validations (zod)
src/app/api/                # cars, articles, search, contact, test-drive,
                            # service-booking, booking-status, testimonials,
                            # faqs, newsletter, captcha, files, admin/*
src/views/                  # seluruh halaman publik + admin (hash router)
```

## 4. Model Data (9 tabel — semua di schema publik Supabase)

`admins`, `mobil_katalog` (Mobil), `artikel`, `pesan_masuk`,
`test_drive`, `testimoni`, `faqs`, `newsletter_subscribers`,
`booking_servis`. Nama kolom snake_case mengikuti kode legacy.

Field JSON-string (`tags`, `spesifikasi`, `galeri_gambar`, `warna`)
disimpan sebagai **teks JSON** juga di Postgres (keputusan Task 17 — nol
perubahan kode aplikasi; parser di `src/lib/serializers.ts`).

Kolom legacy yang sengaja dibiarkan di tabel `artikel` (jangan dihapus
tanpa backup): `is_published`, `author_id`.

## 5. Akun Admin

Dijamin oleh `scripts/seed-supabase.ts` (create-only, tidak menimpa
password yang sudah diganti):

| Email | Keterangan |
|---|---|
| `naufalsuzuki.bsb@gmail.com` | **Akun owner** — password sementara dari Task 19, WAJIB diganti lewat tombol **Ganti Password** di panel admin |
| `admin@suzukibsb.id` | Akun default terdokumentasi |

Ganti password setelah login pertama. Rate limit login: 10 percobaan /
15 menit / IP.

**Akses tersembunyi admin** (mobile saja): buka menu hamburger → ketuk
logo Suzuki 5× berturut-turut (maks. 3 detik antar ketukan) → diarahkan ke
`#/admin` (guard sesi yang menentukan login vs dashboard). Tanpa indikasi
visual; counter reset saat menu ditutup / pindah halaman. Implementasi di
`src/components/site/header.tsx` (`onLogoTap`).

## 6. API (ringkas)

- Publik: `GET /api/cars`, `GET /api/articles`, `GET /api/search`,
  `GET /api/testimonials`, `GET /api/faqs`, `GET /api/booking-status`,
  `POST /api/contact`, `POST /api/test-drive`, `POST /api/service-booking`,
  `POST /api/newsletter`, `GET /api/captcha`.
- Admin (dilindungi `requireAdmin()`): `POST /api/admin/login`,
  `POST /api/admin/logout`, `GET /api/admin/me`, `GET /api/admin/stats`,
  CRUD `admin/cars|articles|faqs|testimonials`, `GET admin/messages|
  test-drives|service-bookings|newsletter`, `POST /api/admin/upload`,
  `POST /api/admin/change-password`.

## 7. Environment

Lihat `.env.example`. Yang dipakai: `DATABASE_URL` (wajib),
`ADMIN_SESSION_SECRET` (wajib di production), opsional
`NEXT_PUBLIC_SITE_URL`, key Turnstile.

**Tidak ada key Supabase anon/publishable/service-role di aplikasi** —
akses data 100% via Prisma server-side.

## 8. Supabase (LIVE) — runbook & aturan

Status: **terhubung sejak Task 18** (dipulihkan ulang Task 19 setelah
reset sandbox). Project `wyznuuqpglhddojfwhpw` (ap-south-1).

- `docs/supabase-setup.sql` sudah dijalankan (idempoten, terbukti aman
  diulang). Ia menyamakan 2 tabel lama ke schema Prisma (uuid→text,
  timestamptz→timestamp(3), array→teks JSON, **enum `artikel_tipe`→text**
  — tanpa ini Prisma error P2032) + membuat 7 tabel baru + RLS ON tanpa
  policy (REST/anon terkunci total; Prisma bypass sebagai owner).
- `prisma/schema.prisma` `provider = "postgresql"`.
- Data live: 5 mobil, 3 artikel (semua PUBLISHED), 2 admin; tabel
  interaksi (pesan/test drive/testimoni/faq/newsletter/booking) mulai
  kosong — terisi seiring operasional.
- **JANGAN `db:push`** ke Supabase: Prisma melihat 2 kolom legacy artikel
  sebagai drift dan menawarkan penghapusannya. Perubahan schema → edit
  `docs/supabase-setup.sql`.
- Deploy Vercel: ganti `DATABASE_URL` ke **Transaction pooler (6543)**
  + `?pgbouncer=true&connection_limit=1&sslmode=require`; set
  `ADMIN_SESSION_SECRET` (`openssl rand -base64 48`).
- Storage gambar produksi (opsional): buat bucket publik Supabase Storage,
  sesuaikan `src/lib/storage.ts` + route `/api/files` (kontrak return tetap).

## 9. Catatan Operasional & Insiden

- **Reset sandbox pernah 5x terjadi** (data lokal + commit lokal hilang;
  IP mesin berubah). Yang selamat: **Supabase (eksternal)** dan repo GitHub.
  Pelajaran: commit & push berkala; data penting di Supabase, bukan file
  lokal sandbox. Setelah reset: pulihkan `.env`, flip provider, generate,
  jalankan `scripts/seed-supabase.ts` (lihat Task 19 di worklog).
  Reset #5 (Task 22) lebih ringan: git history + schema + worklog utuh,
  hanya `.env` ter-rollback ke SQLite dan dev server mati → cukup tulis
  ulang `.env`, `bun run db:generate`, `start-dev-daemon.py` (dengan
  `unset DATABASE_URL`), lalu seed create-only.
- `db/custom.db` (SQLite) = artefak sandbox lama, sudah kosong & tidak
  dipakai. Jangan pindah `DATABASE_URL` kembali ke situ.
- Gambar upload lama (`db/uploads/`) ikut hilang saat reset. Gambar mobil
  kini aset statis **`public/car-imgs/`** (git-tracked, selamat dari reset);
  kolom `gambar_utama` di Supabase memakai path `/car-imgs/*`. Artikel
  `cover_image` masih NULL (belum ada konten). Skema validasi
  `imageRef` (validations.ts) menerima `https://`, `/api/files/*`, dan
  `/car-imgs/*`.
- `typescript.ignoreBuildErrors: true` di next.config (sisa masa porting).

## 10. Pelacakan Proyek & Aturan Dokumentasi

> Setiap perubahan WAJIB memperbarui: (1) bagian README terdampang,
> (2) `worklog.md` (append, format Task ID), (3) changelog di bawah.

### Changelog

| Tanggal | Task | Ringkasan |
|---|---|---|
| 2026-10-07 | 22 | **Pulihan preview web (insiden #5, ringan)**: dev server mati + `.env` ter-rollback ke SQLite → preview user tidak muncul. Git/schema/worklog utuh (beda dari reset #4). Pulihkan: `.env` Supabase → `db:generate` → `start-dev-daemon.py` → seed create-only (2 admin utuh). Verifikasi E2E agent-browser: home render bersih, gerbang tersembunyi 5× ketuk logo (belum login → `#/admin/login`; sudah login → `#/admin`; menu tertutup/kurang dari 5× → tetap), login admin default → dashboard. Tanpa perubahan kode. |
| 2026-10-07 | 21 | **Pulihan reset #4 + gerbang admin tersembunyi + 2 fix bug harga**: `.env` ter-rollback lagi → pulihkan koneksi Supabase + dev server. Fitur: 5× ketuk logo di menu mobile → `#/admin` (header.tsx, tanpa indikasi visual). Fix bug "harga tidak berubah di situs": (1) `harga_label` kini selalu turunan `harga_mulai` saat simpan (dulu label lama terus ditampilkan), (2) `imageRef` zod menolak path `/car-imgs/*` → SEMUA edit mobil gagal disimpan (toast "Referensi gambar tidak valid") — kini diterima, (3) preview form ikut angka live, (4) `refetchOnWindowFocus` diaktifkan. Aset mobil dipindah `download/car-imgs` → `public/car-imgs` (disajikan statis, selamat reset). Semua diverifikasi E2E via agent-browser. |
| 2026-10-04 | 20 | *(hilang saat reset #4 — rekap)* Push 2 commit (Task 19) pakai PAT baru; uji persistence token — commit & entry worklog hilang saat reset berikutnya; PAT tidak tersisa di sandbox |
| 2026-10-04 | 19 | **Pulihan insiden reset sandbox**: repo ter-rollback ke state Task 15 (koneksi Supabase hilang, SQLite lokal kosong) → penyebab login admin gagal total. Pulihkan koneksi Supabase, daftarkan akun owner `naufalsuzuki.bsb@gmail.com` (auth custom, bukan Supabase Auth), tulis ulang README/setup SQL/.env.example/seed script. Semua terverifikasi E2E. |
| 2026-10-04 | 18 | *(hilang saat reset — rekap)* Koneksi LIVE ke Supabase: setup SQL dieksekusi, fix enum `artikel.tipe` (P2032), provider flip postgresql, admin pertama tersalin, verifikasi E2E penuh |
| 2026-10-04 | 17 | *(hilang saat reset — rekap)* Audit DB Supabase existing + skrip setup idempoten `docs/supabase-setup.sql` + runbook koneksi |
| 2026-10-04 | 16 | *(hilang saat reset — rekap)* README handover + fix route upload 404 + pemulihan insiden DB kosong |
| 2026-10-04 | 15 | Push pertama ke GitHub (untrack file runtime; `main` = 17 commit) — satu-satunya commit yang bertahan setelah reset |
| 2026-10-04 | 14 | Paste Tiptap: `allowBase64:true` + h5/h6 lolos sanitizer; CSS `.prose-artikel` diperkuat |
| 2026-10-03 | 13 | Rollback styling/animasi ke gaya asli, tanpa dark mode, halaman promo dihapus |
| 2026-10-03 | 1–12 | Porting penuh dari repo lama → fullstack Next.js 16 (detail utuh di worklog) |

---

*Kalau menemukan ketidaksesuaian antara dokumen dan kode — **kodenya yang
benar**, lalu perbarui dokumen ini (aturan §10).*
