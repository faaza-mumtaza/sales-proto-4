// Seed & verifikasi akun admin di Supabase (idempoten, CREATE-ONLY).
//
// Penting: skrip ini TIDAK PERNAH menimpa password admin yang sudah ada —
// hanya membuat baris jika belum ada. Aman dijalankan berulang kapan pun
// (mis. setelah reset sandbox) tanpa mereset password yang sudah diganti.
//
// Akun yang dijamin ada:
//   1. admin@suzukibsb.id        — akun default terdokumentasi (README).
//   2. naufalsuzuki.bsb@gmail.com — akun owner (dibuat Task 19, password
//      sementara — WAJIB diganti lewat tombol "Ganti Password" di panel).
//
// Jalankan: unset DATABASE_URL && bun scripts/seed-supabase.ts
import { db } from "../src/lib/db";
import { hashPassword } from "../src/lib/password";

const ADMIN_ACCOUNTS: Array<{ email: string; name: string; password: string }> = [
  {
    email: "admin@suzukibsb.id",
    name: "Admin Suzuki BSB",
    password: "SuzukiBSB#2025", // default terdokumentasi — ganti di production
  },
  {
    email: "naufalsuzuki.bsb@gmail.com",
    name: "Naufal — Owner BSB",
    password: "GantiSaya#2026", // SEMENTARA — owner wajib ganti setelah login
  },
];

async function main() {
  for (const acc of ADMIN_ACCOUNTS) {
    const existing = await db.admin.findUnique({ where: { email: acc.email } });
    if (existing) {
      console.log(`✓ sudah ada (dilewati): ${acc.email}`);
      continue;
    }
    await db.admin.create({
      data: {
        email: acc.email,
        name: acc.name,
        passwordHash: await hashPassword(acc.password),
      },
    });
    console.log(`✓ dibuat: ${acc.email}`);
  }

  console.log("\n── Verifikasi Supabase (jumlah baris per tabel) ──");
  const tables = [
    ["admins", db.admin],
    ["mobil_katalog", db.mobil],
    ["artikel", db.artikel],
    ["pesan_masuk", db.pesan],
    ["test_drive", db.testDrive],
    ["testimoni", db.testimoni],
    ["faqs", db.faq],
    ["newsletter_subscribers", db.subscriberNewsletter],
    ["booking_servis", db.bookingServis],
  ] as const;
  for (const [name, model] of tables) {
    const count = await (model as unknown as { count(): Promise<number> }).count();
    console.log(`  ${name.padEnd(24)} ${count}`);
  }
  console.log("\nSelesai.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
