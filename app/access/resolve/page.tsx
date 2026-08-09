import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { SignOutButton } from "@/src/components/auth/SignOutButton";
import { organizationId } from "@/src/domain/organizations/model";
import {
  RFXCHANGE_SESSION_COOKIE_NAME,
  resolveParticipantRoute,
} from "@/src/infrastructure/auth/participant-route-runtime";
import {
  PARTICIPANT_ACCESS_RESOLUTION_PATH,
  participantEntryDestination,
} from "@/src/infrastructure/auth/participant-route-destination";
import {
  createServerFirestoreFoundationRepositories,
  getServerFirestore,
} from "@/src/infrastructure/firestore/runtime";
import { getRequestDictionary } from "@/src/i18n/server";

import styles from "./page.module.css";

interface AccessResolvePageProps {
  readonly searchParams?: Promise<Readonly<Record<string, string | string[] | undefined>>>;
}

function first(value: string | string[] | undefined): string | null {
  if (typeof value === "string" && value.trim()) return value.trim();
  if (Array.isArray(value) && value[0]?.trim()) return value[0].trim();
  return null;
}

export default async function AccessResolvePage({ searchParams }: AccessResolvePageProps) {
  const params = searchParams ? await searchParams : {};
  const requestedOrganizationId = first(params.organizationId);
  const cookieStore = await cookies();
  const access = await resolveParticipantRoute({
    sessionCookie: cookieStore.get(RFXCHANGE_SESSION_COOKIE_NAME)?.value,
    requestedOrganizationId,
  });

  if (access.kind === "unauthenticated") {
    const returnTo = requestedOrganizationId
      ? `${PARTICIPANT_ACCESS_RESOLUTION_PATH}?organizationId=${encodeURIComponent(requestedOrganizationId)}`
      : PARTICIPANT_ACCESS_RESOLUTION_PATH;
    redirect(`/signin?returnTo=${encodeURIComponent(returnTo)}`);
  }
  if (access.kind === "activation-required") {
    redirect(participantEntryDestination(access));
  }
  if (access.kind === "restricted") {
    redirect(`/join?access=${encodeURIComponent(access.restrictionState)}`);
  }
  if (access.kind === "wrong-organization") {
    redirect(PARTICIPANT_ACCESS_RESOLUTION_PATH);
  }
  if (access.kind === "authorized") {
    redirect(access.state.controlledPlatformUrl ?? "/geography/canvas");
  }

  const { dictionary } = await getRequestDictionary();
  const copy = dictionary.recovery;
  const foundation = createServerFirestoreFoundationRepositories(getServerFirestore());
  const organizations = await Promise.all(access.options.map(async (option) => {
    const profile = await foundation.organizations.profiles.getByOrganizationId(
      organizationId(option.organizationId),
    );
    return Object.freeze({
      ...option,
      displayName: profile?.displayName ?? copy.organizationFallback.replace("{id}", option.organizationId),
      selected: access.selectedOrganizationId === option.organizationId,
    });
  }));

  const accountResolution = access.reason === "account-resolution";

  return (
    <main className={styles.page}>
      <section className={styles.card} aria-labelledby="access-resolution-title">
        <p className={styles.eyebrow}>{copy.accessEyebrow}</p>
        <h1 id="access-resolution-title">
          {accountResolution ? copy.accountTitle : copy.organizationTitle}
        </h1>
        <p className={styles.lede}>
          {accountResolution ? copy.accountBody : copy.organizationBody}
        </p>
        <p className={styles.supporting}>
          {accountResolution ? copy.accountNext : copy.organizationBoundary}
        </p>

        {!accountResolution ? (
          <section className={styles.memberships} aria-labelledby="active-memberships-title">
            <h2 id="active-memberships-title">{copy.activeMemberships}</h2>
            <ul>
              {organizations.map((organization) => (
                <li key={organization.membershipId} data-selected={organization.selected || undefined}>
                  <div>
                    <strong>{organization.displayName}</strong>
                    <small>{organization.organizationId}</small>
                  </div>
                  {organization.selected ? (
                    <span className={styles.selected}>{copy.selectedOrganization}</span>
                  ) : (
                    <Link
                      className={styles.select}
                      href={`${PARTICIPANT_ACCESS_RESOLUTION_PATH}?organizationId=${encodeURIComponent(organization.organizationId)}`}
                    >
                      {copy.selectOrganization}
                    </Link>
                  )}
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        <div className={styles.actions}>
          <Link className={styles.primary} href="/">{copy.home}</Link>
          <SignOutButton className={styles.secondary} />
        </div>
      </section>
    </main>
  );
}
