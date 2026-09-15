import { createHmac } from "crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { safeCompare } from "@/lib/adminAuth";

// Same __Host- reasoning as ADMIN_COOKIE_NAME/PORTAL_COOKIE_NAME — kept
// as its own cookie (and own SUPPLIER_SESSION_SECRET) rather than reusing
// the client portal's, so a leaked client session can never be replayed
// as a supplier session or vice versa.
export const SUPPLIER_COOKIE_NAME =
  process.env.NODE_ENV === "production" ? "__Host-supplier_session" : "supplier_session";

const LOGIN_LINK_TTL_MS = 15 * 60 * 1000; // 15 minutes
const SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

interface SupplierTokenPayload {
  email: string;
  purpose: "login" | "session";
  exp: number;
}

function sign(payload: string, secret: string): string {
  return createHmac("sha256", secret).update(payload).digest("base64url");
}

function encode(payload: SupplierTokenPayload, secret: string): string {
  const json = Buffer.from(JSON.stringify(payload)).toString("base64url");
  return `${json}.${sign(json, secret)}`;
}

function decode(
  token: string | undefined,
  secret: string | undefined,
  purpose: SupplierTokenPayload["purpose"]
): string | null {
  if (!token || !secret) return null;
  const [json, signature] = token.split(".");
  if (!json || !signature) return null;

  if (!safeCompare(signature, sign(json, secret))) return null;

  let payload: SupplierTokenPayload;
  try {
    payload = JSON.parse(Buffer.from(json, "base64url").toString("utf8"));
  } catch {
    return null;
  }

  if (payload.purpose !== purpose) return null;
  if (!payload.email || !Number.isFinite(payload.exp) || Date.now() > payload.exp) return null;

  return payload.email;
}

export function createLoginLinkToken(email: string, secret: string): string {
  return encode({ email, purpose: "login", exp: Date.now() + LOGIN_LINK_TTL_MS }, secret);
}

export function verifyLoginLinkToken(token: string, secret: string | undefined): string | null {
  return decode(token, secret, "login");
}

export function createSupplierSessionToken(email: string, secret: string): string {
  return encode({ email, purpose: "session", exp: Date.now() + SESSION_TTL_MS }, secret);
}

function verifySupplierSessionToken(token: string | undefined, secret: string | undefined): string | null {
  return decode(token, secret, "session");
}

/** Call at the top of a supplier-portal page (server component). Redirects to login if not authenticated. */
export async function requireSupplierEmail(): Promise<string> {
  const token = (await cookies()).get(SUPPLIER_COOKIE_NAME)?.value;
  const email = verifySupplierSessionToken(token, process.env.SUPPLIER_SESSION_SECRET);
  if (!email) redirect("/supplier-portal/login");
  return email;
}
