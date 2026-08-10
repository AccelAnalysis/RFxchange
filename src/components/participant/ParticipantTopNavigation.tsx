"use client";

import Link from "next/link";

import { BrandWordmark } from "../brand/BrandWordmark";
import { useI18n } from "../i18n/I18nProvider";
import { NavigationFrame } from "../ui";

import b2Styles from "./ParticipantWorkspaceB2.module.css";

export type ParticipantNavigationItem =
  | "Network"
  | "Referrals"
  | "Resources"
  | "Quick Start"
  | "Account";

const primaryNavigation = [
  { id: "Network", labelKey: "network", href: "/geography/canvas" },
  { id: "Referrals", labelKey: "referrals", href: "/referrals" },
  { id: "Resources", labelKey: "resources", href: "/resources" },
  { id: "Quick Start", labelKey: "quickStart", href: "/quick-start" },
] as const;

function NavigationItems({
  activeItem,
  administrationHref,
}: Readonly<{ activeItem?: ParticipantNavigationItem; administrationHref?: string }>) {
  const { t } = useI18n();
  return (
    <>
      {primaryNavigation.map((item) => (
        <Link
          key={item.id}
          href={item.href}
          aria-current={activeItem === item.id ? "page" : undefined}
        >
          {t(`participantNavigation.${item.labelKey}`)}
        </Link>
      ))}
      <Link
        href="/organization-profile"
        aria-current={activeItem === "Account" ? "page" : undefined}
      >
        {t("participantNavigation.account")}
      </Link>
      {administrationHref ? (
        <Link href={administrationHref}>
          {t("participantNavigation.administration")}
        </Link>
      ) : null}
    </>
  );
}

export function ParticipantTopNavigation({
  activeItem,
  administrationHref,
}: Readonly<{ activeItem?: ParticipantNavigationItem; administrationHref?: string }>) {
  const { t } = useI18n();
  return (
    <NavigationFrame
      className={b2Styles.navigation}
      brand={<BrandWordmark compact />}
      desktopNavigation={<NavigationItems activeItem={activeItem} administrationHref={administrationHref} />}
      mobileNavigation={<NavigationItems activeItem={activeItem} administrationHref={administrationHref} />}
      mobileLabel={t("participantNavigation.menu")}
      navigationLabel={t("participantNavigation.ariaLabel")}
    />
  );
}
