import Link from "next/link";

import type { PublicPolicyDocument } from "../../content/legal";
import { BrandWordmark } from "../brand/BrandWordmark";

import styles from "./PublicPolicyPage.module.css";

export function PublicPolicyPage({ policy }: Readonly<{ policy: PublicPolicyDocument }>) {
  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <BrandWordmark />
        <nav aria-label="Policy navigation">
          <Link href="/terms">Terms</Link>
          <Link href="/platform-rules">Platform Rules</Link>
          <Link href="/privacy">Privacy</Link>
          <Link href="/join">Join</Link>
        </nav>
      </header>

      <article className={styles.document}>
        <p className={styles.eyebrow}>Current published policy</p>
        <h1>{policy.title}</h1>
        <div className={styles.meta}>
          <span>Version {policy.version}</span>
          <span>Effective {policy.effectiveDate}</span>
        </div>
        <p className={styles.summary}>{policy.summary}</p>

        <div className={styles.sections}>
          {policy.sections.map((section) => (
            <section key={section.heading}>
              <h2>{section.heading}</h2>
              {section.paragraphs?.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
              {section.bullets ? (
                <ul>
                  {section.bullets.map((bullet) => <li key={bullet}>{bullet}</li>)}
                </ul>
              ) : null}
            </section>
          ))}
        </div>

        <aside className={styles.notice}>
          <strong>Policy record</strong>
          <p>
            RFxchange may retain version and acknowledgement history for auditability. Material
            changes may require renewed acceptance or acknowledgement.
          </p>
        </aside>
      </article>

      <footer className={styles.footer}>
        <BrandWordmark compact />
        <nav aria-label="Legal links">
          <Link href="/terms">Terms of Service</Link>
          <Link href="/platform-rules">Platform Rules</Link>
          <Link href="/privacy">Privacy Policy</Link>
        </nav>
      </footer>
    </main>
  );
}
