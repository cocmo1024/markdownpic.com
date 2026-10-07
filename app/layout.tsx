import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
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
  },
  twitter: {
    card: "summary",
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
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable}`}>
      <body>{children}</body>
    </html>
  );
}
