"use server";

import { unstable_cache, revalidateTag } from "next/cache";
import { getSupabasePublicClient } from "@/lib/supabase/publicClient";
import { getSupabaseAdminClient } from "@/lib/supabase/adminClient";
import { requireAdminAction } from "@/lib/adminAuth";
import type { SiteTheme } from "@/lib/supabase/types";

const DEFAULT_THEME: SiteTheme = {
  id: "default",
  primary_color: "#0b192c",
  accent_color: "#f39c12",
  surface_color: "#ffffff",
  background_color: "#eef2f6",
  font_choice: "inter",
  text_scale: "medium",
  updated_at: "",
};

const HEX_COLOR_RE = /^#[0-9a-fA-F]{6}$/;

// Cached (not per-request) so every page can stay statically generated —
// this only changes when an admin saves new settings, at which point
// updateSiteTheme explicitly busts the tag below.
const getCachedTheme = unstable_cache(
  async (): Promise<SiteTheme> => {
    const supabase = getSupabasePublicClient();
    const { data } = await supabase.from("site_theme").select("*").eq("id", "default").maybeSingle();
    return sanitizeTheme(data as SiteTheme | null);
  },
  ["site-theme"],
  { tags: ["site-theme"] }
);

/** The root layout interpolates these values directly into a raw <style>
 * tag on every page, so re-validate on read too (not just on write) —
 * belt and suspenders against anything ever landing in the row outside
 * the validated updateSiteTheme path (e.g. a manual DB edit). */
function sanitizeTheme(row: SiteTheme | null): SiteTheme {
  if (!row) return DEFAULT_THEME;
  return {
    ...row,
    primary_color: HEX_COLOR_RE.test(row.primary_color) ? row.primary_color : DEFAULT_THEME.primary_color,
    accent_color: HEX_COLOR_RE.test(row.accent_color) ? row.accent_color : DEFAULT_THEME.accent_color,
    surface_color: HEX_COLOR_RE.test(row.surface_color) ? row.surface_color : DEFAULT_THEME.surface_color,
    background_color: HEX_COLOR_RE.test(row.background_color)
      ? row.background_color
      : DEFAULT_THEME.background_color,
    font_choice: ["inter", "poppins", "playfair"].includes(row.font_choice)
      ? row.font_choice
      : DEFAULT_THEME.font_choice,
    text_scale: ["small", "medium", "large"].includes(row.text_scale) ? row.text_scale : DEFAULT_THEME.text_scale,
  };
}

/** Public — read on every page (root layout) to apply site-wide styling. */
export async function getSiteTheme(): Promise<SiteTheme> {
  return getCachedTheme();
}

export interface ThemeInput {
  primary_color: string;
  accent_color: string;
  surface_color: string;
  background_color: string;
  font_choice: SiteTheme["font_choice"];
  text_scale: SiteTheme["text_scale"];
}

export interface ThemeSaveResult {
  ok: boolean;
  message: string;
}

export async function updateSiteTheme(input: ThemeInput): Promise<ThemeSaveResult> {
  await requireAdminAction();

  if (
    !HEX_COLOR_RE.test(input.primary_color) ||
    !HEX_COLOR_RE.test(input.accent_color) ||
    !HEX_COLOR_RE.test(input.surface_color) ||
    !HEX_COLOR_RE.test(input.background_color)
  ) {
    return { ok: false, message: "Colors must be a valid hex code like #059669." };
  }

  const supabase = getSupabaseAdminClient();
  const { error } = await supabase.from("site_theme").upsert({
    id: "default",
    primary_color: input.primary_color,
    accent_color: input.accent_color,
    surface_color: input.surface_color,
    background_color: input.background_color,
    font_choice: input.font_choice,
    text_scale: input.text_scale,
    updated_at: new Date().toISOString(),
  });

  if (error) return { ok: false, message: error.message };

  // "max" is this Next.js version's recommended revalidateTag profile —
  // it marks the cached theme stale and refreshes it in the background on
  // the next page visit, rather than blocking. In practice this means the
  // new theme is live within moments, not instantly on this exact request.
  revalidateTag("site-theme", "max");
  return { ok: true, message: "Saved — give it a few seconds, then refresh the site to see it applied everywhere." };
}
