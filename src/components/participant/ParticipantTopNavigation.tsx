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
}: Readonly<{ activeItem?: ParticipantNavigationItem }>) {
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
    </>
  );
}

export function ParticipantTopNavigation({
  activeItem,
}: Readonly<{ activeItem?: ParticipantNavigationItem }>) {
  const { t } = useI18n();
  return (
    <NavigationFrame
      className={b2Styles.navigation}
      brand={<BrandWordmark compact />}
      desktopNavigation={<NavigationItems activeItem={activeItem} />}
      mobileNavigation={<NavigationItems activeItem={activeItem} />}
      mobileLabel={t("participantNavigation.menu")}
      navigationLabel={t("participantNavigation.ariaLabel")}
    />
  );
}
