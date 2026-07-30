import type { createPortsmouthOrganizationResolutionPreview } from "../../data/organization-resolution/portsmouth-resolution-preview.ts";

import styles from "./OrganizationResolutionPanel.module.css";

type OrganizationResolutionPreviewModel = ReturnType<
  typeof createPortsmouthOrganizationResolutionPreview
>;

export function OrganizationResolutionPanel({
  model,
}: Readonly<{ model: OrganizationResolutionPreviewModel }>) {
  const candidate = model.candidates[0];
  return (
    <section
      className={styles.panel}
      id="organization-resolution"
      aria-labelledby="organization-resolution-title"
    >
      <div className={styles.progress}>
        <span>Organization resolution</span>
        <strong>01 / 03</strong>
      </div>

      <div className={styles.intro}>
        <p className={styles.eyebrow}>Continue as an organization</p>
        <h1 id="organization-resolution-title">Find the right organization record.</h1>
        <p>
          We use your entered name and selected locality to avoid duplicate
          organization identities.
        </p>
      </div>

      <form className={styles.search} action="/organization-resolution" method="get">
        <label htmlFor="organization-name">Organization name</label>
        <div>
          <input
            id="organization-name"
            name="name"
            defaultValue={model.provisionalIdentity.displayName}
            autoComplete="organization"
          />
          <button type="submit">Search</button>
        </div>
        <small>Searching in the server-authorized {model.geographyName} locality</small>
      </form>

      <article className={styles.seededProfile}>
        <div className={styles.profileHeading}>
          <div className={styles.monogram} aria-hidden="true">
            HF
          </div>
          <div>
            <span className={styles.status}>{model.publicProfile.status}</span>
            <h2>{model.publicProfile.displayName}</h2>
            <p>
              {model.publicProfile.locality}, {model.publicProfile.region}
            </p>
          </div>
        </div>
        <div className={styles.categories}>
          {model.publicProfile.categories.map((category) => (
            <span key={category}>{category}</span>
          ))}
        </div>
        <p className={styles.provenance}>
          Seed source: {model.publicProfile.provenanceLabel}
        </p>
        <a
          className={styles.claim}
          href={`?intent=claim&organization=${model.publicProfile.organizationId}#organization-matches`}
        >
          Claim this organization
        </a>
      </article>

      <div className={styles.matches} id="organization-matches">
        <div className={styles.matchesHeader}>
          <div>
            <span>Likely match</span>
            <h2>Review before you continue</h2>
          </div>
          <strong>{model.candidates.length}</strong>
        </div>
        {candidate ? (
          <article className={styles.matchCard}>
            <div>
              <h3>{candidate.displayName}</h3>
              <p>
                {candidate.evidence.map((item) => item.explanation).join(" · ")}
              </p>
            </div>
            <a
              href={`?decision=existing&organization=${candidate.organizationId}#resolution-decision`}
            >
              This is my organization
            </a>
          </article>
        ) : (
          <p>No likely organization matches were found.</p>
        )}
        <a
          className={styles.create}
          href="?decision=create#resolution-decision"
        >
          None of these — create this organization
        </a>
      </div>

      <aside className={styles.boundary} id="resolution-decision">
        <span>Resolution is not authority</span>
        <p>
          Selecting or creating a record preserves your organization intent.
          Management authority is established in the next controlled step.
        </p>
      </aside>
    </section>
  );
}
