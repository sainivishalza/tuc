"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { ADMIN_COOKIE_NAME, createSessionToken, safeCompare } from "@/lib/adminAuth";

export interface LoginState {
  error?: string;
}

export async function login(_prevState: LoginState, formData: FormData): Promise<LoginState> {
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
    return { error: "Incorrect password." };
  }

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
