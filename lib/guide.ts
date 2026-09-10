import { getSupabasePublicClient } from "@/lib/supabase/publicClient";

const GUIDE_PATH = "guides/sourcing-guide.pdf";

/** Safe for both server and browser use — reads the public
 * NEXT_PUBLIC_SUPABASE_URL env var, not a secret. */
export function getGuidePdfUrl(): string {
  const supabase = getSupabasePublicClient();
  return supabase.storage.from("site-assets").getPublicUrl(GUIDE_PATH).data.publicUrl;
}
