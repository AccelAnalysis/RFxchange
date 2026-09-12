import { NextRequest, NextResponse } from "next/server";
import { legacyApplicationDestination } from "@/src/application/platform/application-origins";
import { localeCookieName } from "@/src/i18n/config";

export function proxy(request: NextRequest) {
  const destination = legacyApplicationDestination(
    request.nextUrl.pathname,
    request.nextUrl.searchParams.get("utm_campaign"),
    request.cookies.get(localeCookieName)?.value,
  );
  if (!destination) return NextResponse.next();
  const response = NextResponse.redirect(destination, 307);
  response.headers.set("Cache-Control", "private, no-store");
  response.headers.set("Referrer-Policy", "no-referrer");
  return response;
}

export const config = { matcher: ["/((?!api|_next|favicon.ico).*)"] };
