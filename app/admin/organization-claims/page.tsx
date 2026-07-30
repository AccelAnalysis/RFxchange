import Link from "next/link";

import styles from "./page.module.css";

const filters = [
  "Seeded", "Unclaimed", "Claimed", "Active", "Incomplete", "Verification pending",
  "Verified", "Provider", "Issuer", "Duplicate", "Restricted", "Suspended",
  "Terminated", "Geography",
] as const;

const workflow = [
  "Claim submitted",
  "Evidence requested",
  "Existing administrator notified",
  "Evidence compared",
  "Authorized admin decision",
  "Membership assigned or rejected",
  "Decision and audit evidence recorded",
] as const;

export default function OrganizationClaimsAdminPage() {
  return (
    <main className={styles.page}>
      <aside className={styles.sidebar}>
        <Link href="/" className={styles.wordmark}><span>RF</span>xchange<sup>™</sup></Link>
        <nav aria-label="Administrative navigation">
          <a href="#queue" className={styles.active}>Organization claims</a>
          <a href="#scope">Scope & permissions</a>
          <a href="#evidence">Private evidence</a>
          <a href="#audit">Audit history</a>
        </nav>
        <div className={styles.scope}>
          <span>Current scope</span>
          <strong>Portsmouth, VA</strong>
          <small>Organization claim review</small>
        </div>
      </aside>
      <section className={styles.workspace}>
        <header className={styles.header}>
          <div>
            <p>Administration · organizations</p>
            <h1>Claims & authority</h1>
          </div>
          <div className={styles.adminIdentity}>
            <span>Scoped administrator</span>
            <strong>Claims Operations</strong>
          </div>
        </header>
        <section className={styles.filters} aria-label="Organization claims filters">
          <label>
            <span>Search organizations or claim IDs</span>
            <input type="search" defaultValue="Harborlight Fabrication" />
          </label>
          <div className={styles.filterList}>
            {filters.map((filter, index) => (
              <button type="button" className={index === 9 ? styles.selectedFilter : ""} key={filter}>
                {filter}
              </button>
            ))}
          </div>
        </section>
        <div className={styles.columns}>
          <section className={styles.queue} id="queue">
            <div className={styles.sectionHeading}>
              <div><span>2 records</span><h2>Potential duplicate claims</h2></div>
              <strong>Evidence review required</strong>
            </div>
            <article className={styles.claimRow} aria-current="true">
              <div className={styles.monogram}>HF</div>
              <div>
                <h3>Harborlight Fabrication</h3>
                <p>Portsmouth, VA · Claim CLM-2048</p>
              </div>
              <span>Conflict</span>
            </article>
            <article className={styles.claimRow}>
              <div className={styles.monogram}>HF</div>
              <div>
                <h3>Harborlight Fabrication LLC</h3>
                <p>Portsmouth, VA · Claim CLM-1984</p>
              </div>
              <span>Existing claim</span>
            </article>
            <div className={styles.identityNote}>
              <strong>History is preserved.</strong>
              <p>Adjudication changes claim and membership state; it does not merge or replace organization history.</p>
            </div>
          </section>
          <section className={styles.review}>
            <div className={styles.reviewHeader}>
              <div>
                <p>Case CLM-2048 · Organization ORG-1842</p>
                <h2>Authority conflict review</h2>
              </div>
              <span>Verification: Not evaluated</span>
            </div>
            <div className={styles.evidence} id="evidence">
              <h3>Evidence comparison</h3>
              <div>
                <span>Claimant evidence</span>
                <strong>Virginia SCC authoritative record</strong>
                <small>Verified · restricted reference only</small>
              </div>
              <div>
                <span>Existing authority</span>
                <strong>Administrator invitation history</strong>
                <small>Notification sent · response recorded</small>
              </div>
              <p>Sensitive documents remain private and require explicit evidence-read authority.</p>
            </div>
            <ol className={styles.timeline}>
              {workflow.map((step, index) => (
                <li key={step} data-complete={index < 4}>
                  <span>{index < 4 ? "Complete" : index === 4 ? "Current" : "Pending"}</span>
                  <strong>{step}</strong>
                </li>
              ))}
            </ol>
            <div className={styles.decision} id="audit">
              <label>
                <span>Decision rationale</span>
                <textarea defaultValue="Compare authoritative ownership evidence and the existing administrator response before assigning membership." />
              </label>
              <div>
                <button type="button" className={styles.deny}>Deny claim</button>
                <button type="button" className={styles.approve}>Approve authority</button>
              </div>
              <p>Approval requires recent re-authentication and creates immutable before/after audit evidence.</p>
            </div>
          </section>
        </div>
      </section>
    </main>
  );
}
