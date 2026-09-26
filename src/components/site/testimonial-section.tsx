"use client";

// Section testimoni pelanggan untuk halaman publik (home).
// Menampilkan testimoni APPROVED + form kirim testimoni baru (masuk antrean
// moderasi admin — bukan langsung tayang, anti spam/penyalahgunaan).

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Star, Quote, MessageSquarePlus, Send, Loader2, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { apiGet, apiPost, ApiError } from "@/lib/api";
import { formatDateID } from "@/lib/site-utils";
import { SectionHeading } from "./section-heading";
import { Reveal } from "./reveal";

export interface TestimoniPublik {
  id: string;
  nama: string;
  rating: number;
  pesan: string;
  created_at: string;
}

function StarRating({ value, size = "w-4 h-4" }: { value: number; size?: string }) {
  return (
    <span className="inline-flex items-center gap-0.5" aria-label={`Rating ${value} dari 5 bintang`}>
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          className={`${size} ${
            i < value ? "fill-amber-400 text-amber-400" : "fill-muted text-muted-foreground/30"
          }`}
          aria-hidden
        />
      ))}
    </span>
  );
}

/** Inisial nama untuk avatar gradient (tanpa foto — privasi). */
function AvatarInitial({ nama }: { nama: string }) {
  const initial = nama.trim().charAt(0).toUpperCase() || "?";
  const palette = ["bg-suzuki-red", "bg-suzuki-navy", "bg-amber-500", "bg-emerald-600", "bg-rose-500", "bg-teal-600"];
  const color = palette[nama.length % palette.length];
  return (
    <span
      className={`w-11 h-11 rounded-full ${color} text-white font-bold text-lg flex items-center justify-center shadow-md shrink-0`}
      aria-hidden
    >
      {initial}
    </span>
  );
}

export function TestimonialSection() {
  const qc = useQueryClient();
  const [showForm, setShowForm] = useState(false);

  const query = useQuery({
    queryKey: ["testimoni", "public"],
    queryFn: () => apiGet<{ testimonials: TestimoniPublik[] }>("/api/testimonials?take=9"),
  });

  const items = query.data?.testimonials ?? [];
  const avg =
    items.length > 0 ? Math.round((items.reduce((s, t) => s + t.rating, 0) / items.length) * 10) / 10 : 0;

  return (
    <section className="py-16" aria-labelledby="judul-testimoni">
      <div className="container mx-auto px-4">
        <SectionHeading
          title="Kata Mereka Tentang Kami"
          subtitle={`Rating rata-rata ${avg > 0 ? `${avg} / 5` : "—"} dari pelanggan Suzuki BSB Semarang.`}
        />

        {query.isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="bg-card rounded-xl border border-border p-6 animate-pulse">
                <div className="flex gap-4 items-center mb-4">
                  <div className="w-11 h-11 rounded-full bg-muted" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 w-24 bg-muted rounded" />
                    <div className="h-3 w-16 bg-muted rounded" />
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="h-3 w-full bg-muted rounded" />
                  <div className="h-3 w-4/5 bg-muted rounded" />
                  <div className="h-3 w-2/3 bg-muted rounded" />
                </div>
              </div>
            ))}
          </div>
        ) : query.isError ? (
          <div className="text-center py-10">
            <p className="text-muted-foreground text-sm mb-3">Gagal memuat testimoni.</p>
            <button
              type="button"
              onClick={() => void query.refetch()}
              className="text-sm text-suzuki-red font-semibold hover:underline"
            >
              Coba lagi
            </button>
          </div>
        ) : items.length === 0 ? (
          <div className="text-center py-10">
            <p className="text-muted-foreground text-sm">
              Belum ada testimoni yang tayang. Jadilah yang pertama menulis!
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {items.map((t, i) => (
              <Reveal key={t.id} delay={Math.min(i, 5) * 80} className="h-full">
                <figure className="bg-card rounded-xl border border-border p-6 hover:shadow-lg hover:shadow-suzuki-navy/10 hover:-translate-y-1 transition-all duration-300 card-accent h-full flex flex-col relative overflow-hidden">
                  <Quote
                    className="absolute -top-1 -right-1 w-20 h-20 text-suzuki-red/5 rotate-12"
                    aria-hidden
                  />
                  <div className="flex items-center gap-3 mb-4">
                    <AvatarInitial nama={t.nama} />
                    <div className="min-w-0">
                      <figcaption className="font-semibold text-suzuki-navy dark:text-foreground truncate">{t.nama}</figcaption>
                      <p className="text-xs text-muted-foreground">{formatDateID(t.created_at)}</p>
                    </div>
                  </div>
                  <StarRating value={t.rating} />
                  <blockquote className="mt-3 text-sm text-muted-foreground leading-relaxed flex-1">
                    “{t.pesan}”
                  </blockquote>
                </figure>
              </Reveal>
            ))}
          </div>
        )}

        {/* CTA tulis testimoni */}
        <div className="text-center mt-10">
          <button
            type="button"
            onClick={() => setShowForm((v) => !v)}
            aria-expanded={showForm}
            aria-controls="form-testimoni"
            className="inline-flex items-center gap-2 px-6 py-3 border border-suzuki-navy/30 dark:border-white/20 text-suzuki-navy dark:text-white hover:bg-suzuki-navy dark:hover:bg-white hover:text-white dark:hover:text-suzuki-navy rounded-full text-sm font-semibold transition-all hover:shadow-lg hover:shadow-suzuki-navy/20 hover:-translate-y-0.5 active:scale-95"
          >
            <MessageSquarePlus className="w-4 h-4" aria-hidden />
            {showForm ? "Tutup Formulir" : "Tulis Testimoni Anda"}
          </button>
        </div>

        {showForm && (
          <div id="form-testimoni" className="max-w-xl mx-auto mt-8">
            <TestimonialForm
              onSuccess={() => {
                setShowForm(false);
                void qc.invalidateQueries({ queryKey: ["testimoni", "public"] });
              }}
            />
          </div>
        )}
      </div>
    </section>
  );
}

