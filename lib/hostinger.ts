// Hostinger's CDN caches full HTML pages for up to a year and does not
// purge itself when a new deploy replaces the build's content-hashed
// CSS/JS files — so an edge that cached a page before a deploy keeps
// serving it with links to files that no longer exist. This purges that
// edge cache so every node picks up the current build.
const HOSTINGER_WEBSITE_UID = "u428186913:theuniquechoice.com";

export async function purgeHostingerCache(): Promise<{ ok: boolean; message: string }> {
  const token = process.env.HOSTINGER_API_TOKEN;
  if (!token) {
    return { ok: false, message: "HOSTINGER_API_TOKEN is not set." };
  }

  try {
    const res = await fetch(
      `https://developers.hostinger.com/api/agency-hosting/v1/websites/${encodeURIComponent(HOSTINGER_WEBSITE_UID)}/cache`,
      {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
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
