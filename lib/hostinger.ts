// Hostinger's CDN caches full HTML pages for up to a year and does not
// purge itself when a new deploy replaces the build's content-hashed
// CSS/JS files — so an edge that cached a page before a deploy keeps
// serving it with links to files that no longer exist. This purges that
// edge cache so every node picks up the current build.
const HOSTINGER_USERNAME = "u428186913";
const HOSTINGER_DOMAIN = "theuniquechoice.com";

export async function purgeHostingerCache(): Promise<{ ok: boolean; message: string }> {
  const token = process.env.HOSTINGER_API_TOKEN;
  if (!token) {
    return { ok: false, message: "HOSTINGER_API_TOKEN is not set." };
  }

  try {
    const res = await fetch(
      `https://developers.hostinger.com/api/hosting/v1/accounts/${encodeURIComponent(HOSTINGER_USERNAME)}/websites/${encodeURIComponent(HOSTINGER_DOMAIN)}/cache/clear`,
      {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
        // Without a hard deadline, a slow/hanging Hostinger API call blocks
        // instrumentation.ts's register() — which blocks the whole Next.js
        // server from finishing startup, taking the entire site down.
        signal: AbortSignal.timeout(8000),
      }
    );

    if (!res.ok) {
      const body = await res.text().catch(() => "");
      return { ok: false, message: `Hostinger API returned ${res.status}: ${body.slice(0, 300)}` };
    }

    return { ok: true, message: "CDN cache purged." };
  } catch (err) {
    return { ok: false, message: err instanceof Error ? err.message : "Failed to reach Hostinger API." };
  }
}
