"use client";

import { useState } from "react";

import type { ControlledLocalityMapModel } from "../../application/geography/controlled-locality-map";
import {
  ORGANIZATION_BUSINESS_OBJECTIVES,
  ORGANIZATION_PARTICIPATION_ROLES,
} from "../../domain/organization-profile/model";
import {
  ControlledLocalityCanvas,
  type ControlledLocalityPointOverlay,
} from "../map/ControlledLocalityCanvas";

import styles from "./EssentialProfilePanel.module.css";

const CONFIRMED_LOCATION: readonly ControlledLocalityPointOverlay[] = Object.freeze([
  Object.freeze({
    id: "harborlight-confirmed-location",
    position: [-76.297933263584, 36.835462854397] as const,
    label: "Harborlight private confirmed location",
    kind: "confirmed-location" as const,
  }),
]);

const ROLE_LABELS: Readonly<Record<string, string>> = Object.freeze({
  business: "Business",
  supplier: "Supplier",
  buyer: "Buyer",
  issuer: "Issuer",
  government: "Government",
  edo: "EDO",
  "resource-provider": "Resource Provider",
  chamber: "Chamber",
  lender: "Lender",
  university: "University",
  nonprofit: "Nonprofit",
  other: "Other",
});

const OBJECTIVE_LABELS: Readonly<Record<string, string>> = Object.freeze({
  "find-opportunities": "Find opportunities",
  "issue-opportunities": "Issue opportunities",
  "find-customers": "Find customers",
  "find-suppliers": "Find suppliers",
  "find-teammates": "Find teammates",
  "send-receive-referrals": "Send and receive referrals",
  "find-resources-support": "Find resources and support",
  "explore-local-network": "Explore the local network",
});

const STEPS = ["Identity", "Capability", "Network intent", "Complete"] as const;

function toggle(values: readonly string[], value: string): readonly string[] {
  return values.includes(value)
    ? values.filter((entry) => entry !== value)
    : [...values, value];
}

