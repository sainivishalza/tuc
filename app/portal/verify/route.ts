import { NextRequest, NextResponse } from "next/server";
import { verifyLoginLinkToken, createPortalSessionToken, PORTAL_COOKIE_NAME } from "@/lib/portalAuth";

// Sets the cookie directly on the NextResponse rather than through
// next/headers' cookies() — explicit and guaranteed to attach to exactly
// the response this handler returns, with no dependence on how Next
// merges a separately-mutated cookie store into a manually-built redirect.
export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get("token");
  const secret = process.env.PORTAL_SESSION_SECRET;
  const email = token && secret ? verifyLoginLinkToken(token, secret) : null;

  if (!email || !secret) {
    return NextResponse.redirect(new URL("/portal/login", request.url));
  }

  const sessionToken = createPortalSessionToken(email, secret);
  const response = NextResponse.redirect(new URL("/portal", request.url));
  response.cookies.set(PORTAL_COOKIE_NAME, sessionToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
  return response;
}
