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
  title: "Team1 India",
  description: "Official Team1 India Platform",
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
