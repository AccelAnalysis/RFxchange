import Link from "next/link";

import { BrandWordmark } from "@/src/components/brand/BrandWordmark";

import styles from "./MarketingSite.module.css";

export function MarketingHeader() {
  return (
    <header className={styles.header}>
      <nav className={styles.nav} aria-label="Primary marketing navigation">
        <BrandWordmark />
        <div className={styles.navLinks}>
          <Link href="/how-it-works">How It Works</Link>
          <Link href="/businesses">For Businesses</Link>
          <Link href="/buyers">For Buyers</Link>
          <Link href="/resource-providers">For Resource Providers</Link>
          <Link href="/about">About</Link>
        </div>
        <div className={styles.navActions}>
          <Link className={styles.buttonLight} href="/signin">Sign In</Link>
          <Link className={styles.buttonGold} href="/join">Join Free</Link>
        </div>
      </nav>
    </header>
  );
}

export function MarketingFooter() {
  return (
    <footer className={styles.footer}>
      <div className={styles.footerGrid}>
        <div className={styles.footerBrand}>
          <BrandWordmark compact onDark />
          <p>
            A local business growth network built to make capabilities, opportunities,
            resources, and business connections easier to discover and act on.
          </p>
        </div>
        <div className={styles.footerCol}>
          <h3>Explore</h3>
          <Link href="/how-it-works">How It Works</Link>
          <Link href="/businesses">For Businesses</Link>
          <Link href="/buyers">For Buyers</Link>
          <Link href="/resource-providers">For Resource Providers</Link>
          <Link href="/founding">Founding Membership</Link>
        </div>
        <div className={styles.footerCol}>
          <h3>Organization</h3>
          <Link href="/about">About RFxchange</Link>
          <Link href="/join">Join Free</Link>
          <Link href="/signin">Sign In</Link>
          <Link href="/image-credits">Image Credits</Link>
        </div>
        <div className={styles.footerCol}>
          <h3>Bottom Matter</h3>
          <Link href="/terms">Terms of Service</Link>
          <Link href="/privacy">Privacy Policy</Link>
          <Link href="/platform-rules">Platform Rules</Link>
          <Link href="/accessibility">Accessibility</Link>
        </div>
      </div>
      <div className={styles.footerBottom}>
        <span>© 2026 The RFxchange. A Hi-Coworking initiative.</span>
        <span>Visible · Connected · Actionable</span>
      </div>
    </footer>
  );
}