export function EssentialProfilePanel({
  mapModel,
}: Readonly<{ mapModel: ControlledLocalityMapModel }>) {
  const [step, setStep] = useState(0);
  const [roles, setRoles] = useState<readonly string[]>(["business", "supplier"]);
  const [objectives, setObjectives] = useState<readonly string[]>([
    "find-opportunities",
    "find-teammates",
  ]);

  return (
    <div className={styles.workspace}>
      <section className={styles.mapRegion} aria-label="Confirmed organization geography">
        <ControlledLocalityCanvas
          model={mapModel}
          headingLevel="h2"
          pointOverlays={CONFIRMED_LOCATION}
        />
        <p className={styles.mapNote}>
          Private administrator view · the confirmed diamond is not an activated network marker.
          Public visibility remains locality-only.
        </p>
      </section>

      <aside className={styles.sheet} aria-labelledby="profile-heading">
        <p className={styles.eyebrow}>Activation · essential profile</p>
        <h1 id="profile-heading">
          Give the network enough to make a useful connection.
        </h1>
        <p className={styles.lead}>
          Identity, capability, role and intent determine Profile Complete. Membership,
          Verification and paid status do not.
        </p>

        <ol className={styles.progress} aria-label="Essential profile progress">
          {STEPS.map((label, index) => (
            <li
              key={label}
              data-current={step === index}
              data-complete={step > index}
            >
              <span>{index + 1}</span>
              {label}
            </li>
          ))}
        </ol>

        <form
          className={styles.form}
          onSubmit={(event) => {
            event.preventDefault();
            setStep((current) => Math.min(STEPS.length - 1, current + 1));
          }}
        >
          {step === 0 ? (
            <fieldset>
              <legend>Minimum organization identity</legend>
              <label>
                Organization name
                <input name="displayName" defaultValue="Harborlight Fabrication" required />
              </label>
              <div className={styles.twoColumns}>
                <label>
                  Organization type
                  <select name="organizationType" defaultValue="for-profit-business" required>
                    <option value="for-profit-business">For-profit business</option>
                    <option value="government-entity">Government entity</option>
                    <option value="nonprofit-organization">Nonprofit organization</option>
                    <option value="educational-institution">Educational institution</option>
                    <option value="other">Other</option>
                  </select>
                </label>
                <label>
                  Website
                  <input
                    name="website"
                    type="url"
                    defaultValue="https://harborlight.example"
                    required
                  />
                </label>
              </div>
              <div className={styles.contactBlock}>
                <p>Main organization contact</p>
                <div className={styles.twoColumns}>
                  <label>
                    Contact name
                    <input name="contactName" defaultValue="Morgan Lee" required />
                  </label>
                  <label>
                    Organization role
                    <input name="contactRole" defaultValue="Operations Director" required />
                  </label>
                </div>
                <label>
                  Organization email
                  <input
                    name="contactEmail"
                    type="email"
                    defaultValue="operations@harborlight.example"
                    required
                  />
                </label>
                <label className={styles.checkbox}>
                  <input name="contactPublic" type="checkbox" />
                  Publish this organization contact on the public profile
                </label>
              </div>
            </fieldset>
          ) : null}

          {step === 1 ? (
            <fieldset>
              <legend>One meaningful capability</legend>
              <p className={styles.fieldIntro}>
                Be specific enough for discovery and team matching. Broad labels such as
                “business services” do not satisfy this requirement.
              </p>
              <label>
                Capability kind
                <select name="capabilityKind" defaultValue="service">
                  <option value="service">Service provided</option>
                  <option value="product">Product supplied</option>
                  <option value="function">Function performed</option>
                  <option value="buying-need">Buying or procurement need</option>
                  <option value="resource-provider-function">Resource-provider function</option>
                </select>
              </label>
              <label>
                Specific capability
                <input
                  name="capabilityName"
                  defaultValue="Precision marine metal fabrication"
                  required
                />
              </label>
              <label>
                Plain-language description
                <textarea
                  name="capabilityDescription"
                  defaultValue="Fabricates corrosion-resistant assemblies for marine and industrial equipment."
                  minLength={20}
                  required
                />
              </label>
              <p className={styles.taxonomyNote}>
                Capability discovery is primary. Detailed products, NAICS and credential
                enrichment remain optional later steps.
              </p>
            </fieldset>
          ) : null}

          {step === 2 ? (
            <>
              <fieldset>
                <legend>Participation roles</legend>
                <p className={styles.fieldIntro}>
                  Choose every role that genuinely applies. These labels guide product routing;
                  they do not grant issuer, buyer, provider or administrative authority.
                </p>
                <div className={styles.choiceGrid}>
                  {ORGANIZATION_PARTICIPATION_ROLES.map((role) => (
                    <label className={styles.choice} key={role}>
                      <input
                        type="checkbox"
                        checked={roles.includes(role)}
                        onChange={() => setRoles((current) => toggle(current, role))}
                      />
                      {ROLE_LABELS[role]}
                    </label>
                  ))}
                </div>
              </fieldset>
              <fieldset>
                <legend>Business objectives</legend>
                <p className={styles.fieldIntro}>
                  Objectives personalize later first-value pathways. They do not affect
                  credibility or neutral eligibility.
                </p>
                <div className={styles.choiceGrid}>
                  {ORGANIZATION_BUSINESS_OBJECTIVES.map((objective) => (
                    <label className={styles.choice} key={objective}>
                      <input
                        type="checkbox"
                        checked={objectives.includes(objective)}
                        onChange={() =>
                          setObjectives((current) => toggle(current, objective))
                        }
                      />
                      {OBJECTIVE_LABELS[objective]}
                    </label>
                  ))}
                </div>
              </fieldset>
            </>
          ) : null}

          {step === 3 ? (
            <section className={styles.milestone} aria-live="polite">
              <span>Active credential · automatically derived</span>
              <h2>Profile Complete</h2>
              <p>
                The required identity, contact, confirmed location, visibility, service
                geography, meaningful capability and participation role are present.
              </p>
              <ul>
                <li>Profile Complete is not Organization Verified.</li>
                <li>No buyer, issuer or resource-provider authority was granted.</li>
                <li>The organization marker remains inactive until Slice 2.8 conditions pass.</li>
              </ul>
            </section>
          ) : null}

          <div className={styles.actions}>
            {step > 0 && step < STEPS.length - 1 ? (
              <button
                type="button"
                className={styles.secondary}
                onClick={() => setStep((current) => Math.max(0, current - 1))}
              >
                Back
              </button>
            ) : null}
            {step < STEPS.length - 1 ? (
              <button type="submit" className={styles.primary}>
                {step === 2 ? "Save and evaluate profile" : "Continue"}
              </button>
            ) : null}
          </div>
        </form>

        <div className={styles.requirements} aria-label="Profile Complete requirements">
          <strong>Automatic completion gate</strong>
          <span>Identity + contact</span>
          <span>Meaningful capability</span>
          <span>Confirmed location + visibility</span>
          <span>Service geography + role</span>
        </div>
      </aside>
    </div>
  );
}
