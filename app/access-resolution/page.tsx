import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { organizationId } from "@/src/domain/organizations/model";
import {
  RFXCHANGE_SESSION_COOKIE_NAME,
  resolveParticipantRoute,
} from "@/src/infrastructure/auth/participant-route-runtime";
import {
  createServerFirestoreFoundationRepositories,
  getServerFirestore,
} from "@/src/infrastructure/firestore/runtime";
import { getRequestDictionary } from "@/src/i18n/server";

import styles from "./page.module.css";

interface AccessResolutionPageProps {
  readonly searchParams?: Promise<Readonly<Record<string, string | string[] | undefined>>>;
}

function single(value: string | string[] | undefined): string | null {
  if (typeof value === "string" && value.trim()) return value.trim();
  if (Array.isArray(value) && typeof value[0] === "string" && value[0].trim()) {
    return value[0].trim();
  }
  return null;
}

export default async function AccessResolutionPage({ searchParams }: AccessResolutionPageProps) {
  const params = searchParams ? await searchParams : {};
  const requestedOrganizationId = single(params.organization);
  const resolutionUrl = requestedOrganizationId
    ? `/access-resolution?organization=${encodeURIComponent(requestedOrganizationId)}`
    : "/access-resolution";
  const cookieStore = await cookies();
  const access = await resolveParticipantRoute({
    sessionCookie: cookieStore.get(RFXCHANGE_SESSION_COOKIE_NAME)?.value,
    requestedOrganizationId,
  });

  if (access.kind === "unauthenticated") {
    redirect(`/signin?returnTo=${encodeURIComponent(resolutionUrl)}`);
  }
  if (access.kind === "activation-required") redirect("/join");
  if (access.kind === "wrong-organization") {
    redirect(access.state.controlledPlatformUrl ?? "/join");
  }
  if (access.kind === "restricted") {
    redirect(`/join?access=${encodeURIComponent(access.restrictionState)}`);
  }
  if (access.kind === "authorized") {
    redirect(access.state.controlledPlatformUrl ?? "/geography/canvas");
  }

  const { dictionary } = await getRequestDictionary();
  const copy = dictionary.accessResolution;
  const foundation = createServerFirestoreFoundationRepositories(getServerFirestore());
  const options = await Promise.all(
    access.options.map(async (option, index) => {
      const profile = await foundation.organizations.profiles.getByOrganizationId(
        organizationId(option.organizationId),
      );
      return Object.freeze({
        ...option,
        displayName: profile?.displayName ?? copy.optionFallback.replace("{number}", String(index + 1)),
      });
    }),
  );
  const selected = access.selectedOrganizationId
    ? options.find((option) => option.organizationId === access.selectedOrganizationId) ?? null
    : null;

  return (
    <main className={styles.page}>
      <div className={styles.shell}>
        <section className={styles.card} aria-labelledby="access-resolution-title">
          <p className={styles.eyebrow}>{copy.eyebrow}</p>
          <h1 id="access-resolution-title">{copy.title}</h1>

          <div className={styles.section}>
            <h2>
              {access.reason === "account-resolution"
                ? copy.accountTitle
                : copy.organizationTitle}
            </h2>
            <p>
              {access.reason === "account-resolution"
                ? copy.accountBody
                : copy.organizationBody}
            </p>

            {options.length > 0 ? (
              <div className={styles.options} aria-label={copy.organizationTitle}>
                {options.map((option) => {
                  const isSelected = option.organizationId === access.selectedOrganizationId;
                  return (
                    <Link
                      key={option.membershipId}
                      className={styles.option}
                      data-selected={isSelected}
                      href={`/access-resolution?organization=${encodeURIComponent(option.organizationId)}`}
                    >
                      <span className={styles.optionName}>
                        {option.displayName}
                        <small>{copy.activeMembership}</small>
                      </span>
                      <span className={styles.optionStatus}>
                        {isSelected ? copy.selected : copy.review}
                      </span>
                    </Link>
                  );
                })}
              </div>
            ) : null}

            {selected ? (
              <div className={styles.selected}>
                <h3>{copy.selectedTitle}</h3>
                <p>{copy.selectedBody}</p>
              </div>
            ) : null}
          </div>

          <div className={styles.actions}>
            <Link className={styles.primary} href={resolutionUrl}>{copy.recheck}</Link>
            <Link className={styles.secondary} href="/">{copy.home}</Link>
          </div>
          <p className={styles.boundary}>{copy.boundary}</p>
        </section>
      </div>
    </main>
  );
}
