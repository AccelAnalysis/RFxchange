"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import type { ControlledLocalityMapModel } from "../../application/geography/controlled-locality-map";
import {
  createExistingWorkspaceState,
  existingWorkspaceStorageKey,
  parseExistingWorkspaceState,
  serializeExistingWorkspaceState,
  type ExistingWorkspaceState,
} from "../../application/participant/existing-workspace-state";
import {
  ExchangeSpatialScene,
  type ExchangeHomeMarker,
} from "../map/ExchangeSpatialScene";
import {
  AlertBanner,
  ObjectCard,
  StatePanel,
  StatusPill,
} from "../ui";
import {
  ParticipantShell,
  ResponsiveEdgeSheet,
  SpatialWorkspace,
} from "./ParticipantWorkspace";

import styles from "./ExistingWorkspaceFoundation.module.css";

export type ExistingWorkspaceStatus =
  | "ready"
  | "loading"
  | "empty"
  | "error"
  | "permission"
  | "expired"
  | "recovery";

interface ExistingWorkspaceFoundationProps {
  readonly model: ControlledLocalityMapModel;
  readonly homeMarker: ExchangeHomeMarker;
  readonly organizationId: string;
  readonly status?: ExistingWorkspaceStatus;
}

const statusCopy: Readonly<Record<Exclude<ExistingWorkspaceStatus, "ready">, Readonly<{
  title: string;
  body: string;
  actionLabel?: string;
  actionHref?: string;
}>>> = Object.freeze({
  loading: Object.freeze({
    title: "Preparing your Exchange workspace",
    body: "The authorized organization and locality projection are loading. Your activation state remains preserved.",
  }),
  empty: Object.freeze({
    title: "No authorized organization projection is available",
    body: "Return to activation to complete or repair the organization, geography, profile, or marker requirements.",
    actionLabel: "Review activation",
    actionHref: "/join",
  }),
  error: Object.freeze({
    title: "The workspace could not be prepared",
    body: "No organization or geography state was changed. Retry the authenticated workspace or return to activation for recovery.",
    actionLabel: "Retry workspace",
    actionHref: "/geography/canvas",
  }),
  permission: Object.freeze({
    title: "This organization workspace is not available to your account",
    body: "Access is resolved from current organization membership and restrictions. Private organization details are not displayed.",
    actionLabel: "Return to your workspace",
    actionHref: "/geography/canvas",
  }),
  expired: Object.freeze({
    title: "Your workspace session has expired",
    body: "Sign in again to re-evaluate current organization authority and return to the permitted workspace.",
    actionLabel: "Sign in",
    actionHref: "/signin?returnTo=%2Fgeography%2Fcanvas",
  }),
  recovery: Object.freeze({
    title: "Workspace recovery is available",
    body: "Your organization remains intact. Re-open activation to resolve the missing workspace projection without creating a duplicate organization.",
    actionLabel: "Open recovery",
    actionHref: "/join",
  }),
});

function WorkspaceBoundary({ status }: Readonly<{ status: Exclude<ExistingWorkspaceStatus, "ready"> }>) {
  const copy = statusCopy[status];
  return (
    <ParticipantShell activeItem="Intelligence">
      <main className={styles.stateWorkspace} aria-label="RFxchange workspace status">
        <StatePanel
          state={status}
          title={copy.title}
          action={copy.actionHref && copy.actionLabel
            ? <Link className={styles.stateAction} href={copy.actionHref}>{copy.actionLabel}</Link>
            : undefined}
        >
          {copy.body}
        </StatePanel>
      </main>
    </ParticipantShell>
  );
}

