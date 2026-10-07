# Suzuki BSB Semarang — Website Dealer Fullstack (sales-proto-4)

Website dealer Suzuki "BSB Semarang": situs publik (katalog, artikel/promo,
test drive, booking servis, testimoni, FAQ, newsletter) + panel admin
lengkap. Diporting dari repo lama `sales-proto-3` (TanStack Start + Supabase
REST) ke **Next.js 16 fullstack + Prisma**.

> **Dokumen ini ditulis ulang di Task 19** setelah reset sandbox menghapus
> salinan lokalnya. Koreksi Task 21: commit Task 16 ternyata tetap aman di
> GitHub (`b9dc153`) — reset hanya memulihkan snapshot lokal pra-push.
> Versi ini tetap menjadi dokumen otoritatif (kondisi terkini: Supabase
> live); README Task 16 (614 baris, kaya detail arsitektur/kustomisasi)
> tersimpan di riwayat git. Sejarah lengkap: `worklog.md`.

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
scripts/fix-car-data.ts     # Task 22: sinkronkan harga_label + isi foto mobil
                            # dari /car-imgs (idempoten, aman diulang)
scripts/restore-uploads.py  # pulihkan db/uploads dari backup (jika ada)
scripts/ops-config.ts        # brankas PAT/konfig di Supabase (get/set) — lihat §9.1
public/car-imgs/             # foto mobil statis (git-tracked, reset-proof) —
                             # dipakai kolom gambar_utama "/car-imgs/..."
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

**`mobil_katalog.harga_label` = kolom turunan** (Task 22): API admin
SELALU menurunkannya dari `harga_mulai` saat simpan; semua tampilan
memakai angka `harga_mulai` dulu (helper `carHarga()` di site-utils).
Label hanya fallback custom saat harga kosong — tidak ada input form
untuknya lagi.

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
- Catatan Task 22: PUT/POST `admin/cars` menurunkan `harga_label` dari
  `harga_mulai` (anti label basi). `imageRef` validasi menerima URL https,
  `/api/files/...` (upload), dan `/car-imgs/...` (foto statis dealer).

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

- **Reset sandbox pernah 6x terjadi** (terakhir: 2026-10-07, dua kali
  dalam satu hari — gejala khas: `.env` ter-rollback ke SQLite, dev server
  & cron mati; kadang repo git ikut ter-rollback ke snapshot lama, kadang
  tidak). Yang selamat di SEMUA reset: **Supabase (eksternal)** dan repo
  GitHub. Pelajaran: commit & push berkala; data penting di Supabase,
  bukan file lokal sandbox. Setelah reset: pulihkan `.env` (URL pooler
  Supabase), `bun run db:generate`, `python3 start-dev-daemon.py` (dengan
  `unset DATABASE_URL`), lalu `bun scripts/seed-supabase.ts` (create-only).
  Lihat Task 19/20 di worklog untuk runbook lengkap.
- `db/custom.db` (SQLite) = artefak sandbox lama, sudah kosong & tidak
  dipakai. Jangan pindah `DATABASE_URL` kembali ke situ.
- Gambar upload lama (`db/uploads/`) ikut hilang saat reset — namun data
  Supabase tidak terdampak. Foto mobil kini terisi: `public/car-imgs/`
  (git-tracked, tahan reset) dan kolom `gambar_utama` diisi path
  `/car-imgs/...` lewat `scripts/fix-car-data.ts` (hanya mengisi kolom
  NULL — upload admin tetap menang). Artikel `cover_image` masih NULL.
  Skema validasi `imageRef` (validations.ts) menerima `https://`,
  `/api/files/*`, dan `/car-imgs/*`.
- `typescript.ignoreBuildErrors: true` di next.config (sisa masa porting).

### 9.1 Kredensial Git (PAT GitHub) — brankas & pemulihan (diperbarui Task 23)

PAT fine-grained (tanpa expiry, scope Contents r/w repo ini) **tidak
pernah boleh ditulis di file yang ter-commit** (repo ini PUBLIC!).

