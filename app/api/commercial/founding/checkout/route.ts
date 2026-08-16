import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

import { RFXCHANGE_SESSION_COOKIE_NAME } from "@/src/infrastructure/auth/participant-route-runtime";
import {
  FoundingCommerceError,
  beginFoundingCheckout,
  resolveFoundingOrganizationContext,
} from "@/src/infrastructure/commercial/founding-runtime";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function failure(error: unknown): NextResponse {
  if (error instanceof FoundingCommerceError) {
    return NextResponse.json({ error: error.code }, { status: error.status });
  }
  return NextResponse.json({ error: "checkout-unavailable" }, { status: 503 });
}

export async function POST(request: NextRequest) {
  try {
    const commandId = request.headers.get("idempotency-key")?.trim() ?? "";
    const cookieStore = await cookies();
    const context = await resolveFoundingOrganizationContext({
      sessionCookie: cookieStore.get(RFXCHANGE_SESSION_COOKIE_NAME)?.value,
    });
    const result = await beginFoundingCheckout({
      context,
      commandId,
      publicOrigin: process.env.RFXCHANGE_PUBLIC_ORIGIN ?? "",
    });
    return NextResponse.json(
      { checkoutUrl: result.checkoutUrl, reused: result.reused },
      { headers: { "cache-control": "no-store" } },
    );
  } catch (error) {
    return failure(error);
  }
}
