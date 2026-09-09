import { createHmac } from "crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { safeCompare } from "@/lib/adminAuth";

// See ADMIN_COOKIE_NAME in lib/adminAuth.ts for why this is conditional
// and what __Host- actually guarantees.
export const PORTAL_COOKIE_NAME =
  process.env.NODE_ENV === "production" ? "__Host-portal_session" : "portal_session";

const LOGIN_LINK_TTL_MS = 15 * 60 * 1000; // 15 minutes — long enough to open an email, short enough to limit a leaked-link window
const SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

interface PortalTokenPayload {
  email: string;
  purpose: "login" | "session";
  exp: number;
}

function sign(payload: string, secret: string): string {
  return createHmac("sha256", secret).update(payload).digest("base64url");
}

function encode(payload: PortalTokenPayload, secret: string): string {
  const json = Buffer.from(JSON.stringify(payload)).toString("base64url");
  return `${json}.${sign(json, secret)}`;
}

function decode(
  token: string | undefined,
  secret: string | undefined,
  purpose: PortalTokenPayload["purpose"]
): string | null {
  if (!token || !secret) return null;
  const [json, signature] = token.split(".");
  if (!json || !signature) return null;

  if (!safeCompare(signature, sign(json, secret))) return null;

  let payload: PortalTokenPayload;
  try {
    payload = JSON.parse(Buffer.from(json, "base64url").toString("utf8"));
  } catch {
    return null;
  }

  if (payload.purpose !== purpose) return null;
  if (!payload.email || !Number.isFinite(payload.exp) || Date.now() > payload.exp) return null;

  return payload.email;
}

/** Short-lived, single-purpose token emailed as the sign-in link — kept
 * separate from the session token so a leaked email link can't be reused
 * to mint a fresh 30-day session after the 15-minute window closes. */
export function createLoginLinkToken(email: string, secret: string): string {
  return encode({ email, purpose: "login", exp: Date.now() + LOGIN_LINK_TTL_MS }, secret);
}

export function verifyLoginLinkToken(token: string, secret: string | undefined): string | null {
  return decode(token, secret, "login");
}

export function createPortalSessionToken(email: string, secret: string): string {
  return encode({ email, purpose: "session", exp: Date.now() + SESSION_TTL_MS }, secret);
}

function verifyPortalSessionToken(token: string | undefined, secret: string | undefined): string | null {
  return decode(token, secret, "session");
}

/** Call at the top of a portal page (server component). Redirects to login if not authenticated. */
export async function requirePortalEmail(): Promise<string> {
  const token = (await cookies()).get(PORTAL_COOKIE_NAME)?.value;
  const email = verifyPortalSessionToken(token, process.env.PORTAL_SESSION_SECRET);
  if (!email) redirect("/portal/login");
  return email;
}
