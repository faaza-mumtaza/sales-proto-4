-- ============================================================================
-- SUZUKI BSB WEBSITE — SETUP DATABASE SUPABASE (skrip SEKALI JALAN, idempoten)
-- ============================================================================
-- Project Supabase : wyznuuqpglhddojfwhpw (https://wyznuuqpglhddojfwhpw.supabase.co)
-- STATUS           : SUDAH DIJALANKAN (Task 17/18, diverifikasi ulang Task 19).
--                    File ini dipertahankan sebagai sumber kebenaran DDL —
--                    perubahan schema ke depannya ditambahkan di sini.
-- Cara pakai       : Supabase Dashboard → SQL Editor → New query →
--                    paste SELURUH isi file ini → Run.
--                    (Alternatif: `bunx prisma db execute --file docs/supabase-setup.sql
--                    --url "$DATABASE_URL"` dari server.)
--
-- LATAR BELAKANG
-- --------------
-- Project Supabase ini sebelumnya dipakai repo lama (sales-proto-3, TanStack
-- Start) dan sudah berisi 2 tabel dengan data:
--   - `artikel`       (3 baris)  — tanpa kolom `status` / `scheduled_at`,
--                                  `tags` bertipe array native, `id` uuid,
--                                  `tipe` bertipe ENUM artikel_tipe.
--   - `mobil_katalog` (5 baris)  — tanpa kolom `spesifikasi` / `warna`,
--                                  `galeri_gambar` bertipe array native.
-- Repo ini (sales-proto-4) memakai schema Prisma (`prisma/schema.prisma`)
-- yang merupakan EVOLUSI dari schema lama. Skrip ini menyamakan database ke
-- schema Prisma TANPA membuang data lama:
--
--   1. `artikel`       : + kolom `status` & `scheduled_at`; `tags` (array
--                        native) → teks JSON; `id` uuid → text; kolom waktu
--                        timestamptz → timestamp(3); `tipe` ENUM → text.
--   2. `mobil_katalog` : + kolom `spesifikasi` & `warna`; `galeri_gambar`
--                        (array native) → teks JSON; `id` uuid → text; kolom
--                        waktu timestamptz → timestamp(3).
--   3. 7 TABEL BARU persis schema Prisma: `admins`, `pesan_masuk`,
--      `test_drive`, `testimoni`, `faqs`, `newsletter_subscribers`,
--      `booking_servis` (lengkap FK, unique index, index biasa).
--   4. RLS dinyalakan pada semua tabel baru TANPA policy → endpoint REST
--      Supabase (anon key) tidak bisa membaca/menulis apa pun. Seluruh
--      akses data lewat aplikasi (Prisma, role `postgres` = owner tabel,
--      otomatis bypass RLS).
--
-- Kolom legacy yang SENGAJA dibiarkan (tidak dipakai aplikasi; jangan dihapus
-- tanpa backup): `artikel.is_published`, `artikel.author_id`.
--
-- CATATAN KEAMANAN
-- ----------------
-- Skrip ini tidak memakai API key apa pun. Kredensial SATU-SATUNYA yang
-- dibutuhkan aplikasi adalah connection string PostgreSQL (Project Settings →
-- Database → Connection string), disimpan di `.env` server-side — jangan
-- pernah diekspos ke browser. Key `anon`/`publishable` Supabase tidak dipakai
-- aplikasi ini (lihat README). Akun di menu Authentication (auth.users)
-- Supabase juga TIDAK dipakai — login aplikasi memakai tabel `public.admins`.
--
-- Skrip AMAN DIJALANKAN BERULANG (semua statement dijaga IF NOT EXISTS /
-- pengecekan tipe; terbukti 2x jalan penuh tanpa efek samping). Jika gagal di
-- tengah: perbaiki penyebabnya, jalankan ulang seluruh skrip.
-- ============================================================================


-- ============================================================================
-- A. SAMAKAN TABEL LAMA: `artikel`
-- ============================================================================

-- A1. `id`: uuid → text (parity dengan Prisma `String @id`).
--     Default gen_random_uuid() dihapus — aplikasi (Prisma) yang generate
--     uuid di sisi klien, DB tidak butuh default.
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns
             WHERE table_schema = 'public' AND table_name = 'artikel'
               AND column_name = 'id' AND data_type = 'uuid') THEN
    ALTER TABLE public.artikel ALTER COLUMN "id" DROP DEFAULT;
    ALTER TABLE public.artikel ALTER COLUMN "id" TYPE text USING "id"::text;
  END IF;
