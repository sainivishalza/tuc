import type { Metadata, Viewport } from "next";
import Script from "next/script";
import { Inter, Poppins, Playfair_Display, Plus_Jakarta_Sans, IBM_Plex_Sans } from "next/font/google";
import AnalyticsProvider from "@/components/AnalyticsProvider";
import { getSiteTheme } from "@/lib/actions/theme";
import type { FontChoice, TextScale, CornerStyle } from "@/lib/supabase/types";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-poppins",
  display: "swap",
});

const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-playfair",
  display: "swap",
});

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["600", "700"],
  variable: "--font-jakarta",
  display: "swap",
});

// Admin-only display face — see .font-admin-display in globals.css.
const plex = IBM_Plex_Sans({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  variable: "--font-plex",
  display: "swap",
});

const FONT_VAR_BY_CHOICE: Record<FontChoice, string> = {
  inter: "var(--font-inter)",
  poppins: "var(--font-poppins)",
  playfair: "var(--font-playfair)",
};

const TEXT_SCALE_VALUE: Record<TextScale, number> = {
  small: 0.925,
  medium: 1,
  large: 1.075,
};

const CORNER_RADIUS_VALUE: Record<CornerStyle, { lg: string; xl: string; xl2: string; xl3: string }> = {
  sharp: { lg: "0.125rem", xl: "0.25rem", xl2: "0.375rem", xl3: "0.5rem" },
  rounded: { lg: "0.5rem", xl: "0.75rem", xl2: "1rem", xl3: "1.5rem" },
  soft: { lg: "1rem", xl: "1.25rem", xl2: "1.75rem", xl3: "2.25rem" },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export const metadata: Metadata = {
  metadataBase: new URL("https://theuniquechoice.com"),
  title: "The Unique Choice",
  description:
    "Sourcing, inspection, and door-to-door shipping from China & Hong Kong.",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const theme = await getSiteTheme();

  // Injected as a plain :root override rather than passed through Tailwind
  // classes, so admin-picked colors/font/size apply everywhere those CSS
  // variables are already used (buttons, nav, headings) with no per-
  // component changes and no risk of breaking the static-generated pages —
  // this is cached (see lib/actions/theme.ts) and only recomputed when an
  // admin actually saves new settings.
  const radius = CORNER_RADIUS_VALUE[theme.corner_style];
  const themeStyle = `:root {
    --brand-navy: ${theme.primary_color};
    --accent: ${theme.accent_color};
    --brand-blue: ${theme.secondary_color};
    --surface: ${theme.surface_color};
    --background: ${theme.background_color};
    --font-selected: ${FONT_VAR_BY_CHOICE[theme.font_choice]};
    --text-scale: ${TEXT_SCALE_VALUE[theme.text_scale]};
    --corner-radius-lg: ${radius.lg};
    --corner-radius-xl: ${radius.xl};
    --corner-radius-2xl: ${radius.xl2};
    --corner-radius-3xl: ${radius.xl3};
  }
  ${
    !theme.tinted_sections
      ? `.section-tint-blue, .section-tint-amber { background: var(--surface-2); }
  .gradient-hero-light { background: var(--background); }`
      : ""
  }`;

  return (
    <html
      lang="en"
      className={`${inter.variable} ${poppins.variable} ${playfair.variable} ${jakarta.variable} ${plex.variable}`}
    >
      <head>
        <style dangerouslySetInnerHTML={{ __html: themeStyle }} />
      </head>
      <body className="antialiased">
        <AnalyticsProvider />
        {children}
        {/*
          Plausible Analytics — GDPR-friendly, no cookies, no personal data.
          https://plausible.io
        */}
        <Script
          defer
          data-domain="theuniquechoice.com"
          src="https://plausible.io/js/script.js"
        />
      </body>
    </html>
  );
}
