import { db } from '@/lib/db'
async function main() {
  const [m, a, p, td, t, f, s] = await Promise.all([
    db.mobil.count(), db.artikel.count(), db.pesan.count(), db.testDrive.count(),
    db.testimoni.count(), db.faq.count(), db.bookingServis.count(),
  ])
  console.log({ Mobil: m, Artikel: a, Pesan: p, TestDrive: td, Testimoni: t, Faq: f, Servis: s })
}
main().finally(() => db.$disconnect())