END $$;

-- A2. Kolom waktu: timestamptz → timestamp(3) (mapping default Prisma
--     DateTime). Nilai instan dipertahankan (dikonversi pada zona UTC).
DO $$
DECLARE c text;
BEGIN
  FOR c IN SELECT unnest(ARRAY['created_at', 'updated_at', 'published_at']) LOOP
    IF EXISTS (SELECT 1 FROM information_schema.columns
               WHERE table_schema = 'public' AND table_name = 'artikel'
                 AND column_name = c
                 AND data_type = 'timestamp with time zone') THEN
      EXECUTE format('ALTER TABLE public.artikel ALTER COLUMN %I DROP DEFAULT', c);
      EXECUTE format('ALTER TABLE public.artikel ALTER COLUMN %I TYPE timestamp(3) USING %I AT TIME ZONE ''UTC''', c, c);
    END IF;
  END LOOP;
  EXECUTE 'ALTER TABLE public.artikel ALTER COLUMN "created_at" SET DEFAULT CURRENT_TIMESTAMP';
END $$;

-- A3. `tags`: array/json native → TEKS JSON (format yang dipakai aplikasi:
--     '["a","b"]'). Konversi data lama otomatis via to_jsonb.
DO $$
DECLARE t text;
BEGIN
  SELECT data_type INTO t FROM information_schema.columns
   WHERE table_schema = 'public' AND table_name = 'artikel'
     AND column_name = 'tags';
  IF t IN ('ARRAY', 'JSON', 'JSONB') THEN
    EXECUTE 'ALTER TABLE public.artikel ALTER COLUMN "tags" DROP DEFAULT';
    EXECUTE 'ALTER TABLE public.artikel ALTER COLUMN "tags" TYPE text USING to_jsonb("tags")::text';
  END IF;
END $$;
UPDATE public.artikel SET "tags" = '[]' WHERE "tags" IS NULL;
ALTER TABLE public.artikel ALTER COLUMN "tags" SET DEFAULT '[]';
ALTER TABLE public.artikel ALTER COLUMN "tags" SET NOT NULL;

-- A4. Kolom baru milik aplikasi: `status` + `scheduled_at`.
ALTER TABLE public.artikel ADD COLUMN IF NOT EXISTS "status" TEXT NOT NULL DEFAULT 'DRAFT';
ALTER TABLE public.artikel ADD COLUMN IF NOT EXISTS "scheduled_at" TIMESTAMP(3);

-- A5. Backfill SATU KALI: artikel lama yang published → status PUBLISHED.
--     Guard `published_at IS NOT NULL` memastikan artikel DRAFT buatan
--     aplikasi (yang published_at-nya NULL) tidak ikut ter-publish ulang
--     jika skrip dijalankan lagi di kemudian hari.
UPDATE public.artikel
   SET "status" = 'PUBLISHED'
 WHERE "status" = 'DRAFT'
   AND "is_published" IS TRUE
   AND "published_at" IS NOT NULL;

-- A6. `tipe`: ENUM `artikel_tipe` (PROMO|BERITA|KEGIATAN, warisan repo lama,
--      dengan DEFAULT 'BERITA'::artikel_tipe) → TEXT (Prisma String).
--      Tanpa ini Prisma error P2032 "found incompatible value of PROMO".
--      DEFAULT lama dibuang lebih dulu — selain tidak dipakai Prisma
--      (aplikasi selalu mengirim tipe eksplisit), default yang menunjuk ke
--      enum akan menggagalkan konversi & DROP TYPE.
DO $$
BEGIN
  -- 1. Buang DEFAULT yang menunjuk ke enum, jika ada.
  IF EXISTS (SELECT 1 FROM information_schema.columns
             WHERE table_schema = 'public' AND table_name = 'artikel'
               AND column_name = 'tipe'
               AND column_default LIKE '%artikel_tipe%') THEN
    ALTER TABLE public.artikel ALTER COLUMN "tipe" DROP DEFAULT;
  END IF;
  -- 2. Konversi enum → text.
  IF EXISTS (SELECT 1 FROM information_schema.columns
             WHERE table_schema = 'public' AND table_name = 'artikel'
               AND column_name = 'tipe' AND data_type = 'USER-DEFINED') THEN
    ALTER TABLE public.artikel ALTER COLUMN "tipe" TYPE text USING "tipe"::text;
  END IF;
