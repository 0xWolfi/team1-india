import { prisma } from "@/lib/prisma";

/**
 * Wrap an API handler with monitoring (logs duration, status, errors).
 *
 * Usage:
 *   export const GET = withMonitoring(async (request: Request) => { ... });
 */
export function withMonitoring(handler: (request: Request, context?: any) => Promise<Response>) {
  return async (request: Request, context?: any) => {
    const start = Date.now();
    const url = new URL(request.url);
    try {
      const response = await handler(request, context);
      const duration = Date.now() - start;

      // Log to DB (non-blocking)
      logApiHealth(url.pathname, request.method, response.status, duration);

      return response;
    } catch (error) {
      const duration = Date.now() - start;
      logApiHealth(url.pathname, request.method, 500, duration, String(error));
      throw error;
    }
  };
}

function logApiHealth(
  endpoint: string,
  method: string,
  statusCode: number,
  durationMs: number,
  error?: string
) {
  prisma.apiHealthLog
    .create({
      data: { endpoint, method, statusCode, durationMs, error },
    })
    .catch(() => {});
}
