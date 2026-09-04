import type { Metadata, Viewport } from "next";
import Script from "next/script";
import { Inter } from "next/font/google";
import AnalyticsProvider from "@/components/AnalyticsProvider";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

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

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={inter.variable}>
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
