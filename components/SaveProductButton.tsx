"use client";

import { Heart } from "lucide-react";
import { useSavedProducts } from "@/lib/savedProducts";

export default function SaveProductButton({
  productId,
  saveLabel,
  savedLabel,
  variant = "icon",
}: {
  productId: string;
  saveLabel: string;
  savedLabel: string;
  variant?: "icon" | "button";
}) {
  const { isSaved, toggle } = useSavedProducts();
  const saved = isSaved(productId);

  function handleClick(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    toggle(productId);
  }

  if (variant === "button") {
    return (
      <button
        type="button"
        onClick={handleClick}
        aria-pressed={saved}
        className={`flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition ${
          saved ? "border-accent/40 bg-accent/10 text-accent" : "border-border bg-surface text-muted hover:text-foreground"
        }`}
      >
        <Heart size={13} className={saved ? "fill-current" : ""} />
        {saved ? savedLabel : saveLabel}
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-pressed={saved}
      aria-label={saved ? savedLabel : saveLabel}
      className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full border backdrop-blur transition ${
        saved ? "border-accent/40 bg-accent/10 text-accent" : "border-border bg-surface/80 text-muted hover:text-foreground"
      }`}
    >
      <Heart size={14} className={saved ? "fill-current" : ""} />
    </button>
  );
}
