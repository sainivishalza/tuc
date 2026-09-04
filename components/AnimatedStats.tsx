"use client";

import { useEffect, useRef, useState } from "react";
import { useInView } from "framer-motion";
import { Users, Globe, Clock, Package } from "lucide-react";
import type { Dictionary } from "@/lib/i18n";

function AnimatedNumber({ target, suffix = "" }: { target: number; suffix?: string }) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-50px" });

  useEffect(() => {
    if (!isInView) return;

    let start = 0;
    const duration = 2000;
    const increment = target / (duration / 16);

    const timer = setInterval(() => {
      start += increment;
      if (start >= target) {
        setCount(target);
        clearInterval(timer);
      } else {
        setCount(Math.floor(start));
      }
    }, 16);

    return () => clearInterval(timer);
  }, [isInView, target]);

  return (
    <span ref={ref} className="font-display text-4xl font-bold tracking-tight sm:text-5xl">
      {count.toLocaleString()}{suffix}
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
