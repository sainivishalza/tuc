import type { LucideIcon } from "lucide-react";

/**
 * A flat, bordered icon tile — no gloss or gradient fill. The glossy 3D
 * tile this replaced read as a SaaS-app device; a thin-bordered square
 * with a plain line icon reads closer to an exhibit marker in a printed
 * report, matching the editorial/corporate direction.
 */
export default function ServiceIllustration({
  icon: Icon,
  variant = "blue",
  size = 64,
}: {
  icon: LucideIcon;
  variant?: "blue" | "navy";
  size?: number;
}) {
  const iconSize = Math.round(size * 0.42);
  const isNavy = variant === "navy";

  return (
    <div
      className={`flex shrink-0 items-center justify-center border ${
        isNavy
          ? "border-brand-navy/25 bg-brand-navy text-white"
          : "border-accent/30 bg-transparent text-accent"
      }`}
      style={{ height: size, width: size }}
    >
      <Icon size={iconSize} strokeWidth={1.6} />
    </div>
  );
}
