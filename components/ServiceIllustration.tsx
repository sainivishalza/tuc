import { useId } from "react";
import type { LucideIcon } from "lucide-react";

/**
 * A glossy, gradient-filled "3D icon" tile — not a photo, but a real
 * illustrated visual (soft highlight + shadow layers) rather than a
 * bare outline icon. No external image-generation tool is available
 * in this environment, so this is built entirely from SVG/CSS.
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
  const uid = useId();
  const gradientId = `${uid}-tile-${variant}`;
  const glossId = `${uid}-gloss`;
  const iconSize = Math.round(size * 0.44);

  return (
    <div className="relative shrink-0" style={{ height: size, width: size }}>
      <svg viewBox="0 0 64 64" className="h-full w-full drop-shadow-md">
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="1" y2="1">
            {variant === "navy" ? (
              <>
                <stop offset="0%" stopColor="#059669" />
                <stop offset="100%" stopColor="#022c22" />
              </>
            ) : (
              <>
                <stop offset="0%" stopColor="#34d399" />
                <stop offset="100%" stopColor="#064e3b" />
              </>
            )}
          </linearGradient>
          <radialGradient id={glossId} cx="30%" cy="22%" r="55%">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.55" />
            <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
          </radialGradient>
        </defs>
        <rect x="2" y="2" width="60" height="60" rx="18" fill={`url(#${gradientId})`} />
        <rect x="2" y="2" width="60" height="60" rx="18" fill={`url(#${glossId})`} />
        <rect
          x="2.5"
          y="2.5"
          width="59"
          height="59"
          rx="17.5"
          fill="none"
          stroke="#ffffff"
          strokeOpacity="0.15"
        />
      </svg>
      <Icon
        size={iconSize}
        strokeWidth={1.8}
        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-white drop-shadow-sm"
      />
    </div>
  );
}
