/** @type {import('next').NextConfig} */
const nextConfig = {
  poweredByHeader: false,
  // pdfkit loads its font metrics via fs.readFileSync at runtime using
  // paths relative to its own package directory — bundling it into the
  // webpack graph breaks that resolution, so it must run as a plain
  // Node require() instead.
  serverExternalPackages: ["pdfkit"],
  experimental: {
    serverActions: {
      // Default is 1MB — too small for a phone-camera proof-of-delivery
      // photo or a packing list with many rows. Bounded rather than
      // unlimited since this still guards against excessive-resource-use
      // requests; both upload actions are admin-only anyway.
      bodySizeLimit: "10mb",
    },
  },
  async headers() {
    // Next.js App Router hydrates via inline <script> tags (the RSC
    // payload) and this app injects one inline <style> tag per request
    // for the admin-editable theme colors (see app/layout.tsx) — neither
    // carries a nonce today, so script-src/style-src need 'unsafe-inline'
    // rather than being fully locked down. Real value here still comes
    // from restricting which *external* origins can load as scripts/
    // connections/images/frames at all, and from frame-ancestors/
    // object-src/base-uri, which don't depend on inline content.
    const csp = [
      "default-src 'self'",
      // https://challenges.cloudflare.com serves the Turnstile widget
      // script (quote form + portal login, see components/TurnstileWidget.tsx)
      // — renders nothing and is never fetched at all when
      // NEXT_PUBLIC_TURNSTILE_SITE_KEY isn't set.
      "script-src 'self' 'unsafe-inline' https://plausible.io https://challenges.cloudflare.com",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: https://*.supabase.co",
      "font-src 'self' data:",
      // The site-analytics tracker (lib/analytics.ts) writes pageview/CTA
      // events directly from the browser via the Supabase JS client using
      // the public anon key (RLS-scoped, insert-only) — that request goes
      // straight to Supabase's REST API, not through this app's server.
      "connect-src 'self' https://plausible.io https://*.supabase.co https://challenges.cloudflare.com",
      // Turnstile's actual challenge renders inside an iframe.
      "frame-src https://challenges.cloudflare.com",
      "frame-ancestors 'none'",
      "base-uri 'self'",
      "form-action 'self'",
      "object-src 'none'",
    ].join("; ");

    return [
      {
        source: "/:path*",
        headers: [
          // Blocks the site (admin login included) from being embedded in
          // an iframe on another domain — the standard clickjacking defense.
          { key: "X-Frame-Options", value: "DENY" },
          // Stops browsers from guessing a response's content type based on
          // its content rather than its declared Content-Type header.
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
          { key: "Content-Security-Policy", value: csp },
          // Forces HTTPS for two years including subdomains — Hostinger
          // already redirects http->https, this makes browsers skip that
          // redirect entirely (and refuse to fall back to plain HTTP) on
          // every repeat visit.
          { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains" },
          // Isolates this site's window from cross-origin popups/openers
          // (mitigates Spectre-class and tabnabbing-style attacks) without
          // touching how other origins can fetch this site's own
          // resources — unlike Cross-Origin-Resource-Policy, which would
          // also block social platforms (WhatsApp/Facebook/Twitter) from
          // fetching /opengraph-image for link-preview cards, so that one
          // is deliberately left unset.
          { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
        ],
      },
    ];
  },
};

export default nextConfig;
