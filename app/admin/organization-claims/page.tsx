import Link from "next/link";
import { cookies } from "next/headers";
import { notFound, redirect } from "next/navigation";

import { RFXCHANGE_SESSION_COOKIE_NAME } from "@/src/infrastructure/auth/firebase-server-session";
import { resolveAdminRoute } from "@/src/infrastructure/auth/admin-route-runtime";
import { getServerFirestore, createServerFirestoreFoundationRepositories } from "@/src/infrastructure/firestore/runtime";
import { createFirestoreOrganizationAuthorityClaims } from "@/src/infrastructure/firestore/organization-authority-claims";

import styles from "./page.module.css";

const OPEN_CLAIM_STATUSES = [
  "submitted",
  "evidence-requested",
  "existing-administrator-notified",
  "evidence-compared",
  "conflict",
] as const;

function readable(value: string): string {
  return value
    .split("-")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export default async function OrganizationClaimsAdminPage() {
  const cookieStore = await cookies();
  const access = await resolveAdminRoute({
    sessionCookie: cookieStore.get(RFXCHANGE_SESSION_COOKIE_NAME)?.value,
    permission: "organization.claim.read",
  });

  if (access.kind === "unauthenticated") {
    redirect("/signin?returnTo=%2Fadmin%2Forganization-claims");
  }
  if (access.kind === "privileged-access-denied" && access.reason === "recent-reauthentication-required") {
    redirect("/signin?returnTo=%2Fadmin%2Forganization-claims");
  }
  if (access.kind !== "authorized") notFound();

  const db = getServerFirestore();
  const claimsRepository = createFirestoreOrganizationAuthorityClaims(db).claims;
  const claimGroups = await Promise.all(
    OPEN_CLAIM_STATUSES.map((status) => claimsRepository.listByStatus(status)),
  );
  const claims = [...new Map(claimGroups.flat().map((claim) => [String(claim.id), claim])).values()]
    .sort((left, right) => Date.parse(right.updatedAt) - Date.parse(left.updatedAt));

  const foundation = createServerFirestoreFoundationRepositories(db);
  const profileEntries = await Promise.all(
    [...new Set(claims.map((claim) => String(claim.organizationId)))].map(async (organizationId) => {
      const claim = claims.find((candidate) => String(candidate.organizationId) === organizationId)!;
      const profile = await foundation.organizations.profiles.getByOrganizationId(claim.organizationId);
      return [organizationId, profile?.displayName ?? "Organization"] as const;
    }),
  );
  const profileNames = new Map(profileEntries);
  const canAdjudicate = access.authority.effectivePermissions.includes(
    "organization.claim.adjudicate" as (typeof access.authority.effectivePermissions)[number],
  );

  return (
    <main className={styles.page}>
      <aside className={styles.sidebar}>
        <Link href="/" className={styles.wordmark}><span>RF</span>xchange<sup>™</sup></Link>
        <nav aria-label="Administrative navigation">
          <span className={styles.active}>Organization claims</span>
          <Link href="/organization-profile">Participant account</Link>
        </nav>
        <div className={styles.scope}>
          <span>Authority</span>
          <strong>{String(access.account.administratorId)}</strong>
          <small>Scope: {access.authority.scope.resolved}</small>
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
            <strong>{access.permission}</strong>
          </div>
        </header>

        <section className={styles.filters} aria-label="Organization claims summary">
          <div className={styles.filterList}>
            {OPEN_CLAIM_STATUSES.map((status) => (
              <span key={status}>{readable(status)}</span>
            ))}
          </div>
        </section>

        <div className={styles.columns}>
          <section className={styles.queue} id="queue">
            <div className={styles.sectionHeading}>
              <div>
                <span>{claims.length} open {claims.length === 1 ? "record" : "records"}</span>
                <h2>Live authority claims</h2>
              </div>
              <strong>{canAdjudicate ? "Adjudication authority granted" : "Read-only authority"}</strong>
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
                <p>The live authority-claim repository currently contains no non-terminal records.</p>
              </div>
            )}
          </section>

          <section className={styles.review}>
            <div className={styles.reviewHeader}>
              <div>
                <p>Runtime convergence</p>
                <h2>Protected administrative surface</h2>
              </div>
              <span>{canAdjudicate ? "Read + adjudicate" : "Read only"}</span>
            </div>
            <div className={styles.evidence}>
              <h3>Access boundary</h3>
              <p>
                This route is resolved from the authenticated Firebase subject to a persisted
                platform-administrator account, privileged security state, authority context, and
                explicit permission. Ordinary participants and direct anonymous URL requests cannot
                render this workspace.
              </p>
              <p>
                Private claim evidence is intentionally not rendered by this list surface. Access
                to restricted organization documents requires its own minimum-necessary permission.
              </p>
            </div>
          </section>
        </div>
      </section>
    </main>
  );
}
