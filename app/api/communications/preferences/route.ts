import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { COMMUNICATION_CONSENT_VERSION, type CommunicationPreferences } from "@/src/domain/communications/lifecycle";
import { createServerAuthenticationBoundary } from "@/src/infrastructure/auth/firebase-session-runtime";
import { getServerFirebaseAuth } from "@/src/infrastructure/auth/firebase-server";
import { RFXCHANGE_SESSION_COOKIE_NAME } from "@/src/infrastructure/auth/firebase-server-session";
import { getServerFirestore } from "@/src/infrastructure/firestore/runtime";
import { boundedRequestBytes } from "@/src/infrastructure/http/bounded-request";

export const runtime = "nodejs";
async function authenticate(request: NextRequest) {
  try { return await createServerAuthenticationBoundary().authenticateSessionCookie({ sessionCookie: request.cookies.get(RFXCHANGE_SESSION_COOKIE_NAME)?.value ?? "", now: new Date().toISOString() }); }
  catch { return null; }
}
export async function GET(request: NextRequest) {
  const context = await authenticate(request);
  if (!context) return NextResponse.json({ error: "Sign in to manage communications." }, { status: 401 });
  const [preferences, account] = await Promise.all([getServerFirestore().collection("communicationPreferences").doc(String(context.user.id)).get(), getServerFirebaseAuth().getUser(context.authentication.subject)]);
  return NextResponse.json({ preferences: preferences.data() ?? null, smsAvailable: Boolean(account.phoneNumber), consentTextVersion: COMMUNICATION_CONSENT_VERSION }, { headers: { "cache-control": "no-store" } });
}
export async function POST(request: NextRequest) {
  if (request.headers.get("origin") !== request.nextUrl.origin) return NextResponse.json({ error: "Request origin required." }, { status: 403 });
  const context = await authenticate(request);
  if (!context) return NextResponse.json({ error: "Sign in to manage communications." }, { status: 401 });
  let body: Record<string, unknown>;
  try {
    body = JSON.parse((await boundedRequestBytes(request, 4096)).toString("utf8"));
    if (!body || typeof body.email !== "boolean" || typeof body.sms !== "boolean" || typeof body.marketingConsent !== "boolean" || body.consentTextVersion !== COMMUNICATION_CONSENT_VERSION || !Number.isInteger(body.expectedVersion) || typeof body.timeZone !== "string") throw new Error("invalid");
    new Intl.DateTimeFormat("en-US", { timeZone: body.timeZone }).format();
  } catch { return NextResponse.json({ error: "Review your communication choices and time zone." }, { status: 400 }); }
  const account = await getServerFirebaseAuth().getUser(context.authentication.subject);
  if (body.sms && !account.phoneNumber) return NextResponse.json({ error: "A verified phone number is required for text messages." }, { status: 409 });
  const db = getServerFirestore();
  const ref = db.collection("communicationPreferences").doc(String(context.user.id));
  try {
    const result = await db.runTransaction(async (tx) => {
      const previous = await tx.get(ref);
      const version = previous.get("version") ?? 0;
      if (version !== body.expectedVersion) throw new Error("conflict");
      const preferences: CommunicationPreferences = { userId: String(context.user.id), version: version + 1,
        email: body.email as boolean, sms: body.sms as boolean, marketingConsent: body.marketingConsent as boolean,
        phone: body.sms ? account.phoneNumber ?? null : null, timeZone: body.timeZone as string,
        consentTextVersion: COMMUNICATION_CONSENT_VERSION, updatedAt: new Date().toISOString() };
      tx.set(ref, preferences);
      tx.create(db.collection("communicationConsentEvents").doc(randomUUID()), { userId: preferences.userId, version: preferences.version,
        email: preferences.email, sms: preferences.sms, marketingConsent: preferences.marketingConsent, consentTextVersion: COMMUNICATION_CONSENT_VERSION, occurredAt: preferences.updatedAt });
      tx.set(db.collection("lifecycleEnrollments").doc(preferences.userId), { userId: preferences.userId, nextEvaluationAt: preferences.updatedAt }, { merge: true });
      return preferences;
    });
    return NextResponse.json({ preferences: result });
  } catch { return NextResponse.json({ error: "Preferences changed. Refresh and try again." }, { status: 409 }); }
}
