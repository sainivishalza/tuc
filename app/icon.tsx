import { ImageResponse } from "next/og";
import { getSiteTheme } from "@/lib/actions/theme";

export const size = { width: 64, height: 64 };
export const contentType = "image/png";

export default async function Icon() {
  const theme = await getSiteTheme();

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          borderRadius: 14,
          background: theme.logo_url
            ? "#ffffff"
            : `linear-gradient(100deg, ${theme.primary_color} 0%, ${theme.secondary_color} 100%)`,
          color: "white",
          fontSize: 28,
          fontWeight: 800,
          fontFamily: "sans-serif",
        }}
      >
        {theme.logo_url ? (
          <img
            src={theme.logo_url}
            width={56}
            height={56}
            style={{ objectFit: "contain" }}
            alt=""
          />
        ) : (
          "U"
        )}
      </div>
    ),
    { ...size }
  );
}
