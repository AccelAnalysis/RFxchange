import Link from "next/link";

import { BrandWordmark } from "@/src/components/brand/BrandWordmark";
import { LanguageSwitcher } from "@/src/components/i18n/LanguageSwitcher";
import { getRequestDictionary } from "@/src/i18n/server";

import responsive from "./MarketingChromeResponsive.module.css";
import styles from "./MarketingSite.module.css";

export async function MarketingHeader() {
  const { dictionary } = await getRequestDictionary();
  const navigation = [
    { href: "/how-it-works", label: dictionary.marketing.nav.howItWorks },
    { href: "/businesses", label: dictionary.marketing.nav.businesses },
    { href: "/buyers", label: dictionary.marketing.nav.buyers },
    { href: "/resource-providers", label: dictionary.marketing.nav.resourceProviders },
    { href: "/founding", label: dictionary.marketing.footer.foundingMembership },
    { href: "/about", label: dictionary.marketing.nav.about },
  ] as const;

  return (
    <header className={styles.header}>
      <nav className={`${styles.nav} ${responsive.nav}`} aria-label={dictionary.marketing.nav.ariaLabel}>
        <BrandWordmark />
        <div className={`${styles.navLinks} ${responsive.desktopLinks}`}>
          {navigation.map((item) => (
            <Link href={item.href} key={item.href}>{item.label}</Link>
          ))}
        </div>
        <details className={responsive.navMenu}>
          <summary>{dictionary.marketing.footer.explore}</summary>
          <div className={responsive.navMenuLinks}>
            {navigation.map((item) => (
              <Link href={item.href} key={item.href}>{item.label}</Link>
            ))}
          </div>
        </details>
        <div className={styles.navActions}>
          <LanguageSwitcher />
          <Link className={styles.buttonLight} href="/signin">
            {dictionary.common.actions.signIn}
          </Link>
          <Link className={styles.buttonGold} href="/join">
            {dictionary.common.actions.joinFree}
          </Link>
        </div>
      </nav>
    </header>
  );
}

export async function MarketingFooter() {
  const { dictionary } = await getRequestDictionary();

  return (
    <footer className={styles.footer}>
      <div className={styles.footerGrid}>
        <div className={styles.footerBrand}>
          <BrandWordmark compact onDark />
          <p>{dictionary.marketing.footer.summary}</p>
          <p><strong>{dictionary.marketing.footer.byline}</strong></p>
        </div>
        <div className={styles.footerCol}>
          <h3>{dictionary.marketing.footer.explore}</h3>
          <Link href="/how-it-works">{dictionary.marketing.nav.howItWorks}</Link>
          <Link href="/businesses">{dictionary.marketing.nav.businesses}</Link>
          <Link href="/buyers">{dictionary.marketing.nav.buyers}</Link>
          <Link href="/resource-providers">{dictionary.marketing.nav.resourceProviders}</Link>
          <Link href="/founding">{dictionary.marketing.footer.foundingMembership}</Link>
        </div>
        <div className={styles.footerCol}>
          <h3>{dictionary.marketing.footer.organization}</h3>
          <Link href="/about">{dictionary.marketing.footer.about}</Link>
          <Link href="/join">{dictionary.common.actions.joinFree}</Link>
          <Link href="/signin">{dictionary.common.actions.signIn}</Link>
          <Link href="/image-credits">{dictionary.marketing.footer.imageCredits}</Link>
        </div>
        <div className={styles.footerCol}>
          <h3>{dictionary.marketing.footer.bottomMatter}</h3>
          <Link href="/terms">{dictionary.marketing.footer.terms}</Link>
          <Link href="/privacy">{dictionary.marketing.footer.privacy}</Link>
          <Link href="/platform-rules">{dictionary.marketing.footer.rules}</Link>
          <Link href="/accessibility">{dictionary.marketing.footer.accessibility}</Link>
        </div>
      </div>
      <div className={styles.footerBottom}>
        <span>{dictionary.marketing.footer.copyright}</span>
        <span>{dictionary.marketing.footer.tagline}</span>
      </div>
    </footer>
  );
}
