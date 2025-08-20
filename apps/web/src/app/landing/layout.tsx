import type { Metadata } from "next";
import Script from "next/script";

export const metadata: Metadata = {
  title: "Close more deals with an AI-powered real estate workspace | Rivor",
  description: "Rivor turns inbox chaos into a clean flow—triage emails, auto-draft replies, schedule showings, and keep your pipeline moving. Join the waitlist for early access.",
  keywords: [
    "real estate AI",
    "email triage",
    "real estate CRM",
    "AI assistant",
    "pipeline management",
    "real estate automation",
    "email management",
    "deal flow",
    "real estate workspace"
  ],
  authors: [{ name: "Rivor" }],
  creator: "Rivor",
  publisher: "Rivor",
  metadataBase: new URL(process.env.NEXT_PUBLIC_BASE_URL || "https://rivor.co"),
  alternates: {
    canonical: "/landing",
  },
  openGraph: {
    title: "Close more deals with an AI-powered real estate workspace",
    description: "Rivor turns inbox chaos into a clean flow—triage emails, auto-draft replies, schedule showings, and keep your pipeline moving.",
    url: "/landing",
    siteName: "Rivor",
    images: [
      {
        url: "/og-landing.png",
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
    title: "Close more deals with an AI-powered real estate workspace",
    description: "Turn inbox chaos into deal flow with Rivor's AI-powered real estate workspace.",
    images: ["/og-landing.png"],
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
};

declare global {
  interface Window {
    gtag: (command: string, targetId: string, config?: any) => void;
  }
}

export default function LandingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      {/* Google Analytics - Only load if GOOGLE_ANALYTICS_ID is set */}
      {process.env.NEXT_PUBLIC_GOOGLE_ANALYTICS_ID && (
        <>
          <Script
            src={`https://www.googletagmanager.com/gtag/js?id=${process.env.NEXT_PUBLIC_GOOGLE_ANALYTICS_ID}`}
            strategy="afterInteractive"
          />
          <Script id="google-analytics" strategy="afterInteractive">
            {`
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', '${process.env.NEXT_PUBLIC_GOOGLE_ANALYTICS_ID}', {
                page_title: document.title,
                page_location: window.location.href,
                anonymize_ip: true,
                allow_google_signals: false,
                allow_ad_personalization_signals: false
              });
            `}
          </Script>
        </>
      )}
      
      {/* Structured Data for SEO */}
      <Script
        id="structured-data"
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "SoftwareApplication",
            "name": "Rivor",
            "description": "AI-powered real estate workspace that turns inbox chaos into deal flow",
            "applicationCategory": "BusinessApplication",
            "operatingSystem": "Web",
            "offers": {
              "@type": "Offer",
              "price": "0",
              "priceCurrency": "USD",
              "availability": "https://schema.org/ComingSoon"
            },
            "aggregateRating": {
              "@type": "AggregateRating",
              "ratingValue": "5",
              "ratingCount": "1"
            }
          })
        }}
      />
      
      {children}
    </>
  );
}