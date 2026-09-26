"use client";

import { Link } from "@/lib/router";
import { Calendar, ArrowRight, Tag } from "lucide-react";
import { formatDateID, type Artikel } from "@/lib/site-utils";

export function ArticleCard({ article }: { article: Artikel }) {
  return (
    <Link
      to={`/artikel/${article.slug}`}
      className="bg-card rounded-xl border border-border overflow-hidden group hover:shadow-lg hover:-translate-y-0.5 transition-all flex flex-col"
    >
      {article.cover_image ? (
        <div className="relative aspect-[5/3] overflow-hidden bg-muted">
          <img
            src={article.cover_image}
            alt={article.judul}
            loading="lazy"
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
          <span className="absolute top-4 left-4 px-3 py-1 bg-suzuki-red text-white text-xs font-semibold rounded-full shadow">
            {article.tipe}
          </span>
        </div>
      ) : (
        <div className="relative aspect-[5/3] overflow-hidden bg-gradient-to-br from-suzuki-navy to-suzuki-navy/70 flex items-center justify-center">
          <span className="px-3 py-1 bg-suzuki-red text-white text-xs font-semibold rounded-full">
            {article.tipe}
          </span>
        </div>
      )}
      <div className="p-6 flex flex-col flex-1">
        <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
          <Calendar className="w-3.5 h-3.5" aria-hidden />
          {formatDateID(article.published_at ?? article.created_at)}
        </div>
        <h3 className="text-lg font-bold text-suzuki-navy mb-2 line-clamp-2 group-hover:text-suzuki-red transition-colors">
          {article.judul}
        </h3>
        {article.ringkasan && (
          <p className="text-muted-foreground text-sm line-clamp-3 mb-3">{article.ringkasan}</p>
        )}
        {article.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-3">
            {article.tags.slice(0, 3).map((t) => (
              <span
                key={t}
                className="inline-flex items-center gap-1 text-[11px] text-muted-foreground bg-muted px-2 py-0.5 rounded-full"
              >
                <Tag className="w-3 h-3" aria-hidden />
                {t}
              </span>
            ))}
          </div>
        )}
        <span className="mt-auto inline-flex items-center gap-1 text-suzuki-red font-medium text-sm group-hover:gap-2 transition-all">
          Baca Selengkapnya <ArrowRight className="w-4 h-4" aria-hidden />
        </span>
      </div>
    </Link>
  );
}
