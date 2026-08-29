import Link from "next/link";

export default function NotFound() {
  return (
    <section className="flex min-h-[70vh] flex-col items-center justify-center px-4 text-center">
      <div className="glass-strong max-w-md rounded-3xl px-8 py-16">
        <span className="eyebrow accent-text text-xs sm:text-sm">Oops</span>
        <h1 className="font-display mt-4 text-6xl font-semibold tracking-tight sm:text-7xl">
          404
        </h1>
        <p className="mt-4 text-sm text-muted sm:text-base">
          The page you&apos;re looking for doesn&apos;t exist or has been moved.
        </p>
        <Link
          href="/en"
          className="brand-gradient mt-8 inline-flex items-center gap-2 rounded-full px-6 py-3 text-sm font-semibold text-white shadow-lg transition hover:opacity-90"
        >
          Back to Home
        </Link>
      </div>
    </section>
  );
}
