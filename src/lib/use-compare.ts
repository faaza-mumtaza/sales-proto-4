"use client";

// Hook React untuk compare-store — aman terhadap hydration mismatch
// (server snapshot selalu array kosong, sinkron ke localStorage setelah mount).

import { useCallback, useSyncExternalStore } from "react";
import {
  getCompareSlugs,
  toggleCompare,
  removeCompare,
  clearCompare,
  subscribeCompare,
  MAX_COMPARE,
} from "./compare-store";

const EMPTY: string[] = [];

export function useCompare() {
  const slugs = useSyncExternalStore(subscribeCompare, getCompareSlugs, () => EMPTY);

  const toggle = useCallback((slug: string) => toggleCompare(slug), []);
  const remove = useCallback((slug: string) => removeCompare(slug), []);
  const clear = useCallback(() => clearCompare(), []);

  return { slugs, toggle, remove, clear, max: MAX_COMPARE, isFull: slugs.length >= MAX_COMPARE };
}
