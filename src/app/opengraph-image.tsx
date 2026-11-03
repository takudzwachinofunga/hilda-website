import { ImageResponse } from "next/og";
import { getSettings } from "@/lib/settings";

export const dynamic = "force-dynamic";
export const alt = "Site preview";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// Default social sharing image (articles with a featured photo use that instead).
export default async function OpengraphImage() {
  const settings = await getSettings();
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: "#FFFFFF",
          padding: "72px 80px",
          borderTop: "24px solid #C8102E",
          fontFamily: "serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
          <div style={{ width: 14, height: 88, background: "#C8102E" }} />
          <div style={{ fontSize: 88, fontWeight: 700, color: "#111111", letterSpacing: -2 }}>
            {settings.siteName}
          </div>
        </div>
        <div style={{ fontSize: 40, color: "#666666", lineHeight: 1.35, maxWidth: 980 }}>{settings.tagline}</div>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            fontSize: 26,
            color: "#111111",
            borderTop: "2px solid #111111",
            paddingTop: 24,
            fontFamily: "sans-serif",
            letterSpacing: 3,
            textTransform: "uppercase",
          }}
        >
          <span>{settings.authorName}</span>
          <span>{settings.location ?? ""}</span>
        </div>
      </div>
    ),
    size,
  );
}
