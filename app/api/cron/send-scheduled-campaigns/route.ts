import { NextRequest, NextResponse } from "next/server";
import { safeCompare } from "@/lib/adminAuth";
import { processScheduledCampaigns } from "@/lib/scheduledCampaigns";

// Same shape as app/api/cron/digest/route.ts: no scheduler runs inside
// this app, so this route exists to be *called* by one — a Hostinger
// Cron Job (hPanel > Advanced > Cron Jobs) hitting this URL every 15
// minutes or so with `Authorization: Bearer <CRON_SECRET>`. Reuses the
// same CRON_SECRET as the digest route rather than adding a second
// secret for what's the same trust boundary (an external scheduler
// calling back into this app).
export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  const provided = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ?? "";

  if (!secret || !provided || !safeCompare(provided, secret)) {
    return NextResponse.json({ ok: false, message: "Unauthorized" }, { status: 401 });
  }

  const results = await processScheduledCampaigns();

  return NextResponse.json({
    ok: true,
    campaignsProcessed: results.length,
    results,
  });
}
