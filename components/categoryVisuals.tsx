"use client";

import { Cpu, Home, Shirt, Building2, Package, Wrench, Sparkles, type LucideIcon } from "lucide-react";

// Same icon choices and tint palette as ProductCategories on the homepage,
// keyed by category id instead of array position so every category picker
// across the site (quote wizard, smart match, landed cost calculator)
// renders the identical icon a visitor already saw in that grid — one
// visual language instead of a mix of line icons and emoji.
export const CATEGORY_ICONS: Record<string, LucideIcon> = {
  electronics: Cpu,
  home: Home,
  fashion: Shirt,
  building: Building2,
  packaging: Package,
  auto: Wrench,
  other: Sparkles,
};

// One consistent tile treatment for every category, everywhere it
// appears — a cream tile with a navy outline icon — instead of a
// different tint per category, which read as six unrelated colors
// rather than one system.
export function CategoryBadge({ id, size = 40 }: { id: string; size?: number }) {
  const Icon = CATEGORY_ICONS[id] ?? Sparkles;
  return (
    <div
      className="flex items-center justify-center rounded-xl border border-brand-navy/20 bg-surface"
      style={{ height: size, width: size }}
    >
      <Icon size={Math.round(size * 0.5)} strokeWidth={1.6} className="text-brand-navy" />
    </div>
  );
}
