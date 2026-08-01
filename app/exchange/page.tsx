import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { OperationalWorkspace, ParticipantShell } from "@/src/components/participant/ParticipantWorkspace";
import { FIRST_VALUE_DESTINATIONS } from "@/src/domain/first-value/model";
import {
  createServerFirstValueAndOpenReleaseService,
  openReleaseScopeFromAccess,
} from "@/src/infrastructure/activation-release/runtime";
import {
  RFXCHANGE_SESSION_COOKIE_NAME,
  resolveParticipantRoute,
} from "@/src/infrastructure/auth/participant-route-runtime";
import styles from "./page.module.css";

export default async function ExchangePage() {
  const cookieStore = await cookies();
  const access = await resolveParticipantRoute({
    sessionCookie: cookieStore.get(RFXCHANGE_SESSION_COOKIE_NAME)?.value,
  });
  if (access.kind === "unauthenticated") redirect("/signin?returnTo=%2Fexchange");
  if (access.kind === "activation-required") redirect("/join");
  if (access.kind === "wrong-organization") redirect(access.state.controlledPlatformUrl ?? "/join");
  if (access.kind === "restricted") redirect(`/join?access=${encodeURIComponent(access.restrictionState)}`);
  if (access.state.lifecycleState !== "open-platform") redirect("/first-value");

  const scope = openReleaseScopeFromAccess(access);
  const service = createServerFirstValueAndOpenReleaseService(access);
  const [gate, selection] = await Promise.all([service.evaluate(scope), service.get(scope)]);
  if (gate.kind === "blocked") redirect(gate.remediation);
  if (!selection) redirect("/first-value");
  const destination = FIRST_VALUE_DESTINATIONS[selection.selectedIntent];

  return (
    <ParticipantShell activeItem={destination.workspace === "opportunities" ? "Opportunities" : destination.workspace === "referrals" ? "Referrals" : destination.workspace === "resources" ? "Resources" : "Intelligence"}>
      <OperationalWorkspace ariaLabel="Open RFxchange participant workspace" className={styles.workspace}>
        <section className={styles.wrap}>
          <p className={styles.eyebrow}>OPEN · activation complete</p>
          <h1>Welcome to the RFxchange.</h1>
          <p className={styles.lede}>Your account, organization authority, locality, Profile Complete marker, orientation, policies, and first-value choice passed the current server-authoritative release gate.</p>
          <article className={styles.destination}>
            <span>Your first-value path</span>
            <h2>{destination.label}</h2>
            <p>{destination.summary}</p>
            <div data-availability={destination.availability}>{destination.availability === "available" ? "Available now" : "Saved for its approved feature release"}</div>
            <small>{destination.availabilityMessage}</small>
          </article>
          <div className={styles.actions}>
            {destination.route ? <Link className={styles.primary} href={destination.route}>Continue to {destination.label.toLowerCase()}</Link> : null}
            <Link className={destination.route ? styles.secondary : styles.primary} href="/geography/canvas">Explore your locality map</Link>
          </div>
          <p className={styles.boundary}>OPEN is not Verification, provider approval, a paid status, a credibility badge, or a guarantee of opportunity or outcome. Current authorization and restrictions continue to be checked on protected requests.</p>
        </section>
      </OperationalWorkspace>
    </ParticipantShell>
  );
}
