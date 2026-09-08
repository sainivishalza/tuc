"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { PORTAL_COOKIE_NAME } from "@/lib/portalAuth";

export async function logout() {
  (await cookies()).delete(PORTAL_COOKIE_NAME);
  redirect("/portal/login");
}
