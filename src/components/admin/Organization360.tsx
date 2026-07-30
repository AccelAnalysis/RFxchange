"use client";

import Link from "next/link";
import { useState } from "react";

import type {
  Organization360Projection,
  Organization360TabKey,
} from "../../application/admin/organization-360";

import styles from "./Organization360.module.css";

export interface Organization360Props {
  readonly projection: Organization360Projection;
}

function label(value: string): string {
  return value
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export function Organization360({ projection }: Organization360Props) {
  const [activeTab, setActiveTab] = useState<Organization360TabKey>("overview");
  const current = projection.tabs.find((tab) => tab.key === activeTab);
  const exceptional = projection.header.accountAccess !== "active";

  return (
    <section
      className={styles.workspace}
      data-organization-scope={projection.scope.organizationId}
    >
      <header className={`${styles.header} ${exceptional ? styles.exceptional : ""}`}>
        <div className={styles.scope}>
          <p>Organization scope</p>
          <h1>{projection.scope.displayName}</h1>
          <code>{projection.scope.organizationId}</code>
        </div>
        <div className={styles.accessState}>
          <span aria-hidden="true">{exceptional ? "!" : "✓"}</span>
          <div>
            <small>Account & access</small>
            <strong>{label(projection.header.accountAccess)}</strong>
          </div>
        </div>

        <dl className={styles.statusGrid}>
          <div>
            <dt>Profile</dt>
            <dd>{label(projection.header.profileCompletion)}</dd>
          </div>
          <div>
            <dt>Map marker</dt>
            <dd>{label(projection.header.markerActivation)}</dd>
          </div>
          <div>
            <dt>Verification</dt>
            <dd>{label(projection.header.verification)}</dd>
          </div>
          <div>
            <dt>Official provider</dt>
            <dd>{label(projection.header.officialProvider)}</dd>
          </div>
          <div>
            <dt>Commercial</dt>
            <dd>
              {label(projection.header.commercial.planKey)}
              {projection.header.commercial.foundingRecognition
                ? " · Founding recognition"
                : ""}
            </dd>
          </div>
          <div>
            <dt>Primary geography</dt>
            <dd>
              {projection.header.primaryGeography.name} ·{" "}
              {label(projection.header.primaryGeography.releaseState)}
            </dd>
          </div>
        </dl>

        {projection.header.investigation === "active" ? (
          <div className={styles.caseBanner}>
            <div>
              <strong>Active investigation / integrity context</strong>
              <p>
                Restriction and investigation state remain separate from Verification,
                provider, and commercial facts.
              </p>
            </div>
            {projection.header.governingCase?.visible &&
            projection.header.governingCase.href ? (
              <Link href={projection.header.governingCase.href}>
                Open {projection.header.governingCase.caseNumber}
              </Link>
            ) : (
              <span>Case detail requires additional permission</span>
            )}
          </div>
        ) : null}
      </header>

      <div className={styles.body}>
        <nav className={styles.tabs} aria-label="Organization 360 contexts">
          {projection.tabs.map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveTab(tab.key)}
              aria-current={activeTab === tab.key ? "page" : undefined}
              disabled={tab.state === "restricted"}
              data-organization-id={tab.organizationId}
            >
              <span>{tab.label}</span>
              <small>
                {tab.state === "restricted"
                  ? "Restricted"
                  : tab.count && tab.count > 0
                    ? tab.count
                    : tab.state === "empty"
                      ? "Empty"
                      : "View"}
              </small>
            </button>
          ))}
        </nav>

        <main className={styles.content}>
          <div className={styles.contentHeading}>
            <div>
              <p>Scoped context · {projection.scope.displayName}</p>
              <h2>{current?.label ?? "Overview"}</h2>
            </div>
            <span>{projection.scope.organizationId}</span>
          </div>

          {activeTab === "overview" ? (
            <>
              <div className={styles.metrics}>
                <div>
                  <strong>{projection.overview.activeMemberships}</strong>
                  <span>Active users</span>
                </div>
                <div>
                  <strong>{projection.overview.capabilities}</strong>
                  <span>Capabilities</span>
                </div>
                <div>
                  <strong>{projection.overview.serviceGeographies}</strong>
                  <span>Service geographies</span>
                </div>
              </div>
              <section className={styles.summary}>
                <div>
                  <p>Public location</p>
                  <strong>
                    {projection.overview.publicLocationVisibility
                      ? label(projection.overview.publicLocationVisibility)
                      : "Not available"}
                  </strong>
                </div>
                <div>
                  <p>Private location detail</p>
                  <strong>
                    {projection.overview.privateLocation.visible
                      ? projection.overview.privateLocation.addressLine1
                      : "Hidden · minimum-necessary permission required"}
                  </strong>
                </div>
                <div>
                  <p>Founding / payment</p>
                  <strong>Commercial fact only · no credibility effect</strong>
                </div>
              </section>
            </>
          ) : current?.state === "empty" ? (
            <section className={styles.empty}>
              <span aria-hidden="true">○</span>
              <h3>No stage-appropriate records yet.</h3>
              <p>
                This context preserves the selected organization scope without
                fabricating future-domain data.
              </p>
            </section>
          ) : (
            <section className={styles.empty}>
              <span aria-hidden="true">↗</span>
              <h3>{current?.label} is available in this organization scope.</h3>
              <p>
                Queries and follow-on actions remain bound to{" "}
                <code>{projection.scope.organizationId}</code>.
              </p>
            </section>
          )}
        </main>
      </div>
    </section>
  );
}
