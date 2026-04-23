"use client";

let sessionId: string | null = null;

function getSessionId() {
  if (!sessionId) {
    if (typeof sessionStorage !== "undefined") {
      sessionId = sessionStorage.getItem("_sid") || crypto.randomUUID();
      sessionStorage.setItem("_sid", sessionId);
    } else {
      sessionId = crypto.randomUUID();
    }
  }
  return sessionId;
}

export function trackPageView(path: string) {
  sendEvent({ type: "page_view", name: "page_view", path });
}

export function trackClick(name: string, data?: Record<string, any>) {
  sendEvent({ type: "click", name, data });
}

export function trackEvent(name: string, data?: Record<string, any>) {
  sendEvent({ type: "custom", name, data });
}

function sendEvent(event: { type: string; name: string; path?: string; data?: any }) {
  if (typeof navigator === "undefined" || !navigator.sendBeacon) return;

  const params = typeof window !== "undefined" ? new URLSearchParams(window.location.search) : null;

  navigator.sendBeacon(
    "/api/analytics/collect",
    JSON.stringify({
      ...event,
      sessionId: getSessionId(),
      referrer: typeof document !== "undefined" ? document.referrer || null : null,
      path: event.path || (typeof window !== "undefined" ? window.location.pathname : null),
      utmSource: params?.get("utm_source") || null,
      utmMedium: params?.get("utm_medium") || null,
      utmCampaign: params?.get("utm_campaign") || null,
    })
  );
}
