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
          background: "#0c0a09",
          color: "#f7f3ee",
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
              background: "linear-gradient(100deg, #e6321f 0%, #ff7a1a 55%, #ffb443 100%)",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 26,
              fontWeight: 800,
              color: "white",
            }}
          >
            TU
          </div>
          <div style={{ fontSize: 32, fontWeight: 800 }}>The Unique Choice</div>
        </div>
        <div style={{ display: "flex", fontSize: 54, fontWeight: 800, lineHeight: 1.15, maxWidth: 980 }}>
          {dict.hero.title} {dict.hero.titleHighlight}
        </div>
        <div style={{ display: "flex", fontSize: 26, color: "#a89e93", marginTop: 24, maxWidth: 900 }}>
          {dict.services.subtitle}
        </div>
      </div>
    ),
    { ...size }
  );
}
