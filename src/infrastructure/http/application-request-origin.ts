import { applicationOrigins } from "../../application/platform/application-origins.ts";

/**
 * App Hosting can expose its internal listener in request.url. Compare browser
 * origins against our deployed application, never a supplied Host/Forwarded header.
 * Local development accepts only an exact loopback origin, never in production.
 * This is a CSRF check; every caller must still authorize its own command.
 */
export function isApplicationRequestOrigin(
  request: Pick<Request, "headers" | "url">,
  application: "admin" | "exchange",
): boolean {
  const origin = request.headers.get("origin");
  if (origin === applicationOrigins[application]) return true;
  if (process.env.NODE_ENV === "production" || !origin) return false;
  try {
    const target = new URL(request.url);
    return target.protocol === "http:"
      && ["localhost", "127.0.0.1", "[::1]"].includes(target.hostname)
      && origin === target.origin;
  } catch { return false; }
}
