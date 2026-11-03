import type { Metadata, Viewport } from "next";
import { Fraunces, Inter, Source_Serif_4 } from "next/font/google";

import { getSettings, siteUrl } from "@/lib/settings";
import "./globals.css";

const display = Fraunces({
  subsets: ["latin"],
  variable: "--font-fraunces",
  axes: ["opsz", "SOFT"],
  display: "swap",
});
const sans = Inter({ subsets: ["latin"], variable: "--font-inter", display: "swap" });
const serif = Source_Serif_4({
  subsets: ["latin"],
  variable: "--font-source-serif",
  style: ["normal", "italic"],
  display: "swap",
});

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSettings();
  return {
    metadataBase: new URL(siteUrl()),
    title: { default: settings.siteName, template: `%s — ${settings.siteName}` },
    description: settings.tagline,
    applicationName: settings.siteName,
    authors: [{ name: settings.authorName }],
    alternates: { canonical: "/" },
    openGraph: {
      type: "website",
      siteName: settings.siteName,
      title: settings.siteName,
      description: settings.tagline,
      locale: "en_ZW",
    },
    twitter: { card: "summary_large_image" },
  };
}

export const viewport: Viewport = {
  themeColor: "#ffffff",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${display.variable} ${sans.variable} ${serif.variable}`}>
      <body className="bg-white font-sans text-ink antialiased">{children}</body>
    </html>
  );
}
