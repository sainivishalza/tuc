"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { SUPPLIER_COOKIE_NAME } from "@/lib/supplierAuth";

export async function logout() {
  (await cookies()).delete(SUPPLIER_COOKIE_NAME);
  redirect("/supplier-portal/login");
}
