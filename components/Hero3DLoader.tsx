"use client";

import { Component, type ReactNode, useEffect, useState } from "react";
import dynamic from "next/dynamic";

const Hero3D = dynamic(() => import("./Hero3D"), {
  ssr: false,
  loading: () => null,
});

class WebGLErrorBoundary extends Component<
  { children: ReactNode },
  { failed: boolean }
> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    return this.state.failed ? null : this.children;
  }
  get children() {
    return this.props.children;
  }
}

export default function Hero3DLoader() {
  // Defer the Three.js bundle until the browser is idle after first
  // paint — it's decorative, and downloading/parsing/executing it
  // immediately on mount competes with the critical rendering path
  // (LCP/TBT) for no visible benefit, since the CSS glow below already
  // fills the space in the meantime.
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const schedule =
      "requestIdleCallback" in window
        ? (cb: () => void) => window.requestIdleCallback(cb, { timeout: 2000 })
        : (cb: () => void) => window.setTimeout(cb, 200);
    const handle = schedule(() => setReady(true));
    return () => {
      if ("cancelIdleCallback" in window && typeof handle === "number") {
        window.cancelIdleCallback(handle);
      }
    };
  }, []);

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
      {ready && (
        <WebGLErrorBoundary>
          <Hero3D />
        </WebGLErrorBoundary>
      )}
    </div>
  );
}
