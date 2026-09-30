import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Yuyyuy — Backend & Local-Inference Engineer",
  description:
    "Portfolio and technical writing on AI infrastructure, web development, and networking.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id" suppressHydrationWarning>
      <head>
        {/*
          Loaded via a plain <link>, not next/font/google, so the Docker build
          never needs network access to fonts.googleapis.com — it only matters
          for the browser at runtime, and globals.css already has a full
          system-font fallback stack if this request is blocked/offline too.
        */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=IBM+Plex+Mono:wght@400;500&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="antialiased">{children}</body>
    </html>
  );
}
