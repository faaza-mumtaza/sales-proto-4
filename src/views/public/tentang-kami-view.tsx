"use client";

import { SiteLayout } from "@/components/site/site-layout";
import { usePageMeta } from "@/lib/router";

export function TentangKamiView() {
  usePageMeta("Tentang Kami — Suzuki BSB Semarang");

  return (
    <SiteLayout>
      <section className="bg-suzuki-navy py-16 text-white">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-3xl md:text-4xl font-bold mb-4">Tentang Kami</h1>
          <p className="text-white/70 max-w-2xl mx-auto">
            Dealer resmi Suzuki BSB Semarang, mitra terpercaya untuk kebutuhan kendaraan
            Anda.
          </p>
        </div>
      </section>

      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
              <h2 className="text-2xl md:text-3xl font-bold text-suzuki-navy mb-6">
                Dealer Resmi Suzuki Terpercaya di Semarang
              </h2>
              <div className="space-y-4 text-muted-foreground">
                <p>
                  Suzuki BSB Semarang adalah dealer resmi Suzuki yang berkomitmen memberikan
                  pelayanan terbaik dalam penjualan mobil baru, layanan purna jual, dan
                  penyediaan suku cadang asli. Kami menjamin keaslian produk dan garansi
                  penuh dari PT Suzuki Indomobil Motor untuk setiap unit yang dijual. Dengan
                  tim sales profesional dan teknisi bersertifikat, kami siap membantu Anda
                  menemukan unit Suzuki, mulai dari city car, MPV, hingga SUV, yang paling
                  sesuai dengan gaya hidup, kebutuhan keluarga, dan budget Anda.
                </p>
                <p>
                  Salah satu keunggulan kami adalah kemudahan proses pembelian. Sistem
                  pembelian dibuat cepat dan transparan dengan opsi pembiayaan yang
                  fleksibel dan kompetitif serta DP ringan. Kami bekerja sama dengan
                  berbagai lembaga keuangan terpercaya untuk menawarkan pilihan cicilan
                  yang dapat disesuaikan dengan kemampuan finansial Anda. Selain itu kami
                  menyediakan simulasi kredit mobil gratis.
                </p>
                <p>
                  Jangan ragu menghubungi dealer Suzuki BSB Semarang. Tim kami siap
                  memberikan informasi lengkap dan layanan terbaik. Dapatkan mobil Suzuki
                  impian Anda dengan proses yang mudah, cepat, dan dukungan purna jual
                  serta garansi resmi hanya di Suzuki BSB Semarang.
                </p>
              </div>
              <div className="aspect-[4/3] rounded-xl overflow-hidden shadow-lg group">
                <img
                  src="https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=1200&q=80"
                  alt="Showroom Suzuki BSB Semarang"
                  className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-700"
                  loading="lazy"
                />
              </div>
          </div>
        </div>
      </section>

      <section className="py-16 bg-suzuki-light">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-8">
              <div className="bg-suzuki-navy text-white rounded-xl p-8 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 h-full">
                <h3 className="text-xl font-bold mb-4">Visi Kami</h3>
                <p className="text-white/80">
                  Menjadi dealer Suzuki terbaik dan terpercaya di Jawa Tengah dengan
                  memberikan pengalaman pembelian dan layanan purna jual yang memuaskan bagi
                  setiap pelanggan.
                </p>
              </div>
              <div className="bg-suzuki-red text-white rounded-xl p-8 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 h-full">
                <h3 className="text-xl font-bold mb-4">Misi Kami</h3>
                <ul className="text-white/90 space-y-2">
                  <li>• Menyediakan produk Suzuki berkualitas dengan harga kompetitif</li>
                  <li>• Memberikan pelayanan prima dan profesional</li>
                  <li>• Membangun hubungan jangka panjang dengan pelanggan</li>
                  <li>• Terus berinovasi dalam layanan dan teknologi</li>
                </ul>
              </div>
          </div>
        </div>
      </section>

      <section className="py-8 pb-16" aria-labelledby="judul-lokasi">
        <div className="container mx-auto px-4">
          <h2 id="judul-lokasi" className="text-2xl md:text-3xl font-bold text-suzuki-navy mb-6 text-center">
            Lokasi Kami
          </h2>
          <div className="rounded-xl overflow-hidden border border-border shadow-sm">
            <iframe
              src="https://www.google.com/maps/embed?pb=!1m14!1m8!1m3!1d7919.50377681912!2d110.330541!3d-7.0384191!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x2e70610b377241d5%3A0x9d73a269e2124e32!2sSuzuki%20BSB%20-%20Sunmotor%20Indosentra%20Trada!5e0!3m2!1sen!2sid!4v1765292799929!5m2!1sen!2sid"
              width="100%"
              height="400"
              style={{ border: 0 }}
              allowFullScreen
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              title="Lokasi Suzuki BSB"
            />
          </div>
        </div>
      </section>
    </SiteLayout>
  );
}