END $$;
-- 3. Buang tipe enum yang sudah tidak dipakai kolom/default mana pun.
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_type t
             JOIN pg_namespace n ON n.oid = t.typnamespace
             WHERE n.nspname = 'public' AND t.typname = 'artikel_tipe')
     AND NOT EXISTS (SELECT 1 FROM information_schema.columns
                     WHERE table_schema = 'public'
                       AND (udt_name = 'artikel_tipe'
                            OR column_default LIKE '%artikel_tipe%')) THEN
    DROP TYPE public.artikel_tipe;
  END IF;
END $$;


-- ============================================================================
-- B. SAMAKAN TABEL LAMA: `mobil_katalog`
-- ============================================================================

-- B1. `id`: uuid → text (sama seperti A1).
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns
             WHERE table_schema = 'public' AND table_name = 'mobil_katalog'
               AND column_name = 'id' AND data_type = 'uuid') THEN
    ALTER TABLE public.mobil_katalog ALTER COLUMN "id" DROP DEFAULT;
    ALTER TABLE public.mobil_katalog ALTER COLUMN "id" TYPE text USING "id"::text;
  END IF;
END $$;

-- B2. Kolom waktu: timestamptz → timestamp(3) (sama seperti A2).
DO $$
DECLARE c text;
BEGIN
  FOR c IN SELECT unnest(ARRAY['created_at', 'updated_at']) LOOP
    IF EXISTS (SELECT 1 FROM information_schema.columns
               WHERE table_schema = 'public' AND table_name = 'mobil_katalog'
                 AND column_name = c
                 AND data_type = 'timestamp with time zone') THEN
      EXECUTE format('ALTER TABLE public.mobil_katalog ALTER COLUMN %I DROP DEFAULT', c);
      EXECUTE format('ALTER TABLE public.mobil_katalog ALTER COLUMN %I TYPE timestamp(3) USING %I AT TIME ZONE ''UTC''', c, c);
    END IF;
  END LOOP;
  EXECUTE 'ALTER TABLE public.mobil_katalog ALTER COLUMN "created_at" SET DEFAULT CURRENT_TIMESTAMP';
END $$;

-- B3. `galeri_gambar`: array/json native → TEKS JSON (sama seperti A3).
DO $$
DECLARE t text;
BEGIN
  SELECT data_type INTO t FROM information_schema.columns
   WHERE table_schema = 'public' AND table_name = 'mobil_katalog'
     AND column_name = 'galeri_gambar';
  IF t IN ('ARRAY', 'JSON', 'JSONB') THEN
    EXECUTE 'ALTER TABLE public.mobil_katalog ALTER COLUMN "galeri_gambar" DROP DEFAULT';
    EXECUTE 'ALTER TABLE public.mobil_katalog ALTER COLUMN "galeri_gambar" TYPE text USING to_jsonb("galeri_gambar")::text';
  END IF;
END $$;
UPDATE public.mobil_katalog SET "galeri_gambar" = '[]' WHERE "galeri_gambar" IS NULL;
ALTER TABLE public.mobil_katalog ALTER COLUMN "galeri_gambar" SET DEFAULT '[]';
ALTER TABLE public.mobil_katalog ALTER COLUMN "galeri_gambar" SET NOT NULL;

-- B4. Kolom baru milik aplikasi: `spesifikasi` & `warna` (teks JSON).
ALTER TABLE public.mobil_katalog ADD COLUMN IF NOT EXISTS "spesifikasi" TEXT NOT NULL DEFAULT '{}';
ALTER TABLE public.mobil_katalog ADD COLUMN IF NOT EXISTS "warna" TEXT NOT NULL DEFAULT '[]';


