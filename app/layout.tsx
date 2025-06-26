import type React from "react";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { Quicksand } from "next/font/google";

const quicksand = Quicksand({
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  display: "swap",
});

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning className={quicksand.className}>
      <head>
        <title>Minature Potato</title>
        <meta
          name="description"
          content="Turn your tiny thoughts into adorable quote images! Miniature Potato makes it easy (and fun!) to create sweet, shareable visuals for your shayari, quotes, and more — all in just a few clicks."
        />
        <meta name="viewport" content="width=device-width, initial-scale=1" />

        {/* Favicons and PWA */}
        <link
          rel="apple-touch-icon"
          sizes="180x180"
          href="/apple-touch-icon.png"
        />
        <link
          rel="icon"
          type="image/png"
          sizes="192x192"
          href="/android-chrome-192x192.png"
        />
        <link
          rel="icon"
          type="image/png"
          sizes="512x512"
          href="/android-chrome-512x512.png"
        />
        <link
          rel="icon"
          type="image/png"
          sizes="32x32"
          href="/favicon-32x32.png"
        />
        <link
          rel="icon"
          type="image/png"
          sizes="16x16"
          href="/favicon-16x16.png"
        />
        <link rel="icon" href="/favicon.ico" />
        <link rel="manifest" href="/site.webmanifest" />
        <meta name="theme-color" content="#f8c8da" />
        <meta name="msapplication-TileColor" content="#f8c8da" />
        <meta name="apple-mobile-web-app-title" content="Minature Potato" />
        <meta name="application-name" content="Minature Potato" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />

        {/* Social: Open Graph / Facebook */}
        <meta property="og:title" content="Minature Potato" />
        <meta
          property="og:description"
          content="Turn your tiny thoughts into adorable quote images! Miniature Potato makes it easy (and fun!) to create sweet, shareable visuals for your shayari, quotes, and more — all in just a few clicks."
        />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://miniature-potato-wth.vercel.app/" />

        {/* Social: Twitter */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Minature Potato" />
        <meta
          name="twitter:description"
          content="Turn your tiny thoughts into adorable quote images! Miniature Potato makes it easy (and fun!) to create sweet, shareable visuals for your shayari, quotes, and more — all in just a few clicks."
        />

        {/* Canonical */}
        <link rel="canonical" href="https://yourdomain.com/" />
      </head>
      <body>
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem={false}
        >
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
