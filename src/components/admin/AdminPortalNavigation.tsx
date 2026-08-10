"use client";

import Link from "next/link";

import type { ImplementedAdminRuntimeDestinationKey } from "../../application/admin/portal-navigation";
import { useI18n } from "../i18n/I18nProvider";

import styles from "./AdminPortalShell.module.css";

export interface AdminPortalNavigationProps {
  readonly destinations: readonly Readonly<{
    navigationId: string;
    key: ImplementedAdminRuntimeDestinationKey;
    labelKey: "organizationClaims" | "resourceProviders";
    description: string;
    href: `/admin/${string}`;
    scopeValue: string;
    scopeTargetId: string | null;
  }>[];
  readonly currentDestination?: ImplementedAdminRuntimeDestinationKey;
  readonly currentScope?: string;
}

export function AdminPortalNavigation({ destinations, currentDestination, currentScope }: AdminPortalNavigationProps) {
  const { t } = useI18n();

  return (
    <nav aria-label={t("participantNavigation.adminAriaLabel")} className={styles.navigation}>
      <div className={styles.heading}>
        <span>RFxchange</span>
        <strong>{t("participantNavigation.administration")}</strong>
      </div>
      <ul>
        {destinations.map((destination) => (
          <li key={destination.navigationId}>
            <Link
              href={destination.href}
              aria-current={
                currentDestination === destination.key && currentScope === destination.scopeValue
                  ? "page"
                  : undefined
              }
              title={destination.description}
            >
              <span>{t(`participantNavigation.${destination.labelKey}`)}</span>
              {destination.scopeTargetId ? <small>{destination.scopeTargetId}</small> : null}
            </Link>
          </li>
        ))}
      </ul>
      <Link className={styles.participantAccount} href="/organization-profile">
        {t("participantNavigation.participantAccount")}
      </Link>
    </nav>
  );
}
