import { NextRequest, NextResponse } from "next/server";

import { serializeAcquisitionContextToken } from "@/src/application/acquisition/acquisition-context";
import {
  acquisitionCookieOptions,
  createServerAcquisitionContextService,
  RFXCHANGE_ACQUISITION_COOKIE_NAME,
} from "@/src/infrastructure/acquisition/runtime";

export async function POST(request: NextRequest) {
  try {
    const form = await request.formData();
    const reference = typeof form.get("opportunityReference") === "string"
      ? String(form.get("opportunityReference"))
      : "";
    const issued = await createServerAcquisitionContextService().issuePublicOpportunity({
      reference,
      referrer: request.headers.get("referer"),
    });
    const response = NextResponse.redirect(new URL("/join?entry=opportunity", request.url), 303);
    response.cookies.set(
      RFXCHANGE_ACQUISITION_COOKIE_NAME,
      serializeAcquisitionContextToken(issued.token),
      acquisitionCookieOptions(),
    );
    return response;
  } catch {
    return NextResponse.json({ error: "This public opportunity is unavailable." }, { status: 404 });
  }
}
