"use client";

import { useCallback, useSyncExternalStore } from "react";
import { DEFAULT_CURRENCY } from "@/lib/currency";

const STORAGE_KEY = "uc_display_currency";
const listeners = new Set<() => void>();
let cached: string | null = null;

function readCurrency(): string {
  try {
    return window.localStorage.getItem(STORAGE_KEY) || DEFAULT_CURRENCY;
  } catch {
    return DEFAULT_CURRENCY;
  }
}

function getSnapshot(): string {
  if (!cached) cached = readCurrency();
  return cached;
}

function getServerSnapshot(): string {
  return DEFAULT_CURRENCY;
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function writeCurrency(code: string) {
  cached = code;
  try {
    window.localStorage.setItem(STORAGE_KEY, code);
  } catch {
    // localStorage unavailable (private mode, quota) — selection just won't persist
  }
  for (const listener of listeners) listener();
}

/** Same reasoning and shape as useSavedProducts (lib/savedProducts.ts) —
 * a per-visitor display preference with no server state, kept in sync
 * across every PriceTag on the page via useSyncExternalStore. */
export function useCurrency() {
  const currency = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const setCurrency = useCallback((code: string) => writeCurrency(code), []);
  return { currency, setCurrency };
}
