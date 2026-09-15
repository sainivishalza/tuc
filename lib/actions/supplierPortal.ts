"use server";

import { headers } from "next/headers";
import { getSupabaseAdminClient } from "@/lib/supabase/adminClient";
import { sendEmail } from "@/lib/email";
import { checkRateLimit, recordFailedAttempt } from "@/lib/rateLimit";
import { verifyTurnstileToken } from "@/lib/turnstile";
import { createLoginLinkToken } from "@/lib/supplierAuth";
import { validateAndUploadFile, IMAGE_TYPES, LICENSE_TYPES } from "@/lib/supplierFileUpload";
import type { Supplier } from "@/lib/supabase/types";

const SITE_URL = "https://theuniquechoice.com";

export interface RequestLinkState {
  message?: string;
  error?: string;
  /** Set when the email doesn't match a registered supplier, so the form
   * can point the visitor at the registration page instead of just failing. */
  notRegistered?: boolean;
}

export interface UpdateProfileState {
  message?: string;
  error?: string;
}

function supplierLoginEmailHtml(link: string): string {
  return `
    <div style="font-family: Arial, Helvetica, sans-serif; max-width: 480px; margin: 0 auto; color: #0f1c17;">
      <p style="font-size: 12px; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase; color: #059669; margin: 0 0 12px;">
        The Unique Choice
      </p>
      <h1 style="font-size: 20px; margin: 0 0 12px;">Sign in to your supplier account</h1>
      <p style="font-size: 14px; color: #5b6b64; margin: 0 0 20px;">
        Click the button below to sign in. This link expires in 15 minutes.
      </p>
      <a href="${link}" style="display: inline-block; background: #059669; color: #ffffff; text-decoration: none; font-size: 14px; font-weight: 600; padding: 12px 24px; border-radius: 999px;">
        Sign in to my supplier account
      </a>
      <p style="font-size: 12px; color: #9ca3af; margin-top: 24px;">
        If you didn't request this, you can safely ignore this email.
      </p>
    </div>
  `;
}

export async function requestSupplierLoginLink(
  _prevState: RequestLinkState,
  formData: FormData
): Promise<RequestLinkState> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  if (!email || !email.includes("@")) {
    return { error: "Enter a valid email address." };
  }

  const headersList = await headers();
  const ip = headersList.get("x-forwarded-for")?.split(",").pop()?.trim() ?? "unknown";
  const rateLimitKey = `supplier-portal:${ip}`;

  const limit = await checkRateLimit(rateLimitKey);
  if (!limit.allowed) {
    const minutes = Math.ceil((limit.retryAfterMs ?? 0) / 60000);
    return { error: `Too many attempts. Try again in ${minutes} minute${minutes === 1 ? "" : "s"}.` };
  }
  await recordFailedAttempt(rateLimitKey);

  const turnstileToken = String(formData.get("turnstileToken") ?? "");
  const captchaOk = await verifyTurnstileToken(turnstileToken, ip);
  if (!captchaOk) {
    return { error: "Verification failed — please try again." };
  }

  const secret = process.env.SUPPLIER_SESSION_SECRET;
  if (!secret) {
    return {
      error:
        "The supplier account isn't configured yet. Set SUPPLIER_SESSION_SECRET as an environment variable on your hosting.",
    };
  }

  const supabase = getSupabaseAdminClient();
  const { data: supplier } = await supabase.from("suppliers").select("id").ilike("email", email).maybeSingle();

  if (!supplier) {
    return {
      error: "We couldn't find a supplier account for that email. Register below to apply.",
      notRegistered: true,
    };
  }

  const token = createLoginLinkToken(email, secret);
  const link = `${SITE_URL}/supplier-portal/verify?token=${encodeURIComponent(token)}`;
  const result = await sendEmail({
    to: email,
    subject: "Sign in to your Unique Choice supplier account",
    html: supplierLoginEmailHtml(link),
  });
  if (!result.ok) {
    console.error(`[supplier-portal] failed to email login link to ${email}: ${result.message}`);
    return { error: "We couldn't send the sign-in email right now. Please try again shortly." };
  }

  return { message: "We've sent a sign-in link to your email. It expires in 15 minutes." };
}

export async function getSupplierBySelf(email: string): Promise<Supplier | null> {
  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase.from("suppliers").select("*").ilike("email", email).maybeSingle();
  if (error) return null;
  return data as Supplier | null;
}

export interface SupplierProfileInput {
  company_name: string;
  contact_name: string;
  phone: string;
  product_categories: string;
  business_address: string;
  country: string;
  notes: string;
}

/** Self-service edit — deliberately narrower than the admin's updateSupplier:
 * no status, rating, admin_notes, or email change. Email is how the session
 * itself is scoped, so letting it change here would be an account-identity
 * change dressed up as a profile edit. */
export async function updateOwnSupplierProfile(
  email: string,
  input: SupplierProfileInput,
  formData?: FormData
): Promise<UpdateProfileState> {
  if (!input.company_name.trim() || !input.contact_name.trim()) {
    return { error: "Company name and contact name are required." };
  }

  const supabase = getSupabaseAdminClient();
  const { data: existing } = await supabase.from("suppliers").select("id").ilike("email", email).maybeSingle();
  if (!existing) {
    return { error: "We couldn't find your supplier account." };
  }

  const update: Record<string, unknown> = {
    company_name: input.company_name.trim(),
    contact_name: input.contact_name.trim(),
    phone: input.phone.trim() || null,
    product_categories: input.product_categories.trim() || null,
    business_address: input.business_address.trim() || null,
    country: input.country.trim() || null,
    notes: input.notes.trim() || null,
    updated_at: new Date().toISOString(),
  };

  if (formData) {
    const pathPrefix = `suppliers/${existing.id}`;
    const licenseResult = await validateAndUploadFile(formData, "business_license", LICENSE_TYPES, pathPrefix);
    if (licenseResult) {
      if (!licenseResult.ok) return { error: licenseResult.message };
      update.business_license_url = licenseResult.url;
    }
    const cardResult = await validateAndUploadFile(formData, "visiting_card", IMAGE_TYPES, pathPrefix);
    if (cardResult) {
      if (!cardResult.ok) return { error: cardResult.message };
      update.visiting_card_url = cardResult.url;
    }
    const photoResult = await validateAndUploadFile(formData, "company_photo", IMAGE_TYPES, pathPrefix);
    if (photoResult) {
      if (!photoResult.ok) return { error: photoResult.message };
      update.company_photo_url = photoResult.url;
    }
  }

  const { error } = await supabase.from("suppliers").update(update).eq("id", existing.id).eq("email", email);
  if (error) return { error: "Something went wrong saving your profile. Please try again." };

  return { message: "Your profile has been updated." };
}
