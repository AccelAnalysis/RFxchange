import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import {
  appendFoundingAcquisitionIntent,
  resolveFoundingAcquisitionIntent,
} from "@/src/infrastructure/acquisition/founding-intent";
import { participantEntryDestination } from "@/src/infrastructure/auth/participant-route-destination";
import {
  RFXCHANGE_SESSION_COOKIE_NAME,
  resolveParticipantRoute,
} from "@/src/infrastructure/auth/participant-route-runtime";

interface ExchangePageProps {
  readonly searchParams?: Promise<Readonly<Record<string, string | string[] | undefined>>>;
}

/**
 * Canonical Exchange entry.
 *
 * The participant's map shell is available as soon as the server-authoritative controlled
 * platform prerequisites exist. OPEN remains the authority boundary for consequential domain
 * actions; it no longer prevents a qualified participant from seeing the Exchange itself.
 */
export default async function ExchangePage({ searchParams }: ExchangePageProps) {
  const params = searchParams ? await searchParams : {};
  const acquisitionIntent = resolveFoundingAcquisitionIntent(params.acquisition);
  const exchangeUrl = acquisitionIntent
    ? appendFoundingAcquisitionIntent("/exchange")
    : "/exchange";
  const cookieStore = await cookies();
  const access = await resolveParticipantRoute({
    sessionCookie: cookieStore.get(RFXCHANGE_SESSION_COOKIE_NAME)?.value,
  });

  if (access.kind === "unauthenticated") {
    redirect(`/signin?returnTo=${encodeURIComponent(exchangeUrl)}`);
  }
  if (access.kind === "access-resolution-required") {
    redirect(participantEntryDestination(access));
  }
  if (access.kind === "activation-required") {
    redirect(participantEntryDestination(
      access,
      acquisitionIntent ? "/acquisition/founding" : "/join",
    ));
  }
  if (access.kind === "wrong-organization") {
    const destination = access.state.controlledPlatformUrl ?? "/join";
    redirect(acquisitionIntent ? appendFoundingAcquisitionIntent(destination) : destination);
  }
  if (access.kind === "restricted") {
    redirect(`/join?access=${encodeURIComponent(access.restrictionState)}`);
  }

  const mapUrl = acquisitionIntent
    ? appendFoundingAcquisitionIntent("/geography/canvas")
    : "/geography/canvas";
  redirect(mapUrl);
}