-- ============================================================================
-- C. TUJUH TABEL BARU (persis `prisma/schema.prisma`)
--    Konvensi mengikuti output Prisma Migrate:
--    String → TEXT, Int → INTEGER, Boolean → BOOLEAN, DateTime → TIMESTAMP(3),
--    unique index `<tabel>_<kolom>_key`, index `<tabel>_<kolom>_idx`,
--    FK `<tabel>_<kolom>_fkey`.
-- ============================================================================

-- C1. admins — akun admin aplikasi (auth custom scrypt, lihat src/lib/auth.ts
--     & src/lib/password.ts). INI BUKAN Supabase Auth (auth.users) — akun di
--     menu Authentication Supabase tidak dipakai aplikasi.
CREATE TABLE IF NOT EXISTS public.admins (
  "id" TEXT NOT NULL PRIMARY KEY,
  "email" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "passwordHash" TEXT NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL
);
CREATE UNIQUE INDEX IF NOT EXISTS "admins_email_key" ON public.admins ("email");

-- C2. pesan_masuk — submit form kontak
CREATE TABLE IF NOT EXISTS public.pesan_masuk (
  "id" TEXT NOT NULL PRIMARY KEY,
  "nama_lengkap" TEXT NOT NULL,
  "no_telepon" TEXT NOT NULL,
  "email" TEXT,
  "subjek" TEXT,
  "pesan" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'BARU',
  "ip_address" TEXT,
  "user_agent" TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL
);

-- C3. test_drive — booking test drive
CREATE TABLE IF NOT EXISTS public.test_drive (
  "id" TEXT NOT NULL PRIMARY KEY,
  "nama_lengkap" TEXT NOT NULL,
  "no_telepon" TEXT NOT NULL,
  "email" TEXT NOT NULL,
  "mobil_id" TEXT,
  "mobil_pilihan" TEXT NOT NULL,
  "tanggal_diinginkan" TIMESTAMP(3) NOT NULL,
  "waktu_diinginkan" TEXT NOT NULL,
  "catatan" TEXT,
  "status" TEXT NOT NULL DEFAULT 'PENDING',
  "ip_address" TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL
);
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint
                 WHERE conname = 'test_drive_mobil_id_fkey'
                   AND conrelid = 'public.test_drive'::regclass) THEN
    ALTER TABLE public.test_drive
      ADD CONSTRAINT "test_drive_mobil_id_fkey"
      FOREIGN KEY ("mobil_id") REFERENCES public.mobil_katalog("id")
      ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;

-- C4. testimoni — ulasan pelanggan (moderasi: PENDING → APPROVED admin)
CREATE TABLE IF NOT EXISTS public.testimoni (
  "id" TEXT NOT NULL PRIMARY KEY,
  "nama" TEXT NOT NULL,
  "rating" INTEGER NOT NULL DEFAULT 5,
  "pesan" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'PENDING',
  "ip_address" TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL
);

-- C5. faqs — FAQ publik
CREATE TABLE IF NOT EXISTS public.faqs (
  "id" TEXT NOT NULL PRIMARY KEY,
  "kategori" TEXT NOT NULL DEFAULT 'umum',
  "pertanyaan" TEXT NOT NULL,
  "jawaban" TEXT NOT NULL,
  "urutan" INTEGER NOT NULL DEFAULT 0,
  "is_published" BOOLEAN NOT NULL DEFAULT true,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL
);
CREATE INDEX IF NOT EXISTS "faqs_is_published_urutan_idx"
  ON public.faqs ("is_published", "urutan");

-- C6. newsletter_subscribers — subscriber newsletter
CREATE TABLE IF NOT EXISTS public.newsletter_subscribers (
  "id" TEXT NOT NULL PRIMARY KEY,
  "email" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'AKTIF',
  "ip_address" TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL
);
CREATE UNIQUE INDEX IF NOT EXISTS "newsletter_subscribers_email_key"
  ON public.newsletter_subscribers ("email");
CREATE INDEX IF NOT EXISTS "newsletter_subscribers_status_created_at_idx"
  ON public.newsletter_subscribers ("status", "created_at");

