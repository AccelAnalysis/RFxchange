"use client";

import { useState } from "react";

import type { ControlledLocalityMapModel } from "../../application/geography/controlled-locality-map";
import {
  ControlledLocalityCanvas,
  type ControlledLocalityPointOverlay,
} from "../map/ControlledLocalityCanvas";
import {
  LocalityStatusOverlay,
  MapOverlaySurface,
  ResponsiveEdgeSheet,
  SpatialWorkspace,
} from "../participant/ParticipantWorkspace";

import styles from "./OrganizationLocationPanel.module.css";

const CANDIDATE_POSITION = [-76.297933263584, 36.835462854397] as const;

export function OrganizationLocationPanel({
  mapModel,
}: Readonly<{ mapModel: ControlledLocalityMapModel }>) {
  const [stage, setStage] = useState<"address" | "candidate" | "confirmed">("address");
  const [visibility, setVisibility] = useState("locality-only");
  const pointOverlays: readonly ControlledLocalityPointOverlay[] =
    stage === "address"
      ? []
      : [{
          id: "high-street-candidate",
          position: CANDIDATE_POSITION,
          label: "200 High Street",
          kind: stage === "candidate" ? "location-candidate" : "confirmed-location",
        }];

  return (
    <SpatialWorkspace ariaLabel="Organization location confirmation workspace">
      <ControlledLocalityCanvas
        model={mapModel}
        overlaySide="left"
        pointOverlays={pointOverlays}
      />
      <MapOverlaySurface position="top-center">
        <div className={styles.localityOverlay}>
          <LocalityStatusOverlay
            locality="Portsmouth, Virginia"
            state="Location confirmation"
            supportingText="Candidate and confirmed points remain geographically anchored"
          />
        </div>
      </MapOverlaySurface>

      <ResponsiveEdgeSheet ariaLabelledBy="location-heading">
        <div className={styles.sheet}>
        <p className={styles.eyebrow}>Activation · location</p>
        <h1 id="location-heading">Confirm where Harborlight is based.</h1>
        <p className={styles.lead}>
          Your physical location, public map precision, and service geography are separate.
          A confirmed point is not yet an activated organization marker.
        </p>

        <ol className={styles.progress} aria-label="Location confirmation progress">
          <li data-active={stage === "address"}>1. Address</li>
          <li data-active={stage === "candidate"}>2. Map confirmation</li>
          <li data-active={stage === "confirmed"}>3. Confirmed</li>
        </ol>

        <form
          className={styles.form}
          onSubmit={(event) => {
            event.preventDefault();
            setStage((current) => current === "address" ? "candidate" : "confirmed");
          }}
        >
          <fieldset>
            <legend>Physical location</legend>
            <label>
              Street address
              <input name="addressLine1" defaultValue="200 High St" required />
            </label>
            <div className={styles.fieldRow}>
              <label>
                City
                <input name="locality" defaultValue="Portsmouth" required />
              </label>
              <label>
                State
                <input name="regionCode" defaultValue="VA" required maxLength={2} />
              </label>
              <label>
                ZIP
                <input name="postalCode" defaultValue="23704" required />
              </label>
            </div>
            <label className={styles.check}>
              <input type="checkbox" defaultChecked />
              This is a home or private address
            </label>
          </fieldset>

          <details>
            <summary>Add a separate mailing address</summary>
            <label>
              Mailing address
              <input name="mailingAddress" placeholder="PO Box or mailing street" />
            </label>
          </details>

          <fieldset>
            <legend>Public map precision</legend>
            {[
              ["exact", "Exact", "Show the approved confirmed business point."],
              ["approximate", "Approximate", "Publish a deterministic privacy-safe nearby point."],
              ["locality-only", "Locality only", "Show Portsmouth presence without a public point."],
            ].map(([value, title, description]) => (
              <label className={styles.radio} key={value}>
                <input
                  type="radio"
                  name="visibility"
                  value={value}
                  checked={visibility === value}
                  onChange={() => setVisibility(value)}
                />
                <span>
                  <strong>{title}</strong>
                  <small>{description}</small>
                </span>
              </label>
            ))}
          </fieldset>

          <fieldset>
            <legend>Service geography</legend>
            <label className={styles.check}>
              <input type="checkbox" defaultChecked />
              Portsmouth, Virginia
            </label>
            <p className={styles.hint}>
              Service geography describes where the organization can work. It does not move or
              publish the physical location.
            </p>
          </fieldset>

          {stage !== "address" ? (
            <div className={styles.candidate} role="status">
              <strong>
                {stage === "candidate" ? "Candidate awaiting confirmation" : "Location confirmed"}
              </strong>
              <span>200 HIGH ST, PORTSMOUTH, VA 23704</span>
              <small>
                U.S. Census Geocoder · Public Address Ranges — current benchmark
              </small>
            </div>
          ) : null}

          <button type="submit" disabled={stage === "confirmed"}>
            {stage === "address"
              ? "Find this location"
              : stage === "candidate"
                ? "Confirm map position"
                : "Location confirmed"}
          </button>
        </form>

        <p className={styles.privacy}>
          Mailing address and exact internal coordinates remain private unless the approved
          public precision explicitly permits an exact projection.
        </p>
        </div>
      </ResponsiveEdgeSheet>
    </SpatialWorkspace>
  );
}
