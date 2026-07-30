"use client";

import type { ControlledLocalityMapModel } from "../../application/geography/controlled-locality-map";
import type { PublicOrganizationMarker } from "../../domain/organization-markers/model";
import { ControlledLocalityCanvas } from "../map/ControlledLocalityCanvas";

import styles from "./MarkerActivationPanel.module.css";

export interface MarkerActivationPanelProps {
  readonly mapModel: ControlledLocalityMapModel;
  readonly marker: PublicOrganizationMarker;
}

export function MarkerActivationPanel({
  mapModel,
  marker,
}: MarkerActivationPanelProps) {
  return (
    <section className={styles.shell}>
      <header className={styles.success}>
        <p className={styles.eyebrow}>Profile Complete · marker active</p>
        <h1>Portsmouth Works is now on the Exchange map.</h1>
        <p>
          Your marker is anchored to your confirmed location and shown through your
          approved approximate-public privacy setting. This is controlled platform
          entry—not OPEN release.
        </p>
        <dl>
          <div>
            <dt>Geography</dt>
            <dd>Portsmouth, Virginia · Released</dd>
          </div>
          <div>
            <dt>Map presence</dt>
            <dd>Approximate public position</dd>
          </div>
          <div>
            <dt>Activation source</dt>
            <dd>Confirmed location + Profile Complete</dd>
          </div>
        </dl>
      </header>

      <ControlledLocalityCanvas
        model={mapModel}
        headingLevel="h2"
        pointOverlays={[
          {
            id: marker.id,
            position: marker.coordinate,
            label: "Portsmouth Works",
            kind: "organization-marker",
            privacyLabel: marker.accessibleLocationLabel,
            activated: true,
          },
        ]}
      />

      <aside className={styles.note} aria-label="Marker privacy explanation">
        <span aria-hidden="true">⌖</span>
        <div>
          <strong>Privacy-safe map presence</strong>
          <p>
            The public point is a deterministic projection. Your confirmed canonical
            coordinate remains unchanged inside RFxchange.
          </p>
        </div>
      </aside>
    </section>
  );
}
