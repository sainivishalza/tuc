import { createHmac, timingSafeEqual } from "crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

// The __Host- prefix is a browser-enforced guarantee: a cookie named
// this way is only ever accepted/sent if it also has Secure, Path=/, and
// no Domain attribute — which rules out it ever being set by a
// subdomain, a MITM on a non-HTTPS connection, or a misconfigured
// Domain= leaking it wider than intended. Only applied in production —
// browsers refuse to set a __Host- cookie at all without Secure, which
// local http://localhost dev/testing doesn't have.
export const ADMIN_COOKIE_NAME =
  process.env.NODE_ENV === "production" ? "__Host-admin_session" : "admin_session";
const SESSION_TTL_MS = 8 * 60 * 60 * 1000; // 8 hours

function sign(payload: string, secret: string): string {
  return createHmac("sha256", secret).update(payload).digest("base64url");
}

/** Constant-time string comparison to avoid timing side-channels. */
export function safeCompare(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) return false;
  return timingSafeEqual(bufA, bufB);
}

export function createSessionToken(secret: string): string {
  const payload = String(Date.now() + SESSION_TTL_MS);
  return `${payload}.${sign(payload, secret)}`;
}

export function verifySessionToken(token: string | undefined, secret: string | undefined): boolean {
  if (!token || !secret) return false;
  const [payload, signature] = token.split(".");
  if (!payload || !signature) return false;

  const expected = sign(payload, secret);
  if (!safeCompare(signature, expected)) return false;

  const expiry = Number(payload);
  if (!Number.isFinite(expiry) || Date.now() > expiry) return false;

  return true;
}

/** Call at the top of an admin page (server component). Redirects to login if not authenticated. */
export async function requireAdminPage(): Promise<void> {
  const token = (await cookies()).get(ADMIN_COOKIE_NAME)?.value;
  if (!verifySessionToken(token, process.env.ADMIN_SESSION_SECRET)) {
    redirect("/admin/login");
  }
}

/** Call at the top of an admin server action. Throws if not authenticated, since actions can't redirect the caller's page state. */
export async function requireAdminAction(): Promise<void> {
  const token = (await cookies()).get(ADMIN_COOKIE_NAME)?.value;
  if (!verifySessionToken(token, process.env.ADMIN_SESSION_SECRET)) {
    throw new Error("Not authenticated");
  }
}
