"use client";

// Hash router — seluruh website berjalan di route "/" (batasan preview
// sandbox), navigasi memakai fragment hash: #/mobil, #/artikel/judul-slug, dll.

import { useEffect, useSyncExternalStore, type AnchorHTMLAttributes, type ReactNode } from "react";

export interface Route {
  /** path tanpa query, contoh: "/mobil/ertiga-hybrid" */
  path: string;
  /** segmen path: ["mobil", "ertiga-hybrid"] */
  segments: string[];
  /** query params */
  query: URLSearchParams;
}

function parseHash(): Route {
  if (typeof window === "undefined") {
    return { path: "/", segments: [], query: new URLSearchParams() };
  }
  const raw = window.location.hash.replace(/^#/, "") || "/";
  const [pathPart, queryPart] = raw.split("?");
  let path = pathPart.startsWith("/") ? pathPart : "/" + pathPart;
  path = path.replace(/\/+$/, "") || "/";
  return {
    path,
    segments: path.slice(1).split("/").filter(Boolean),
    query: new URLSearchParams(queryPart ?? ""),
  };
}

// Snapshot server: server tidak pernah menerima fragment hash, jadi selalu
// render "/" — client memakai nilai ini juga saat pass hidrasi sehingga HTML
// selalu cocok, lalu beralih ke hash asli setelah hidrasi selesai.
const SERVER_ROUTE: Route = {
  path: "/",
  segments: [],
  query: new URLSearchParams(),
};

// Cache snapshot agar referensi stabil (syarat useSyncExternalStore)
let cachedHash = "\u0000unset";
let cachedRoute: Route = SERVER_ROUTE;

function getSnapshot(): Route {
  const hash = typeof window === "undefined" ? "" : window.location.hash;
  if (hash !== cachedHash) {
    cachedHash = hash;
    cachedRoute = parseHash();
  }
  return cachedRoute;
}

function getServerSnapshot(): Route {
  return SERVER_ROUTE;
}

function subscribe(callback: () => void): () => void {
  const handler = () => {
    // scroll ke atas saat navigasi (hashchange hanya terjadi saat navigasi)
    window.scrollTo({ top: 0, behavior: "instant" as ScrollBehavior });
    callback();
  };
  window.addEventListener("hashchange", handler);
  return () => window.removeEventListener("hashchange", handler);
}

export function useHashRoute(): Route {
  // useSyncExternalStore: pola resmi React untuk state eksternal (location.hash)
  // dengan dukungan SSR/hidrasi via getServerSnapshot.
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

/** Navigasi programatik, mis. navigate("/admin/katalog"). */
export function navigate(to: string) {
  const target = to.startsWith("/") ? to : "/" + to;
  const next = "#" + target;
  if (window.location.hash === next) return;
  window.location.hash = next;
}

interface LinkProps extends Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "href"> {
  to: string;
  children: ReactNode;
}

/** Link navigasi SPA (anchor dengan hash). */
export function Link({ to, children, ...rest }: LinkProps) {
  const target = to.startsWith("/") ? to : "/" + to;
  return (
    <a href={"#" + target} {...rest}>
      {children}
    </a>
  );
}

/** Set judul dokumen per-view (SEO client-side di sandbox SPA). */
export function usePageMeta(title: string) {
  useEffect(() => {
    document.title = title;
  }, [title]);
}
