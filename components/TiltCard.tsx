"use client";

import { useRef, useState } from "react";
import type { ReactNode, MouseEvent } from "react";

/**
 * Mouse-hover tilt effect, plain CSS transform + transition instead of
 * framer-motion's spring physics — it's a desktop-only hover flourish
 * (mobile has no mousemove), so a full animation library on the
 * critical path bought nothing for the touch visitors who make up
 * most of this site's traffic.
 */
export default function TiltCard({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [tilt, setTilt] = useState({ x: 0.5, y: 0.5 });

  function handleMouseMove(e: MouseEvent<HTMLDivElement>) {
    const rect = ref.current?.getBoundingClientRect();
    if (!rect) return;
    setTilt({
      x: (e.clientX - rect.left) / rect.width,
      y: (e.clientY - rect.top) / rect.height,
    });
  }

  function handleMouseLeave() {
    setTilt({ x: 0.5, y: 0.5 });
  }

  const rotateX = (0.5 - tilt.y) * 16;
  const rotateY = (tilt.x - 0.5) * 16;

  return (
    <div
      ref={ref}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{
        transform: `perspective(800px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`,
        transition: "transform 0.2s ease-out",
        willChange: "transform",
      }}
      className={`relative ${className ?? ""}`}
    >
      {children}
      <div
        aria-hidden
        style={{
          background: `radial-gradient(220px circle at ${tilt.x * 100}% ${tilt.y * 100}%, rgba(255,255,255,0.35), transparent 60%)`,
        }}
        className="pointer-events-none absolute inset-0 rounded-[inherit] opacity-0 transition-opacity duration-300 group-hover:opacity-100"
      />
    </div>
  );
}
