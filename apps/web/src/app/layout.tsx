import type { Metadata } from "next";
import { Inter, IBM_Plex_Mono } from "next/font/google";
import "./globals.css";
import dynamic from "next/dynamic";

const ClientRoot = dynamic(() => import("@/components/providers/ClientRoot"), { ssr: false });

const geistSans = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const geistMono = IBM_Plex_Mono({
  variable: "--font-plex-mono",
  subsets: ["latin"],
  weight: ["400"],
});

export const metadata: Metadata = {
  title: "Rivor — Where Deals Flow Seamlessly",
  description: "Rivor helps real estate teams turn inbox chaos into closed deals with AI-powered summaries, pipeline, calendar, and analytics.",
  metadataBase: new URL("https://rivor.example.com"),
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
        {children}
        <ClientRoot />
        <div id="portal-toasts" />
        <div id="portal-modals" />
        <div id="portal-drawers" />
      </body>
    </html>
  );
}
