import Link from "next/link";
import { cookies } from "next/headers";
import { notFound, redirect } from "next/navigation";

import { visibleImplementedAdminRuntimeDestinations } from "@/src/application/admin/portal-navigation";
import { AdminPortalShell } from "@/src/components/admin/AdminPortalShell";
import { geographyId as parseGeographyId } from "@/src/domain/geography/model";
import { RFXCHANGE_SESSION_COOKIE_NAME } from "@/src/infrastructure/auth/firebase-server-session";
import { resolveAdminRoute } from "@/src/infrastructure/auth/admin-route-runtime";
import { createFirestoreOrganizationAuthorityClaims } from "@/src/infrastructure/firestore/organization-authority-claims";
import {
  createServerFirestoreFoundationRepositories,
  getServerFirestore,
} from "@/src/infrastructure/firestore/runtime";

import styles from "./page.module.css";

const OPEN_CLAIM_STATUSES = [
  "submitted",
  "evidence-requested",
  "existing-administrator-notified",
  "evidence-compared",
  "conflict",
] as const;

function firstSearchParam(value: string | string[] | undefined): string | null {
  if (typeof value === "string" && value.trim()) return value.trim();
  if (Array.isArray(value) && typeof value[0] === "string" && value[0].trim()) return value[0].trim();
  return null;
}

