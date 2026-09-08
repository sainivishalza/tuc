"use server";

import { requireAdminAction } from "@/lib/adminAuth";
import { purgeHostingerCache } from "@/lib/hostinger";

export async function purgeCdnCache(): Promise<{ ok: boolean; message: string }> {
  await requireAdminAction();
  return purgeHostingerCache();
}
