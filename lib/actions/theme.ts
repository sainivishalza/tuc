"use server";

import { unstable_cache, revalidateTag } from "next/cache";
import { getSupabasePublicClient } from "@/lib/supabase/publicClient";
import { getSupabaseAdminClient } from "@/lib/supabase/adminClient";
import { requireAdminAction } from "@/lib/adminAuth";
import type { SiteTheme } from "@/lib/supabase/types";

const LOGO_BUCKET = "site-assets";
const LOGO_PATH = "logo";
const MAX_LOGO_BYTES = 2 * 1024 * 1024; // 2MB

/** `file.type` is just the browser-declared Content-Type of that form
 * part — trusting it alone means an attacker can label any content as
 * "image/png" and have it stored and served as such. Checking the file's
 * actual magic bytes catches a raster format mismatch; this only covers
 * PNG/JPEG/WebP since SVG has no binary signature (handled separately by
 * sanitizeSvg below). */
function matchesDeclaredImageType(bytes: Uint8Array, declaredType: string): boolean {
  const startsWith = (sig: number[]) => sig.every((b, i) => bytes[i] === b);
  switch (declaredType) {
    case "image/png":
      return startsWith([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
    case "image/jpeg":
      return startsWith([0xff, 0xd8, 0xff]);
    case "image/webp":
      return (
        startsWith([0x52, 0x49, 0x46, 0x46]) &&
        bytes[8] === 0x57 &&
        bytes[9] === 0x45 &&
        bytes[10] === 0x42 &&
        bytes[11] === 0x50
      );
    default:
      return false;
  }
}

/** SVG is XML text, not a binary format with a magic-byte signature it
 * can be checked against — and unlike a raster image, it can carry
 * executable content (`<script>`, event-handler attributes, javascript:
 * URIs) that a browser will run if the file is ever opened directly
 * rather than rendered inside an `<img>`. Strip that content rather than
 * rejecting SVG outright, since it's a normal, requested logo format. */
function sanitizeSvg(svgText: string): string {
  return svgText
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/\son\w+\s*=\s*"(?:[^"\\]|\\.)*"/gi, "")
    .replace(/\son\w+\s*=\s*'(?:[^'\\]|\\.)*'/gi, "")
    .replace(/(href|xlink:href|src)\s*=\s*("javascript:[^"]*"|'javascript:[^']*')/gi, '$1="#"');
}

const DEFAULT_THEME: SiteTheme = {
  id: "default",
  primary_color: "#2f3a56",
  accent_color: "#00c2cb",
  secondary_color: "#00c2cb",
  surface_color: "#ffffff",
  background_color: "#f4f6f8",
  font_choice: "inter",
  text_scale: "medium",
  corner_style: "rounded",
  tinted_sections: false,
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
    return { ok: false, message: "Colors must be a valid hex code like #00c2cb." };
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
  // An explicit allowlist rather than `startsWith("image/")` — the
  // declared type also picks which validation path (magic-byte check vs.
  // SVG sanitization) a file goes through below, so it needs to be one of
  // exactly these four, not anything an attacker can freely label.
  const ALLOWED_TYPES = ["image/png", "image/jpeg", "image/webp", "image/svg+xml"];
  if (!ALLOWED_TYPES.includes(file.type)) {
    return { ok: false, message: "Logo must be an image file (PNG, JPG, SVG, or WebP)." };
  }
  if (file.size > MAX_LOGO_BYTES) {
    return { ok: false, message: "Logo must be smaller than 2MB." };
  }

  const arrayBuffer = await file.arrayBuffer();
  let uploadBuffer: ArrayBuffer | string = arrayBuffer;

  if (file.type === "image/svg+xml") {
    // No magic-byte signature to check — sanitize instead (see
    // sanitizeSvg's own comment for why this matters).
    uploadBuffer = sanitizeSvg(new TextDecoder().decode(arrayBuffer));
  } else if (!matchesDeclaredImageType(new Uint8Array(arrayBuffer), file.type)) {
    // `file.type` is just the browser-declared Content-Type of that form
    // part, not verified content — reject anything whose actual bytes
    // don't match what it claims to be, rather than trusting the label
    // and serving it from a public URL as-is.
    return { ok: false, message: "That file doesn't look like a valid image. Try a different file." };
  }

  const ext = file.type === "image/svg+xml" ? "svg" : file.type.split("/")[1];
  const path = `${LOGO_PATH}.${ext}`;

  const supabase = getSupabaseAdminClient();

  // Clear any previously uploaded logo with a different extension so
  // switching file types (e.g. png -> svg) doesn't leave a stale copy
  // sitting alongside the new one.
  await supabase.storage.from(LOGO_BUCKET).remove(["logo.png", "logo.jpg", "logo.jpeg", "logo.svg", "logo.webp"]);

  const { error: uploadError } = await supabase.storage.from(LOGO_BUCKET).upload(path, uploadBuffer, {
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
