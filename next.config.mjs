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
        ],
      },
    ];
  },
};

export default nextConfig;
