import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Providers } from "@/components/providers";
import { SiteFooter } from "@/components/site-footer";
import { BRAND, GITHUB_URL, SITE_URL, TAGLINE } from "@/lib/brand";
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
    "Buy tokenized stocks when the Jupiter tape is cheaper than the issuer mark. Tape is what you pay. Mark is the issuer. Green is the trade.",
  applicationName: BRAND,
  alternates: { canonical: SITE_URL },
  openGraph: {
    title: `${BRAND} — ${TAGLINE}`,
    description:
      "Tape is the live Jupiter price. Mark is the issuer reference. Green means cheaper — that gap is the trade.",
    url: SITE_URL,
    siteName: BRAND,
    type: "website",
  },
  other: {
    github: GITHUB_URL,
  },
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/icon.png", type: "image/png", sizes: "512x512" },
    ],
    apple: { url: "/apple-icon.png", sizes: "180x180" },
  },
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
      </body>
    </html>
  );
}
