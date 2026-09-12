import Link from "next/link";
import { BrandWordmark } from "./BrandWordmark";
import { LanguageSwitcher } from "../i18n/LanguageSwitcher";
import { getRequestDictionary } from "../../i18n/server";
import { applicationOrigins } from "../../application/platform/application-origins";
import styles from "./PublicExchangeChrome.module.css";

export async function PublicExchangeHeader() {
  const { dictionary } = await getRequestDictionary();
  return <header className={styles.header}>
    <BrandWordmark />
    <nav aria-label={dictionary.marketing.nav.ariaLabel}>
      <LanguageSwitcher />
      <Link href="/signin">{dictionary.common.actions.signIn}</Link>
      <Link className={styles.primary} href="/join">{dictionary.common.actions.joinFree}</Link>
    </nav>
  </header>;
}

export async function PublicExchangeFooter() {
  const { dictionary } = await getRequestDictionary();
  return <footer className={styles.footer}>
    <span>{dictionary.marketing.footer.copyright}</span>
    <nav aria-label={dictionary.marketing.footer.bottomMatter}>
      <a href={`${applicationOrigins.marketing}/terms`}>{dictionary.marketing.footer.terms}</a>
      <a href={`${applicationOrigins.marketing}/privacy`}>{dictionary.marketing.footer.privacy}</a>
      <a href={`${applicationOrigins.marketing}/accessibility`}>{dictionary.marketing.footer.accessibility}</a>
    </nav>
  </footer>;
}
