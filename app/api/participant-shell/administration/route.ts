import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { resolveAdminPortalAccess } from "@/src/infrastructure/auth/admin-route-runtime";
import { RFXCHANGE_SESSION_COOKIE_NAME } from "@/src/infrastructure/auth/participant-route-runtime";

const NO_STORE_HEADERS = Object.freeze({
  "cache-control": "private, no-store, max-age=0",
});

function closedAdministrationContext() {
  return NextResponse.json(
    { administrationHref: null },
    { status: 200, headers: NO_STORE_HEADERS },
  );
}

/**
 * Optional shell affordance only. The menu requests it lazily after opening, and any dependency
 * failure hides the link. Every direct administrative route remains independently server-authorized.
 */
export async function GET() {
  try {
    const sessionCookie = (await cookies()).get(RFXCHANGE_SESSION_COOKIE_NAME)?.value;
    const access = await resolveAdminPortalAccess({ sessionCookie });
    return NextResponse.json(
      { administrationHref: access.kind === "authorized" ? "/admin" : null },
      { status: 200, headers: NO_STORE_HEADERS },
    );
  } catch {
    return closedAdministrationContext();
  }
}
