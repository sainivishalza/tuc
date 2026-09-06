/** @type {import('next').NextConfig} */
const nextConfig = {
  poweredByHeader: false,
  // pdfkit loads its font metrics via fs.readFileSync at runtime using
  // paths relative to its own package directory — bundling it into the
  // webpack graph breaks that resolution, so it must run as a plain
  // Node require() instead.
  serverExternalPackages: ["pdfkit"],
};

export default nextConfig;
