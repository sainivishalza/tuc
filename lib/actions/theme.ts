"use server";

import { unstable_cache, revalidateTag } from "next/cache";
import { getSupabasePublicClient } from "@/lib/supabase/publicClient";
import { getSupabaseAdminClient } from "@/lib/supabase/adminClient";
import { requireAdminAction } from "@/lib/adminAuth";
import type { SiteTheme } from "@/lib/supabase/types";

const LOGO_BUCKET = "site-assets";
const LOGO_PATH = "logo";
const MAX_LOGO_BYTES = 2 * 1024 * 1024; // 2MB

const DEFAULT_THEME: SiteTheme = {
  id: "default",
  primary_color: "#0b192c",
  accent_color: "#d97706",
  secondary_color: "#2563eb",
  surface_color: "#ffffff",
  background_color: "#eef2f6",
  font_choice: "inter",
  text_scale: "medium",
  corner_style: "rounded",
  tinted_sections: true,
  logo_url: null,
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
    secondary_color: HEX_COLOR_RE.test(row.secondary_color)
      ? row.secondary_color
      : DEFAULT_THEME.secondary_color,
    surface_color: HEX_COLOR_RE.test(row.surface_color) ? row.surface_color : DEFAULT_THEME.surface_color,
    background_color: HEX_COLOR_RE.test(row.background_color)
      ? row.background_color
      : DEFAULT_THEME.background_color,
    font_choice: ["inter", "poppins", "playfair"].includes(row.font_choice)
      ? row.font_choice
      : DEFAULT_THEME.font_choice,
    text_scale: ["small", "medium", "large"].includes(row.text_scale) ? row.text_scale : DEFAULT_THEME.text_scale,
    corner_style: ["sharp", "rounded", "soft"].includes(row.corner_style)
      ? row.corner_style
      : DEFAULT_THEME.corner_style,
    tinted_sections: typeof row.tinted_sections === "boolean" ? row.tinted_sections : DEFAULT_THEME.tinted_sections,
    logo_url: typeof row.logo_url === "string" && row.logo_url.length > 0 ? row.logo_url : null,
  };
}

/** Public — read on every page (root layout) to apply site-wide styling. */
export async function getSiteTheme(): Promise<SiteTheme> {
  return getCachedTheme();
}

export interface ThemeInput {
  primary_color: string;
  accent_color: string;
  secondary_color: string;
  surface_color: string;
  background_color: string;
  font_choice: SiteTheme["font_choice"];
  text_scale: SiteTheme["text_scale"];
  corner_style: SiteTheme["corner_style"];
  tinted_sections: boolean;
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
    !HEX_COLOR_RE.test(input.secondary_color) ||
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
    secondary_color: input.secondary_color,
    surface_color: input.surface_color,
    background_color: input.background_color,
    font_choice: input.font_choice,
    text_scale: input.text_scale,
    corner_style: input.corner_style,
    tinted_sections: input.tinted_sections,
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

/**
 * Uploaded to a fixed path (not the original filename) so a re-upload
 * overwrites in place — no orphaned old files piling up in the bucket, and
 * no need to track/delete a previous path before writing the new one.
 * A cache-busting query param is appended to the stored URL since the path
 * never changes, otherwise browsers/CDNs would keep serving the old image.
 */
export async function uploadSiteLogo(formData: FormData): Promise<ThemeSaveResult> {
  await requireAdminAction();

  const file = formData.get("logo");
  if (!(file instanceof File) || file.size === 0) {
    return { ok: false, message: "No file selected." };
  }
  if (!file.type.startsWith("image/")) {
    return { ok: false, message: "Logo must be an image file (PNG, JPG, SVG, or WebP)." };
  }
  if (file.size > MAX_LOGO_BYTES) {
    return { ok: false, message: "Logo must be smaller than 2MB." };
  }

  const ext = file.type === "image/svg+xml" ? "svg" : file.type.split("/")[1] || "png";
  const path = `${LOGO_PATH}.${ext}`;
  const arrayBuffer = await file.arrayBuffer();

  const supabase = getSupabaseAdminClient();

  // Clear any previously uploaded logo with a different extension so
  // switching file types (e.g. png -> svg) doesn't leave a stale copy
  // sitting alongside the new one.
  await supabase.storage.from(LOGO_BUCKET).remove(["logo.png", "logo.jpg", "logo.jpeg", "logo.svg", "logo.webp"]);

  const { error: uploadError } = await supabase.storage.from(LOGO_BUCKET).upload(path, arrayBuffer, {
    contentType: file.type,
    upsert: true,
  });
  if (uploadError) return { ok: false, message: uploadError.message };

  const { data: publicUrl } = supabase.storage.from(LOGO_BUCKET).getPublicUrl(path);
  const logoUrl = `${publicUrl.publicUrl}?v=${Date.now()}`;

  const { error: updateError } = await supabase
    .from("site_theme")
    .update({ logo_url: logoUrl, updated_at: new Date().toISOString() })
    .eq("id", "default");
  if (updateError) return { ok: false, message: updateError.message };

  revalidateTag("site-theme", "max");
  return { ok: true, message: "Logo uploaded — give it a few seconds, then refresh to see it everywhere." };
}

export async function removeSiteLogo(): Promise<ThemeSaveResult> {
  await requireAdminAction();

  const supabase = getSupabaseAdminClient();
  await supabase.storage.from(LOGO_BUCKET).remove(["logo.png", "logo.jpg", "logo.jpeg", "logo.svg", "logo.webp"]);

  const { error } = await supabase
    .from("site_theme")
    .update({ logo_url: null, updated_at: new Date().toISOString() })
    .eq("id", "default");
  if (error) return { ok: false, message: error.message };

  revalidateTag("site-theme", "max");
  return { ok: true, message: "Logo removed — the default mark will show again." };
}
