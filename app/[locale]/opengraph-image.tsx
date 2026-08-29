import { ImageResponse } from "next/og";
import { getDictionary, type Locale } from "@/lib/i18n";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function OGImage({ params }: { params: Promise<{ locale: Locale }> }) {
  const { locale } = await params;
  const dict = await getDictionary(locale);

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "80px",
          background: "#0b1220",
          color: "#eef2f7",
          fontFamily: "sans-serif",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 16,
            marginBottom: 40,
          }}
        >
          <div
            style={{
              display: "flex",
              width: 64,
              height: 64,
              borderRadius: 16,
              background: "linear-gradient(100deg, #0b2545 0%, #1d4ed8 100%)",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 26,
              fontWeight: 800,
              color: "white",
            }}
          >
            U
          </div>
          <div style={{ fontSize: 32, fontWeight: 800 }}>
            The Unique Choice
          </div>
        </div>
        <div style={{ display: "flex", fontSize: 54, fontWeight: 800, lineHeight: 1.15, maxWidth: 980 }}>
          {dict.hero.title} {dict.hero.titleHighlight}
        </div>
        <div style={{ display: "flex", fontSize: 26, color: "#93a1b3", marginTop: 24, maxWidth: 900 }}>
          {dict.services.subtitle}
        </div>
      </div>
    ),
    { ...size }
  );
}
