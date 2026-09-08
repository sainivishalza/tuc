"use client";

import { useState } from "react";
import { updateSiteTheme } from "@/lib/actions/theme";
import type { SiteTheme, FontChoice, TextScale } from "@/lib/supabase/types";
import { Button, inputClass, labelClass } from "@/components/admin/ui";

const FONT_OPTIONS: { value: FontChoice; label: string; cssVar: string }[] = [
  { value: "inter", label: "Inter — Modern & Clean", cssVar: "var(--font-inter)" },
  { value: "poppins", label: "Poppins — Friendly & Bold", cssVar: "var(--font-poppins)" },
  { value: "playfair", label: "Playfair Display — Elegant & Editorial", cssVar: "var(--font-playfair)" },
];

const SIZE_OPTIONS: { value: TextScale; label: string }[] = [
  { value: "small", label: "Small" },
  { value: "medium", label: "Medium" },
  { value: "large", label: "Large" },
];

const SIZE_PREVIEW_REM: Record<TextScale, string> = {
  small: "0.925rem",
  medium: "1rem",
  large: "1.075rem",
};

function isValidHex(value: string): boolean {
  return /^#[0-9a-fA-F]{6}$/.test(value);
}

export default function ThemeSettingsForm({ initial }: { initial: SiteTheme }) {
  const [primaryColor, setPrimaryColor] = useState(initial.primary_color);
  const [accentColor, setAccentColor] = useState(initial.accent_color);
  const [surfaceColor, setSurfaceColor] = useState(initial.surface_color);
  const [backgroundColor, setBackgroundColor] = useState(initial.background_color);
  const [fontChoice, setFontChoice] = useState<FontChoice>(initial.font_choice);
  const [textScale, setTextScale] = useState<TextScale>(initial.text_scale);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const selectedFont = FONT_OPTIONS.find((f) => f.value === fontChoice) ?? FONT_OPTIONS[0];

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setMessage("");

    if (
      !isValidHex(primaryColor) ||
      !isValidHex(accentColor) ||
      !isValidHex(surfaceColor) ||
      !isValidHex(backgroundColor)
    ) {
      setError("Colors must be a valid hex code like #059669.");
      return;
    }

    setSaving(true);
    try {
      const result = await updateSiteTheme({
        primary_color: primaryColor,
        accent_color: accentColor,
        surface_color: surfaceColor,
        background_color: backgroundColor,
        font_choice: fontChoice,
        text_scale: textScale,
      });
      if (result.ok) {
        setMessage(result.message);
      } else {
        setError(result.message);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save theme settings.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <ColorField
          label="Primary color"
          sublabel="Hero, dark gradients"
          placeholder="#064e3b"
          value={primaryColor}
          onChange={setPrimaryColor}
        />
        <ColorField
          label="Accent color"
          sublabel="Buttons, links, highlights"
          placeholder="#059669"
          value={accentColor}
          onChange={setAccentColor}
        />
        <ColorField
          label="Card background"
          sublabel="Every white card, panel, and popup"
          placeholder="#ffffff"
          value={surfaceColor}
          onChange={setSurfaceColor}
        />
        <ColorField
          label="Body background"
          sublabel="Behind cards — keep this different from the card color above, or cards stop standing out"
          placeholder="#eef2f6"
          value={backgroundColor}
          onChange={setBackgroundColor}
        />
      </div>
      {surfaceColor.toLowerCase() === backgroundColor.toLowerCase() && (
        <p className="rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-700">
          Card background and body background are the same color — cards will blend into the page instead of standing out.
        </p>
      )}

      <div>
        <label className={labelClass}>Font</label>
        <select
          value={fontChoice}
          onChange={(e) => setFontChoice(e.target.value as FontChoice)}
          className={inputClass}
        >
          {FONT_OPTIONS.map((f) => (
            <option key={f.value} value={f.value}>
              {f.label}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className={labelClass}>Base text size</label>
        <div className="flex gap-2">
          {SIZE_OPTIONS.map((s) => (
            <button
              key={s.value}
              type="button"
              onClick={() => setTextScale(s.value)}
              className={`rounded-lg border px-4 py-2 text-sm font-medium transition ${
                textScale === s.value
                  ? "border-brand-900 bg-brand-900 text-white"
                  : "border-gray-200 text-gray-600 hover:border-gray-400"
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>
        <p className="mt-1 text-[11px] text-gray-400">
          Scales all text and spacing on the public site proportionally.
        </p>
      </div>

      {/* Live preview — reflects unsaved changes so the admin can see the
          effect before committing. */}
      <div className="rounded-xl border border-gray-200 bg-gray-50 p-5">
        <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-gray-400">Preview</p>
        <div
          className="rounded-xl border border-gray-200 p-6"
          style={{ fontFamily: selectedFont.cssVar, background: backgroundColor }}
        >
          <div
            className="rounded-xl border border-gray-200 p-6 shadow-sm"
            style={{ background: surfaceColor }}
          >
            <p
              className="font-bold"
              style={{ color: primaryColor, fontSize: `calc(${SIZE_PREVIEW_REM[textScale]} * 1.75)` }}
            >
              Your Trusted Sourcing Partner
            </p>
            <p className="mt-2 text-gray-600" style={{ fontSize: SIZE_PREVIEW_REM[textScale] }}>
              This is how body text and paragraphs will look across the site.
            </p>
            <button
              type="button"
              className="mt-4 rounded-full px-5 py-2.5 text-sm font-semibold text-white"
              style={{ background: `linear-gradient(135deg, ${accentColor}, ${primaryColor})` }}
            >
              Chat on WhatsApp
            </button>
          </div>
        </div>
      </div>

      {error && <p className="text-sm text-red-500">{error}</p>}
      {message && <p className="text-sm text-emerald-600">{message}</p>}

      <Button type="submit" disabled={saving} className="w-fit">
        {saving ? "Saving..." : "Save theme settings"}
      </Button>
    </form>
  );
}

function ColorField({
  label,
  sublabel,
  placeholder,
  value,
  onChange,
}: {
  label: string;
  sublabel: string;
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div>
      <label className={labelClass}>{label}</label>
      <div className="flex items-center gap-2">
        <input
          type="color"
          value={isValidHex(value) ? value : "#000000"}
          onChange={(e) => onChange(e.target.value)}
          className="h-9 w-11 shrink-0 cursor-pointer rounded-lg border border-gray-200 p-1"
        />
        <input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className={inputClass}
        />
      </div>
      <p className="mt-1 text-[11px] text-gray-400">{sublabel}</p>
    </div>
  );
}
