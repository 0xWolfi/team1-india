"use client"

import * as React from "react"
import { ThemeProvider as NextThemesProvider } from "next-themes"
import { SessionProvider } from "next-auth/react"
import { ReactLenis } from 'lenis/react'
export function ThemeProvider({
  children,
  ...props
}: React.ComponentProps<typeof NextThemesProvider>) {
  return (
    <ReactLenis root options={{ lerp: 0.08, duration: 1.4, smoothWheel: true }}>
      <SessionProvider>
        <NextThemesProvider {...props}>{children}</NextThemesProvider>
      </SessionProvider>
    </ReactLenis>
  )
}