> **Sejarah singkat:** skema lama (Task 21 paralel) menyimpan token di
> 3 lokasi *runtime* sandbox (remote URL `.git/config`,
> `~/.git-credentials`, `local-github-token`). Semuanya **mati saat
> reset sandbox #4–#6** — di dalam sandbox TIDAK ada lokasi yang tahan
> reset. Sejak Task 23, brankas utamanya di Supabase (eksternal).

1. **Brankas utama (tahan semua reset): tabel `ops_config` di Supabase**
   (key `github_pat`). Cara ambil — setelah `.env` dipulihkan:
   ```bash
   unset DATABASE_URL && bun scripts/ops-config.ts get github_pat
   ```
   Lalu push sekali jalan (token tidak perlu diketik ulang di chat/file):
   ```bash
   TOKEN=$(bun scripts/ops-config.ts get github_pat)
   git push "https://faaza-mumtaza:${TOKEN}@github.com/faaza-mumtaza/sales-proto-4.git" main
   ```
   Ganti rotasi token: `…ops-config.ts set github_pat <token-baru>`.
2. **Kenyamanan (mati saat reset, boleh hilang):** `~/.git-credentials`
   (chmod 600) + `credential.helper=store` global — push langsung
   `git push origin main` selama sandbox hidup.
3. **Fallback terakhir:** user mengirim ulang token via chat (nilai asli
   tersimpan permanen di akun GitHub user).

Catatan: token pernah muncul di chat — jika suatu saat direvoke,
perbarui brankas (`ops-config.ts set github_pat <baru>`). Jangan
pernah commit nilai token; `git remote -v` bisa menampilkan token bila
tersemat di URL — hindari menaruhnya di remote URL.

## 10. Pelacakan Proyek & Aturan Dokumentasi

> Setiap perubahan WAJIB memperbarui: (1) bagian README terdampang,
> (2) `worklog.md` (append, format Task ID), (3) changelog di bawah.

### Changelog