export function ExistingWorkspaceFoundation({
  model,
  homeMarker,
  organizationId,
  status = "ready",
}: ExistingWorkspaceFoundationProps) {
  const [workspaceState, setWorkspaceState] = useState<ExistingWorkspaceState>(() =>
    createExistingWorkspaceState({ organizationId, selectedObjectId: homeMarker.id }),
  );
  const [stateHydrated, setStateHydrated] = useState(false);

  useEffect(() => {
    try {
      const key = existingWorkspaceStorageKey(organizationId);
      const restored = parseExistingWorkspaceState(window.localStorage.getItem(key), organizationId);
      if (restored && restored.selectedObjectId === homeMarker.id) {
        setWorkspaceState(restored);
      }
    } catch {
      // Browser UI-state storage may be unavailable. Authority and domain state do not depend on it.
    } finally {
      setStateHydrated(true);
    }
  }, [homeMarker.id, organizationId]);

  useEffect(() => {
    if (!stateHydrated) return;
    try {
      window.localStorage.setItem(
        existingWorkspaceStorageKey(organizationId),
        serializeExistingWorkspaceState(workspaceState),
      );
    } catch {
      // UI state persistence is optional and never affects authority or domain state.
    }
  }, [organizationId, stateHydrated, workspaceState]);

  if (status !== "ready") return <WorkspaceBoundary status={status} />;

  const panelOpen = workspaceState.panelOpen;
  const selected = workspaceState.selectedObjectId === homeMarker.id;
  const locality = model.selectedGeography.name;
  const locationLabel = homeMarker.accessibleLocationLabel ?? `${locality} organization location`;

  const openOrganizationHome = () => {
    setWorkspaceState(createExistingWorkspaceState({
      organizationId,
      selectedObjectId: homeMarker.id,
      panelOpen: true,
    }));
  };

  const closeOrganizationHome = () => {
    setWorkspaceState(createExistingWorkspaceState({
      organizationId,
      selectedObjectId: homeMarker.id,
      panelOpen: false,
    }));
  };

  return (
    <ParticipantShell activeItem="Intelligence">
      <SpatialWorkspace ariaLabel="RFxchange Intelligence geographic workspace">
        <ExchangeSpatialScene
          model={model}
          mode="organization"
          marker={homeMarker}
          interactive
          showSearch
          workspaceOverlay={panelOpen ? "right" : null}
        />

        <div className={styles.workspaceActions}>
          <button
            type="button"
            className={styles.organizationHomeButton}
            onClick={openOrganizationHome}
            aria-expanded={panelOpen}
            aria-controls="organization-home-panel"
          >
            <span className={styles.organizationNode} aria-hidden="true">RF</span>
            <span>
              <small>Organization home</small>
              <strong>{homeMarker.label}</strong>
            </span>
          </button>
        </div>

        {panelOpen ? (
          <ResponsiveEdgeSheet ariaLabelledBy="organization-home-title" side="right" width="standard">
            <div id="organization-home-panel" className={styles.organizationHome}>
              <div className={styles.sheetHeader}>
                <div>
                  <p className={styles.eyebrow}>Organization home</p>
                  <h1 id="organization-home-title">{homeMarker.label}</h1>
                </div>
                <button type="button" className={styles.closeButton} onClick={closeOrganizationHome}>
                  <span aria-hidden="true">×</span>
                  <span className={styles.srOnly}>Close organization home</span>
                </button>
              </div>

              <div className={styles.statusRow}>
                <StatusPill tone="positive">Active organization node</StatusPill>
                <StatusPill tone="connection">{locality}</StatusPill>
              </div>

              <ObjectCard
                eyebrow="Visible now"
                title="Your established Exchange position"
                tone="connection"
                status={selected ? <StatusPill tone="information">Selected</StatusPill> : null}
                metadata={<span>Projection observed through the authenticated organization workspace.</span>}
              >
                <dl className={styles.organizationFacts}>
                  <div>
                    <dt>Home locality</dt>
                    <dd>{locality}</dd>
                  </div>
                  <div>
                    <dt>Visible location</dt>
                    <dd>{locationLabel}</dd>
                  </div>
                  <div>
                    <dt>Map source</dt>
                    <dd>{model.attribution.label} · {model.attribution.vintage}</dd>
                  </div>
                  <div>
                    <dt>Viewport</dt>
                    <dd>Organization home is restored deterministically on entry.</dd>
                  </div>
                </dl>
                <div className={styles.cardActions}>
                  <Link className={styles.primaryAction} href="/organization-profile">Manage organization profile</Link>
                </div>
              </ObjectCard>

              <AlertBanner title="Current workspace scope" tone="information">
                This environment shows domains that are already authoritative: your organization,
                approved geography, map position, and account/profile access.
              </AlertBanner>

              <StatePanel state="empty" title="Network discovery is not live yet">
                Capability search across permitted organizations, referrals, official resource providers,
                and RFx objects remain absent until their authorized Wave 3 and Wave 4 slices are complete.
              </StatePanel>

              <section className={styles.provenance} aria-labelledby="provenance-title">
                <p className={styles.eyebrow}>Data provenance</p>
                <h2 id="provenance-title">What this map is based on</h2>
                <dl>
                  <div>
                    <dt>Boundary authority</dt>
                    <dd>{model.attribution.label}</dd>
                  </div>
                  <div>
                    <dt>Boundary vintage</dt>
                    <dd>{model.attribution.vintage}</dd>
                  </div>
                  <div>
                    <dt>Retrieved</dt>
                    <dd>{new Date(model.attribution.retrievedAt).toLocaleDateString("en-US")}</dd>
                  </div>
                </dl>
              </section>
            </div>
          </ResponsiveEdgeSheet>
        ) : null}
      </SpatialWorkspace>
    </ParticipantShell>
  );
}
