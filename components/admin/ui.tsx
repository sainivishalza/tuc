import Link from "next/link";
import type { ReactNode } from "react";

/**
 * Shared visual primitives for the admin panel. Every admin page used to
 * hand-roll its own "rounded-2xl border border-gray-200 bg-white p-4"
 * cards, badges, and buttons — this is that vocabulary factored out once,
 * so the whole panel reads as one designed surface instead of 18 pages
 * that each approximated the same look slightly differently.
 */

export function BackLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <Link
      href={href}
      className="inline-flex w-fit items-center gap-1.5 text-sm font-medium text-gray-500 hover:text-gray-900"
    >
      ← {children}
    </Link>
  );
}

export function PageHeader({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle?: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-4">
      <div>
        <h1 className="font-admin-display text-2xl font-bold text-gray-900">{title}</h1>
        {subtitle && <p className="mt-1 max-w-2xl text-sm text-gray-500">{subtitle}</p>}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}

export function Card({
  children,
  className = "",
}: {
  children?: ReactNode;
  className?: string;
}) {
  return (
    <div className={`rounded-2xl border border-gray-200 bg-white p-5 ${className}`}>
      {children}
    </div>
  );
}

export function EmptyState({
  children,
  icon: Icon,
  action,
}: {
  children: ReactNode;
  icon?: React.ComponentType<{ size?: number; strokeWidth?: number }>;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-gray-300 bg-white p-10 text-center text-sm text-gray-500">
      {Icon && (
        <span className="flex h-11 w-11 items-center justify-center rounded-full bg-brand-50 text-brand-400">
          <Icon size={20} strokeWidth={1.6} />
        </span>
      )}
      <div>{children}</div>
      {action}
    </div>
  );
}

const BADGE_TONES = {
  neutral: "bg-gray-100 text-gray-500",
  success: "bg-emerald-100 text-emerald-700",
  warning: "bg-amber-100 text-amber-700",
  danger: "bg-red-100 text-red-700",
  info: "bg-blue-100 text-blue-700",
  purple: "bg-purple-100 text-purple-700",
  indigo: "bg-indigo-100 text-indigo-700",
  teal: "bg-teal-100 text-teal-700",
} as const;

export type BadgeTone = keyof typeof BADGE_TONES;

export function Badge({ tone = "neutral", children }: { tone?: BadgeTone; children: ReactNode }) {
  return (
    <span
      className={`inline-flex shrink-0 items-center rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide ${BADGE_TONES[tone]}`}
    >
      {children}
    </span>
  );
}

/* Primary is amber (--accent) — the same action color the public site
   reserves for CTAs — rather than a navy fill, so "primary action" reads
   identically in both places. "danger" (the destructive variant, kept
   under its original key so the ~10 existing call sites don't need
   touching) now reads as clearly destructive at rest instead of only on
   hover. */
const BUTTON_VARIANTS = {
  primary: "bg-accent text-brand-navy hover:bg-accent-dark shadow-sm shadow-accent/20",
  secondary: "border border-gray-200 bg-white text-gray-700 hover:border-gray-300 hover:bg-gray-50",
  danger: "border border-red-200 bg-white text-red-600 hover:border-red-300 hover:bg-red-50",
  ghost: "text-gray-500 hover:bg-gray-100 hover:text-gray-900",
} as const;

type ButtonVariant = keyof typeof BUTTON_VARIANTS;

const BUTTON_BASE =
  "inline-flex items-center justify-center gap-1.5 rounded-xl text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-50";
const BUTTON_SIZES = {
  sm: "px-3 py-1.5 text-xs",
  md: "px-4 py-2",
  icon: "p-2",
} as const;

export function Button({
  variant = "primary",
  size = "md",
  className = "",
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: keyof typeof BUTTON_SIZES;
}) {
  return (
    <button
      className={`${BUTTON_BASE} ${BUTTON_SIZES[size]} ${BUTTON_VARIANTS[variant]} ${className}`}
      {...props}
    />
  );
}

export function LinkButton({
  href,
  variant = "primary",
  size = "md",
  className = "",
  children,
}: {
  href: string;
  variant?: ButtonVariant;
  size?: keyof typeof BUTTON_SIZES;
  className?: string;
  children: ReactNode;
}) {
  return (
    <Link
      href={href}
      className={`${BUTTON_BASE} ${BUTTON_SIZES[size]} ${BUTTON_VARIANTS[variant]} ${className}`}
    >
      {children}
    </Link>
  );
}

export const inputClass =
  "w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent";

export const labelClass = "mb-1.5 block text-xs font-semibold text-gray-700";

export const fileInputClass =
  "block w-full cursor-pointer text-sm text-gray-600 file:mr-3 file:cursor-pointer file:rounded-lg file:border-0 file:bg-brand-900 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white hover:file:bg-brand-800";

/** A single pulsing placeholder block — the primitive every skeleton
 * below is built from. Plain CSS animation, no client JS needed. */
export function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse rounded-md bg-gray-200 ${className}`} />;
}

/** Placeholder for a data table while its rows are loading — mirrors a
 * real table's shape (header + N rows of cells) so the layout doesn't
 * jump once real data arrives. */
export function TableSkeleton({ rows = 6, columns = 5 }: { rows?: number; columns?: number }) {
  return (
    <Card className="overflow-hidden p-0">
      <div className="flex gap-4 border-b border-gray-100 bg-gray-50 px-5 py-3">
        {Array.from({ length: columns }).map((_, i) => (
          <Skeleton key={i} className="h-3 flex-1" />
        ))}
      </div>
      {Array.from({ length: rows }).map((_, r) => (
        <div key={r} className="flex items-center gap-4 border-b border-gray-100 px-5 py-4 last:border-b-0">
          {Array.from({ length: columns }).map((_, c) => (
            <Skeleton key={c} className={`h-3.5 flex-1 ${c === 0 ? "max-w-[140px]" : ""}`} />
          ))}
        </div>
      ))}
    </Card>
  );
}

/** Placeholder for a row of KPI cards on the dashboard. */
export function KpiCardSkeleton() {
  return (
    <Card className="flex flex-col gap-3">
      <Skeleton className="h-3.5 w-24" />
      <Skeleton className="h-8 w-16" />
      <Skeleton className="h-3 w-20" />
    </Card>
  );
}

/** A real KPI figure card for the dashboard — large bold number, small
 * label, optional trend/context line and icon, matching the same
 * large-bold-serif-number treatment used on the public site. */
export function KpiCard({
  label,
  value,
  icon: Icon,
  context,
  tone = "neutral",
}: {
  label: string;
  value: string;
  icon?: React.ComponentType<{ size?: number; strokeWidth?: number }>;
  context?: string;
  tone?: "neutral" | "success" | "warning" | "danger";
}) {
  const toneClass = {
    neutral: "text-gray-400",
    success: "text-emerald-600",
    warning: "text-amber-600",
    danger: "text-red-600",
  }[tone];

  return (
    <Card className="flex flex-col gap-1">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">{label}</p>
        {Icon && (
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-50 text-brand-900">
            <Icon size={15} />
          </span>
        )}
      </div>
      <p className="kpi-value-compact text-gray-900">{value}</p>
      {context && <p className={`text-xs font-medium ${toneClass}`}>{context}</p>}
    </Card>
  );
}
