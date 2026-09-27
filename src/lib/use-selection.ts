"use client";

import { useState } from "react";

/**
 * State seleksi item (checkbox) untuk aksi massal di halaman admin.
 *
 * Id yang tidak lagi ada di daftar (terhapus / terfilter keluar) otomatis
 * dibuang memakai pola "adjust state during render" React — aman dari
 * aturan react-hooks/set-state-in-effect dan selalu konsisten dengan
 * daftar yang sedang tampil.
 */
export function useSelection(items: Array<{ id: string }>) {
  const [selected, setSelected] = useState<ReadonlySet<string>>(new Set());

  // Buang id basi saat daftar berubah (item terhapus / keluar filter)
  const validIds = new Set(items.map((i) => i.id));
  let hasStale = false;
  for (const id of selected) {
    if (!validIds.has(id)) {
      hasStale = true;
      break;
    }
  }
  if (hasStale) {
    const next = new Set(selected);
    for (const id of next) {
      if (!validIds.has(id)) next.delete(id);
    }
    setSelected(next);
  }

  const allSelected = items.length > 0 && items.every((i) => selected.has(i.id));
  const someSelected = selected.size > 0 && !allSelected;

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleAll() {
    setSelected((prev) => {
      if (items.length > 0 && items.every((i) => prev.has(i.id))) return new Set();
      return new Set(items.map((i) => i.id));
    });
  }

  function selectAll() {
    setSelected(new Set(items.map((i) => i.id)));
  }

  function clear() {
    setSelected(new Set());
  }

  return {
    selected,
    count: selected.size,
    allSelected,
    someSelected,
    toggle,
    toggleAll,
    selectAll,
    clear,
  };
}
