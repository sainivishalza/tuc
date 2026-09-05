import { createHmac, timingSafeEqual } from "crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export const ADMIN_COOKIE_NAME = "admin_session";
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
