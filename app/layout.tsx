import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono, Newsreader, Noto_Sans_SC, Noto_Serif_SC } from "next/font/google";
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

// Chinese (and other CJK) text in cards. Self-hosted, sliced by unicode-range and never preloaded:
// a slice downloads only when a card actually contains characters from it.
const notoSans = Noto_Sans_SC({ variable: "--font-noto-sans-sc", subsets: ["latin"], weight: ["400", "700"], preload: false, display: "swap" });
const notoSerif = Noto_Serif_SC({ variable: "--font-noto-serif-sc", subsets: ["latin"], weight: ["400", "700"], preload: false, display: "swap" });

export const viewport: Viewport = {
  themeColor: [{ media: "(prefers-color-scheme: light)", color: "#f4f2ec" }, { media: "(prefers-color-scheme: dark)", color: "#161512" }],
  colorScheme: "light dark",
};

// Applies a saved Light/Dark choice before first paint, so the page never flashes the wrong theme.
const appearanceScript = `try{var t=localStorage.getItem("markdownpic.appearance");if(t==="light"||t==="dark")document.documentElement.dataset.theme=t}catch(e){}`;

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
  manifest: "/manifest.webmanifest",
  appleWebApp: { capable: true, title: "MarkdownPic", statusBarStyle: "default" },
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
    apple: "/apple-touch-icon.png",
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} ${newsreader.variable} ${notoSans.variable} ${notoSerif.variable}`} suppressHydrationWarning>
      <head><script dangerouslySetInnerHTML={{ __html: appearanceScript }} /></head>
      <body>{children}</body>
    </html>
  );
}
