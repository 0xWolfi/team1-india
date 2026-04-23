import { prisma } from "@/lib/prisma";

/**
 * Track an API call for analytics (server-side, non-blocking).
 */
export function trackApiCall(
  endpoint: string,
  method: string,
  status: number,
  durationMs: number,
  userEmail?: string
) {
  prisma.analyticsEvent
    .create({
      data: {
        type: "api_call",
        name: `${method} ${endpoint}`,
        path: endpoint,
        userEmail,
        sessionId: "server",
        data: { method, status, durationMs, success: status < 400 },
      },
    })
    .catch(() => {}); // silently fail — analytics should never break the app
}
