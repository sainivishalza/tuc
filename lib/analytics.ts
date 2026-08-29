/**
 * Lightweight, cookie-free analytics.
 * All data lives in localStorage — no server, no third parties, fully GDPR-safe.
 */

const STORAGE_KEY = "tuc_analytics";
const MAX_EVENTS = 500;

export interface AnalyticsEvent {
  type: "pageview" | "cta_click";
  path: string;
  label?: string;
  ts: number;
}

interface AnalyticsStore {
  events: AnalyticsEvent[];
}

function load(): AnalyticsStore {
  if (typeof window === "undefined") return { events: [] };
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { events: [] };
    return JSON.parse(raw) as AnalyticsStore;
  } catch {
    return { events: [] };
  }
}

function save(store: AnalyticsStore) {
  if (typeof window === "undefined") return;
  // Keep only the most recent events
  store.events = store.events.slice(-MAX_EVENTS);
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
  } catch {
    // Storage full — drop oldest half
    store.events = store.events.slice(-Math.floor(MAX_EVENTS / 2));
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
    } catch {
      // Give up silently
    }
  }
}

export function trackPageView(path: string) {
  const store = load();
  store.events.push({ type: "pageview", path, ts: Date.now() });
  save(store);
}

export function trackCtaClick(label: string, path: string) {
  const store = load();
  store.events.push({ type: "cta_click", path, label, ts: Date.now() });
  save(store);
}

export function getEvents(): AnalyticsEvent[] {
  return load().events;
}

export function getPageViewCounts(): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const e of load().events) {
    if (e.type === "pageview") {
      counts[e.path] = (counts[e.path] ?? 0) + 1;
    }
  }
  return counts;
}

export function getCtaClickCounts(): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const e of load().events) {
    if (e.type === "cta_click" && e.label) {
      counts[e.label] = (counts[e.label] ?? 0) + 1;
    }
  }
  return counts;
}

export function getTotalEvents(): number {
  return load().events.length;
}

export function clearAnalytics() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(STORAGE_KEY);
}
