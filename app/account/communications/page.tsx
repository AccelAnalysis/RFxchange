import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { CommunicationPreferencesForm } from "@/src/components/communications/CommunicationPreferencesForm";
import { createServerAuthenticationBoundary } from "@/src/infrastructure/auth/firebase-session-runtime";
import { RFXCHANGE_SESSION_COOKIE_NAME } from "@/src/infrastructure/auth/firebase-server-session";
import { getRequestDictionary } from "@/src/i18n/server";
export default async function Page() {
  const cookie = (await cookies()).get(RFXCHANGE_SESSION_COOKIE_NAME)?.value ?? "";
  try { await createServerAuthenticationBoundary().authenticateSessionCookie({ sessionCookie: cookie, now: new Date().toISOString() }); }
  catch { redirect("/signin?returnTo=%2Faccount%2Fcommunications"); }
  const { dictionary } = await getRequestDictionary();
  return <main aria-label={dictionary.interface.services.preferences.title}><CommunicationPreferencesForm/></main>;
}
