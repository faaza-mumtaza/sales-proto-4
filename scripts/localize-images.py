#!/usr/bin/env python3
"""Localize all remote car images into db/uploads + restore missing assets.

Run from project root: python3 scripts/localize-images.py
- Downloads every http(s) image referenced by mobil_katalog into
  db/uploads/cars/cms/<slug>.<ext> and rewrites DB refs to /api/files/...
- Restores the missing Baleno asset from download/baleno-clean.jpg
  (matches existing DB ref 8a29e8eb-f9c2-4a15-97f1-f193f79387ad.jpg).
- Prints a report; exits non-zero if anything is still missing afterward.

NOTE: operates directly on SQLite (db/custom.db) with the dev server running.
SQLite WAL allows concurrent readers/writers — the running Next.js process
re-reads rows per request, so updates are visible immediately.
"""
import json
import os
import sqlite3
import sys
import urllib.parse
import urllib.request

DB = "db/custom.db"
UPLOADS = "db/uploads"
BALENO_SRC = "download/baleno-clean.jpg"
BALENO_DST = "db/uploads/cars/2026-09/8a29e8eb-f9c2-4a15-97f1-f193f79387ad.jpg"

UA = "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126 Safari/537.36"


def fetch(url: str, dest: str) -> tuple[bool, int]:
    """Download url to dest. Returns (ok, size)."""
    try:
        req = urllib.request.Request(url, headers={"User-Agent": UA})
        with urllib.request.urlopen(req, timeout=30) as r:
            data = r.read()
        os.makedirs(os.path.dirname(dest), exist_ok=True)
        with open(dest, "wb") as f:
            f.write(data)
        return True, len(data)
    except Exception as e:  # noqa: BLE001
        print(f"  FAIL {url[:90]} -> {e}")
        return False, 0


def ext_for(url: str, data: bytes) -> str:
    """Pick extension from URL or magic bytes."""
    low = url.lower().split("?")[0]
    for ext in (".png", ".webp", ".jpg", ".jpeg"):
        if low.endswith(ext):
            return ext
    if data[:8] == b"\x89PNG\r\n\x1a\n":
        return ".png"
    if data[:4] == b"RIFF" and data[8:12] == b"WEBP":
        return ".webp"
    return ".jpg"


def main() -> int:
    conn = sqlite3.connect(DB)
    conn.row_factory = sqlite3.Row
    cur = conn.cursor()

    restored = 0

    # 1) Restore Baleno local asset (DB ref already points there)
    if os.path.exists(BALENO_SRC) and not os.path.exists(BALENO_DST):
        os.makedirs(os.path.dirname(BALENO_DST), exist_ok=True)
        with open(BALENO_SRC, "rb") as s, open(BALENO_DST, "wb") as d:
            d.write(s.read())
        print(f"[baleno] restored {BALENO_DST} ({os.path.getsize(BALENO_DST)} bytes)")
        restored += 1
    elif os.path.exists(BALENO_DST):
        print("[baleno] already present")
    else:
        print(f"[baleno] MISSING source {BALENO_SRC}")

    # 2) Localize remote refs per car
    for row in cur.execute(
        "SELECT id, nama, slug, gambar_utama, galeri_gambar, warna FROM mobil_katalog"
    ).fetchall():
        changed = False
        gambar = row["gambar_utama"]
        galeri = json.loads(row["galeri_gambar"]) if row["galeri_gambar"] else []
        warna = json.loads(row["warna"]) if row["warna"] else []
        url_map: dict[str, str] = {}  # remote url -> local /api/files path

        def localize(url: str) -> str:
            """Download remote url once; return new local path or original url."""
            if not url or not url.startswith("http"):
                return url
            if url in url_map:
                return url_map[url]
            dest_base = os.path.join(UPLOADS, "cars", "cms", row["slug"])
            # temp file to sniff extension
            tmp = dest_base + ".tmp"
            ok, size = fetch(url, tmp)
            if not ok:
                url_map[url] = url  # keep remote on failure
                return url
            with open(tmp, "rb") as f:
                head = f.read(64)
            with open(tmp, "rb") as f:
                data = f.read()
            ext = ext_for(url, data + head)
            dest = dest_base + ext
            os.replace(tmp, dest)
            api_path = "/api/files/cars/cms/" + row["slug"] + ext
            print(f"  [{row['slug']}] {url[:60]}... -> {api_path} ({size//1024} KB)")
            url_map[url] = api_path
            return api_path

        if gambar and gambar.startswith("http"):
            new = localize(gambar)
            if new != gambar:
                gambar = new
                changed = True

        for i, g in enumerate(galeri):
            if g and g.startswith("http"):
                new = localize(g)
                if new != g:
                    galeri[i] = new
                    changed = True

        for w in warna:
            img = w.get("gambar") or ""
            if img.startswith("http"):
                new = localize(img)
                if new != img:
                    w["gambar"] = new
                    changed = True

        if changed:
            cur.execute(
                "UPDATE mobil_katalog SET gambar_utama=?, galeri_gambar=?, warna=? WHERE id=?",
                (
                    gambar,
                    json.dumps(galeri),
                    json.dumps(warna),
                    row["id"],
                ),
            )
            restored += 1

    conn.commit()

    # 3) Final audit — every /api/files ref must exist on disk
    missing = []
    for nama, gu, gal, warna in cur.execute(
        "SELECT nama, gambar_utama, galeri_gambar, warna FROM mobil_katalog"
    ).fetchall():
        for u in [gu, *(json.loads(gal) if gal else []),
                  *[w.get("gambar") for w in (json.loads(warna) if warna else []) if w.get("gambar")]]:
            if not u:
                continue
            if u.startswith("/api/files/"):
                p = urllib.parse.unquote(u.replace("/api/files/", UPLOADS + "/", 1))
                if not os.path.exists(p):
                    missing.append((nama, u))
            elif not u.startswith("http"):
                missing.append((nama, u + " (unexpected scheme)"))

    for slug, cover in cur.execute("SELECT slug, cover_image FROM artikel").fetchall():
        if cover and cover.startswith("/api/files/"):
            p = urllib.parse.unquote(cover.replace("/api/files/", UPLOADS + "/", 1))
            if not os.path.exists(p):
                missing.append((slug, cover))

    print(f"\nrestored/localized cars: {restored}")
    print(f"missing after run: {len(missing)}")
    for label, u in missing:
        print("  STILL MISSING:", label, "->", u)

    conn.close()
    return 1 if missing else 0


if __name__ == "__main__":
    sys.exit(main())
