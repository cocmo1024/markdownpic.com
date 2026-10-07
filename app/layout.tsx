import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono, Newsreader } from "next/font/google";
import "katex/dist/katex.min.css";
import "./globals.css";
import { SITE_URL, siteDescription } from "@/lib/site-config";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// Editorial serif for exported cards and display type.
const newsreader = Newsreader({
  variable: "--font-newsreader",
  subsets: ["latin"],
  style: ["normal", "italic"],
});

export const viewport: Viewport = { themeColor: "#f4f2ec", colorScheme: "light" };

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: "Markdown to Image — PNG, JPEG & WebP | MarkdownPic", template: "%s | MarkdownPic" },
  description: siteDescription,
  applicationName: "MarkdownPic",
  keywords: [
    "Markdown to image",
    "Markdown to PNG",
    "text to image",
    "social card generator",
  ],
  openGraph: {
    title: "Markdown to Image | MarkdownPic",
    description: siteDescription,
    type: "website",
    siteName: "MarkdownPic",
    images: [{ url: "/og.png", width: 1200, height: 630, alt: "Markdown in. A picture worth sharing out." }],
  },
  twitter: {
    card: "summary_large_image",
    images: ["/og.png"],
    title: "Markdown to Image | MarkdownPic",
    description: siteDescription,
  },
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} ${newsreader.variable}`}>
      <body>{children}</body>
    </html>
  );
}
