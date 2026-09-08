"use server";

import { headers } from "next/headers";
import { getSupabaseAdminClient } from "@/lib/supabase/adminClient";
import { sendEmail } from "@/lib/email";
import { checkRateLimit, recordFailedAttempt } from "@/lib/rateLimit";
import { createLoginLinkToken } from "@/lib/portalAuth";
import type { Shipment, QuoteRequest } from "@/lib/supabase/types";

const SITE_URL = "https://theuniquechoice.com";

export interface RequestLinkState {
  message?: string;
  error?: string;
}

function portalLoginEmailHtml(link: string): string {
  return `
    <div style="font-family: Arial, Helvetica, sans-serif; max-width: 480px; margin: 0 auto; color: #0f1c17;">
      <p style="font-size: 12px; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase; color: #059669; margin: 0 0 12px;">
        The Unique Choice
      </p>
      <h1 style="font-size: 20px; margin: 0 0 12px;">Sign in to your client portal</h1>
      <p style="font-size: 14px; color: #5b6b64; margin: 0 0 20px;">
        Click the button below to sign in. This link expires in 15 minutes.
      </p>
      <a href="${link}" style="display: inline-block; background: #059669; color: #ffffff; text-decoration: none; font-size: 14px; font-weight: 600; padding: 12px 24px; border-radius: 999px;">
        Sign in to my portal
      </a>
      <p style="font-size: 12px; color: #9ca3af; margin-top: 24px;">
        If you didn't request this, you can safely ignore this email.
      </p>
    </div>
  `;
}

export async function requestPortalLink(
  _prevState: RequestLinkState,
  formData: FormData
): Promise<RequestLinkState> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  if (!email || !email.includes("@")) {
    return { error: "Enter a valid email address." };
  }

  // x-forwarded-for's last hop is the one appended by our own reverse
  // proxy, not client-spoofable — same reasoning as the admin login rate
  // limit (see app/admin/login/actions.ts).
  const headersList = await headers();
  const ip = headersList.get("x-forwarded-for")?.split(",").pop()?.trim() ?? "unknown";
  const rateLimitKey = `portal:${ip}`;

  const limit = checkRateLimit(rateLimitKey);
  if (!limit.allowed) {
    const minutes = Math.ceil((limit.retryAfterMs ?? 0) / 60000);
    return { error: `Too many attempts. Try again in ${minutes} minute${minutes === 1 ? "" : "s"}.` };
  }
  recordFailedAttempt(rateLimitKey);

  const secret = process.env.PORTAL_SESSION_SECRET;
  if (!secret) {
    return {
      error:
        "The client portal isn't configured yet. Set PORTAL_SESSION_SECRET as an environment variable on your hosting.",
    };
  }

  const supabase = getSupabaseAdminClient();
  const [{ count: shipmentCount }, { count: quoteCount }] = await Promise.all([
    supabase.from("shipments").select("id", { count: "exact", head: true }).ilike("customer_email", email),
    supabase.from("quote_requests").select("id", { count: "exact", head: true }).ilike("email", email),
  ]);

  if ((shipmentCount ?? 0) > 0 || (quoteCount ?? 0) > 0) {
    const token = createLoginLinkToken(email, secret);
    const link = `${SITE_URL}/portal/verify?token=${encodeURIComponent(token)}`;
    await sendEmail({
      to: email,
      subject: "Sign in to your Unique Choice client portal",
      html: portalLoginEmailHtml(link),
    });
  }

  // Identical message whether or not we found an account — otherwise this
  // form becomes a way to check which email addresses have shipments with
  // us.
  return { message: "If that email has an account with us, we've sent a sign-in link. It expires in 15 minutes." };
}

export async function getPortalShipments(email: string): Promise<Shipment[]> {
  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase
    .from("shipments")
    .select("*")
    .ilike("customer_email", email)
    .order("updated_at", { ascending: false });

  if (error) return [];
  return data as Shipment[];
}

export async function getPortalQuoteRequests(email: string): Promise<QuoteRequest[]> {
  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase
    .from("quote_requests")
    .select("*")
    .ilike("email", email)
    .order("created_at", { ascending: false });

  if (error) return [];
  return data as QuoteRequest[];
}
