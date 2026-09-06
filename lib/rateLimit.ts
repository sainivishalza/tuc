const MAX_ATTEMPTS = 5;
const WINDOW_MS = 15 * 60 * 1000; // 15 minutes

interface Entry {
  count: number;
  resetAt: number;
}

// In-memory is sufficient here: the admin panel runs as a single Node
// process (not per-request serverless functions), so this persists for
// the life of that process. It resets on restart/deploy, which is an
// acceptable tradeoff for a single-password internal tool.
const attempts = new Map<string, Entry>();

export function checkRateLimit(key: string): { allowed: boolean; retryAfterMs?: number } {
  const entry = attempts.get(key);
  if (!entry || Date.now() > entry.resetAt) return { allowed: true };
  if (entry.count >= MAX_ATTEMPTS) {
    return { allowed: false, retryAfterMs: entry.resetAt - Date.now() };
  }
  return { allowed: true };
}

export function recordFailedAttempt(key: string): void {
  const entry = attempts.get(key);
  if (!entry || Date.now() > entry.resetAt) {
    attempts.set(key, { count: 1, resetAt: Date.now() + WINDOW_MS });
  } else {
    entry.count += 1;
  }
}

export function clearRateLimit(key: string): void {
  attempts.delete(key);
}
