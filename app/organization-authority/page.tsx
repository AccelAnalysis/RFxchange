import {
  OperationalWorkspace,
  ParticipantShell,
} from "@/src/components/participant/ParticipantWorkspace";

import styles from "./page.module.css";

const pathways = [
  ["Domain email", "Verify an address on the organization’s business domain."],
  ["Administrator invitation", "Accept an invitation from an existing authorized administrator."],
  ["Organization document", "Submit private evidence through the controlled document boundary."],
  ["Administrative review", "Request evidence-based review when automated paths are not available."],
] as const;

export default function OrganizationAuthorityPage() {
  return (
    <ParticipantShell activeItem="Account">
      <OperationalWorkspace ariaLabel="Organization authority workspace">
        <section className={styles.layout}>
          <div className={styles.intro}>
            <p className={styles.eyebrow}>Organization resolved</p>
            <h1>Establish your authority to manage Harborlight Fabrication.</h1>
            <p>
              Resolution found the organization record. This step establishes your management
              relationship. It does not make the organization Verified.
            </p>
            <div className={styles.separation}>
              <strong>Authority ≠ Verification</strong>
              <span>Verification remains not evaluated after authority is approved.</span>
            </div>
          </div>
          <div className={styles.pathways} aria-label="Approved authority pathways">
            <div className={styles.pathwayHeader}>
              <div>
                <p className={styles.eyebrow}>Choose one pathway</p>
                <h2>How can you establish authority?</h2>
              </div>
              <span>Portsmouth, VA</span>
            </div>
            {pathways.map(([title, description], index) => (
              <button className={styles.pathway} type="button" key={title}>
                <span className={styles.number}>{String(index + 1).padStart(2, "0")}</span>
                <span>
                  <strong>{title}</strong>
                  <small>{description}</small>
                </span>
                <span aria-hidden="true">→</span>
              </button>
            ))}
            <p className={styles.privacy}>
              Documents and review evidence stay private. They are not added to the public profile.
            </p>
          </div>
        </section>
      </OperationalWorkspace>
    </ParticipantShell>
  );
}
