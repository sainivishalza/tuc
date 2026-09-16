import { createHmac } from "crypto";
import { safeCompare } from "@/lib/adminAuth";

// Reuses PORTAL_SESSION_SECRET (already configured on every environment
// that has ever needed the client portal) rather than requiring yet
// another env var — the "unsubscribe:" prefix on the HMAC key domain-
// separates these tokens from portal session/login tokens signed with
// the same underlying secret, so one can never be replayed as the other.
function signingKey(): string | null {
  const secret = process.env.PORTAL_SESSION_SECRET;
  return secret ? `unsubscribe:${secret}` : null;
}

function sign(payload: string, key: string): string {
  return createHmac("sha256", key).update(payload).digest("base64url");
}

/** No expiry — an unsubscribe link in an old email should still work
 * whenever someone finally opens it. */
export function createUnsubscribeToken(email: string): string | null {
  const key = signingKey();
  if (!key) return null;
  const payload = Buffer.from(email.trim().toLowerCase()).toString("base64url");
  return `${payload}.${sign(payload, key)}`;
}

export function verifyUnsubscribeToken(token: string): string | null {
  const key = signingKey();
  if (!key) return null;
  const [payload, signature] = token.split(".");
  if (!payload || !signature) return null;
  if (!safeCompare(signature, sign(payload, key))) return null;
  try {
    return Buffer.from(payload, "base64url").toString("utf8");
  } catch {
    return null;
  }
}
