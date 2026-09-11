import { NextResponse } from "next/server";

import {
  RFXCHANGE_FOUNDING_ACQUISITION_COOKIE_NAME,
  RFXCHANGE_FOUNDING_ACQUISITION_INTENT,
} from "@/src/infrastructure/acquisition/founding-intent";

const THIRTY_DAYS_SECONDS = 60 * 60 * 24 * 30;

export async function GET() {
  const response = new NextResponse(null, { status: 307, headers: { Location: "/join", "Cache-Control": "private, no-store" } });
  response.cookies.set({
    name: RFXCHANGE_FOUNDING_ACQUISITION_COOKIE_NAME,
    value: RFXCHANGE_FOUNDING_ACQUISITION_INTENT,
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: THIRTY_DAYS_SECONDS,
  });
  return response;
}
