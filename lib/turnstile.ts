import "server-only";

/**
 * Returns true (allow) when TURNSTILE_SECRET_KEY isn't configured yet —
 * same "gracefully unconfigured" pattern as this project's other optional
 * integrations. Rate limiting (lib/rateLimit.ts) still applies regardless,
 * so a form isn't wide open just because Turnstile hasn't been set up.
 */
export async function verifyTurnstileToken(token: string, ip: string): Promise<boolean> {
  const secret = process.env.TURNSTILE_SECRET_KEY;
  if (!secret) return true;
  if (!token) return false;

  try {
    const res = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ secret, response: token, remoteip: ip }),
      // A hung Cloudflare call must never hold up form submission indefinitely.
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) return true; // fail open — see note below
    const data = (await res.json()) as { success?: boolean };
    return data.success === true;
  } catch {
    // Fail open rather than closed: a Cloudflare outage or network hiccup
    // shouldn't be able to take the whole form down. Rate limiting is the
    // primary defense; Turnstile is an added layer, not the only one.
    return true;
  }
}
