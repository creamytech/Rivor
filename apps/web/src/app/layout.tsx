import type { Metadata, Viewport } from "next";
import { Inter, IBM_Plex_Mono } from "next/font/google";
import "./globals.css";
import "../styles/theme-fixes.css";

// Import polyfills for server-side compatibility
import "./polyfills.js";

// Start all workers (only on server side)
import "@/worker/startWorkers";

import ClientProviders from "@/components/providers/ClientProviders";
import ChatWidget from "@/components/common/ChatWidget";

const geistSans = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
  preload: true,
});

const geistMono = IBM_Plex_Mono({
  variable: "--font-plex-mono",
  subsets: ["latin"],
  weight: ["400"],
  display: "swap",
  preload: false,
});

export const metadata: Metadata = {
  title: {
    default: "Rivor — Where Deals Flow Seamlessly",
    template: "%s | Rivor"
  },
  description: "Transform your real estate business with Rivor's AI-powered unified workspace. Get intelligent email summaries, automated pipeline management, and seamless calendar integration. Turn inbox chaos into closed deals.",
  keywords: ["real estate CRM", "AI email management", "property pipeline", "real estate automation", "email summaries", "calendar integration", "deal tracking"],
  authors: [{ name: "Rivor Team" }],
  creator: "Rivor",
  publisher: "Rivor",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL("https://rivor.example.com"),
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "Rivor — Where Deals Flow Seamlessly",
    description: "Transform your real estate business with AI-powered email management, pipeline automation, and calendar integration.",
    url: "https://rivor.example.com",
    siteName: "Rivor",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Rivor - AI-Powered Real Estate Workspace",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Rivor — Where Deals Flow Seamlessly",
    description: "Transform your real estate business with AI-powered workspace. Turn inbox chaos into closed deals.",
    images: ["/og-image.png"],
    creator: "@rivor",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  icons: {
    icon: "/favicon.ico",
    shortcut: "/favicon-16x16.png",
    apple: "/apple-touch-icon.png",
  },
  manifest: "/site.webmanifest",
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  colorScheme: 'dark',
  themeColor: '#0a0f1f',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        <ClientProviders>
          {children}
          <ChatWidget />
        </ClientProviders>
      </body>
    </html>
  );
}
