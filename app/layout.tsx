import type { Metadata, Viewport } from "next";
import { Kanit } from "next/font/google";
import "./globals.css";


const kanit = Kanit({
  variable: "--font-kanit",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: 'swap',
});

export const metadata: Metadata = {
  metadataBase: new URL('https://team1india.com'),
  title: {
    default: "Team1 India: Built for impact. Designed for builders.",
    template: "%s | Team1 India"
  },
  description: "From idea to scale, Team1India provides the infrastructure, network, and resources you need to build the future.",
  keywords: ["Team1 India", "Startup Accelerator", "Developer Community", "Hackathons", "Mentorship", "India Tech"],
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Team1 India",
  },
  formatDetection: {
    telephone: false,
  },
  openGraph: {
    title: "Team1 India | Built for impact. Designed for builders.",
    description: "From idea to scale, Team1India provides the infrastructure, network, and resources you need to build the future.",
    url: "https://team1india.com",
    siteName: "Team1 India",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Team1 India Community",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Team1 India",
    description: "Built for impact. Designed for builders.",
    creator: "@Team1India",
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#000000" },
  ],
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  viewportFit: "cover",
};

import { ThemeProvider } from "./providers";

import { Analytics } from "@vercel/analytics/react";
import dynamic from "next/dynamic";
import { AnalyticsProvider } from "@/components/providers/AnalyticsProvider";

const PWAUpdatePrompt = dynamic(() => import("@/components/PWAUpdatePrompt"));
const PWAInstallPrompt = dynamic(() => import("@/components/PWAInstallPrompt"));

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${kanit.variable} antialiased`}
      >
        <ThemeProvider
            attribute="class"
            defaultTheme="dark"
            enableSystem
        >
            <div className="relative min-h-[100svh] text-[var(--foreground)] bg-[var(--background)] theme-transition" style={{ overflowX: 'clip' }}>
                {/* JSON-LD Structured Data */}
                {/* JSON-LD Structured Data for Knowledge Graph & AI Agents */}
                <script
                    type="application/ld+json"
                    dangerouslySetInnerHTML={{
                        __html: JSON.stringify({
                            "@context": "https://schema.org",
                            "@graph": [
                                {
                                    "@type": "Organization",
                                    "@id": "https://team1india.com/#organization",
                                    "name": "Team1 India",
                                    "url": "https://team1india.com",
                                    "logo": {
                                        "@type": "ImageObject",
                                        "url": "https://team1india.com/logo.png",
                                        "width": 512,
                                        "height": 512
                                    },
                                    "sameAs": [
                                        "https://x.com/Team1IND",
                                        "https://www.linkedin.com/company/avaxteam1",
                                        "https://github.com/Team1India",
                                        "https://t.me/avalanche_hi"
                                    ],
                                    "description": "The premier builder community and accelerator for the Avalanche Blockchain ecosystem in India.",
                                    "knowsAbout": [
                                        "Avalanche Blockchain",
                                        "Web3 Development",
                                        "Startup Acceleration",
                                        "Venture Capital",
                                        "Hackathons"
                                    ],
                                    "areaServed": {
                                        "@type": "Country",
                                        "name": "India"
                                    },
                                    "memberOf": {
                                        "@type": "Organization",
                                        "name": "Avalanche Ecosystem",
                                        "url": "https://www.avax.network"
                                    },
                                    "contactPoint": {
                                        "@type": "ContactPoint",
                                        "contactType": "partnerships",
                                        "email": "hello@team1india.com"
                                    }
                                },
                                {
                                    "@type": "WebSite",
                                    "@id": "https://team1india.com/#website",
                                    "url": "https://team1india.com",
                                    "name": "Team1 India Platform",
                                    "description": "Built for impact. Designed for builders.",
                                    "publisher": {
                                        "@id": "https://team1india.com/#organization"
                                    },
                                    "inLanguage": "en-US"
                                },
                                {
                                    "@type": "SoftwareApplication",
                                    "name": "Team1 India Dashboard",
                                    "applicationCategory": "DeveloperApplication",
                                    "operatingSystem": "Web",
                                    "offers": {
                                        "@type": "Offer",
                                        "price": "0",
                                        "priceCurrency": "USD"
                                    },
                                    "description": "Platform for developers to find teammates, grants, and mentorship.",
                                    "author": {
                                        "@id": "https://team1india.com/#organization"
                                    }
                                }
                            ]
                        })
                    }}
                />
                <div className="relative z-10">
                    <AnalyticsProvider>
                        {children}
                    </AnalyticsProvider>
                </div>
            </div>
            <Analytics />
            <PWAUpdatePrompt />
            <PWAInstallPrompt />
        </ThemeProvider>
      </body>
    </html>
  );
}
