import { NextRequest, NextResponse } from "next/server";
import { verifyLoginLinkToken, createSupplierSessionToken, SUPPLIER_COOKIE_NAME } from "@/lib/supplierAuth";

// Same reasoning as app/portal/verify/route.ts — build absolute URLs from
// a fixed constant, since request.url resolves to the app's internal bind
// address behind Hostinger's reverse proxy.
const SITE_URL = "https://theuniquechoice.com";

export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get("token");
  const secret = process.env.SUPPLIER_SESSION_SECRET;
  const email = token && secret ? verifyLoginLinkToken(token, secret) : null;

  if (!email || !secret) {
    return NextResponse.redirect(`${SITE_URL}/supplier-portal/login`);
  }

  const sessionToken = createSupplierSessionToken(email, secret);
  const response = NextResponse.redirect(`${SITE_URL}/supplier-portal`);
  response.cookies.set(SUPPLIER_COOKIE_NAME, sessionToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
  return response;
}
