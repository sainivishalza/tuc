import type { Metadata, Viewport } from "next";
import Script from "next/script";
import { Inter, Poppins, Playfair_Display } from "next/font/google";
import AnalyticsProvider from "@/components/AnalyticsProvider";
import { getSiteTheme } from "@/lib/actions/theme";
import type { FontChoice, TextScale } from "@/lib/supabase/types";
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
  const themeStyle = `:root {
    --brand-navy: ${theme.primary_color};
    --accent: ${theme.accent_color};
    --surface: ${theme.surface_color};
    --background: ${theme.background_color};
    --font-selected: ${FONT_VAR_BY_CHOICE[theme.font_choice]};
    --text-scale: ${TEXT_SCALE_VALUE[theme.text_scale]};
  }`;

  return (
    <html
      lang="en"
      className={`${inter.variable} ${poppins.variable} ${playfair.variable}`}
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
