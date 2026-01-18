import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
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
  title: "Team1 India | Built for impact. Designed for builders.",
  description: "From idea to scale, Team1India provides the infrastructure, network, and resources you need to build the future.",
  keywords: ["Team1 India", "Startup Accelerator", "Developer Community", "Hackathons", "Mentorship", "India Tech"],
  openGraph: {
    title: "Team1 India | Built for impact. Designed for builders.",
    description: "From idea to scale, Team1India provides the infrastructure, network, and resources you need to build the future.",
    url: "https://team1india.com",
    siteName: "Team1 India",
    images: [
      {
        url: "/og-image.png", // Assuming an image will exist or user will add one
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
    creator: "@Team1India", // Placeholder
  },
};

import { ThemeProvider } from "./providers";
import { Component as EtheralBackground } from "@/components/ui/etheral-shadow";

import { Analytics } from "@vercel/analytics/next";

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
            <div className="relative text-white min-h-screen">
                <div className="fixed inset-0 z-0 pointer-events-none">
                    <EtheralBackground
                        color="rgba(128, 128, 128, 0.5)" // Slightly transparent gray
                        animation={{ scale: 100, speed: 90 }}
                        noise={{ opacity: 0.2, scale: 1.2 }} // Reduced noise opacity for background
                        sizing="fill"
                    />

                </div>
                <div className="relative z-10">
                    {children}
                </div>
            </div>
            <Analytics />
        </ThemeProvider>
      </body>
    </html>
  );
}
