"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Phone, Mail, MapPin, Clock, Car, MessageSquare, Wrench } from "lucide-react";
import { SiteLayout } from "@/components/site/site-layout";
import { ContactForm } from "@/components/forms/contact-form";
import { TestDriveForm } from "@/components/forms/test-drive-form";
import { ServiceBookingForm } from "@/components/forms/service-booking-form";
import { ErrorState } from "@/components/site/states";
import { FaqSection } from "@/components/site/faq-section";
import { usePageMeta, useHashRoute } from "@/lib/router";
import { apiGet } from "@/lib/api";
import { type Mobil } from "@/lib/site-utils";

type FormId = "kontak" | "test-drive" | "servis";

const formTypes = [
  { id: "kontak", label: "Hubungi Kami", icon: MessageSquare },
  { id: "test-drive", label: "Test Drive", icon: Car },
  { id: "servis", label: "Booking Servis", icon: Wrench },
] as const;

const HEADER_COPY: Record<FormId, { title: string; desc: string }> = {
  kontak: {
    title: "Hubungi Kami",
    desc: "Tim kami siap membantu Anda. Hubungi melalui telepon, email, atau kunjungi dealer kami.",
  },
  "test-drive": {
    title: "Jadwalkan Test Drive",
    desc: "Rasakan langsung pengalaman berkendara mobil Suzuki pilihan Anda. Gratis dan tanpa kewajiban membeli.",
  },
  servis: {
    title: "Booking Servis Bengkel",
    desc: "Servis berkala hingga perbaikan berat — teknisi bersertifikat dan spare part asli Suzuki.",
  },
};