-- C7. booking_servis — booking servis bengkel
CREATE TABLE IF NOT EXISTS public.booking_servis (
  "id" TEXT NOT NULL PRIMARY KEY,
  "nama_lengkap" TEXT NOT NULL,
  "no_telepon" TEXT NOT NULL,
  "email" TEXT,
  "mobil_pilihan" TEXT NOT NULL,
  "mobil_id" TEXT,
  "jenis_servis" TEXT NOT NULL,
  "tanggal_diinginkan" TIMESTAMP(3) NOT NULL,
  "waktu_diinginkan" TEXT NOT NULL,
  "keluhan" TEXT,
  "status" TEXT NOT NULL DEFAULT 'PENDING',
  "ip_address" TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL
);
CREATE INDEX IF NOT EXISTS "booking_servis_status_tanggal_diinginkan_idx"
  ON public.booking_servis ("status", "tanggal_diinginkan");
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint
                 WHERE conname = 'booking_servis_mobil_id_fkey'
                   AND conrelid = 'public.booking_servis'::regclass) THEN
    ALTER TABLE public.booking_servis
      ADD CONSTRAINT "booking_servis_mobil_id_fkey"
      FOREIGN KEY ("mobil_id") REFERENCES public.mobil_katalog("id")
      ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;


-- ============================================================================
-- D. KEAMANAN: nyalakan RLS pada semua TABEL BARU (tanpa policy)
-- ============================================================================
-- Efeknya: endpoint REST Supabase (key anon/publishable — yang memang
-- publik oleh desain) TIDAK BISA membaca/menulis tabel-tabel ini sama sekali.
-- Termasuk tabel `admins` (berisi hash password — wajib terkunci).
-- Aplikasi tidak terpengaruh: Prisma connect sebagai role `postgres`
-- (owner tabel) yang bypass RLS.
--
-- Tabel lama `artikel` & `mobil_katalog` dibiarkan dengan policy lama milik
-- repo sales-proto-3 (anon bisa baca — konten publik, tidak masalah).
-- Kalau mau mengaudit policy yang ada, jalankan query di bagian VERIFIKASI.

ALTER TABLE public.admins                 ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pesan_masuk            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.test_drive             ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.testimoni              ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.faqs                   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.newsletter_subscribers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.booking_servis         ENABLE ROW LEVEL SECURITY;


-- ============================================================================
-- VERIFIKASI (boleh dijalankan ulang kapan saja)
-- ============================================================================

-- 1. Jumlah baris per tabel:
-- SELECT 'artikel' AS tabel, count(*) FROM public.artikel
-- UNION ALL SELECT 'mobil_katalog', count(*) FROM public.mobil_katalog
-- UNION ALL SELECT 'admins', count(*) FROM public.admins
-- UNION ALL SELECT 'pesan_masuk', count(*) FROM public.pesan_masuk
-- UNION ALL SELECT 'test_drive', count(*) FROM public.test_drive
-- UNION ALL SELECT 'testimoni', count(*) FROM public.testimoni
-- UNION ALL SELECT 'faqs', count(*) FROM public.faqs
-- UNION ALL SELECT 'newsletter_subscribers', count(*) FROM public.newsletter_subscribers
-- UNION ALL SELECT 'booking_servis', count(*) FROM public.booking_servis;

-- 2. Semua artikel lama harusnya berstatus PUBLISHED dan tags berupa teks JSON:
-- SELECT "slug", "status", "tags" FROM public.artikel ORDER BY "created_at";

-- 3. Status RLS per tabel (kolom `rowsecurity` harus `true` untuk 7 tabel baru):
-- SELECT tablename, rowsecurity FROM pg_tables
--  WHERE schemaname = 'public' ORDER BY tablename;

-- 4. Audit policy pada tabel lama (warisan repo sales-proto-3):
-- SELECT tablename, policyname, cmd, roles FROM pg_policies
--  WHERE schemaname = 'public' ORDER BY tablename, policyname;

-- ============================================================================
-- OPS CONFIG (Task 23) — brankas PAT GitHub & konfigurasi operasional
-- Dibuat otomatis oleh scripts/ops-config.ts (idempoten). Jangan simpan
-- nilai rahasia di file git — hanya di tabel ini (DB eksternal).
-- ============================================================================
CREATE TABLE IF NOT EXISTS ops_config (
  key        TEXT PRIMARY KEY,
  value      TEXT NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
