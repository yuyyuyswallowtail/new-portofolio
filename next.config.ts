import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: "6mb",
    },
  },
  // Security headers — see SECURITY.md §5. No Access-Control-Allow-Origin
  // anywhere: the only API route (/api/cron/generate-article) is meant for
  // server-to-server calls from the `cron` compose service, authenticated by
  // a shared secret header, not by browser-facing CORS.
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
        ],
      },
      {
        // Static assets (certificates, cv, profile photo) can be cached hard —
        // they only change when someone re-deploys with new files.
        source: "/(certificates|profile.jpg|cv.pdf)/:path*",
        headers: [
          { key: "Cache-Control", value: "public, max-age=86400, immutable" },
        ],
      },
    ];
  },
};

export default nextConfig;
