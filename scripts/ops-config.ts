// Brankas konfigurasi operasional di Supabase (tabel `ops_config`).
// Selamat dari reset sandbox (DB eksternal) — dipakai menyimpan PAT GitHub
// agar token tidak hilang saat sandbox reset / memori AI berganti sesi.
//
// Pakai:
//   unset DATABASE_URL && bun scripts/ops-config.ts get github_pat
//   unset DATABASE_URL && bun scripts/ops-config.ts set github_pat <token-baru>
//
// Tabel dibuat otomatis (idempoten) saat set — TIDAK lewat db:push.
import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();

async function main() {
  const [cmd, key, value] = process.argv.slice(2);
  if (cmd === "set" && key && value) {
    await db.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS ops_config (
        key        TEXT PRIMARY KEY,
        value      TEXT NOT NULL,
        updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
      )
    `);
    await db.opsConfig.upsert({
      where: { key },
      create: { key, value },
      update: { value },
    });
    console.log(`OK: '${key}' tersimpan di ops_config.`);
  } else if (cmd === "get" && key) {
    const row = await db.opsConfig.findUnique({ where: { key } });
    if (!row) {
      console.error(`Tidak ada entri '${key}' di ops_config.`);
      process.exit(1);
    }
    console.log(row.value);
  } else {
    console.error("Pakai: bun scripts/ops-config.ts <get|set> <key> [value]");
    process.exit(1);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
