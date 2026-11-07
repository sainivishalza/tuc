import "server-only";
import { getSupabaseAdminClient } from "@/lib/supabase/adminClient";

// Shared by both the admin supplier editor and the supplier's own
// self-service profile edit. Kept out of any "use server" action file —
// Next.js only allows async function exports from those, and a plain
// const export (BUCKET, IMAGE_TYPES, ...) alongside one silently breaks
// every export from that module.
export const BUCKET = "site-assets";
const MAX_FILE_BYTES = 5 * 1024 * 1024; // 5MB

export const IMAGE_TYPES = ["image/png", "image/jpeg", "image/webp"];
export const LICENSE_TYPES = [...IMAGE_TYPES, "application/pdf"];
export const MAX_GALLERY_IMAGES = 6;

/** Same reasoning as theme.ts's logo upload — `file.type` is just the
 * browser-declared Content-Type, not verified content. Checking magic
 * bytes catches a mismatch before it's stored and served publicly as
 * "proof" of a supplier's business license. */
function matchesDeclaredType(bytes: Uint8Array, declaredType: string): boolean {
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
    case "application/pdf":
      return startsWith([0x25, 0x50, 0x44, 0x46]);
    default:
      return false;
  }
}

interface FileFieldResult {
  ok: true;
  url: string;
}
interface FileFieldError {
  ok: false;
  message: string;
}

export async function validateAndUploadFile(
  formData: FormData,
  field: string,
  allowedTypes: string[],
  pathPrefix: string
): Promise<FileFieldResult | FileFieldError | null> {
  const file = formData.get(field);
  if (!(file instanceof File) || file.size === 0) return null;

  if (!allowedTypes.includes(file.type)) {
    return { ok: false, message: `${field.replace(/_/g, " ")} must be one of: ${allowedTypes.join(", ")}.` };
  }
  if (file.size > MAX_FILE_BYTES) {
    return { ok: false, message: `${field.replace(/_/g, " ")} must be smaller than 5MB.` };
  }

  const arrayBuffer = await file.arrayBuffer();
  if (!matchesDeclaredType(new Uint8Array(arrayBuffer), file.type)) {
    return { ok: false, message: `That ${field.replace(/_/g, " ")} file doesn't look valid. Try a different file.` };
  }

  const ext = file.type === "application/pdf" ? "pdf" : file.type.split("/")[1];
  const path = `${pathPrefix}/${field}-${Date.now()}.${ext}`;

  const supabase = getSupabaseAdminClient();
  const { error } = await supabase.storage.from(BUCKET).upload(path, arrayBuffer, {
    contentType: file.type,
    upsert: true,
  });
  if (error) return { ok: false, message: error.message };

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
  return { ok: true, url: data.publicUrl };
}

/** Shared by the registration form, the admin editor, and the supplier's
 * own self-service edit — all three need the same "keep some existing
 * photos, add some new ones, cap at MAX_GALLERY_IMAGES" merge logic.
 * `existing_gallery_urls` (a JSON array, sent as a hidden field by the
 * edit forms) is the client's record of which currently-stored photos it
 * kept after any removals; the registration form simply omits it, so
 * `urls` starts empty there. New files are read from fixed field names
 * `gallery_0".."gallery_{MAX_GALLERY_IMAGES - 1}` — whichever of those
 * the caller's form actually rendered. */
export async function processGalleryUpload(
  formData: FormData,
  pathPrefix: string
): Promise<{ ok: true; urls: string[] } | { ok: false; message: string }> {
  const keepRaw = formData.get("existing_gallery_urls");
  let urls: string[] = [];
  if (typeof keepRaw === "string" && keepRaw.trim()) {
    try {
      const parsed = JSON.parse(keepRaw);
      if (Array.isArray(parsed)) {
        urls = parsed.filter((u): u is string => typeof u === "string").slice(0, MAX_GALLERY_IMAGES);
      }
    } catch {
      // Malformed input — fall back to an empty kept list rather than failing the save.
    }
  }

  for (let i = 0; i < MAX_GALLERY_IMAGES && urls.length < MAX_GALLERY_IMAGES; i++) {
    const result = await validateAndUploadFile(formData, `gallery_${i}`, IMAGE_TYPES, pathPrefix);
    if (result === null) continue;
    if (!result.ok) return { ok: false, message: result.message };
    urls.push(result.url);
  }

  return { ok: true, urls };
}
