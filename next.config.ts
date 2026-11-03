import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Pages read live database content on each request; no build-time data access.
  cacheComponents: false,
  images: {
    // Cloudinary and Wikimedia Commons both resize on their own CDN
    // (see src/lib/image-loader.ts).
    loader: "custom",
    loaderFile: "./src/lib/image-loader.ts",
    // Wikimedia only renders a fixed set of thumbnail widths and rejects the rest,
    // so ask for those sizes directly instead of having the loader round up and
    // ship more bytes than the layout needs. Cloudinary accepts any width.
    // Keep in step with COMMONS_WIDTHS in src/lib/image-sources.ts.
    deviceSizes: [500, 960, 1280, 1920],
    imageSizes: [120, 250, 330],
  },
  experimental: {
    serverActions: {
      bodySizeLimit: "4mb",
    },
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
        ],
      },
      {
        source: "/admin/:path*",
        headers: [{ key: "X-Robots-Tag", value: "noindex, nofollow" }],
      },
    ];
  },
  turbopack: {
    // The project sits inside a larger folder with its own lockfile; pin the root here.
    root: process.cwd(),
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
