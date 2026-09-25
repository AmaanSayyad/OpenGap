import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { Providers } from "@/components/providers";
import { SiteFooter } from "@/components/site-footer";
import { BRAND, DISCORD_URL, GITHUB_URL, SITE_URL, TAGLINE, TELEGRAM_URL, X_URL } from "@/lib/brand";
import { POOL_URL, TOKEN_DEXSCREENER } from "@/lib/company";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: `${BRAND} — ${TAGLINE}`,
  description:
    "Buy tokenized stocks when the live price on Jupiter is cheaper than the official reference price from the issuer (PreStocks, or Yahoo on listed names).",
  applicationName: BRAND,
  alternates: { canonical: SITE_URL },
  openGraph: {
    title: `${BRAND} — ${TAGLINE}`,
    description:
      "Buy tokenized stocks when the live price on Jupiter is cheaper than the official reference price from the issuer (PreStocks, or Yahoo on listed names).",
    url: SITE_URL,
    siteName: BRAND,
    type: "website",
  },
  other: {
    github: GITHUB_URL,
    twitter: X_URL,
    telegram: TELEGRAM_URL,
    discord: DISCORD_URL,
    token: TOKEN_DEXSCREENER,
    pool: POOL_URL,
  },
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/icon.png", type: "image/png", sizes: "512x512" },
    ],
    apple: { url: "/apple-icon.png", sizes: "180x180" },
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`dark ${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col font-sans">
        <Providers>
          <div className="flex min-h-full flex-1 flex-col">
            {children}
            <SiteFooter />
          </div>
        </Providers>
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