| Tanggal | Task | Ringkasan |
|---|---|---|
| 2026-10-07 | 23 | **Brankas PAT di Supabase + merge garis waktu paralel**: token GitHub kini tersimpan di tabel `ops_config` Supabase (eksternal — tahan semua reset; skema 3-layer runtime lama terbukti mati saat reset #4–#6). Skrip `scripts/ops-config.ts` (get/set). Merge origin/main (garis waktu paralel sesi 5 Okt: Task 20/21/22 versi remote) dengan commit lokal (Task 21/22 versi lokal 7 Okt): konflik README/worklog disatukan kronologis, fix harga memihak mekanisme server-side (label = turunan `harga_mulai` di API), gerbang admin tersembunyi (header.tsx) tetap. Push semua. |
| 2026-10-07 | 22-B | **Pulihan preview web (insiden #5, ringan)**: dev server mati + `.env` ter-rollback ke SQLite → preview user tidak muncul. Git/schema/worklog utuh (beda dari reset #4). Pulihkan: `.env` Supabase → `db:generate` → `start-dev-daemon.py` → seed create-only (2 admin utuh). Verifikasi E2E agent-browser: home render bersih, gerbang tersembunyi 5× ketuk logo (belum login → `#/admin/login`; sudah login → `#/admin`; menu tertutup/kurang dari 5× → tetap), login admin default → dashboard. Tanpa perubahan kode. |
| 2026-10-07 | 21-B | **Pulihan reset #4 + gerbang admin tersembunyi**: 5× ketuk logo di menu mobile → `#/admin` (header.tsx, tanpa indikasi visual; counter reset saat menu tutup/ganti route, expiry 3 detik). Fix `imageRef` zod menerima `/car-imgs/*` (dulu SEMUA edit mobil gagal simpan), `refetchOnWindowFocus` diaktifkan. Aset `download/car-imgs` → `public/car-imgs`. Fix harga versi ini digantikan mekanisme server-side Task 22-A saat merge Task 23. |
| 2026-10-05 | 22-A | **Fix bug harga + redesign kartu mobile ala suzuki.co.id**: (1) harga diubah admin tidak tampil di situs/preview — akar masalah `harga_label` basi terkirim ulang dari form; kini label SELALU diturunkan server dari `harga_mulai`, tampilan pakai angka dulu (`carHarga()`), data lama dimigrasi (`scripts/fix-car-data.ts`); (2) kartu mobil didesain ulang mobile-first: grid 2 kolom di HP, foto full-bleed 4:3, nama uppercase, label "MULAI" cukup sekali (sebelumnya ganda), seluruh kartu clickable, tombol panah bulat; (3) foto mobil asli terisi dari `public/car-imgs/`; (4) FAB di HP kini hanya WhatsApp (tidak menutupi kartu); (5) titik warna kartu hanya tampil bila ≥2 warna. Diverifikasi E2E: ubah harga → preview + situs publik langsung benar. |
| 2026-10-05 | 21-A | **Push GitHub sukses + persistensi token (3-layer runtime — usang, lihat §9.1)**: PAT disimpan di remote URL `.git/config`, `~/.git-credentials`, `local-github-token`. Semuanya mati saat reset #4–#6 → diganti brankas Supabase (Task 23). Temuan saat push: commit Task 16 ternyata sudah ada di GitHub sejak sebelum reset → merge `5d66f88` mengembalikan route `/api/admin/upload`, fix gitignore `/upload/`, dan entry worklog Task 16. |
| 2026-10-05 | 20 | **Pulihan reset sandbox ke-3** (`.env` ter-rollback ke SQLite, `db/` hilang, server mati) → koneksi Supabase dipulihkan, dev server hidup lagi, verifikasi E2E ulang (login owner + default 200, dashboard data live via browser, mobile 375px no-overflow, 0 error). Push GitHub saat itu masih tertunda menunggu PAT. |
| 2026-10-04 | 19 | **Pulihan insiden reset sandbox**: repo ter-rollback ke state Task 15 (koneksi Supabase hilang, SQLite lokal kosong) → penyebab login admin gagal total. Pulihkan koneksi Supabase, daftarkan akun owner `naufalsuzuki.bsb@gmail.com` (auth custom, bukan Supabase Auth), tulis ulang README/setup SQL/.env.example/seed script. Semua terverifikasi E2E. |
| 2026-10-04 | 18 | *(hilang saat reset — rekap)* Koneksi LIVE ke Supabase: setup SQL dieksekusi, fix enum `artikel.tipe` (P2032), provider flip postgresql, admin pertama tersalin, verifikasi E2E penuh |
| 2026-10-04 | 17 | *(hilang saat reset — rekap)* Audit DB Supabase existing + skrip setup idempoten `docs/supabase-setup.sql` + runbook koneksi |
| 2026-10-04 | 16 | README handover (14 bab) + fix route upload 404 + fix gitignore `/upload/` + pemulihan insiden DB kosong — **commit-nya ter-push ke GitHub (`b9dc153`)**; reset hanya menghapus salinan lokalnya, di-merge kembali di Task 21 |
| 2026-10-04 | 15 | Push pertama ke GitHub (untrack file runtime; `main` = 17 commit) — satu-satunya commit yang bertahan setelah reset |
| 2026-10-04 | 14 | Paste Tiptap: `allowBase64:true` + h5/h6 lolos sanitizer; CSS `.prose-artikel` diperkuat |
| 2026-10-03 | 13 | Rollback styling/animasi ke gaya asli, tanpa dark mode, halaman promo dihapus |
| 2026-10-03 | 1–12 | Porting penuh dari repo lama → fullstack Next.js 16 (detail utuh di worklog) |

---

*Kalau menemukan ketidaksesuaian antara dokumen dan kode — **kodenya yang
benar**, lalu perbarui dokumen ini (aturan §10).*
