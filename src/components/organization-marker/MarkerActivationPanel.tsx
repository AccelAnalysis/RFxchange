"use client";

import type { ControlledLocalityMapModel } from "../../application/geography/controlled-locality-map";
import type { PublicOrganizationMarker } from "../../domain/organization-markers/model";
import { ControlledLocalityCanvas } from "../map/ControlledLocalityCanvas";
import {
  ResponsiveEdgeSheet,
  SpatialWorkspace,
} from "../participant/ParticipantWorkspace";

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
    <SpatialWorkspace ariaLabel="Activated organization map workspace">
      <ControlledLocalityCanvas
        model={mapModel}
        initialZoom="nearby"
        overlaySide="right"
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

      <ResponsiveEdgeSheet
        ariaLabelledBy="marker-activation-heading"
        side="left"
      >
        <header className={styles.success}>
          <p className={styles.eyebrow}>Profile Complete · marker active</p>
          <h1 id="marker-activation-heading">
            You are now on the Exchange map.
          </h1>
        </header>

        <details className={styles.activationDetails}>
          <summary>View activation details</summary>
          <div className={styles.activationDetailContent}>
            <p>
              Portsmouth Works is anchored to its confirmed location and shown through your
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

            <div className={styles.note} aria-label="Marker privacy explanation">
              <span aria-hidden="true">⌖</span>
              <div>
                <strong>Privacy-safe map presence</strong>
                <p>
                  The public point is a deterministic projection. Your confirmed canonical
                  coordinate remains unchanged inside RFxchange.
                </p>
              </div>
            </div>
          </div>
        </details>
      </ResponsiveEdgeSheet>
    </SpatialWorkspace>
  );
}
