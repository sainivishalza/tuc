import "server-only";
import { createHmac, timingSafeEqual } from "crypto";

// Resend signs webhook deliveries the same way Svix does (Resend uses
// Svix as its webhook-delivery provider) — verified against Svix's own
// manual-verification docs rather than pulling in the svix package, to
// keep this a plain crypto check like every other signing helper in this
// codebase (lib/adminAuth.ts, lib/portalAuth.ts, ...).
export interface SvixHeaders {
  id: string | null;
  timestamp: string | null;
  signature: string | null;
}

/** 5-minute replay-window tolerance — generous enough for real clock
 * drift/delivery delay, tight enough that a captured request can't be
 * replayed hours later. */
const TIMESTAMP_TOLERANCE_SECONDS = 5 * 60;

function safeCompare(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) return false;
  return timingSafeEqual(bufA, bufB);
}

/** `rawBody` must be the exact, unparsed request body — the signature is
 * computed over its literal bytes, so re-serializing parsed JSON would
 * produce a different (and wrongly-rejected) signature. */
export function verifyResendWebhookSignature(rawBody: string, headers: SvixHeaders, secret: string): boolean {
  const { id, timestamp, signature } = headers;
  if (!id || !timestamp || !signature || !secret.startsWith("whsec_")) return false;

  const timestampNum = Number(timestamp);
  if (!Number.isFinite(timestampNum)) return false;
  if (Math.abs(Date.now() / 1000 - timestampNum) > TIMESTAMP_TOLERANCE_SECONDS) return false;

  const secretBytes = Buffer.from(secret.slice("whsec_".length), "base64");
  const signedContent = `${id}.${timestamp}.${rawBody}`;
  const expected = createHmac("sha256", secretBytes).update(signedContent).digest("base64");

  // svix-signature is space-delimited "v1,<base64sig>" entries — Svix
  // rotates/supports multiple signing versions, so any match is valid.
  const candidates = signature.split(" ").map((entry) => entry.split(",")[1]).filter(Boolean);
  return candidates.some((candidate) => safeCompare(candidate, expected));
}
