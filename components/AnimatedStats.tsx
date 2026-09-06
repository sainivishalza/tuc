"use client";

import { useEffect, useRef, useState } from "react";
import { Users, Globe, Clock, Package } from "lucide-react";
import type { Dictionary } from "@/lib/i18n";

/**
 * Distinguishes "already visible when the page loaded" from "scrolled
 * into view later". IntersectionObserver's first callback always fires
 * with the current state, so the very first call tells us which case
 * this is — the two need different treatment for Speed Index: content
 * visible at load animating for a full 2s directly counts against it
 * (Lighthouse measures visual progress in the initial viewport), while
 * a later scroll-triggered reveal doesn't affect that metric at all.
 */
function useInView(ref: React.RefObject<Element | null>) {
  const [isInView, setIsInView] = useState(false);
  const [visibleOnMount, setVisibleOnMount] = useState<boolean | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    let first = true;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (first) {
          first = false;
          setVisibleOnMount(entry.isIntersecting);
        }
        if (entry.isIntersecting) {
          setIsInView(true);
          observer.disconnect();
        }
      },
      { rootMargin: "-50px" }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [ref]);

  return { isInView, visibleOnMount };
}

function AnimatedNumber({ target, suffix = "" }: { target: number; suffix?: string }) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const { isInView, visibleOnMount } = useInView(ref);

  useEffect(() => {
    // Already on screen at load: skip the effect entirely and render
    // the final value directly below, instead of ticking up for 2s in
    // front of the page-speed test.
    if (!isInView || visibleOnMount) return;

    // requestAnimationFrame rather than a fixed setInterval(16ms): rAF
    // ties updates to the browser's actual paint cycle, so a slow
    // device naturally renders fewer, larger steps instead of piling
    // up ~125 individual React re-renders regardless of how much time
    // each one actually takes.
    const duration = 2000;
    const start = performance.now();
    let rafId: number;

    function tick(now: number) {
      const progress = Math.min((now - start) / duration, 1);
      setCount(Math.floor(progress * target));
      if (progress < 1) rafId = requestAnimationFrame(tick);
    }
    rafId = requestAnimationFrame(tick);

    return () => cancelAnimationFrame(rafId);
  }, [isInView, visibleOnMount, target]);

  const displayCount = visibleOnMount && isInView ? target : count;

  return (
    <span ref={ref} className="font-display text-4xl font-bold tracking-tight sm:text-5xl">
      {displayCount.toLocaleString()}{suffix}
    </span>
  );
}

const statMeta = [
  { icon: Users, value: 500, suffix: "+", color: "text-blue-400" },
  { icon: Globe, value: 15, suffix: "+", color: "text-emerald-400" },
  { icon: Clock, value: 10, suffix: "+", color: "text-amber-400" },
  { icon: Package, value: 2000, suffix: "+", color: "text-purple-400" },
];

export default function AnimatedStats({ dict }: { dict: Dictionary }) {
  const stats = statMeta.map((meta, i) => ({
    ...meta,
    label: dict.stats.items[i].label,
  }));

  return (
    <section className="relative px-4 py-20 sm:px-6">
      <div className="mx-auto max-w-5xl">
        <div className="glass-strong rounded-3xl p-8 sm:p-12">
          <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
            {stats.map((stat, i) => {
              const Icon = stat.icon;
              return (
                <div key={stat.label} className="flex flex-col items-center text-center">
                  <div className={`mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-${stat.color.replace('text-', '')}/20 to-transparent`}>
                    <Icon size={28} className={stat.color} />
                  </div>
                  <AnimatedNumber target={stat.value} suffix={stat.suffix} />
                  <p className="mt-2 text-sm text-muted">{stat.label}</p>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
