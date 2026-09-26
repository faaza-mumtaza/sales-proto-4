# Worklog — Suzuki Dealer Fullstack Website (sales-proto-3)

Proyek: Website dealer Suzuki "BSB Semarang" fullstack (publik + admin) dibangun di sandbox Next.js 16 (`/home/z/my-project`), diporting dari repo lama `sales-proto-3` (TanStack Start + Supabase) sesuai blueprint user.

## Keputusan Arsitektur (Penting untuk agent berikutnya)
- **Stack**: Next.js 16 App Router + TypeScript + Tailwind 4 + shadcn/ui + Prisma (SQLite di sandbox, schema portable ke Supabase Postgres utk production) + TanStack Query + Tiptap v3 + sonner + zod.
- **Routing**: Preview sandbox HANYA route `/`. Seluruh website = SPA di `src/app/page.tsx` dengan **hash router** (`#/mobil`, `#/artikel/slug`, `#/admin`, dll). JANGAN bikin page route lain. API routes di `src/app/api/**` boleh & wajib (bukan page).
- **Auth**: custom session cookie (`suzuki_admin_session`, HMAC-signed token, HttpOnly, SameSite=Lax, 7 hari) + scrypt password hash. Lib: `src/lib/auth.ts` (server-only). Semua `/api/admin/**` dilindungi `requireAdmin()` kecuali `/api/admin/login`.
- **Anti-spam**: math captcha server-side (`/api/captcha`, lib `src/lib/captcha.ts`, TTL 5 menit) + honeypot field `website` + rate limit per IP in-memory (`src/lib/rate-limit.ts`). Turnstile-ready (skip di sandbox karena butuh key).
- **Storage gambar**: upload via `/api/admin/upload` (base64 JSON) → disimpan di `db/uploads/` (BUKAN di source code, sudah .gitignore) → diserve publik via `/api/files/[...path]`. Abstraksi mudah diganti Supabase Storage saat production.
- **Scheduled publish artikel**: status `TERJADWAL` + `scheduled_at`; di-publish otomatis (lazy) saat query publik artikel.
- **Field DB snake_case** mengikuti kode lama (nama_lengkap, dsb.) supaya porting UI minim perubahan.
- Seed data mobil memakai URL gambar asli dari CMS dealer (`cms.suzukihyperlocal.com` — terverifikasi reachable).
- **JANGAN set X-Frame-Options restriktif** — preview panel adalah iframe cross-origin; akan merusak preview.
- Default admin (seed): `admin@suzukibsb.id` / `SuzukiBSB#2025` (user WAJIB ganti di production).

## Struktur File (target)
```
prisma/schema.prisma           — Admin, Mobil, Artikel, Pesan, TestDrive
prisma/seed.ts                 — seed admin + mobil + artikel
src/lib/ (server): auth.ts, rate-limit.ts, captcha.ts, storage.ts, sanitize.ts, validations.ts, db.ts (ada)
src/lib/ (client): router.tsx, api.ts, site-utils.ts
src/app/api/...
src/components/site/...  (header, footer, hero-section, car-card, car-catalog, floating-buttons, site-layout)
src/components/forms/... (contact-form, test-drive-form, captcha-challenge)
src/components/admin/... (admin-shell, car-form, artikel-editor, image-uploader)
src/views/ (public + admin views, di-switch oleh router di page.tsx)
src/app/page.tsx         — SPA entry ('use client'), QueryClientProvider + Toaster + Router
src/app/layout.tsx       — metadata SEO, font Poppins
src/app/globals.css      — tema Suzuki (red #e32322, navy #1a2942) porting dari repo lama
src/app/sitemap.ts       — sitemap dinamis
```

---
Task ID: 1
Agent: main (Z.ai Code)
Task: Clone repo sales-proto-3, analisis kode lama, susun rencana implementasi blueprint fullstack Suzuki dealer website

Work Log:
- Clone repo & extract `sales-proto-2-main.zip` ke `/home/z/sales-proto-3/extracted/`
- Analisis lengkap: project lama = TanStack Start + Vite + Supabase (auth/DB/storage) + Tiptap + react-hook-form + zod
- Baca seluruh komponen penting: site (header/footer/hero/car-card/car-catalog/floating/site-layout), forms (contact/test-drive/turnstile), admin (car-form/artikel-editor/image-uploader, shell, dashboard, list katalog/pesan/test-drive), routes publik (home/mobil/artikel/promo→redirect/tentang-kami/kontak/auth), lib (site-utils, validations), supabase migrations (schema lengkap + RLS)
- Cek sandbox: Next.js 16.1.1 siap, dev server jalan port 3000, Prisma terpasang, zod v4, TanStack Query, sonner, shadcn/ui lengkap
- Test reachability URL gambar CMS dealer → OK (200)
- Install deps baru: @tiptap/react@3.31.3, @tiptap/starter-kit, @tiptap/extension-image, @tiptap/extension-link, sanitize-html@2.17.7, slugify, @types/sanitize-html

