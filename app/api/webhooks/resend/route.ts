import { NextRequest, NextResponse } from "next/server";
import { verifyResendWebhookSignature } from "@/lib/resendWebhook";
import { handleResendWebhookEvent } from "@/lib/emailWebhookHandler";

// Resend (via Svix) posts here for every email.* event on emails sent
// through this account — not just campaign sends, so a shipment
// notification or a portal sign-in link bouncing shows up too. No admin
// session exists for this route; the Svix signature IS the auth check.
export async function POST(request: NextRequest) {
  const secret = process.env.RESEND_WEBHOOK_SECRET;
  if (!secret) {
    console.error("[resend-webhook] RESEND_WEBHOOK_SECRET is not set — rejecting delivery.");
    return NextResponse.json({ error: "Webhook not configured." }, { status: 500 });
  }

  // The signature is computed over the exact raw bytes — reading as text
  // (not request.json()) keeps this from re-serializing and silently
  // invalidating every signature.
  const rawBody = await request.text();
  const verified = verifyResendWebhookSignature(
    rawBody,
    {
      id: request.headers.get("svix-id"),
      timestamp: request.headers.get("svix-timestamp"),
      signature: request.headers.get("svix-signature"),
    },
    secret
  );

  if (!verified) {
    return NextResponse.json({ error: "Invalid signature." }, { status: 401 });
  }

  let event: { type?: string; data?: Record<string, unknown> };
  try {
    event = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: "Invalid JSON." }, { status: 400 });
  }

  if (!event.type || !event.data) {
    return NextResponse.json({ error: "Missing type/data." }, { status: 400 });
  }

  try {
    await handleResendWebhookEvent({ type: event.type, data: event.data });
  } catch (err) {
    // Log and still 200 — a DB hiccup on our side shouldn't make Resend
    // retry-storm an event we may have already partially processed.
    console.error(`[resend-webhook] failed to process ${event.type}:`, err);
  }

  return NextResponse.json({ ok: true });
}
