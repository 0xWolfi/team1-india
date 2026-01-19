import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: 'swap',
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: 'swap',
});

export const metadata: Metadata = {
  metadataBase: new URL('https://team1india.com'),
  title: {
    default: "Team1 India | Built for impact. Designed for builders.",
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
  themeColor: "#000000",
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,  // ✅ Allow zoom for accessibility
  userScalable: true,  // ✅ Required for WCAG AA compliance
};

import { ThemeProvider } from "./providers";
import { DynamicBackground } from "@/components/ui/DynamicBackground";

import { Analytics } from "@vercel/analytics/react";
import PWAUpdatePrompt from "@/components/PWAUpdatePrompt";
import PWAInstallPrompt from "@/components/PWAInstallPrompt";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ThemeProvider
            attribute="class"
            defaultTheme="dark"
            enableSystem
            disableTransitionOnChange
        >
            <div className="relative text-white min-h-[100svh]">
                <div className="fixed inset-0 z-0 pointer-events-none">
                    <DynamicBackground />
                </div>
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
                                        "https://twitter.com/Team1India",
                                        "https://www.linkedin.com/company/team1india",
                                        "https://github.com/Team1India",
                                        "https://t.me/Team1India"
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
                    {children}
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
