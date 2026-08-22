import { ImageResponse } from "next/og";

export const size = { width: 64, height: 64 };
export const contentType = "image/png";

export default function Icon() {
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
          background: "linear-gradient(100deg, #e6321f 0%, #ff7a1a 55%, #ffb443 100%)",
          color: "white",
          fontSize: 28,
          fontWeight: 800,
          fontFamily: "sans-serif",
        }}
      >
        TU
      </div>
    ),
    { ...size }
  );
}
