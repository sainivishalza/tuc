// Runs once when the server process starts — which happens on every
// deploy, since the host restarts the Node process to pick up the new
// build. Used to purge the CDN edge cache automatically so visitors never
// get HTML from a stale edge pointing at deleted, content-hashed assets.
export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { purgeHostingerCache } = await import("@/lib/hostinger");
    const result = await purgeHostingerCache();
    console.log(`[startup] Hostinger CDN purge: ${result.ok ? "ok" : "failed"} — ${result.message}`);
  }
}
