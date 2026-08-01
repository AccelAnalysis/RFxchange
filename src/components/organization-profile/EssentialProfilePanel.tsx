"use client";

import { useState } from "react";

import type { ControlledLocalityMapModel } from "../../application/geography/controlled-locality-map";
import { ORGANIZATION_CAPABILITY_CATEGORIES } from "../../domain/organization-profile/model";
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

const CATEGORY_LABELS: Readonly<Record<string, string>> = Object.freeze({
  "professional-business-services": "Professional and business services",
  "construction-skilled-trades": "Construction and skilled trades",
  "manufacturing-fabrication": "Manufacturing and fabrication",
  "technology-data-cybersecurity": "Technology, data and cybersecurity",
  "transportation-logistics": "Transportation and logistics",
  "marketing-creative-services": "Marketing and creative services",
  "facilities-real-estate": "Facilities and real estate",
  "education-workforce-training": "Education and workforce training",
  "health-safety-security": "Health, safety and security",
  "food-hospitality-events": "Food, hospitality and events",
  other: "Other",
});

const STEPS = ["Review identity", "Capability", "Complete"] as const;

export function EssentialProfilePanel({
  mapModel,
}: Readonly<{ mapModel: ControlledLocalityMapModel }>) {
  const [step, setStep] = useState(0);
  const [category, setCategory] = useState("manufacturing-fabrication");

  return (
    <div className={styles.workspace}>
      <section className={styles.mapRegion} aria-label="Confirmed organization geography">
        <ControlledLocalityCanvas
          model={mapModel}
          pointOverlays={CONFIRMED_LOCATION}
        />
        <p className={styles.mapNote}>
          Private administrator view · the confirmed diamond is not an activated network marker.
          Public visibility remains locality-only.
        </p>
      </section>

      <aside className={styles.sheet} aria-labelledby="profile-heading">
        <p className={styles.eyebrow}>Activation · essential profile</p>
        <h1 id="profile-heading">Review what you entered and add one useful capability.</h1>
        <p className={styles.lead}>
          RFxchange carries organization identity and contact information forward. A specific
          capability completes the minimum profile; organization type, buyer/supplier labels, and
          business objectives are not registration gates.
        </p>

        <ol className={styles.progress} aria-label="Essential profile progress">
          {STEPS.map((label, index) => (
            <li key={label} data-current={step === index} data-complete={step > index}>
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
              <legend>Carried-forward organization information</legend>
              <p className={styles.fieldIntro}>
                Review the values captured earlier rather than entering them again.
              </p>
              <label>
                Organization name
                <input value="Harborlight Fabrication" readOnly />
              </label>
              <div className={styles.twoColumns}>
                <label>
                  Website
                  <input value="https://harborlight.example" readOnly />
                </label>
                <label>
                  Main contact
                  <input value="Morgan Lee · operations@harborlight.example" readOnly />
                </label>
              </div>
              <label>
                Contact role
                <input name="contactRole" defaultValue="Operations Director" required />
              </label>
              <label className={styles.checkbox}>
                <input name="contactPublic" type="checkbox" />
                Publish this organization contact on the public profile
              </label>
            </fieldset>
          ) : null}

          {step === 1 ? (
            <fieldset>
              <legend>One meaningful capability</legend>
              <p className={styles.fieldIntro}>
                Choose a discoverable category and name the specific capability. Broad labels such
                as “business services” do not satisfy this requirement.
              </p>
              <label>
                Capability type
                <select name="capabilityKind" defaultValue="service">
                  <option value="service">Service provided</option>
                  <option value="product">Product supplied</option>
                  <option value="function">Function performed</option>
                </select>
              </label>
              <label>
                Capability category
                <select
                  name="capabilityCategory"
                  value={category}
                  onChange={(event) => setCategory(event.target.value)}
                  required
                >
                  {ORGANIZATION_CAPABILITY_CATEGORIES.map((value) => (
                    <option key={value} value={value}>{CATEGORY_LABELS[value]}</option>
                  ))}
                </select>
              </label>
              {category === "other" ? (
                <label>
                  Other category
                  <input name="otherCapabilityCategory" required />
                </label>
              ) : null}
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
            <section className={styles.milestone} aria-live="polite">
              <span>Active credential · automatically derived</span>
              <h2>Profile Complete</h2>
              <p>
                Required identity, contact, website disposition, confirmed location, visibility,
                service geography, and a meaningful categorized capability are present.
              </p>
              <ul>
                <li>Profile Complete is not Organization Verified.</li>
                <li>Every organization may both issue and respond to opportunities.</li>
                <li>Official Resource Provider status requires a separate reviewed application.</li>
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
                {step === 1 ? "Save and evaluate profile" : "Continue"}
              </button>
            ) : null}
          </div>
        </form>

        <div className={styles.requirements} aria-label="Profile Complete requirements">
          <strong>Automatic completion gate</strong>
          <span>Identity + contact</span>
          <span>Website disposition</span>
          <span>Meaningful categorized capability</span>
          <span>Confirmed location + visibility</span>
          <span>Service geography</span>
        </div>
      </aside>
    </div>
  );
}