export function KontakView() {
  const route = useHashRoute();
  const [active, setActive] = useState<FormId>(
    route.query.get("form") === "test-drive"
      ? "test-drive"
      : route.query.get("form") === "servis"
        ? "servis"
        : "kontak",
  );
  usePageMeta(
    active === "test-drive"
      ? "Jadwalkan Test Drive — Suzuki BSB"
      : active === "servis"
        ? "Booking Servis Bengkel — Suzuki BSB"
        : "Kontak — Suzuki BSB Semarang",
  );

  // Mobil default untuk test drive (dari tombol CTA halaman detail mobil)
  const defaultMobilId = route.query.get("mobil") ?? undefined;
  // Prefill subjek/pesan untuk form kontak (dari CTA simulasi kredit)
  const defaultSubjek = route.query.get("subjek") ?? "";
  const defaultPesan = route.query.get("pesan") ?? "";

  // Sinkronkan bila hash berubah (pola "adjust state during render" React):
  // CTA dari halaman lain bisa membawa ?form=... setelah komponen hidup.
  const currentForm = route.query.get("form");
  const [trackedForm, setTrackedForm] = useState(currentForm);
  if (trackedForm !== currentForm) {
    setTrackedForm(currentForm);
    if (currentForm === "test-drive") setActive("test-drive");
    else if (currentForm === "servis") setActive("servis");
    else if (currentForm === "kontak") setActive("kontak");
  }

  const carsQuery = useQuery({
    queryKey: ["mobil", "public"],
    queryFn: () => apiGet<{ cars: Mobil[] }>("/api/cars"),
  });
  const cars = carsQuery.data?.cars ?? [];

  return (
    <SiteLayout>
      <section className="bg-suzuki-navy py-16 text-white relative overflow-hidden">
        <div className="decoration absolute -top-20 -right-20 w-72 h-72 rounded-full bg-suzuki-red/10 blur-3xl" />
        <div className="container mx-auto px-4 text-center relative">
          <h1 className="text-3xl md:text-4xl font-bold mb-4">
            {HEADER_COPY[active].title}
          </h1>
          <p className="text-white/70 max-w-2xl mx-auto">
            {HEADER_COPY[active].desc}
          </p>
        </div>
      </section>

      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-12">
            <div>
              <h2 className="text-2xl font-bold text-suzuki-navy mb-6">Informasi Kontak</h2>
              <div className="space-y-6">
                {[
                  {
                    icon: MapPin,
                    title: "Alamat Dealer",
                    body: "Jl. Kompleks Graha Taman Karet, Kedungpane, Mijen, Bukit Semarang, Semarang",
                  },
                  {
                    icon: Phone,
                    title: "Telepon / WhatsApp",
                    body: <a href="tel:+6285647079807" className="hover:text-suzuki-red transition-colors">0856-4707-9807</a>,
                  },
                  {
                    icon: Mail,
                    title: "Sales Marketing",
                    body: (
                      <>
                        <span className="font-medium">NAUFAL, S.E.</span>
                        <br />
                        <span className="text-sm">PT. SUNMOTOR INDOSENTRA TRADA</span>
                      </>
                    ),
                  },
                  {
                    icon: Clock,
                    title: "Jam Operasional",
                    body: (
                      <>
                        Senin - Sabtu: 08:00 - 17:00 WIB
                        <br />
                        Minggu: 09:00 - 15:00 WIB
                      </>
                    ),
                  },
                ].map((c, i) => (
                  <div key={i} className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-suzuki-red/10 rounded-lg flex items-center justify-center shrink-0">
                      <c.icon className="w-6 h-6 text-suzuki-red" aria-hidden />
                    </div>
                    <div>
                      <h3 className="font-semibold text-suzuki-navy mb-1">{c.title}</h3>
                      <div className="text-muted-foreground">{c.body}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-card rounded-xl border border-border p-6 md:p-8">
              <div className="flex justify-center mb-8">
                <div
                  className="inline-flex flex-wrap justify-center gap-1 bg-gray-100 rounded-2xl sm:rounded-full p-1"
                  role="tablist"
                  aria-label="Pilih jenis form"
                >
                  {formTypes.map((t) => (
                    <button
                      key={t.id}
                      role="tab"
                      aria-selected={active === t.id}
                      onClick={() => setActive(t.id)}
                      className={`flex items-center gap-2 px-4 sm:px-5 py-2.5 rounded-full text-sm font-medium transition-all ${
                        active === t.id
                          ? "bg-suzuki-red text-white shadow-sm"
                          : "text-gray-500 hover:text-suzuki-navy"
                      }`}
                    >
                      <t.icon className="w-4 h-4" aria-hidden />
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>

              {active === "kontak" ? (
                <>
                  <h2 className="text-2xl font-bold text-suzuki-navy mb-6">Kirim Pesan</h2>
                  <ContactForm defaultSubjek={defaultSubjek} defaultPesan={defaultPesan} />
                </>
              ) : active === "servis" ? (
                carsQuery.isLoading ? (
                  <p className="text-center text-muted-foreground py-8">Memuat form booking servis…</p>
                ) : carsQuery.isError ? (
                  <ErrorState
                    message="Gagal memuat daftar mobil untuk booking servis."
                    onRetry={() => void carsQuery.refetch()}
                  />
                ) : (
                  <>
                    <h2 className="text-2xl font-bold text-suzuki-navy mb-6">Form Booking Servis</h2>
                    <ServiceBookingForm cars={cars} defaultMobilId={defaultMobilId} />
                  </>
                )
              ) : carsQuery.isLoading ? (
                <p className="text-center text-muted-foreground py-8">Memuat form test drive…</p>
              ) : carsQuery.isError ? (
                <ErrorState
                  message="Gagal memuat daftar mobil untuk test drive."
                  onRetry={() => void carsQuery.refetch()}
                />
              ) : (
                <>
                  <h2 className="text-2xl font-bold text-suzuki-navy mb-6">Form Test Drive</h2>
                  <TestDriveForm cars={cars} defaultMobilId={defaultMobilId} />
                </>
              )}
            </div>
          </div>
        </div>
      </section>

      <section className="py-8 pb-16">
        <div className="container mx-auto px-4">
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

      {/* FAQ — dikelola admin, hanya yang dipublikasikan */}
      <FaqSection />
    </SiteLayout>
  );
}
