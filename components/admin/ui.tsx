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
        <h1 className="font-display text-2xl font-bold text-gray-900">{title}</h1>
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
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={`rounded-2xl border border-gray-200 bg-white p-5 ${className}`}>
      {children}
    </div>
  );
}

export function EmptyState({ children }: { children: ReactNode }) {
  return (
    <div className="rounded-2xl border border-dashed border-gray-300 bg-white p-10 text-center text-sm text-gray-500">
      {children}
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

const BUTTON_VARIANTS = {
  primary:
    "bg-brand-900 text-white hover:bg-brand-800 shadow-sm shadow-brand-900/10",
  secondary:
    "border border-gray-200 bg-white text-gray-700 hover:bg-gray-50",
  danger:
    "border border-gray-200 bg-white text-gray-500 hover:border-red-300 hover:text-red-500",
} as const;

type ButtonVariant = keyof typeof BUTTON_VARIANTS;

const BUTTON_BASE =
  "inline-flex items-center justify-center gap-1.5 rounded-xl text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-60";
const BUTTON_SIZES = { sm: "px-3 py-1.5 text-xs", md: "px-4 py-2" } as const;

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
