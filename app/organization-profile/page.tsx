import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { MapMotionPreferenceToggle } from "@/src/components/account/MapMotionPreferenceToggle";
import { SignOutButton } from "@/src/components/auth/SignOutButton";
import {
  OperationalWorkspace,
  ParticipantShell,
} from "@/src/components/participant/ParticipantWorkspace";
import { hydrateEssentialOrganizationProfile } from "@/src/domain/organization-profile/model";
import {
  RFXCHANGE_SESSION_COOKIE_NAME,
  resolveParticipantRoute,
} from "@/src/infrastructure/auth/participant-route-runtime";
import {
  createServerFirestoreFoundationRepositories,
  getServerFirestore,
} from "@/src/infrastructure/firestore/runtime";

import styles from "./page.module.css";

function readable(value: string): string {
  return value
    .split("-")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export default async function OrganizationProfilePage() {
  const cookieStore = await cookies();
  const access = await resolveParticipantRoute({
    sessionCookie: cookieStore.get(RFXCHANGE_SESSION_COOKIE_NAME)?.value,
  });

  if (access.kind === "unauthenticated") {
    redirect("/signin?returnTo=%2Forganization-profile");
  }
  if (access.kind === "activation-required") redirect("/join");
  if (access.kind === "wrong-organization") {
    redirect(access.state.controlledPlatformUrl ?? "/join");
  }
  if (access.kind === "restricted") {
    redirect(`/join?access=${encodeURIComponent(access.restrictionState)}`);
  }

  const foundation = createServerFirestoreFoundationRepositories(getServerFirestore());
  const [profileRecord, authorization] = await Promise.all([
    foundation.organizations.profiles.getByOrganizationId(access.membership.organizationId),
    foundation.organizationAuthorization.getByMembershipId(access.membership.id),
  ]);
  if (!profileRecord) redirect("/join");

  const profile = hydrateEssentialOrganizationProfile(profileRecord);
  const controlledStatus = access.state.lifecycleState === "open-platform"
    ? "Open Exchange"
    : "Controlled Exchange";

  return (
    <ParticipantShell activeItem="Account">
      <OperationalWorkspace ariaLabel="Organization account workspace">
        <section className={styles.page}>
          <header className={styles.header}>
            <div>
              <p className={styles.eyebrow}>Account · {controlledStatus}</p>
              <h1>{profile.displayName}</h1>
              <p>
                This workspace reflects your authenticated RFxchange organization context. Later
                profile, trust, commercial, and user-administration capabilities remain governed by
                their approved product slices.
              </p>
            </div>
            <SignOutButton className={styles.signOut} />
          </header>

          <section className={styles.grid}>
            <article className={styles.card}>
              <h2>Organization identity</h2>
              <dl className={styles.definitionList}>
                <dt>Organization ID</dt>
                <dd>{String(access.membership.organizationId)}</dd>
                <dt>Organization type</dt>
                <dd>{profile.organizationType ? readable(profile.organizationType) : "Not recorded"}</dd>
                <dt>Profile status</dt>
                <dd>{access.state.profileCompletion?.status === "active" ? "Profile Complete" : "Incomplete"}</dd>
                <dt>Workspace state</dt>
                <dd><span className={styles.status}>{controlledStatus}</span></dd>
              </dl>
            </article>

            <article className={styles.card}>
              <h2>Geography & marker</h2>
              <dl className={styles.definitionList}>
                <dt>Home locality</dt>
                <dd>{access.state.selectedGeography?.name ?? "Not recorded"}</dd>
                <dt>Location visibility</dt>
                <dd>{access.state.location ? readable(access.state.location.visibility) : "Not recorded"}</dd>
                <dt>Marker</dt>
                <dd>{access.state.marker?.status === "active" ? "Active" : "Not active"}</dd>
                <dt>Initial service geography</dt>
                <dd>{access.state.selectedGeography?.name ?? "Not recorded"}</dd>
              </dl>
              <p className={styles.empty}>
                During minimum activation, RFxchange initializes the confirmed home locality as the
                organization&apos;s initial service geography. Expanded service territories remain a
                separate profile concept and can be refined in later profile enrichment.
              </p>
            </article>

            <article className={styles.card}>
              <h2>Map settings</h2>
              <MapMotionPreferenceToggle />
            </article>

            <article className={styles.card}>
              <h2>Participation roles</h2>
              {profile.participationRoles.length ? (
                <ul className={styles.tags}>
                  {profile.participationRoles.map((role) => <li key={role}>{readable(role)}</li>)}
                </ul>
              ) : <p className={styles.empty}>No participation role has been recorded.</p>}
            </article>

            <article className={styles.card}>
              <h2>Business objectives</h2>
              {profile.businessObjectives.length ? (
                <ul className={styles.tags}>
                  {profile.businessObjectives.map((objective) => <li key={objective}>{readable(objective)}</li>)}
                </ul>
              ) : <p className={styles.empty}>No business objective has been recorded.</p>}
            </article>

            <article className={styles.card}>
              <h2>Your organization relationship</h2>
              <dl className={styles.definitionList}>
                <dt>Membership</dt>
                <dd>Active</dd>
                <dt>Authorization role</dt>
                <dd>{authorization ? readable(String(authorization.roleKey)) : "No authorization role recorded"}</dd>
                <dt>Granted capabilities</dt>
                <dd>{authorization?.permissions.length ?? 0}</dd>
              </dl>
            </article>

            <article className={styles.card}>
              <h2>Current release boundary</h2>
              <p className={styles.empty}>
                Referrals, Opportunities, Resources, advanced profile enrichment, credibility,
                commercial benefits, and additional user administration remain unavailable until
                their approved slices are complete.
              </p>
            </article>
          </section>
        </section>
      </OperationalWorkspace>
    </ParticipantShell>
  );
}