function TestimonialForm({ onSuccess }: { onSuccess: () => void }) {
  const [nama, setNama] = useState("");
  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [pesan, setPesan] = useState("");
  const [website, setWebsite] = useState(""); // honeypot
  const [error, setError] = useState<string | null>(null);

  const mutation = useMutation({
    mutationFn: (data: { nama: string; rating: number; pesan: string; website: string }) =>
      apiPost("/api/testimonials", data),
    onSuccess: () => {
      toast.success("Testimoni terkirim! Menunggu persetujuan admin sebelum tayang.");
      onSuccess();
    },
    onError: (e) => {
      const msg = e instanceof ApiError ? e.message : "Gagal mengirim testimoni. Coba lagi.";
      setError(msg);
    },
  });

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (nama.trim().length < 2) {
      setError("Nama minimal 2 karakter.");
      return;
    }
    if (pesan.trim().length < 10) {
      setError("Testimoni minimal 10 karakter.");
      return;
    }
    mutation.mutate({ nama: nama.trim(), rating, pesan: pesan.trim(), website });
  }

  return (
    <Reveal>
      <form
        onSubmit={submit}
        className="bg-card rounded-xl border border-border p-6 sm:p-8 shadow-sm space-y-5"
        noValidate
      >
        <h3 className="font-bold text-lg text-suzuki-navy dark:text-foreground">Bagikan Pengalaman Anda</h3>
        <p className="text-sm text-muted-foreground -mt-3">
          Testimoni akan ditinjau oleh tim kami sebelum ditayangkan. Terima kasih!
        </p>

        <div>
          <label htmlFor="testi-nama" className="block text-sm font-medium mb-1.5 text-suzuki-navy dark:text-foreground">
            Nama <span className="text-suzuki-red">*</span>
          </label>
          <input
            id="testi-nama"
            value={nama}
            onChange={(e) => setNama(e.target.value)}
            maxLength={100}
            required
            autoComplete="name"
            className="w-full px-4 py-2.5 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-suzuki-red/50 focus:border-suzuki-red/50"
            placeholder="Nama Anda"
          />
        </div>

        <div>
          <span className="block text-sm font-medium mb-1.5 text-suzuki-navy dark:text-foreground">
            Rating <span className="text-suzuki-red">*</span>
          </span>
          <div className="flex items-center gap-1" role="radiogroup" aria-label="Pilih rating">
            {Array.from({ length: 5 }).map((_, i) => {
              const val = i + 1;
              const shown = hoverRating || rating;
              return (
                <button
                  key={val}
                  type="button"
                  role="radio"
                  aria-checked={rating === val}
                  aria-label={`${val} bintang`}
                  onMouseEnter={() => setHoverRating(val)}
                  onMouseLeave={() => setHoverRating(0)}
                  onClick={() => setRating(val)}
                  className="p-1 transition-transform hover:scale-125 active:scale-95"
                >
                  <Star
                    className={`w-7 h-7 transition-colors ${
                      val <= shown ? "fill-amber-400 text-amber-400" : "fill-muted text-muted-foreground/30"
                    }`}
                    aria-hidden
                  />
                </button>
              );
            })}
            <span className="ml-2 text-sm text-muted-foreground" aria-live="polite">
              {rating} / 5
            </span>
          </div>
        </div>

        <div>
          <label htmlFor="testi-pesan" className="block text-sm font-medium mb-1.5 text-suzuki-navy dark:text-foreground">
            Testimoni Anda <span className="text-suzuki-red">*</span>
          </label>
          <textarea
            id="testi-pesan"
            value={pesan}
            onChange={(e) => setPesan(e.target.value)}
            rows={4}
            maxLength={1000}
            required
            className="w-full px-4 py-2.5 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-suzuki-red/50 focus:border-suzuki-red/50 resize-y"
            placeholder="Ceritakan pengalaman Anda membeli / servis di Suzuki BSB…"
          />
          <p className="text-xs text-muted-foreground mt-1 text-right">{pesan.length}/1000</p>
        </div>

        {/* Honeypot — disembunyikan dari manusia, terlihat oleh bot */}
        <div className="absolute -left-[9999px]" aria-hidden>
          <label>
            Website
            <input
              type="text"
              tabIndex={-1}
              autoComplete="off"
              value={website}
              onChange={(e) => setWebsite(e.target.value)}
            />
          </label>
        </div>

        {error && (
          <p className="text-sm text-red-600 dark:text-red-300 bg-red-50 dark:bg-red-950/60 border border-red-200 dark:border-red-900 rounded-lg px-4 py-2.5" role="alert">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={mutation.isPending}
          className="inline-flex w-full items-center justify-center gap-2 bg-suzuki-red hover:bg-suzuki-red/90 text-white px-6 py-3 rounded-lg font-semibold transition-all hover:shadow-lg hover:shadow-suzuki-red/30 active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {mutation.isPending ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" aria-hidden /> Mengirim…
            </>
          ) : mutation.isSuccess ? (
            <>
              <CheckCircle2 className="w-4 h-4" aria-hidden /> Terkirim
            </>
          ) : (
            <>
              <Send className="w-4 h-4" aria-hidden /> Kirim Testimoni
            </>
          )}
        </button>
      </form>
    </Reveal>
  );
}