function readable(value: string): string {
  return value
    .split("-")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function claimHref(claimId: string, geographyId: string | null): string {
  const search = new URLSearchParams({ claimId });
  if (geographyId) search.set("geographyId", geographyId);
  return `/admin/organization-claims?${search.toString()}`;
}

export default async function OrganizationClaimsAdminPage({
  searchParams,
}: {
  readonly searchParams?: Promise<Readonly<Record<string, string | string[] | undefined>>>;
}) {
  const params = searchParams ? await searchParams : {};
  const requestedGeography = firstSearchParam(params.geographyId);
  const requestedClaimId = firstSearchParam(params.claimId);
  let geographyId = null;
  if (requestedGeography) {
    try {
      geographyId = parseGeographyId(requestedGeography);
    } catch {
      notFound();
    }
  }

  const scope = geographyId ? `GEOGRAPHY:${geographyId}` : "GLOBAL";
  const returnPath = geographyId
    ? `/admin/organization-claims?geographyId=${encodeURIComponent(String(geographyId))}`
    : "/admin/organization-claims";
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get(RFXCHANGE_SESSION_COOKIE_NAME)?.value;
  const access = await resolveAdminRoute({
    sessionCookie,
    permission: "organization.claim.read",
    scope,
  });

  if (access.kind === "unauthenticated") {
    redirect(`/signin?returnTo=${encodeURIComponent(returnPath)}`);
  }
  if (
    access.kind === "privileged-access-denied" &&
    access.reason === "recent-reauthentication-required"
  ) {
    redirect(`/signin?returnTo=${encodeURIComponent(returnPath)}`);
  }
  if (access.kind !== "authorized") notFound();

  const db = getServerFirestore();
  const claimsRepository = createFirestoreOrganizationAuthorityClaims(db).claims;
  const rawClaims = geographyId
    ? await claimsRepository.listByGeographyId(geographyId)
    : (await Promise.all(
        OPEN_CLAIM_STATUSES.map((status) => claimsRepository.listByStatus(status)),
      )).flat();
  const claims = [...new Map(
    rawClaims
      .filter((claim) => OPEN_CLAIM_STATUSES.includes(
        claim.status as (typeof OPEN_CLAIM_STATUSES)[number],
      ))
      .map((claim) => [String(claim.id), claim]),
  ).values()].sort((left, right) => Date.parse(right.updatedAt) - Date.parse(left.updatedAt));

  const selectedClaim = requestedClaimId
    ? claims.find((claim) => String(claim.id) === requestedClaimId) ?? notFound()
    : claims[0] ?? null;

  const foundation = createServerFirestoreFoundationRepositories(db);
  const profileEntries = await Promise.all(
    [...new Set(claims.map((claim) => String(claim.organizationId)))].map(async (organizationId) => {
      const claim = claims.find((candidate) => String(candidate.organizationId) === organizationId)!;
      const profile = await foundation.organizations.profiles.getByOrganizationId(claim.organizationId);
      return [organizationId, profile?.displayName ?? "Organization"] as const;
    }),
  );
  const profileNames = new Map(profileEntries);

  const adjudicationAccess = await resolveAdminRoute({
    sessionCookie,
    permission: "organization.claim.adjudicate",
    scope,
    access: "write",
  });
  const canAdjudicate = adjudicationAccess.kind === "authorized";
  const organizationAccess = selectedClaim
    ? await resolveAdminRoute({
        sessionCookie,
        permission: "organization.profile.read",
        scope: `ORGANIZATION:${selectedClaim.organizationId}`,
      })
    : null;
  const canOpenOrganization = organizationAccess?.kind === "authorized";

  const destinations = visibleImplementedAdminRuntimeDestinations(
    access.authority,
    access.grants,
    new Date().toISOString(),
  );
  const selectedOrganizationName = selectedClaim
    ? profileNames.get(String(selectedClaim.organizationId)) ?? "Organization"
    : null;

  return (
    <AdminPortalShell
      destinations={destinations}
      currentDestination="organization-claims"
      currentScope={access.scope.value}
    >
      <section className={styles.workspace}>
        <header className={styles.header}>
          <div>
            <p>Organizations</p>
            <h1>Claims &amp; authority</h1>
            <p className={styles.intro}>
              Review who may manage an organization. Management authority and Organization
              Verification remain separate decisions.
            </p>
          </div>
          <div className={styles.summary} aria-label={`${claims.length} open claims`}>
            <strong>{claims.length}</strong>
            <span>open {claims.length === 1 ? "claim" : "claims"}</span>
          </div>
        </header>

        <section className={styles.filters} aria-label="Included claim statuses">
          <span>Included</span>
          <div className={styles.filterList}>
            {OPEN_CLAIM_STATUSES.map((status) => (
              <span key={status}>{readable(status)}</span>
            ))}
          </div>
        </section>

        <div className={styles.columns}>
          <section className={styles.queue} aria-labelledby="claim-queue-heading">
            <div className={styles.sectionHeading}>
              <div>
                <p>Review queue</p>
                <h2 id="claim-queue-heading">Authority claims</h2>
              </div>
              <span>{canAdjudicate ? "Decision access" : "Read only"}</span>
            </div>

            {claims.length ? (
              <div className={styles.claimList}>
                {claims.map((claim) => {
                  const selected = selectedClaim?.id === claim.id;
                  const organizationName = profileNames.get(String(claim.organizationId)) ?? "Organization";
                  return (
                    <Link
                      className={styles.claimRow}
                      data-selected={selected ? "true" : "false"}
                      key={String(claim.id)}
                      href={claimHref(String(claim.id), geographyId ? String(geographyId) : null)}
                      aria-current={selected ? "page" : undefined}
                    >
                      <div className={styles.monogram} aria-hidden="true">
                        {organizationName.slice(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <h3>{organizationName}</h3>
                        <p>Geography {String(claim.geographyId)}</p>
                      </div>
                      <span>{readable(claim.status)}</span>
                    </Link>
                  );
                })}
              </div>
            ) : (
              <div className={styles.emptyQueue}>
                <strong>Nothing is waiting for review.</strong>
                <p>No open authority claims are present in this access scope.</p>
              </div>
            )}
          </section>

          <section className={styles.review} aria-live="polite">
            {selectedClaim ? (
              <>
                <div className={styles.reviewHeader}>
                  <div>
                    <p>Authority claim</p>
                    <h2>{selectedOrganizationName}</h2>
                  </div>
                  <span>{readable(selectedClaim.status)}</span>
                </div>

                <p className={styles.reviewIntro}>
                  Confirm that the claimant has legitimate authority to manage this organization
                  without changing its separate verification or credibility state.
                </p>

                <dl className={styles.facts}>
                  <div>
                    <dt>Claimant</dt>
                    <dd>{String(selectedClaim.userId)}</dd>
                  </div>
                  <div>
                    <dt>Geography</dt>
                    <dd>{String(selectedClaim.geographyId)}</dd>
                  </div>
                  <div>
                    <dt>Evidence</dt>
                    <dd>{selectedClaim.evidence.length} submitted item{selectedClaim.evidence.length === 1 ? "" : "s"}</dd>
                  </div>
                  <div>
                    <dt>Conflicts</dt>
                    <dd>{selectedClaim.conflictingClaimIds.length || "None"}</dd>
                  </div>
                  <div>
                    <dt>Existing administrator</dt>
                    <dd>{readable(selectedClaim.existingAdministratorNotification)}</dd>
                  </div>
                  <div>
                    <dt>Last updated</dt>
                    <dd>{new Date(selectedClaim.updatedAt).toLocaleString()}</dd>
                  </div>
                </dl>

                <section className={styles.evidence} aria-labelledby="claim-evidence-heading">
                  <div className={styles.subheading}>
                    <h3 id="claim-evidence-heading">Evidence summary</h3>
                    <span>Private files require separate access</span>
                  </div>
                  {selectedClaim.evidence.length ? (
                    <ul>
                      {selectedClaim.evidence.map((item) => (
                        <li key={item.id}>
                          <div>
                            <strong>{readable(item.kind)}</strong>
                            <span>{readable(item.status)}</span>
                          </div>
                          <small>Submitted {new Date(item.submittedAt).toLocaleDateString()}</small>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p>No evidence metadata has been submitted for this claim.</p>
                  )}
                </section>

                <aside className={styles.authorityBoundary}>
                  <strong>Authority is not verification.</strong>
                  <p>
                    An approved claim may establish organization-management access. It does not
                    mark the organization Verified, endorsed, qualified, or more credible.
                  </p>
                </aside>

                <footer className={styles.reviewFooter}>
                  <span>{canAdjudicate ? "Decision access available" : "Read-only access"}</span>
                  {canOpenOrganization ? (
                    <Link href={`/admin/organizations/${selectedClaim.organizationId}`}>
                      Open organization
                    </Link>
                  ) : null}
                </footer>
              </>
            ) : (
              <div className={styles.emptyReview}>
                <span aria-hidden="true">○</span>
                <h2>No claim selected</h2>
                <p>A claim will appear here when work enters this authorized queue.</p>
              </div>
            )}
          </section>
        </div>
      </section>
    </AdminPortalShell>
  );
}
