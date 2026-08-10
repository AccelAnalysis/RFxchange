import Link from "next/link";
import { cookies } from "next/headers";
import { notFound, redirect } from "next/navigation";

import { geographyId as parseGeographyId } from "@/src/domain/geography/model";
import { visibleImplementedAdminRuntimeDestinations } from "@/src/application/admin/portal-navigation";
import { RFXCHANGE_SESSION_COOKIE_NAME } from "@/src/infrastructure/auth/firebase-server-session";
import { resolveAdminRoute } from "@/src/infrastructure/auth/admin-route-runtime";
import { getServerFirestore, createServerFirestoreFoundationRepositories } from "@/src/infrastructure/firestore/runtime";
import { createFirestoreOrganizationAuthorityClaims } from "@/src/infrastructure/firestore/organization-authority-claims";
import { getRequestDictionary } from "@/src/i18n/server";

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

export default async function OrganizationClaimsAdminPage({
  searchParams,
}: {
  readonly searchParams?: Promise<Readonly<Record<string, string | string[] | undefined>>>;
}) {
  const params = searchParams ? await searchParams : {};
  const requestedGeography = firstSearchParam(params.geographyId);
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
  const access = await resolveAdminRoute({
    sessionCookie: cookieStore.get(RFXCHANGE_SESSION_COOKIE_NAME)?.value,
    permission: "organization.claim.read",
    scope,
  });

  if (access.kind === "unauthenticated") {
    redirect(`/signin?returnTo=${encodeURIComponent(returnPath)}`);
  }
  if (access.kind === "privileged-access-denied" && access.reason === "recent-reauthentication-required") {
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
      .filter((claim) => OPEN_CLAIM_STATUSES.includes(claim.status as (typeof OPEN_CLAIM_STATUSES)[number]))
      .map((claim) => [String(claim.id), claim]),
  ).values()].sort((left, right) => Date.parse(right.updatedAt) - Date.parse(left.updatedAt));

  const foundation = createServerFirestoreFoundationRepositories(db);
  const profileEntries = await Promise.all(
    [...new Set(claims.map((claim) => String(claim.organizationId)))].map(async (organizationId) => {
      const claim = claims.find((candidate) => String(candidate.organizationId) === organizationId)!;
      const profile = await foundation.organizations.profiles.getByOrganizationId(claim.organizationId);
      return [organizationId, profile?.displayName ?? "Organization"] as const;
    }),
  );
  const profileNames = new Map(profileEntries);
  const canAdjudicate = access.authority.effectivePermissions.some(
    (permission) => permission === "organization.claim.adjudicate",
  );
  const destinations = visibleImplementedAdminRuntimeDestinations(
    access.authority,
    access.grants,
    new Date().toISOString(),
  );
  const { dictionary } = await getRequestDictionary();
  const navigationCopy = dictionary.participantNavigation;

  return (
    <main className={styles.page}>
      <aside className={styles.sidebar}>
        <Link href="/" className={styles.wordmark}><span>RF</span>xchange<sup>™</sup></Link>
        <nav aria-label={navigationCopy.adminAriaLabel}>
          {destinations.map((destination) => (
            <Link
              key={destination.navigationId}
              href={destination.href}
              className={
                destination.key === "organization-claims" && destination.scope.value === access.scope.value
                  ? styles.active
                  : undefined
              }
              aria-current={
                destination.key === "organization-claims" && destination.scope.value === access.scope.value
                  ? "page"
                  : undefined
              }
            >
              <span>{navigationCopy[destination.labelKey]}</span>
              {destination.scope.kind === "GLOBAL" ? null : <small>{String(destination.scope.targetId)}</small>}
            </Link>
          ))}
          <Link href="/organization-profile">{navigationCopy.participantAccount}</Link>
        </nav>
        <div className={styles.scope}>
          <span>Current scope</span>
          <strong>{access.scope.value}</strong>
          <small>Grant {access.grantId}</small>
        </div>
      </aside>
      <section className={styles.workspace}>
        <header className={styles.header}>
          <div>
            <p>Administration · organizations</p>
            <h1>Claims & authority</h1>
          </div>
          <div className={styles.adminIdentity}>
            <span>Authorized administrator</span>
            <strong>{String(access.account.administratorId)}</strong>
          </div>
        </header>

        <section className={styles.filters} aria-label="Organization claims summary">
          <div className={styles.filterList}>
            {OPEN_CLAIM_STATUSES.map((status) => <span key={status}>{readable(status)}</span>)}
          </div>
        </section>

        <div className={styles.columns}>
          <section className={styles.queue} id="queue">
            <div className={styles.sectionHeading}>
              <div>
                <span>{claims.length} open {claims.length === 1 ? "record" : "records"}</span>
                <h2>Live authority claims</h2>
              </div>
              <strong>{canAdjudicate ? "Adjudication permission present" : "Read-only permission"}</strong>
            </div>

            {claims.length ? claims.map((claim) => (
              <article className={styles.claimRow} key={String(claim.id)}>
                <div className={styles.monogram} aria-hidden="true">
                  {(profileNames.get(String(claim.organizationId)) ?? "O").slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <h3>{profileNames.get(String(claim.organizationId)) ?? "Organization"}</h3>
                  <p>Claim {String(claim.id)} · Geography {String(claim.geographyId)}</p>
                </div>
                <span>{readable(claim.status)}</span>
              </article>
            )) : (
              <div className={styles.identityNote}>
                <strong>No open claims.</strong>
                <p>The live authority-claim repository currently contains no non-terminal records in this authorized scope.</p>
              </div>
            )}
          </section>

          <section className={styles.review}>
            <div className={styles.reviewHeader}>
              <div>
                <p>Runtime convergence</p>
                <h2>Protected administrative surface</h2>
              </div>
              <span>{access.scope.value}</span>
            </div>
            <div className={styles.evidence}>
              <h3>Access boundary</h3>
              <p>
                This route resolves the authenticated Firebase subject to a persisted platform
                administrator, privileged security state, authority context, and an active grant
                matching the requested scope. A geography-scoped administrator sees only claims in
                that geography; GLOBAL access requires a GLOBAL grant.
              </p>
              <p>
                Private evidence is intentionally excluded from this queue. Evidence access and
                adjudication remain separate minimum-necessary permissions and workflows.
              </p>
            </div>
          </section>
        </div>
      </section>
    </main>
  );
}
