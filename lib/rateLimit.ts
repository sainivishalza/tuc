const DEFAULT_MAX_ATTEMPTS = 5;
const DEFAULT_WINDOW_MS = 15 * 60 * 1000; // 15 minutes

interface Entry {
  count: number;
  resetAt: number;
  maxAttempts: number;
}

export interface RateLimitOptions {
  /** Attempts allowed within the window. Defaults to 5. */
  maxAttempts?: number;
  /** Window length in ms. Defaults to 15 minutes. */
  windowMs?: number;
}

// In-memory is sufficient here: the admin panel runs as a single Node
// process (not per-request serverless functions), so this persists for
// the life of that process. It resets on restart/deploy, which is an
// acceptable tradeoff for a single-password internal tool and for the
// public forms/lookups below — a deploy-triggered reset just means an
// attacker gets one fresh window per deploy, not unlimited attempts.
const attempts = new Map<string, Entry>();

export function checkRateLimit(key: string): { allowed: boolean; retryAfterMs?: number } {
  const entry = attempts.get(key);
  if (!entry || Date.now() > entry.resetAt) return { allowed: true };
  if (entry.count >= entry.maxAttempts) {
    return { allowed: false, retryAfterMs: entry.resetAt - Date.now() };
  }
  return { allowed: true };
}

export function recordFailedAttempt(key: string, options: RateLimitOptions = {}): void {
  const maxAttempts = options.maxAttempts ?? DEFAULT_MAX_ATTEMPTS;
  const windowMs = options.windowMs ?? DEFAULT_WINDOW_MS;
  const entry = attempts.get(key);
  if (!entry || Date.now() > entry.resetAt) {
    attempts.set(key, { count: 1, resetAt: Date.now() + windowMs, maxAttempts });
  } else {
    entry.count += 1;
  }
}

export function clearRateLimit(key: string): void {
  attempts.delete(key);
}
