"use client"

import * as React from "react"
import { ThemeProvider as NextThemesProvider } from "next-themes"
import { SessionProvider } from "next-auth/react"
import { ReactLenis } from 'lenis/react'

// Only enable Lenis smooth-scroll on devices with a fine pointer (mouse/trackpad)
// AND a wide viewport. On touch devices and DevTools mobile emulation, Lenis
// interferes with native scroll, forcing users to drag instead of using the wheel.
function useEnableLenis() {
  const [enabled, setEnabled] = React.useState(false);
  React.useEffect(() => {
    const mq = window.matchMedia("(min-width: 1024px) and (pointer: fine)");
    const update = () => setEnabled(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);
  return enabled;
}

export function ThemeProvider({
  children,
  ...props
}: React.ComponentProps<typeof NextThemesProvider>) {
  const enableLenis = useEnableLenis();
  const content = (
    <SessionProvider>
      <NextThemesProvider {...props}>{children}</NextThemesProvider>
    </SessionProvider>
  );
  if (!enableLenis) return content;
  return (
    <ReactLenis root options={{ lerp: 0.08, duration: 1.4, smoothWheel: true }}>
      {content}
    </ReactLenis>
  );
}
