import { MotionConfig } from "framer-motion";
import type { Metadata } from "next";
import { PageTransition } from "@/components/site/page-transition";
import { ThemeScript } from "@/components/site/theme-script";
import "./globals.css";

export const metadata: Metadata = {
  title: "Bintang Mesir — Software Engineer",
  description:
    "Software Engineer & Full Stack Web Developer — React, Next.js, Express, Laravel, Golang Fiber. Portfolio and technical writing on AI, web development, and networking.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id" suppressHydrationWarning>
      <head>
        <ThemeScript />
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
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=IBM+Plex+Mono:wght@400;500&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="antialiased">
        {/* reducedMotion="user" makes every Framer Motion animation in the app
            automatically honor the OS/browser prefers-reduced-motion setting,
            without each component having to check it individually. */}
        <MotionConfig reducedMotion="user">
          <PageTransition>{children}</PageTransition>
        </MotionConfig>
      </body>
    </html>
  );
}