Stage Summary:
- Kode lama sepenuhnya dipahami; desain & copywriting Suzuki BSB dipertahankan
- Arsitektur single-route SPA + API + Prisma SQLite diputuskan (lihat bagian keputusan di atas)
- Siap implementasi: schema → seed → API → frontend publik → admin → security → QA

---
Task ID: 2
Agent: main (Z.ai Code)
Task: Implementasi fullstack lengkap sesuai blueprint (DB, API, frontend publik, admin, security, SEO)

Work Log:
- **Database**: schema Prisma (Admin, Mobil, Artikel, Pesan, TestDrive — field snake_case sesuai kode legacy, tabel @map untuk portabilitas Postgres), db push, seed 9 mobil (data asli dari site lama: nama/harga/kategori/gambar CMS), 6 artikel (5 published + 1 TERJADWAL utk demo auto-publish), admin (scrypt), 2 pesan & 2 test drive contoh. Generate 6 cover artikel via image-generation skill (db/uploads/seed/*.png).
- **Infra server** (`src/lib/`): password.ts (scrypt), auth.ts (session HMAC HttpOnly cookie + requireAdmin), rate-limit.ts & captcha.ts (globalThis store — fix module-instance-per-route di Next dev!), storage.ts (upload db/uploads + serve /api/files + anti path-traversal), sanitize.ts (sanitize-html allowlist), validations.ts (zod v4), serializers.ts (DTO + publishDueArtikels lazy).
- **API publik**: GET /api/cars, /api/cars/[slug], /api/articles?tipe=, /api/articles/[slug] (+views+related), /api/captcha; POST /api/contact, /api/test-drive (rate-limit 5/10m + honeypot + math-captcha/Turnstile-ready + zod + validasi mobil_id ke DB).
- **API admin** (semua requireAdmin kecuali login): login/logout/me (rate-limited 10/15m), stats (dashboard), cars & articles (GET/POST/PUT/DELETE + slug-duplikat 409 + sanitasi konten + status DRAFT/TERJADWAL/PUBLISHED), messages & test-drives (GET/PATCH/DELETE), upload (base64→storage, 5MB, tipe gambar saja).
- **Frontend publik** (SPA hash-router di page.tsx): Header/Footer/SiteLayout (sticky footer flex+mt-auto), Hero, CarCatalog (filter+search), CarCard, ArticleCard, states (skeleton/error/empty); views: Home, Mobil, MobilDetail (galeri+specs+related+CTA), Artikel, ArtikelDetail (prose+share+related), Promo, TentangKami, Kontak (2 tab form + Google Maps), NotFound.
- **Admin**: AdminShell (sidebar+guard /api/admin/me+logout), Login, Dashboard (4 kartu statistik klikabel + pesan terbaru + jadwal terdekat), Katalog (tabel desktop/kartu mobile, toggle tampil/sembunyi, search), CarForm (spesifikasi dinamis + ImageUploader + GalleryUploader + preview), Artikel (list + filter status + search), ArtikelEditor (Tiptap v3: bold/italic/H1/H2/list/quote/link/upload-gambar + status draft/terjadwal/publish + preview), Pesan (ubah status + Balas WA wa.me + hapus), TestDrive (konfirmasi/batalkan/selesai + ringkasan jadwal + filter tanggal + WA).
- **Keamanan**: security headers via next.config (CSP, nosniff, referrer-policy, permissions-policy — X-Frame-Options sengaja tidak dibatasi demi preview iframe), /api/* no-store, validasi zod semua input, sanitasi XSS teruji (script/onclick/javascript: dibuang), rate-limit teruji (429), path traversal 404, cookie HttpOnly+SameSite.
- **SEO**: metadata lengkap di layout (OG/twitter/keywords/favicon Poppins), usePageMeta per-view, sitemap.ts dinamis (mobil+artikel), robots.txt (disallow /api & admin).
- **Bug diperbaiki saat QA**: (1) login baca admin.password_hash padahal field passwordHash; (2) captcha/rate-limit Map tidak shared antar route → globalThis; (3) zod v4 preprocess→undefined tidak lolos .optional() luar → inner .optional(); (4) cache TanStack admin/me stale → redirect loop login → setQueryData sinkron + staleTime 0; (5) hydration mismatch hash-router → useSyncExternalStore dengan getServerSnapshot.

Stage Summary:
- Seluruh blueprint terimplementasi dan TERUJI end-to-end via curl + agent-browser:
  - Admin tambah mobil (BALENO) via UI → DB → langsung muncul di katalog publik + detail ✓
  - Admin tulis promo via editor Tiptap → PUBLISHED → langsung muncul di halaman promo ✓
  - Form kontak & test drive via browser + captcha → DB → muncul di dashboard admin ✓
  - Ubah status pesan (DIBALAS) & konfirmasi booking (CONFIRMED) via UI → tersimpan ✓
  - Guard admin (401/redirect), sanitasi XSS, rate limit, path traversal, validasi tanggal ✓
- Verifikasi VLM (desktop+mobile): tampilan profesional, branding Suzuki konsisten, layout rapi tanpa overlap, admin ramah non-teknis. Fallback gambar bekerja (Baleno lalu dilengkapi gambar asli via image-search).
- Responsif: tanpa horizontal overflow di 375px & 1440px; sticky footer terverifikasi (tanpa celah di bawah footer).
- Lint bersih, dev.log bersih (2 warning lama saat hot-reload mid-edit), sitemap+robots jalan.
- Kredensial admin: **admin@suzukibsb.id / SuzukiBSB#2025** (ganti untuk production!).

### Status saat ini: SEMUA fitur blueprint UTAMA selesai & terverifikasi.
### Sisa / rekomendasi fase berikutnya:
1. Detail styling lanjutan (animasi scroll-reveal, skeleton halaman detail, empty-state ilustrasi).
2. Fitur tambahan: pencarian artikel, pagination/filter harga katalog, export CSV pesan/booking, notifikasi WA otomatis (deep link API), galeri warna per mobil.
3. Migrasi production: ganti provider sqlite→postgresql + DATABASE_URL Supabase, NEXT_PUBLIC_SITE_URL, ADMIN_SESSION_SECRET kuat, ganti password admin, pasang TURNSTILE_SECRET_KEY, pertimbangkan next/image untuk optimasi gambar.
4. Uji beban & Lighthouse setelah deploy Vercel.

---
Task ID: 3
Agent: main (Z.ai Code)
Task: QA menyeluruh fase sebelumnya via agent-browser, lalu peningkatan styling menyeluruh + fitur baru (pencarian artikel, sort katalog, simulasi kredit, export CSV, badge notifikasi admin)

Work Log:
- **QA ulang seluruh aplikasi** (fase sebelumnya): home, katalog+search, detail mobil, list+detail artikel, form kontak dengan captcha (pesan masuk DB & tampil di dashboard), guard admin→login, login, dashboard, ubah status, responsif 375px & 1440px tanpa horizontal overflow. Semua fungsi inti TERVERIFIKASI jalan. Lint & dev.log bersih. Temuan minor: 1 artikel demo tanpa cover image tampil polos.
- **Styling (global)**: tambah keyframes & util CSS di globals.css (fade-in-up/fade/scale/float/shimmer/badge-pop, .reveal + .page-enter, .card-accent garis aksen merah saat hover, .pattern-dots fallback cover, :focus-visible ring konsisten, .decoration, semua di-disable otomatis via prefers-reduced-motion).
- **Komponen baru**:
  - `src/components/site/reveal.tsx` — scroll-reveal IntersectionObserver TANPA state React (kelas is-visible via DOM langsung → lolos rule react-hooks/set-state-in-effect, tanpa hydration mismatch, fallback browser lawas).
  - `src/components/site/section-heading.tsx` — heading section konsisten dgn aksen bar merah (align center/left + slot action).
  - `src/components/site/credit-simulator.tsx` — kalkulator simulasi kredit (DP slider 10–50%, tenor 1–6 th, bunga flat 1–12% adjustable, hasil live: angsuran/pokok/total; CTA "Ajukan Simulasi Ini" → form kontak dengan prefill).
  - `src/lib/csv.ts` — util export CSV client-side (escaping kutip, anti CSV-injection prefiks ' untuk sel berawalan =+-@, BOM UTF-8 utk Excel).
- **Polish styling**: hero (Reveal zoom/up, badge shimmer, underline SVG "Impian Anda", tombol hover shadow+lift+active scale, dekorasi floaty); car-card & article-card (hover lift + shadow + zoom gambar + card-accent + judul berubah merah); fallback cover artikel (gradient navy + pattern dots + ikon per tipe PROMO/BERITA/KEGIATAN); states.tsx (ikon lucide AlertTriangle/Inbox/SearchX, ring halus, tombol retry dengan ikon reload + active scale, EmptyState dengan hint); transisi antar halaman (.page-enter di page.tsx semua route); header section semua halaman publik dgn aksen bar + dekorasi blur; overlay admin mobile + backdrop-blur.
- **Fitur baru halaman publik**:
  - Artikel: pencarian (judul/ringkasan/tags) + filter chip tag (12 tag terpopuler, toggle) + counter hasil "Menampilkan X dari Y artikel" + tombol reset filter + empty-state khusus pencarian.
  - Katalog mobil: dropdown urutkan (standar/harga terendah/tertinggi/nama A–Z) + counter jumlah mobil.
  - Detail mobil: panel Simulasi Kredit (collapsible, default tertutup; perhitungan diverifikasi: Ertiga Hybrid 293,2jt DP20% → angsuran 4.788.933/bln; DP30% → 4.190.317) + spesifikasi row hover + gallery dot scale.
  - Detail artikel: tombol "Salin Tautan" (Clipboard API + fallback execCommand, state berubah "Tersalin!") + fallback cover di halaman (gradient+pattern).
  - Kontak: dukungan query param ?subjek= & ?pesan= untuk prefill form (dipakai CTA simulasi kredit).
- **Fitur baru admin**:
  - Sidebar: badge notifikasi merah (jumlah pesan BARU & booking PENDING, poll /api/admin/stats tiap 60 dtk, animasi badge-pop, aria-label, cap 99+).
  - Pesan Masuk & Test Drive: tombol "Export CSV" (menghormati filter aktif; file terverifikasi: header benar, escaping kutip benar, BOM UTF-8 ada; nama file带 tanggal).
- **Bug diperbaiki selama development**: (1) import typo sementara @components-null di artikel-detail-view → langsung dibersihkan; (2) 3 error lint react-compiler (setState-in-effect di Reveal → refactor ke DOM-class manipulation; exportCsv direferensikan sebelum useMemo filtered → dipindah setelahnya); (3) stray </div> di tentang-kami setelah refactor Reveal.

Stage Summary:
- QA fase sebelumnya: SEMUA fitur blueprint tetap berfungsi (tidak ada regresi).
- 5 fitur baru aktif & terverifikasi end-to-end via agent-browser:
  1. Pencarian artikel + filter tag (uji: "test drive" → 3 hasil; tag #kredit → 1 hasil)
  2. Sort katalog (uji price-asc: 183,7jt → 185,1jt → 188,9jt urut benar)
  3. Simulasi kredit: matematika benar, slider live-update, prefill form kontak terverifikasi sampai DB (pesan "Simulasi Tester" dgn subjek "Simulasi Kredit" tersimpan)
  4. Export CSV pesan (file ~/Downloads terdownload, isi valid) & booking (blob CSV terverifikasi via intercept; toast "4 booking diexport")
  5. Badge sidebar admin (3 pesan BARU, 2 booking PENDING sesuai stats) + tombol salin tautan artikel (state "Tersalin!" OK)
- VLM review visual (desktop): home & detail+simulator dinilai profesional, rapi tanpa overlap, branding konsisten.
- Responsif: 375px tanpa overflow di semua halaman termasuk halaman baru (artikel search, sort, simulator, kontak prefill, admin).
- Lint BERSIH (0 error), dev.log bersih, sanity sweep 9 halaman publik + 4 halaman admin semua OK.

### Status saat ini: blueprint lengkap + fase polish styling & 5 fitur tambahan selesai & terverifikasi.
### Sisa / rekomendasi fase berikutnya:
1. Fitur lanjutan opsional: galeri warna per mobil, pagination "muat lagi" artikel (saat jumlah sudah banyak), notifikasi email/WA otomatis ke admin saat ada pesan/booking baru, dashboard grafik tren per bulan.
2. Migrasi production (dari fase sebelumnya, belum berubah): postgresql + DATABASE_URL Supabase, NEXT_PUBLIC_SITE_URL, ADMIN_SESSION_SECRET kuat, ganti password admin, TURNSTILE_SECRET_KEY, pertimbangkan next/image.
3. Data demo "QA Tester"/"Simulasi Tester"/"QA Browser Tester" di DB sengaja dibiarkan sebagai contoh — bisa dihapus via UI admin (tombol hapus) sebelum go-live.
