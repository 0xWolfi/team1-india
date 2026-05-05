import crypto from "crypto";

/**
 * Verifies a cron request's `Authorization: Bearer <CRON_SECRET>` header
 * using a constant-time comparison. Fails closed: if `CRON_SECRET` is unset
 * or empty, all requests are rejected (no fail-open behavior).
 *
 * Returns `null` on success, or a string error message on failure. Callers
 * should map the error to a 401 response.
 */
export function verifyCronAuth(request: Request | { headers: Headers }): string | null {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    // Fail closed: missing config means no caller is authorized.
    return "Server misconfigured";
  }

  const authHeader = request.headers.get("authorization") ?? "";
  const expected = `Bearer ${secret}`;

  // Length check first so timingSafeEqual doesn't throw on mismatched buffers.
  if (authHeader.length !== expected.length) {
    return "Unauthorized";
  }

  try {
    if (!crypto.timingSafeEqual(Buffer.from(authHeader), Buffer.from(expected))) {
      return "Unauthorized";
    }
  } catch {
    return "Unauthorized";
  }

  return null;
}
