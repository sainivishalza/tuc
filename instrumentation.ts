// Runs once when the server process starts — which happens on every
// deploy, since the host restarts the Node process to pick up the new
// build. Used to purge the CDN edge cache automatically so visitors never
// get HTML from a stale edge pointing at deleted, content-hashed assets.
//
// Next.js awaits whatever this function returns before the server
// finishes starting up — so this deliberately does NOT await the purge.
// A slow or hanging Hostinger API call must never delay (or, worse,
// indefinitely block) the entire site from coming back up after a deploy.
export function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    import("@/lib/hostinger")
      .then(({ purgeHostingerCache }) => purgeHostingerCache())
      .then((result) => {
        console.log(`[startup] Hostinger CDN purge: ${result.ok ? "ok" : "failed"} — ${result.message}`);
      })
      .catch((err) => {
        console.log(`[startup] Hostinger CDN purge threw: ${err instanceof Error ? err.message : String(err)}`);
      });
  }
}
