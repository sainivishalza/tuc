"use server";

import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { ADMIN_COOKIE_NAME, createSessionToken, safeCompare } from "@/lib/adminAuth";
import { checkRateLimit, recordFailedAttempt, clearRateLimit } from "@/lib/rateLimit";

export interface LoginState {
  error?: string;
}

export async function login(_prevState: LoginState, formData: FormData): Promise<LoginState> {
  const headersList = await headers();
  // x-forwarded-for is a client-appended, comma-separated hop chain
  // ("client, proxy1, proxy2, ..."). The FIRST entry is whatever the
  // original request claimed — trivially spoofable by anyone setting
  // their own X-Forwarded-For header, which would let an attacker rotate
  // a fake value on every request to bypass the rate limit entirely. The
  // LAST entry is the one appended by our own reverse proxy (the hop
  // closest to this server), which the client cannot control.
  const ip = headersList.get("x-forwarded-for")?.split(",").pop()?.trim() ?? "unknown";

  const limit = await checkRateLimit(ip);
  if (!limit.allowed) {
    const minutes = Math.ceil((limit.retryAfterMs ?? 0) / 60000);
    return { error: `Too many attempts. Try again in ${minutes} minute${minutes === 1 ? "" : "s"}.` };
  }

  const password = String(formData.get("password") ?? "");
  const expectedPassword = process.env.ADMIN_PASSWORD;
  const sessionSecret = process.env.ADMIN_SESSION_SECRET;

  if (!expectedPassword || !sessionSecret) {
    return {
      error:
        "Admin panel isn't configured yet. Set ADMIN_PASSWORD and ADMIN_SESSION_SECRET as environment variables on your hosting.",
    };
  }

  if (!password || !safeCompare(password, expectedPassword)) {
    await recordFailedAttempt(ip);
    return { error: "Incorrect password." };
  }

  await clearRateLimit(ip);

  const token = createSessionToken(sessionSecret);
  (await cookies()).set(ADMIN_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 8,
  });

  redirect("/admin");
}
