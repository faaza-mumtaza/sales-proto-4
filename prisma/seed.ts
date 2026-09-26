// Seed database: admin, katalog mobil, artikel, contoh pesan & test drive.
// Jalankan: bun prisma/seed.ts

import { PrismaClient } from "@prisma/client";
import { hashPassword } from "../src/lib/password";

const db = new PrismaClient();

const CMS = (p: string) => `https://cms.suzukihyperlocal.com/read-file?path=${p}`;

function daysAgo(n: number): Date {
  const d = new Date();
  d.setDate(d.getDate() - n);
  d.setHours(10, 30, 0, 0);
  return d;
}

function daysFromNow(n: number, hour = 10): Date {
  const d = new Date();
  d.setDate(d.getDate() + n);
  d.setHours(hour, 0, 0, 0);
  return d;
}

async function main() {
  // ------------------------------------------------------------------ ADMIN
  const adminEmail = process.env.ADMIN_EMAIL ?? "admin@suzukibsb.id";
  const adminPass = process.env.ADMIN_PASSWORD ?? "SuzukiBSB#2025";
  const passwordHash = await hashPassword(adminPass);
  await db.admin.upsert({
    where: { email: adminEmail },
    update: { passwordHash },
    create: { email: adminEmail, name: "Admin Suzuki BSB", passwordHash },
  });
  console.log(`✔ Admin siap: ${adminEmail}`);

  // ------------------------------------------------------------------ MOBIL
  const cars = [
    {
      nama: "GRAND VITARA",
      slug: "grand-vitara",
      kategori: "passenger",
      kategori_label: "SUV HIGH",
      harga_mulai: 422900000,
      harga_label: "Rp. 422.900.000",
      seater: 5,
      fuel: "Hybrid",
      transmission: "AT",
      urutan: 10,
      is_new: false,
      deskripsi:
        "SUV premium dengan teknologi AllGrip dan sistem Hybrid yang menghadirkan performa bertenaga namun efisien. Dilengkapi fitur keselamatan lengkap serta panorama sunroof untuk kenyamanan maksimal.",
      spesifikasi: [
        { label: "Mesin", value: "K15C 1.462cc Mild Hybrid" },
        { label: "Tenaga", value: "115 PS" },
        { label: "Torsi", value: "138 Nm" },
        { label: "Transmisi", value: "6 AT" },
        { label: "Penggerak", value: "AllGrip (AWD opsional)" },
      ],
      gambar_utama: CMS("images/car-color/59/1763722840-GX.png"),
    },
    {
      nama: "NEW XL7 HYBRID",
      slug: "new-xl7-hybrid",
      kategori: "passenger",
      kategori_label: "SUV MEDIUM",
      harga_mulai: 283700000,
      harga_label: "Rp. 283.700.000",
      seater: 7,
      fuel: "Hybrid",
      transmission: "AT",
      urutan: 20,
      is_new: false,
      deskripsi:
        "LMPV SUV 7 penumpang favorit keluarga Indonesia kini dengan teknologi Hybrid. Kabin lega, fitur hiburan lengkap dengan head unit layar sentuh, dan aksesori.resmi Suzuki.",
      spesifikasi: [
        { label: "Mesin", value: "K15C 1.462cc Hybrid" },
        { label: "Tenaga", value: "111 PS" },
        { label: "Torsi", value: "138 Nm" },
        { label: "Transmisi", value: "6 AT" },
        { label: "Kursi", value: "7 Penumpang" },
      ],
      gambar_utama: CMS("images/car-color/62/01_Suzuki%20XL7%20ALPHA%20KURO-KURO.png"),
    },
    {
      nama: "FRONX HYBRID",
      slug: "fronx-hybrid",
      kategori: "passenger",
      kategori_label: "SUV MEDIUM",
      harga_mulai: 289100000,
      harga_label: "Rp. 289.100.000",
      seater: 5,
      fuel: "Hybrid",
      transmission: "AT",
      urutan: 30,
      is_new: true,
      deskripsi:
        "SUV crossover stylish dengan desain futuristik dan mesin Hybrid efisien. Ideal untuk mobilitas urban yang dinamis dengan fitur keselamatan terkini.",
      spesifikasi: [
        { label: "Mesin", value: "K15C 1.462cc Hybrid" },
        { label: "Tenaga", value: "111 PS" },
        { label: "Torsi", value: "138 Nm" },
        { label: "Transmisi", value: "6 AT / AGS" },
        { label: "Fitur Unggulan", value: "Head Unit 9-inch, 6 Airbag" },
      ],
      gambar_utama: CMS(
        "images/car-color/63/01_Suzuki%20FRONX%20SGX%20Exterior%2045%E2%94%AC%E2%95%91%20front%20side%20[ICE%20GRAYISH%20BLUE]%20copy-SGX.png",
      ),
    },
    {
      nama: "ALL NEW ERTIGA HYBRID",
      slug: "all-new-ertiga-hybrid",
      kategori: "passenger",
      kategori_label: "LMPV",
      harga_mulai: 293200000,
      harga_label: "Rp. 293.200.000",
      seater: 7,
      fuel: "Hybrid",
      transmission: "AT",
      urutan: 40,
      is_new: true,
      deskripsi:
        "All New Ertiga Hybrid — LMPV 7 penumpang paling diminati dengan konsumsi BBM semakin irit, desain elegan, dan fitur keamanan ESP + Hill Hold Control.",
      spesifikasi: [
        { label: "Mesin", value: "K15C 1.462cc Hybrid" },
        { label: "Tenaga", value: "111 PS" },
        { label: "Torsi", value: "138 Nm" },
        { label: "Transmisi", value: "5 MT / 6 AT" },
        { label: "Kursi", value: "7 Penumpang" },
      ],
      gambar_utama: CMS("images/car-color/51/PEARL_SNOW_WHITE-CRUISE.webp"),
    },
    {
      nama: "ALL NEW ERTIGA",
      slug: "all-new-ertiga",
      kategori: "passenger",
      kategori_label: "LMPV",
      harga_mulai: 236100000,
      harga_label: "Rp. 236.100.000",
      seater: 7,
      fuel: "Bensin",
      transmission: "MT/AT",
      urutan: 50,
      is_new: false,
      deskripsi:
        "Mobil keluarga idaman dengan kabin lega dan tangki BBM besar. Pilihan transmisi manual dan otomatis dengan biaya perawatan terjangkau.",
      spesifikasi: [
        { label: "Mesin", value: "K15B 1.462cc" },
        { label: "Tenaga", value: "105 PS" },
        { label: "Torsi", value: "138 Nm" },
        { label: "Transmisi", value: "5 MT / 4 AT" },
        { label: "Kursi", value: "7 Penumpang" },
      ],
      gambar_utama: CMS("images/car-color/1/Cool-Black-Metalic-ALL_NEW_ERTIGA.webp"),
    },
    {
      nama: "JIMNY",
      slug: "jimny",
      kategori: "passenger",
      kategori_label: "SUV COMPACT",
      harga_mulai: 496200000,
      harga_label: "Rp. 496.200.000",
      seater: 5,
      fuel: "Bensin",
      transmission: "MT/AT",
      urutan: 60,
      is_new: false,
      deskripsi:
        "Ikon SUV off-road compact dengan ladder frame dan 4WD AllGrip Pro. Siap menemani petualangan Anda di segala medan dengan gaya yang ikonik.",
      spesifikasi: [
        { label: "Mesin", value: "K15B 1.462cc" },
        { label: "Tenaga", value: "102 PS" },
        { label: "Torsi", value: "130 Nm" },
        { label: "Transmisi", value: "5 MT / 4 AT" },
        { label: "Penggerak", value: "AllGrip Pro 4WD" },
      ],
      gambar_utama: CMS("images/car-color/8/JIMNY_Frontal_Limited_Edition_WHITE-JIMNY_5-DOORS.webp"),
    },
    {
      nama: "S-PRESSO",
      slug: "s-presso",
      kategori: "passenger",
      kategori_label: "CITY CAR",
      harga_mulai: 188900000,
      harga_label: "Rp. 188.900.000",
      seater: 4,
      fuel: "Bensin",
      transmission: "MT/AT",
      urutan: 70,
      is_new: false,
      deskripsi:
        "City car compact dengan ground clearance tinggi — lincah di kota, percaya diri di jalan berlubang. Hemat BBM dan mudah diparkir.",
      spesifikasi: [
        { label: "Mesin", value: "K10C 1.000cc" },
        { label: "Tenaga", value: "67 PS" },
        { label: "Torsi", value: "89 Nm" },
        { label: "Transmisi", value: "5 MT / 5 AGS" },
        { label: "Fitur", value: "Touchscreen, Dual Airbag" },
      ],
      gambar_utama: CMS("images/car-color/53/Sizzle_Orange-White-S-PRESSO.webp"),
    },
    {
      nama: "APV ARENA",
      slug: "apv-arena",
      kategori: "commercial",
      kategori_label: "COMMERCIAL MPV",
      harga_mulai: 183700000,
      harga_label: "Rp. 183.700.000",
      seater: 8,
      fuel: "Bensin",
      transmission: "MT",
      urutan: 80,
      is_new: false,
      deskripsi:
        "MPV komersial serba bisa untuk keluarga besar maupun usaha antar jemput. Kabin lapang, perawatan ekonomis, dan jaringan service resmi luas.",
      spesifikasi: [
        { label: "Mesin", value: "G16A 1.586cc" },
        { label: "Tenaga", value: "110 PS" },
        { label: "Torsi", value: "144 Nm" },
        { label: "Transmisi", value: "5 MT" },
        { label: "Kursi", value: "8 Penumpang" },
      ],
      gambar_utama: CMS("images/car-color/10/red-APV_ARENA.webp"),
    },
    {
      nama: "NEW CARRY PICK UP",
      slug: "new-carry-pick-up",
      kategori: "commercial",
      kategori_label: "PICK UP",
      harga_mulai: 185100000,
      harga_label: "Rp. 185.100.000",
      seater: 2,
      fuel: "Bensin",
      transmission: "MT",
      urutan: 90,
      is_new: false,
      deskripsi:
        "Pick up komersial paling laku di kelasnya — kuat, irit, dan siap dukung mobilitas usaha Anda. Bak muat besar dengan suspensi kokoh.",
      spesifikasi: [
        { label: "Mesin", value: "K10C 1.000cc" },
        { label: "Tenaga", value: "73 PS" },
        { label: "Torsi", value: "92 Nm" },
        { label: "Transmisi", value: "5 MT" },
        { label: "Daya Angkut", value: "± 950 kg" },
      ],
      gambar_utama: CMS("images/car-color/13/White-NEW_CARRY_PICK-UP.webp"),
    },
  ];

  for (const c of cars) {
    const { spesifikasi, ...rest } = c;
    await db.mobil.upsert({
      where: { slug: c.slug },
      update: {},
      create: {
        ...rest,
        spesifikasi: JSON.stringify(spesifikasi),
        galeri_gambar: JSON.stringify([c.gambar_utama]),
        is_published: true,
      },
    });
  }
  console.log(`✔ ${cars.length} mobil ter-seed`);

  // ------------------------------------------------------------------ ARTIKEL
  const articles = [
    {
      judul: "Promo DP Ringan & Angsuran Mulai Rp 3 Jutaan untuk Semua Tipe Suzuki",
      slug: "promo-dp-ringan-angsuran-3-jutaan",
      tipe: "PROMO",
      ringkasan:
        "Nikmati promo ujung bulan di Suzuki BSB Semarang: DP ringan, angsuran mulai Rp 3 jutaan, dan gratis aksesoris untuk semua tipe. Berlaku hingga akhir bulan ini!",
      cover_image: "/api/files/seed/promo-dp-ringan.png",
      tags: ["promo", "kredit", "dp-ringan"],
      status: "PUBLISHED",
      published_at: daysAgo(3),
      konten: `<h2>Promo Ujung Bulan Suzuki BSB Semarang</h2><p>Bulan ini adalah waktu terbaik untuk membawa pulang mobil Suzuki impian Anda. Suzuki BSB Semarang menghadirkan penawaran spesial untuk <strong>semua tipe</strong> — dari city car S-PRESSO hingga SUV ikonik GRAND VITARA.</p><h3>Keuntungan Promo Ini</h3><ul><li>DP ringan mulai dari Rp 10 jutaan</li><li>Angsuran mulai Rp 3 jutaan per bulan</li><li>Gratis aksesoris resmi senilai jutaan rupiah</li><li>Proses kredit cepat dan transparan</li></ul><h3>Syarat & Ketentuan</h3><p>Promo berlaku untuk pembelian unit stok selama bulan berjalan, dengan tenor dan skema pembiayaan menyesuaikan lembaga keuangan mitra. Simulasi kredit <strong>gratis</strong> tanpa kewajiban — langsung hubungi sales kami via WhatsApp.</p><blockquote>Tim kami siap membantu menghitung simulasi kredit sesuai budget Anda.</blockquote><p>Jangan lewatkan kesempatan ini — kunjungi showroom kami di Mijen, Semarang atau hubungi sales consultant kami sekarang!</p>`,
    },
    {
      judul: "Gratis Servis Berkala 3 Tahun untuk Setiap Unit Baru Suzuki",
      slug: "gratis-servis-berkala-3-tahun",
      tipe: "PROMO",
      ringkasan:
        "Setiap pembelian unit baru di Suzuki BSB Semarang kini mendapatkan gratis biaya jasa servis berkala selama 3 tahun. Wujud purna jual terbaik dari dealer resmi.",
      cover_image: "/api/files/seed/promo-service.png",
      tags: ["promo", "service", "purna-jual"],
      status: "PUBLISHED",
      published_at: daysAgo(6),
      konten: `<h2>Purna Jual Terbaik dari Dealer Resmi</h2><p>Suzuki BSB Semarang berkomitmen menjaga performa kendaraan Anda setelah pembelian. Kini setiap unit baru yang dibeli di dealer kami mendapatkan <strong>gratis biaya jasa servis berkala selama 3 tahun atau 30.000 km</strong> (mana yang lebih dulu tercapai).</p><h3>Yang Anda Dapatkan</h3><ul><li>Gratis biaya jasa servis berkala 3 tahun</li><li>Teknisi bersertifikat Suzuki</li><li>Spare part asli bergaransi resmi</li><li>Booking service mudah via WhatsApp</li></ul><p>Servis berkala sangat penting untuk menjaga garansi mobil Anda. Dengan program ini, Anda tidak perlu khawatir biaya perawatan di tahun-tahun awal pemakaian.</p><p>Hubungi kami untuk info lengkap atau <em>booking service</em> sekarang.</p>`,
    },
    {
      judul: "Suzuki Perkuat Lineup Hybrid, Semua Model Andalan Kini Lebih Irit",
      slug: "suzuki-perkuat-lineup-hybrid",
      tipe: "BERITA",
      ringkasan:
        "Teknologi hybrid kini hadir di Ertiga, XL7, Fronx, hingga Grand Vitara. Konsumsi BBM lebih irit tanpa mengorbankan performa — simak selengkapnya.",
      cover_image: "/api/files/seed/berita-hybrid.png",
      tags: ["hybrid", "berita", "teknologi"],
      status: "PUBLISHED",
      published_at: daysAgo(8),
      konten: `<h2>Era Hybrid Suzuki di Indonesia</h2><p>Suzuki Indonesia semakin serius menghadirkan teknologi hemat bahan bakar. Setelah sukses dengan Ertiga Hybrid dan XL7 Hybrid, kini giliran FRONX HYBRID dan GRAND VITARA melengkapi lineup di dealer resmi, termasuk Suzuki BSB Semarang.</p><h3>Keunggulan Teknologi Hybrid Suzuki</h3><ul><li>Torsi listrik membantu akselerasi di putaran rendah</li><li>Konsumsi BBM lebih efisien di dalam kota</li><li>Tanpa perlu cas eksternal — praktis seperti mobil bensin</li><li>Perawatan sama mudahnya dengan unit non-hybrid</li></ul><p>Buat Anda yang mobilitas harianya tinggi di dalam kota, teknologi hybrid ini memberikan penghematan nyata setiap bulannya.</p><blockquote>Coba sendiri sensasinya — jadwalkan test drive unit hybrid favorit Anda sekarang.</blockquote>`,
    },
    {
      judul: "Katalog Terbaru Suzuki BSB Semarang: Garansi Resmi & Test Drive Gratis",
      slug: "katalog-terbaru-garansi-resmi-test-drive-gratis",
      tipe: "BERITA",
      ringkasan:
        "Lihat lineup lengkap Suzuki di BSB Semarang — dari S-Presso hingga Jimny. Semua unit bergaransi resmi dan bisa dites langsung secara gratis.",
      cover_image: "/api/files/seed/berita-lineup.png",
      tags: ["katalog", "berita", "test-drive"],
      status: "PUBLISHED",
      published_at: daysAgo(12),
      konten: `<h2>Semua Pilihan Suzuki Ada di Sini</h2><p>Website Suzuki BSB Semarang kini menampilkan katalog lengkap seluruh lineup — <strong>Passenger Car</strong> dan <strong>Commercial Car</strong>. Anda bisa melihat spesifikasi, harga, dan foto setiap unit secara detail.</p><h3>Kenapa Beli di Dealer Resmi?</h3><ul><li>Garansi resmi pabrikan</li><li>Unit bergaransi & terdokumentasi</li><li>Test drive gratis tanpa kewajiban membeli</li><li>Simulasi kredit transparan</li></ul><p>Vehicle line-up kami mencakup city car, LMPV keluarga, SUV, hingga pick up komersial untuk kebutuhan usaha Anda.</p><p>Buka halaman <a href="#/mobil">Katalog Mobil</a> untuk melihat seluruh unit, atau langsung jadwalkan test drive!</p>`,
    },
    {
      judul: "Sukses Ramai! Event Test Drive Suzuki BSB Semarang",
      slug: "sukses-event-test-drive-suzuki-bsb",
      tipe: "KEGIATAN",
      ringkasan:
        "Ratusan pengunjung hadir merasakan langsung pengalaman berkendara unit favorit Suzuki di event test drive kami. Simak keseruannya!",
      cover_image: "/api/files/seed/kegiatan-testdrive.png",
      tags: ["event", "test-drive", "kegiatan"],
      status: "PUBLISHED",
      published_at: daysAgo(2),
      konten: `<h2>Meriah! Event Test Drive Suzuki</h2><p>Akhir pekan lalu, Suzuki BSB Semarang menggelar event test drive yang diikuti ratusan pengunjung dari Semarang dan sekitarnya. Pengunjung dapat mencoba langsung unit favorit seperti <strong>ALL NEW ERTIGA HYBRID</strong>, <strong>FRONX HYBRID</strong>, hingga <strong>GRAND VITARA</strong>.</p><h3>Highlight Kegiatan</h3><ul><li>Test drive gratis semua unit unggulan</li><li>Konsultasi kredit & tukar tambah bersama sales consultant</li><li>Door prize untuk pengunjung</li><li>Penawaran khusus khusus hari event</li></ul><p>Terima kasih kepada seluruh pengunjung! Bagi Anda yang belum sempat hadir, jangan khawatir — <em>test drive</em> tetap bisa dijadwalkan setiap hari di showroom kami.</p>`,
    },
    {
      judul: "Suzuki BSB Semarang Gelar Bakti Sosial di Mijen",
      slug: "baksos-suzuki-bsb-mijen",
      tipe: "KEGIATAN",
      ringkasan:
        "Sebagai wujud kepedulian terhadap lingkungan sekitar, Suzuki BSB Semarang menyelenggarakan bakti sosial di kawasan Mijen, Semarang.",
      cover_image: "/api/files/seed/kegiatan-sosial.png",
      tags: ["baksos", "kegiatan", "sosial"],
      status: "TERJADWAL",
      scheduled_at: daysFromNow(1, 9),
      konten: `<h2>Berbagi untuk Masyarakat</h2><p>Suzuki BSB Semarang akan menggelar kegiatan bakti sosial di kawasan Mijen, Semarang. Kegiatan ini merupakan bagian dari komitmen kami untuk terliban memberi manfaat bagi masyarakat sekitar.</p><h3>Rencana Kegiatan</h3><ul><li>Pembagian paket sembako untuk warga terdampak</li><li>Pemeriksaan kesehatan gratis bersama tenaga medis</li><li>Edukasi safety riding & berkendara aman</li></ul><p>Artikel ini dipublikasikan otomatis sesuai jadwal. Nantikan dokumentasi lengkap kegiatannya!</p>`,
    },
  ];

  for (const a of articles) {
    await db.artikel.upsert({
      where: { slug: a.slug },
      update: {},
      create: {
        judul: a.judul,
        slug: a.slug,
        ringkasan: a.ringkasan,
        konten: a.konten,
        cover_image: a.cover_image,
        tipe: a.tipe,
        tags: JSON.stringify(a.tags),
        status: a.status,
        published_at: a.status === "PUBLISHED" ? a.published_at : null,
        scheduled_at: a.status === "TERJADWAL" ? a.scheduled_at : null,
        views: Math.floor(Math.random() * 400) + 50,
      },
    });
  }
  console.log(`✔ ${articles.length} artikel ter-seed`);

  // ------------------------------------------------------- CONTOH PESAN & TD
  const pesanCount = await db.pesan.count();
  if (pesanCount === 0) {
    await db.pesan.createMany({
      data: [
        {
          nama_lengkap: "Budi Santoso",
          no_telepon: "081234567890",
          email: "budi.santoso@contohmail.com",
          subjek: "Simulasi Kredit",
          pesan: "Halo, saya tertarik dengan All New Ertiga Hybrid. Boleh minta simulasi kredit dengan DP 20 juta dan tenor 5 tahun? Terima kasih.",
          status: "BARU",
        },
        {
          nama_lengkap: "Siti Rahayu",
          no_telepon: "085712345678",
          email: "siti.rahayu@contohmail.com",
          subjek: "Booking Service",
          pesan: "Selamat pagi, saya ingin booking service berkala pertama untuk XL7 saya tanggal 28 sekitar jam 9 pagi. Apakah bisa dibantu? Terima kasih.",
          status: "DIBACA",
        },
      ],
    });
    console.log("✔ 2 contoh pesan ter-seed");
  }

  const tdCount = await db.testDrive.count();
  if (tdCount === 0) {
    const ertigaHybrid = await db.mobil.findUnique({ where: { slug: "all-new-ertiga-hybrid" } });
    const fronx = await db.mobil.findUnique({ where: { slug: "fronx-hybrid" } });
    await db.testDrive.createMany({
      data: [
        {
          nama_lengkap: "Andi Wijaya",
          no_telepon: "0813222333444",
          email: "andi.wijaya@contohmail.com",
          mobil_id: ertigaHybrid?.id ?? null,
          mobil_pilihan: "ALL NEW ERTIGA HYBRID",
          tanggal_diinginkan: daysFromNow(1, 12),
          waktu_diinginkan: "10:00",
          catatan: "Saya ingin mencoba versi AT jika tersedia.",
          status: "PENDING",
        },
        {
          nama_lengkap: "Dewi Lestari",
          no_telepon: "0856111222333",
          email: "dewi.lestari@contohmail.com",
          mobil_id: fronx?.id ?? null,
          mobil_pilihan: "FRONX HYBRID",
          tanggal_diinginkan: daysFromNow(3, 12),
          waktu_diinginkan: "14:00",
          catatan: null,
          status: "CONFIRMED",
        },
      ],
    });
    console.log("✔ 2 contoh test drive ter-seed");
  }

  // -------------------------------------------------------------- TESTIMONI
  const testiCount = await db.testimoni.count();
  if (testiCount === 0) {
    await db.testimoni.createMany({
      data: [
        {
          nama: "Budi Santoso",
          rating: 5,
          pesan:
            "Proses kredit cepat dan mudah, sales sangat sabar menjelaskan semua perhitungan. Ertiga Hybrid kami terima sesuai janji. Recommended dealer Suzuki di Semarang!",
          status: "APPROVED",
          created_at: daysAgo(12),
        },
        {
          nama: "Rina Kurniawati",
          rating: 5,
          pesan:
            "Test drive dijadwalkan hari yang sama saat saya hubungi via WhatsApp. Mobil Fronx sangat nyaman, tim BSB ramah dan tidak memaksa beli. Sukses selalu!",
          status: "APPROVED",
          created_at: daysAgo(9),
        },
        {
          nama: "Hendra Gunawan",
          rating: 4,
          pesan:
            "Servis berkala XL7 rapi dan transparan biayanya. Ruang tunggu nyaman, tinggal tunggu notifikasi WA kalau unit sudah selesai. Puas dengan pelayanannya.",
          status: "APPROVED",
          created_at: daysAgo(6),
        },
        {
          nama: "Siti Rahmawati",
          rating: 5,
          pesan:
            "Grand Vitara impian keluarga akhirnya kesampaian lewat promo trade-in BSB. NPWP dan dokumen dibantu urus sampai jadi. Terima kasih banyak!",
          status: "PENDING",
          created_at: daysAgo(1),
        },
      ],
    });
    console.log("✔ 4 contoh testimoni ter-seed (3 approved, 1 pending)");
  }
}

main()
  .then(async () => {
    await db.$disconnect();
    console.log("🎉 Seed selesai.");
  })
  .catch(async (e) => {
    console.error(e);
    await db.$disconnect();
    process.exit(1);
  });
