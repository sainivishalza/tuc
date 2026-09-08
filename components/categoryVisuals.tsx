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

export interface CategoryTint {
  bg: string;
  icon: string;
}

export const CATEGORY_TINTS: Record<string, CategoryTint> = {
  electronics: { bg: "from-blue-500/15 to-blue-600/5", icon: "text-blue-400" },
  home: { bg: "from-amber-500/15 to-amber-600/5", icon: "text-amber-400" },
  fashion: { bg: "from-pink-500/15 to-pink-600/5", icon: "text-pink-400" },
  building: { bg: "from-emerald-500/15 to-emerald-600/5", icon: "text-emerald-400" },
  packaging: { bg: "from-purple-500/15 to-purple-600/5", icon: "text-purple-400" },
  auto: { bg: "from-red-500/15 to-red-600/5", icon: "text-red-400" },
  other: { bg: "from-slate-500/15 to-slate-600/5", icon: "text-slate-400" },
};

const DEFAULT_TINT: CategoryTint = { bg: "from-slate-500/15 to-slate-600/5", icon: "text-slate-400" };

export function getCategoryTint(id: string): CategoryTint {
  return CATEGORY_TINTS[id] ?? DEFAULT_TINT;
}

// Reads straight from the module-level record instead of through a
// function call, same as ProductCategories' `icons[i % icons.length]` —
// react-hooks' static-components check can prove this reference is stable
// across renders, but not one returned from an opaque function call.
export function CategoryBadge({ id, size = 40 }: { id: string; size?: number }) {
  const Icon = CATEGORY_ICONS[id] ?? Sparkles;
  const tint = CATEGORY_TINTS[id] ?? DEFAULT_TINT;
  return (
    <div
      className={`flex items-center justify-center rounded-xl bg-gradient-to-br ${tint.bg}`}
      style={{ height: size, width: size }}
    >
      <Icon size={Math.round(size * 0.5)} className={tint.icon} />
    </div>
  );
}
