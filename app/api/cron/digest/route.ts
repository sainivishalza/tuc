import { NextRequest, NextResponse } from "next/server";
import { safeCompare } from "@/lib/adminAuth";
import { getDailyDigestData } from "@/lib/digest";
import { notifyDailyDigest } from "@/lib/notify";
import { sendQuoteRequestFollowUps, sendSourcingRequestFollowUps } from "@/lib/followUp";
import { recordCronRun } from "@/lib/cronHealth";

// No scheduler runs inside this app — Hostinger's Node hosting doesn't
// have a Vercel-Cron equivalent, so this route exists to be *called* by
// one: a Hostinger Cron Job (hPanel > Advanced > Cron Jobs) or any
// external scheduler hitting this URL once a day with
// `Authorization: Bearer <CRON_SECRET>`. Unconfigured (no CRON_SECRET
// set) or an unrecognized caller both get a flat 401 — same
// gracefully-unconfigured shape as Turnstile/DHL elsewhere in this
// codebase, rather than a route that silently no-ops and looks broken.
export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  const provided = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ?? "";

  if (!secret || !provided || !safeCompare(provided, secret)) {
    return NextResponse.json({ ok: false, message: "Unauthorized" }, { status: 401 });
  }

  try {
    const data = await getDailyDigestData();
    await notifyDailyDigest(data);

    // Rides the same once-a-day cron hit as the digest above rather than
    // needing its own Hostinger cron job — each function's own
    // followup_sent_at check means it's safe to call every time this
    // route fires, not just once.
    const [quoteFollowUpsSent, sourcingFollowUpsSent] = await Promise.all([
      sendQuoteRequestFollowUps(),
      sendSourcingRequestFollowUps(),
    ]);

    await recordCronRun("digest", true);
    return NextResponse.json({
      ok: true,
      newRequests: data.newRequests.length,
      openCount: data.openCount,
      quoteFollowUpsSent,
      sourcingFollowUpsSent,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    await recordCronRun("digest", false, message);
    return NextResponse.json({ ok: false, message }, { status: 500 });
  }
}
