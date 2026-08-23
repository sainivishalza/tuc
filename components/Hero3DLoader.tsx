"use client";

import dynamic from "next/dynamic";

const Hero3D = dynamic(() => import("./Hero3D"), {
  ssr: false,
  loading: () => null,
});

export default function Hero3DLoader() {
  return (
    <div className="pointer-events-none relative h-full w-full">
      {/* CSS fallback glow: a faint ambient backdrop so there's never a
          totally empty box if WebGL is unavailable, without competing
          visually with the sphere when it does render. */}
      <div
        className="absolute inset-8 -z-10 rounded-full opacity-20 blur-3xl"
        style={{
          background:
            "radial-gradient(closest-side, var(--brand-blue) 0%, transparent 75%)",
        }}
      />
      <Hero3D />
    </div>
  );
}
