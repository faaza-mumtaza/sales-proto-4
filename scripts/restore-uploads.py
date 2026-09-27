#!/usr/bin/env python3
"""Restore db/uploads from the backup tarball (download/uploads-backup.tar.gz).

db/uploads is RUNTIME data (gitignored) and has been wiped by sandbox resets
twice before. The backup tarball mirrors every asset referenced by the DB.
After restoring, run `python3 scripts/localize-images.py` to audit — it must
report "missing after run: 0".

Usage:  python3 scripts/restore-uploads.py
"""
import os
import shutil
import subprocess
import sys

TARBALL = "download/uploads-backup.tar.gz"
DEST_PARENT = "db"


def main() -> int:
    if not os.path.exists(TARBALL):
        print(f"ERROR: backup tarball not found: {TARBALL}")
        print("Re-fetch assets instead:")
        print("  1. Baleno: copy download/baleno-clean.jpg -> db/uploads/cars/2026-09/8a29e8eb-f9c2-4a15-97f1-f193f79387ad.jpg")
        print("  2. Cars CMS images: python3 scripts/localize-images.py (re-downloads remote refs)")
        print("  3. Article covers: re-run image-search (see worklog Task 12 procedure)")
        return 1

    os.makedirs(DEST_PARENT, exist_ok=True)
    print(f"Extracting {TARBALL} -> {DEST_PARENT}/uploads ...")
    r = subprocess.run(
        ["tar", "xzf", TARBALL, "-C", DEST_PARENT],
        check=False,
    )
    if r.returncode != 0:
        print("ERROR: tar extraction failed")
        return 1

    count = sum(len(files) for _, _, files in os.walk(os.path.join(DEST_PARENT, "uploads")))
    size = sum(
        os.path.getsize(os.path.join(root, f))
        for root, _, files in os.walk(os.path.join(DEST_PARENT, "uploads"))
        for f in files
    )
    print(f"Restored {count} files ({size // 1024} KB) to {DEST_PARENT}/uploads")

    # Audit
    audit = subprocess.run(
        [sys.executable, "scripts/localize-images.py"],
        check=False,
        capture_output=True,
        text=True,
    )
    tail = audit.stdout.strip().splitlines()[-2:]
    print("Audit:", " | ".join(tail))
    return audit.returncode


if __name__ == "__main__":
    sys.exit(main())
