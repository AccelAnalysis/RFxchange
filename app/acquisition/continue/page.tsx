import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import {
  OperationalWorkspace,
  ParticipantShell,
} from "@/src/components/participant/ParticipantWorkspace";
import type { AcquisitionIntentKind } from "@/src/domain/acquisition/model";
import { accessJourneyId } from "@/src/domain/lifecycle/model";
import {
  createServerAcquisitionContextService,
  resolvePublicOpportunityProjection,
} from "@/src/infrastructure/acquisition/runtime";
import { participantEntryDestination } from "@/src/infrastructure/auth/participant-route-destination";
import {
  RFXCHANGE_SESSION_COOKIE_NAME,
  resolveParticipantRoute,
} from "@/src/infrastructure/auth/participant-route-runtime";

import styles from "./page.module.css";

const INTENT_LABELS = Object.freeze({
  opportunity: "Opportunity",
  "organization-claim": "Organization claim",
  referral: "Referral",
  "team-invitation": "Team invitation",
  provider: "Provider recommendation",
  "buyer-need": "Buyer need",
  direct: "Direct entry",
} satisfies Record<AcquisitionIntentKind, string>);

interface Props {
  readonly searchParams?: Promise<Readonly<Record<string, string | string[] | undefined>>>;
}

function first(value: string | string[] | undefined): string {
  return typeof value === "string" ? value : Array.isArray(value) ? value[0] ?? "" : "";
}

function opaqueSupportReference(value: string): string | null {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value)
    ? value.toLowerCase()
    : null;
}

export default async function AcquisitionContinuationPage({ searchParams }: Props) {
  const params = searchParams ? await searchParams : {};
  const attachmentFailed = first(params.status) === "attachment-failed";
  const supportReference = opaqueSupportReference(first(params.support));
  const cookieStore = await cookies();
  const access = await resolveParticipantRoute({
    sessionCookie: cookieStore.get(RFXCHANGE_SESSION_COOKIE_NAME)?.value,
  });
  if (access.kind === "unauthenticated") redirect("/signin?returnTo=%2Facquisition%2Fcontinue");
  if (access.kind === "access-resolution-required") redirect(participantEntryDestination(access));
  if (access.kind === "activation-required") redirect(participantEntryDestination(access));
  if (access.kind === "wrong-organization") redirect(access.state.controlledPlatformUrl ?? "/join");
  if (access.kind === "restricted") redirect(`/join?access=${encodeURIComponent(access.restrictionState)}`);
  const acquisition = access.state.acquisitionContext;
  if (!acquisition || acquisition.kind === "direct") {
    redirect(access.state.controlledPlatformUrl ?? "/geography/canvas");
  }
  if (access.state.lifecycleState === "open-platform" && !["referral", "provider"].includes(acquisition.kind)) redirect("/exchange");
  let resumeStatus: "resumed" | "pending" = "pending";
  try {
    const resumed = await createServerAcquisitionContextService().resume({
      contextId: acquisition.id,
      userId: access.context.user.id,
      accessJourneyId: accessJourneyId(access.state.accessJourneyId),
    });
    resumeStatus = resumed.resumeStatus;
  } catch {
    // The saved context never blocks access to the participant's canonical Exchange workspace.
  }
  const opportunity = acquisition.kind === "opportunity" && acquisition.subjectReference
    ? await resolvePublicOpportunityProjection(acquisition.subjectReference)
    : null;
  const mapUrl = access.state.lifecycleState === "open-platform" ? acquisition.kind === "provider" ? "/resources" : "/referrals" : "/orientation";

  return (
    <ParticipantShell activeItem={acquisition.kind === "opportunity" ? undefined : acquisition.kind === "referral" ? "Referrals" : acquisition.kind === "provider" ? "Resources" : "Network"}>
      <OperationalWorkspace ariaLabel="Saved acquisition context">
        <section className={styles.wrap}>
          <p className={styles.eyebrow}>Context recovered</p>
          <h1>We remembered why you came.</h1>
          <p className={styles.lede}>
            This {INTENT_LABELS[acquisition.kind].toLowerCase()} was bound to your authenticated
            activation journey. It did not grant organization authority, change geography, or skip
            any activation gate.
          </p>

          {attachmentFailed ? (
            <div className={styles.recovery} role="alert">
              <strong>The referral could not be attached.</strong>
              <p>Your saved context is still available. Retry the attachment below.</p>
              {supportReference ? <small>Support reference: {supportReference}</small> : null}
            </div>
          ) : null}

          <article className={styles.card}>
            <span>{INTENT_LABELS[acquisition.kind]}</span>
            <h2>{opportunity?.title ?? "Your saved next step"}</h2>
            <p>
              {opportunity?.summary ?? (acquisition.kind === "referral"
                ? "Your invitation points to one real business referral. Attaching it makes the minimum referral context available to your organization; it does not accept the referral."
                : acquisition.kind === "provider"
                  ? "A provider invited your organization to complete its own profile. The invitation preserves that context; it does not grant organization authority, provider status, eligibility, or verification."
                  : "Your saved context is preserved without claiming that the originating action was completed or accepted.")}
            </p>
            {opportunity ? (
              <dl>
                <div><dt>Issued by</dt><dd>{opportunity.issuerDisplayName}</dd></div>
                <div><dt>Geography</dt><dd>{opportunity.localityLabel}</dd></div>
                <div><dt>Status</dt><dd>{opportunity.availabilityLabel}</dd></div>
              </dl>
            ) : null}
            <small>Reference: {acquisition.subjectReference}</small>
            <small>Resume status: {resumeStatus}</small>
          </article>

          <div className={styles.actions}>
            {acquisition.kind === "referral" && access.state.lifecycleState === "open-platform" ? (
              <form action="/api/referrals/attach" method="post">
                <button className={styles.primary} type="submit">Attach and review referral</button>
              </form>
            ) : null}
            {opportunity ? (
              <Link className={styles.primary} href={`/opportunities/${encodeURIComponent(opportunity.reference)}`}>
                Review public opportunity
              </Link>
            ) : null}
            <Link className={styles.secondary} href={mapUrl}>{access.state.lifecycleState === "open-platform" ? acquisition.kind === "provider" ? "Continue to Resources" : "Continue to referrals" : "Continue to orientation"}</Link>
          </div>
        </section>
      </OperationalWorkspace>
    </ParticipantShell>
  );
}
