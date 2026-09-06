"use client";

import { useEffect, useRef, type ReactNode } from "react";

/**
 * Transform-only reveal: content is always fully opaque, so it can
 * never be caught mid-animation looking invisible or washed out
 * (opacity-based reveals did exactly that on fast scrolls/loads).
 *
 * Plain IntersectionObserver + direct style mutation, not
 * framer-motion — this wraps 20+ elements on the homepage alone, and
 * two things matter at that scale: sharing one observer across every
 * instance instead of one each, and mutating the DOM directly via a
 * ref instead of via React state, so a batch of elements becoming
 * visible at once doesn't trigger a batch of React re-renders. This
 * mirrors how framer-motion's own whileInView avoids re-rendering for
 * animation-only value changes.
 */
let sharedObserver: IntersectionObserver | null = null;

function getSharedObserver(): IntersectionObserver | null {
  if (sharedObserver || typeof IntersectionObserver === "undefined") return sharedObserver;
  sharedObserver = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        (entry.target as HTMLElement).style.transform = "translateY(0)";
        sharedObserver?.unobserve(entry.target);
      }
    },
    { rootMargin: "0px 0px -10% 0px" }
  );
  return sharedObserver;
}

export default function Reveal({
  children,
  delay = 0,
  className,
}: {
  children: ReactNode;
  delay?: number;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    const observer = getSharedObserver();
    if (!el || !observer) return;

    observer.observe(el);
    return () => observer.unobserve(el);
  }, []);

  return (
    <div
      ref={ref}
      className={className}
      style={{
        transform: "translateY(16px)",
        transition: `transform 0.4s cubic-bezier(0.22, 1, 0.36, 1) ${delay}s`,
        willChange: "transform",
      }}
    >
      {children}
    </div>
  );
}
