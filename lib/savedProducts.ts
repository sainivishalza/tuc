"use client";

import { useCallback, useSyncExternalStore } from "react";

const STORAGE_KEY = "uc_saved_products";

/** There's no buyer account system on this site — visitors browse
 * anonymously — so "saved products" lives entirely in the browser via
 * localStorage, same tradeoff as any anonymous wishlist. Nothing here
 * is sent to the server. useSyncExternalStore (rather than state+effect)
 * keeps every mounted button in sync with a toggle elsewhere on the page
 * and matches server-rendered markup during hydration. */
const listeners = new Set<() => void>();
let cached: Set<string> | null = null;

function readSavedIds(): Set<string> {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return new Set();
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? new Set(parsed) : new Set();
  } catch {
    return new Set();
  }
}

function getSnapshot(): Set<string> {
  if (!cached) cached = readSavedIds();
  return cached;
}

function getServerSnapshot(): Set<string> {
  return new Set();
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function writeSavedIds(ids: Set<string>) {
  cached = ids;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(Array.from(ids)));
  } catch {
    // localStorage unavailable (private mode, quota) — saving silently no-ops
  }
  for (const listener of listeners) listener();
}

export function useSavedProducts() {
  const savedIds = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const toggle = useCallback((productId: string) => {
    const next = new Set(cached ?? readSavedIds());
    if (next.has(productId)) next.delete(productId);
    else next.add(productId);
    writeSavedIds(next);
  }, []);

  const isSaved = useCallback((productId: string) => savedIds.has(productId), [savedIds]);

  return { savedIds, toggle, isSaved };
}
