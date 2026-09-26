// Pembangun data JSON-LD (schema.org) untuk SEO — isomorphic, murni fungsi.
// Dipakai komponen <JsonLd> untuk menyuntikkan <script type="application/ld+json">.

import type { Mobil, Artikel } from "@/lib/site-utils";

export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://suzuki-bsb-semarang.example.com";

export const SITE_NAME = "Suzuki BSB Semarang";
export const SITE_LOGO = `${SITE_URL}/logo.svg`;
export const SITE_PHONE = "+6285647079807";

/** Absolutkan URL gambar relatif (hasil upload) untuk dipakai di JSON-LD. */
function absUrl(u: string | null | undefined): string | undefined {
  if (!u) return undefined;
  if (/^https?:\/\//i.test(u)) return u;
  if (u.startsWith("/")) return `${SITE_URL}${u}`;
  return undefined;
}

/** schema.org: AutoDealer (Organisasi + showroom fisik). */
export function dealerJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "AutoDealer",
    "@id": `${SITE_URL}/#dealer`,
    name: SITE_NAME,
    legalName: "PT. Sunmotor Indosentra Trada",
    description:
      "Dealer resmi Suzuki BSB Semarang — katalog mobil Suzuki, promo terbaru, test drive gratis, dan layanan purna jual terpercaya.",
    url: SITE_URL,
    logo: SITE_LOGO,
    image: SITE_LOGO,
    telephone: SITE_PHONE,
    priceRange: "Rp 150.000.000 – Rp 500.000.000",
    currenciesAccepted: "IDR",
    paymentAccepted: "Cash, Transfer Bank, Kredit",
    address: {
      "@type": "PostalAddress",
      streetAddress: "Jl. Kompleks Graha Taman Karet, Kedungpane, Mijen",
      addressLocality: "Kota Semarang",
      addressRegion: "Jawa Tengah",
      postalCode: "50275",
      addressCountry: "ID",
    },
    geo: {
      "@type": "GeoCoordinates",
      latitude: -7.0384,
      longitude: 110.3305,
    },
    openingHoursSpecification: [
      {
        "@type": "OpeningHoursSpecification",
        dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
        opens: "08:00",
        closes: "17:00",
      },
      {
        "@type": "OpeningHoursSpecification",
        dayOfWeek: ["Sunday"],
        opens: "09:00",
        closes: "15:00",
      },
    ],
    sameAs: ["https://www.instagram.com/naufalll_miin"],
    areaServed: {
      "@type": "City",
      name: "Semarang",
    },
  };
}

/** schema.org: Product + Car untuk halaman detail mobil. */
export function carJsonLd(car: Mobil) {
  const image = [car.gambar_utama, ...car.galeri_gambar.slice(0, 5)]
    .map(absUrl)
    .filter((x): x is string => !!x);

  return {
    "@context": "https://schema.org",
    "@type": ["Product", "Car"],
    "@id": `${SITE_URL}/#/mobil/${car.slug}#product`,
    name: car.nama,
    description:
      car.deskripsi ??
      `${car.nama} — mobil Suzuki resmi di dealer Suzuki BSB Semarang. Harga mulai ${
        car.harga_label ?? ""
      }. Tersedia test drive gratis dan kredit.`,
    image: image.length > 0 ? image : undefined,
    sku: car.slug,
    brand: {
      "@type": "Brand",
      name: "Suzuki",
    },
    url: `${SITE_URL}/#/mobil/${car.slug}`,
    ...(car.seater != null
      ? {
          seatingCapacity: car.seater,
          vehicleSeatingCapacity: car.seater,
        }
      : {}),
    ...(car.fuel ? { fuelType: car.fuel } : {}),
    ...(car.transmission ? { vehicleTransmission: car.transmission } : {}),
    ...(car.harga_mulai != null
      ? {
          offers: {
            "@type": "Offer",
            priceCurrency: "IDR",
            price: car.harga_mulai,
            availability: "https://schema.org/InStock",
            url: `${SITE_URL}/#/mobil/${car.slug}`,
            seller: {
              "@type": "AutoDealer",
              name: SITE_NAME,
            },
            areaServed: "ID",
          },
        }
      : {}),
  };
}

/** schema.org: Article untuk halaman detail artikel. */
export function artikelJsonLd(a: Artikel) {
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    "@id": `${SITE_URL}/#/artikel/${a.slug}#article`,
    headline: a.judul,
    description: a.ringkasan ?? a.judul,
    image: absUrl(a.cover_image) ?? SITE_LOGO,
    datePublished: a.published_at ?? a.created_at,
    dateModified: a.updated_at,
    author: {
      "@type": "Organization",
      name: SITE_NAME,
      url: SITE_URL,
    },
    publisher: {
      "@type": "Organization",
      name: SITE_NAME,
      logo: {
        "@type": "ImageObject",
        url: SITE_LOGO,
      },
    },
    mainEntityOfPage: `${SITE_URL}/#/artikel/${a.slug}`,
    inLanguage: "id-ID",
    ...(a.views > 0
      ? {
          interactionStatistic: {
            "@type": "InteractionCounter",
            interactionType: "https://schema.org/ReadAction",
            userInteractionCount: a.views,
          },
        }
      : {}),
  };
}

/** schema.org: BreadcrumbList untuk navigasi berperingkat. */
export function breadcrumbJsonLd(items: Array<{ label: string; to?: string }>) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((it, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: it.label,
      ...(it.to ? { item: `${SITE_URL}/#${it.to}` } : {}),
    })),
  };
}

/** schema.org: FAQPage — dipakai di halaman kontak (konten FAQ dari DB). */
export function faqJsonLd(faqs: Array<{ pertanyaan: string; jawaban: string }>) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((f) => ({
      "@type": "Question",
      name: f.pertanyaan,
      acceptedAnswer: {
        "@type": "Answer",
        text: f.jawaban,
      },
    })),
  };
}
