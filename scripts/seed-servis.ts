// Seed booking servis demo (jalankan sekali): data backdate agar tren & tampilan realistis.
import { db } from "../src/lib/db";

async function main() {
  const existing = await db.bookingServis.count();
  if (existing > 0) {
    console.log(`Skip: sudah ada ${existing} booking servis.`);
    return;
  }

  const ertiga = await db.mobil.findFirst({ where: { slug: { contains: "ertiga" } }, select: { id: true, nama: true } });
  const xl7 = await db.mobil.findFirst({ where: { slug: { contains: "xl7" } }, select: { id: true, nama: true } });
  const jimny = await db.mobil.findFirst({ where: { slug: { contains: "jimny" } }, select: { id: true, nama: true } });

  const now = new Date();
  const d = (offsetDays: number) => {
    const dt = new Date(now);
    dt.setDate(dt.getDate() + offsetDays);
    return dt;
  };
  const createdDaysAgo = (days: number) => {
    const dt = new Date(now);
    dt.setDate(dt.getDate() - days);
    return dt;
  };

  await db.bookingServis.createMany({
    data: [
      {
        nama_lengkap: "Budi Santoso",
        no_telepon: "081234567001",
        email: "budi.santoso@gmail.com",
        mobil_id: ertiga?.id ?? null,
        mobil_pilihan: ertiga?.nama ?? "Suzuki Ertiga",
        jenis_servis: "servis-berkala",
        tanggal_diinginkan: d(3),
        waktu_diinginkan: "09:00",
        keluhan: "Servis 40.000 km, sekalian cek AC kurang dingin.",
        status: "PENDING",
        ip_address: "127.0.0.1",
        created_at: createdDaysAgo(1),
      },
      {
        nama_lengkap: "Siti Rahmawati",
        no_telepon: "081234567002",
        email: null,
        mobil_id: xl7?.id ?? null,
        mobil_pilihan: xl7?.nama ?? "Suzuki XL7",
        jenis_servis: "ganti-oli",
        tanggal_diinginkan: d(5),
        waktu_diinginkan: "10:00",
        keluhan: "Ganti oli + filter, km 10.000.",
        status: "CONFIRMED",
        ip_address: "127.0.0.1",
        created_at: createdDaysAgo(2),
      },
      {
        nama_lengkap: "Agus Wibowo",
        no_telepon: "081234567003",
        email: "agus.w@yahoo.com",
        mobil_id: jimny?.id ?? null,
        mobil_pilihan: jimny?.nama ?? "Suzuki Jimny",
        jenis_servis: "cek-kaki-kaki",
        tanggal_diinginkan: d(-10),
        waktu_diinginkan: "13:00",
        keluhan: "Rem depan berdecit saat hujan, ban perlu rotasi.",
        status: "DONE",
        ip_address: "127.0.0.1",
        created_at: createdDaysAgo(18),
      },
      {
        nama_lengkap: "Dewi Lestari",
        no_telepon: "081234567004",
        email: null,
        mobil_id: null,
        mobil_pilihan: "Suzuki Karimun Wagon R 2018",
        jenis_servis: "tune-up",
        tanggal_diinginkan: d(-4),
        waktu_diinginkan: "08:00",
        keluhan: "Mesin agak kasar saat idle.",
        status: "DONE",
        ip_address: "127.0.0.1",
        created_at: createdDaysAgo(25),
      },
      {
        nama_lengkap: "Rian Hidayat",
        no_telepon: "081234567005",
        email: "rian.h@gmail.com",
        mobil_id: null,
        mobil_pilihan: "Suzuki APV 2015",
        jenis_servis: "servis-berat",
        tanggal_diinginkan: d(8),
        waktu_diinginkan: "14:00",
        keluhan: "Overheat saat macet, radiator & waterpompa perlu dicek.",
        status: "PENDING",
        ip_address: "127.0.0.1",
        created_at: createdDaysAgo(0),
      },
    ],
  });

  console.log("Seed booking servis: 5 entri dibuat.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .then(() => process.exit(0));
