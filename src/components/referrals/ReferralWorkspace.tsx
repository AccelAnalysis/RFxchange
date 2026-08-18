"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useRef, useState, useTransition } from "react";

import type { ControlledLocalityMapModel } from "../../application/geography/controlled-locality-map";
import {
  consumeLegacyReferralLensIntent,
  type ParticipantSpatialScope,
} from "../../application/participant/participant-spatial-context";
import type { SenderReferralProjection, RecipientReferralProjection, ReferralStatus } from "../../domain/referrals/model";
import {
  ExchangeSpatialScene,
  type ExchangeHomeMarker,
  type ExchangeRelationshipPath,
} from "../map/ExchangeSpatialScene";
import { useI18n } from "../i18n/I18nProvider";
import { WorkflowExplainer } from "../network-education/WorkflowExplainer";
import { ParticipantShell, SpatialWorkspace } from "../participant/ParticipantWorkspace";
import { useParticipantSpatialContext } from "../participant/useParticipantSpatialContext";
import {
  clearRetryStableCommand,
  markRetryStableCommandAttempted,
  resolveRetryStableCommand,
  retryStableCommandWasAttempted,
  shouldClearRetryStableCommandOnReviewBack,
} from "./retry-stable-command";

import styles from "./ReferralWorkspace.module.css";

type ReferralProjection = SenderReferralProjection | RecipientReferralProjection;
type ReferralOrganizationOption = Readonly<{
  organizationId: string;
  displayName: string;
  marker: Readonly<{ id: string; coordinate: readonly [number, number]; accessibleLocationLabel: string }>;
}>;

type PendingCreateAndSend = Readonly<{
  fingerprint: string;
  commandId: string;
}>;

interface ReferralWorkspaceProps {
  readonly model: ControlledLocalityMapModel;
  readonly homeMarker: ExchangeHomeMarker;
  readonly spatialScope: ParticipantSpatialScope;
  readonly initialReferrals: readonly ReferralProjection[];
  readonly organizations: readonly ReferralOrganizationOption[];
  readonly commandRecoveryScope: string;
  readonly requestedReferralId?: string | null;
  readonly requestedOrganizationId?: string | null;
  readonly preferOrganizationSelection?: boolean;
  readonly legacyBareLensIntent?: boolean;
}

const REFERRAL_CREATE_SEND_STORAGE_KEY = "rfxchange:referral-create-and-send";

function readable(value: string): string {
  return value.split("-").map((part) => part.charAt(0).toUpperCase() + part.slice(1)).join(" ");
}

function notificationLabel(
  value: ReferralProjection["notificationStatus"],
  translate: (key: string) => string,
): string {
  return value === "delivery-outcome-unknown"
    ? translate("referralWorkspace.notificationStates.deliveryOutcomeUnknown")
    : readable(value);
}

function nextActions(referral: ReferralProjection): readonly ReferralStatus[] {
  if (referral.role === "recipient" && referral.status === "sent") return ["accepted", "declined"];
  if (["sender", "recipient"].includes(referral.role) && referral.status === "accepted") return ["contacted"];
  if (referral.role === "sender" && referral.status === "contacted") return ["closed"];
  return [];
}

function otherOrganization(selected: ReferralProjection | null, organizations: readonly ReferralOrganizationOption[]) {
  if (!selected) return null;
  const otherId = counterpartyOrganizationId(selected);
  return otherId ? organizations.find((organization) => organization.organizationId === otherId) ?? null : null;
}

function counterpartyOrganizationId(selected: ReferralProjection): string | null {
  return selected.role === "sender"
    ? selected.recipientOrganizationId ? String(selected.recipientOrganizationId) : null
    : String(selected.senderOrganizationId);
}

function browserSessionStorage(): Storage | null {
  try {
    return window.sessionStorage;
  } catch {
    return null;
  }
}

export function ReferralWorkspace({ model, homeMarker, spatialScope, initialReferrals, organizations, commandRecoveryScope, requestedReferralId, requestedOrganizationId, preferOrganizationSelection = false, legacyBareLensIntent = false }: ReferralWorkspaceProps) {
  const { t } = useI18n();
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [, startNavigation] = useTransition();
  const [spatialContext, updateSpatialContext] = useParticipantSpatialContext({ scope: spatialScope, homeMarkerId: homeMarker.id, activeLens: "intelligence" });
  const [referrals, setReferrals] = useState(initialReferrals);
  const restoredReferralId = initialReferrals.some((referral) => referral.id === spatialContext.selection.relationshipId)
    ? spatialContext.selection.relationshipId
    : null;
  const [selectedId, setSelectedId] = useState(requestedReferralId ?? restoredReferralId ?? (preferOrganizationSelection ? null : initialReferrals[0]?.id) ?? null);
  const [composerOpen, setComposerOpen] = useState(false);
  const [recipientKind, setRecipientKind] = useState<"organization" | "external">("organization");
  const [recipientOrganizationId, setRecipientOrganizationId] = useState(
    requestedOrganizationId && organizations.some((organization) => organization.organizationId === requestedOrganizationId)
      ? requestedOrganizationId
      : organizations.some((organization) => organization.organizationId === spatialContext.selection.organizationId)
      ? spatialContext.selection.organizationId
      : "",
  );
  const [recipientLabel, setRecipientLabel] = useState("");
  const [recipientEmail, setRecipientEmail] = useState("");
  const [summary, setSummary] = useState("");
  const [consent, setConsent] = useState(false);
  const [educationOpen, setEducationOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const createAndSendCommandRef = useRef<PendingCreateAndSend | null>(null);
  const panelRef = useRef<HTMLElement | null>(null);
  const attemptedCreateAndSendCommandIdRef = useRef<string | null>(null);
  const commandStorageKey = `${REFERRAL_CREATE_SEND_STORAGE_KEY}:${encodeURIComponent(commandRecoveryScope)}`;
  const selected = referrals.find((referral) => referral.id === selectedId) ?? null;
  const selectedOtherOrganization = otherOrganization(selected, organizations);
  const relationshipPaths: readonly ExchangeRelationshipPath[] = selected && selectedOtherOrganization && ["sent", "accepted", "contacted", "closed"].includes(selected.status)
    ? [Object.freeze({
        id: selected.id,
        from: selected.role === "sender" ? homeMarker.coordinate : selectedOtherOrganization.marker.coordinate,
        to: selected.role === "sender" ? selectedOtherOrganization.marker.coordinate : homeMarker.coordinate,
        label: `${t("referralWorkspace.path.label")}: ${readable(selected.status)}`,
        status: selected.status as ExchangeRelationshipPath["status"],
      })]
    : [];
  const organizationMarkers = useMemo(() => organizations.map((organization) => Object.freeze({
    id: organization.marker.id,
    coordinate: organization.marker.coordinate,
    label: organization.displayName,
    accessibleLocationLabel: organization.marker.accessibleLocationLabel,
  })), [organizations]);
  useEffect(() => {
    if (!legacyBareLensIntent) return;
    const storage = browserSessionStorage();
    if (!storage || !consumeLegacyReferralLensIntent(storage, spatialScope)) return;
    startNavigation(() => router.replace("/geography/canvas?lens=capabilities", { scroll: false }));
  }, [legacyBareLensIntent, router, spatialScope]);
  useEffect(() => {
    if (panelRef.current) panelRef.current.scrollTop = spatialContext.workflowState.referrals.listScrollTop;
  }, [spatialContext.workflowState.referrals.listScrollTop]);
  useEffect(() => {
    if (!preferOrganizationSelection || !requestedOrganizationId) return;
    const organization = organizations.find(
      (candidate) => candidate.organizationId === requestedOrganizationId,
    );
    if (
      !organization
      || (
        spatialContext.selection.organizationId === organization.organizationId
        && spatialContext.selection.markerId === organization.marker.id
        && spatialContext.selection.relationshipId === null
      )
    ) return;
    updateSpatialContext((current) => Object.freeze({
      ...current,
      selection: Object.freeze({
        organizationId: organization.organizationId,
        markerId: organization.marker.id,
        relationshipId: null,
      }),
      panelOpen: true,
      originLens: current.activeLens,
    }));
  }, [organizations, preferOrganizationSelection, requestedOrganizationId, spatialContext.selection.markerId, spatialContext.selection.organizationId, spatialContext.selection.relationshipId, updateSpatialContext]);
  useEffect(() => {
    const activeReferral = referrals.find((referral) => referral.id === selectedId) ?? null;
    const other = otherOrganization(activeReferral, organizations);
    if (
      !activeReferral
      || !other
      || (
        spatialContext.selection.organizationId === other.organizationId
        && spatialContext.selection.markerId === other.marker.id
        && spatialContext.selection.relationshipId === activeReferral.id
      )
    ) return;
    updateSpatialContext((current) => Object.freeze({
      ...current,
      selection: Object.freeze({
        organizationId: other.organizationId,
        markerId: other.marker.id,
        relationshipId: activeReferral.id,
      }),
      panelOpen: true,
      originLens: current.activeLens,
    }));
  }, [organizations, referrals, selectedId, spatialContext.selection.markerId, spatialContext.selection.organizationId, spatialContext.selection.relationshipId, updateSpatialContext]);

  function selectOrganizationMarker(markerId: string) {
    const organization = organizations.find((candidate) => candidate.marker.id === markerId);
    const organizationId = organization?.organizationId ?? spatialScope.organizationId;
    const selectedCounterpartyId = selected ? counterpartyOrganizationId(selected) : null;
    const keepsSelectedReferral = selected !== null && selectedCounterpartyId === organizationId;
    if (!keepsSelectedReferral) {
      setSelectedId(null);
      const next = new URLSearchParams(searchParams.toString());
      next.delete("referral");
      if (organization) next.set("organization", organization.organizationId);
      else next.delete("organization");
      startNavigation(() => router.replace(`${pathname}${next.size ? `?${next.toString()}` : ""}`, { scroll: false }));
    }
    updateSpatialContext((current) => Object.freeze({
      ...current,
      selection: Object.freeze({
        organizationId,
        markerId,
        relationshipId: keepsSelectedReferral ? selected.id : null,
      }),
      panelOpen: true,
      originLens: current.activeLens,
    }));
    setRecipientOrganizationId(organization?.organizationId ?? "");
  }

  function selectReferral(referral: ReferralProjection, resultIndex: number) {
    setSelectedId(referral.id);
    const other = otherOrganization(referral, organizations);
    const counterpartyId = counterpartyOrganizationId(referral);
    const next = new URLSearchParams(searchParams.toString());
    next.set("referral", referral.id);
    if (counterpartyId) {
      next.set("organization", counterpartyId);
      setRecipientOrganizationId(counterpartyId);
    } else {
      next.delete("organization");
      setRecipientOrganizationId("");
    }
    startNavigation(() => router.replace(`${pathname}${next.size ? `?${next.toString()}` : ""}`, { scroll: false }));
    if (counterpartyId && !other) {
      return;
    }
    updateSpatialContext((current) => Object.freeze({
      ...current,
      selection: Object.freeze({
        organizationId: other?.organizationId ?? spatialScope.organizationId,
        markerId: other?.marker.id ?? homeMarker.id,
        relationshipId: referral.id,
      }),
      panelOpen: true,
      originLens: current.activeLens,
      workflowState: Object.freeze({
        ...current.workflowState,
        referrals: Object.freeze({ ...current.workflowState.referrals, resultIndex }),
      }),
    }));
  }

  async function api(body: Record<string, unknown>) {
    const response = await fetch("/api/referrals", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
    const payload = await response.json() as Record<string, unknown>;
    if (!response.ok) throw new Error(String(payload.error ?? t("referralWorkspace.states.error")));
    return payload;
  }

  async function refresh(selectId?: string) {
    const response = await fetch("/api/referrals", { cache: "no-store" });
    if (!response.ok) throw new Error(t("referralWorkspace.states.error"));
    const payload = await response.json() as { referrals: ReferralProjection[] };
    setReferrals(payload.referrals);
    if (selectId) setSelectedId(selectId);
  }

  function operationInput() {
    const existing = organizations.find((organization) => String(organization.organizationId) === recipientOrganizationId);
    const label = recipientKind === "organization" ? existing?.displayName ?? "" : recipientLabel;
    const sharedFields = ["sender-organization", "summary"] as const;
    return Object.freeze({
      fingerprint: JSON.stringify({
        recipientKind,
        recipientOrganizationId: recipientKind === "organization" ? recipientOrganizationId : null,
        recipientLabel: recipientKind === "external" ? recipientLabel : null,
        recipientEmail: recipientKind === "external" ? recipientEmail.trim().toLowerCase() : null,
        need: "introduction",
        summary,
        urgency: "standard",
        preferredContactMethod: "email",
        purpose: "business-introduction",
        sharedFields,
        consentAcknowledged: consent,
      }),
      label,
      sharedFields,
    });
  }

  function commandForFingerprint(fingerprint: string): string {
    const inMemory = createAndSendCommandRef.current;
    if (inMemory?.fingerprint === fingerprint) return inMemory.commandId;
    const commandId = resolveRetryStableCommand({
      storage: browserSessionStorage(),
      storageKey: commandStorageKey,
      fingerprint,
      prefix: "ref-create-send",
    });
    createAndSendCommandRef.current = Object.freeze({ fingerprint, commandId });
    return commandId;
  }

  function clearPendingCommand() {
    const pending = createAndSendCommandRef.current;
    clearRetryStableCommand({
      storage: browserSessionStorage(),
      storageKey: commandStorageKey,
      commandId: pending?.commandId,
    });
    createAndSendCommandRef.current = null;
    attemptedCreateAndSendCommandIdRef.current = null;
  }

  function closeComposer() {
    clearPendingCommand();
    setComposerOpen(false);
    setEducationOpen(false);
  }

  function beginEducationReview() {
    const operation = operationInput();
    commandForFingerprint(operation.fingerprint);
    setEducationOpen(true);
  }

  function backFromEducationReview() {
    const pending = createAndSendCommandRef.current;
    const submissionAttempted = Boolean(pending && (
      attemptedCreateAndSendCommandIdRef.current === pending.commandId ||
      retryStableCommandWasAttempted({
        storage: browserSessionStorage(),
        storageKey: commandStorageKey,
        commandId: pending.commandId,
      })
    ));
    if (shouldClearRetryStableCommandOnReviewBack({
      submissionAttempted,
    })) {
      clearPendingCommand();
    }
    setEducationOpen(false);
  }

  async function acknowledgeCreateAndSend() {
    setBusy(true); setNotice(null);
    const operation = operationInput();
    const commandId = commandForFingerprint(operation.fingerprint);
    attemptedCreateAndSendCommandIdRef.current = commandId;
    markRetryStableCommandAttempted({
      storage: browserSessionStorage(),
      storageKey: commandStorageKey,
      commandId,
    });
    try {
      const result = await api({ action: "create-and-send", commandId, recipientKind, recipientOrganizationId, recipientLabel: operation.label, recipientEmail, need: "introduction", summary, urgency: "standard", preferredContactMethod: "email", purpose: "business-introduction", sharedFields: operation.sharedFields, consentAcknowledged: consent });
      const referral = result.referral as Readonly<{ id: string; version: number }>;
      await refresh(referral.id);
      clearPendingCommand();
      setComposerOpen(false); setEducationOpen(false); setSummary(""); setRecipientEmail(""); setRecipientLabel(""); setConsent(false);
      setNotice(t("referralWorkspace.states.sent"));
    } catch (error) {
      // Keep the exact command in memory and actor-scoped session storage so an uncertain response
      // can replay after a same-tab reload without granting authority or creating a duplicate.
      setNotice(error instanceof Error ? error.message : t("referralWorkspace.states.error"));
    } finally { setBusy(false); }
  }

  async function transition(action: ReferralStatus) {
    if (!selected) return;
    setBusy(true); setNotice(null);
    try {
      await api({ action, commandId: `ref-${action}-${crypto.randomUUID()}`, referralId: selected.id, expectedVersion: selected.version, ...(action === "closed" ? { outcome: "other" } : {}) });
      await refresh(selected.id);
      setNotice(t(`referralWorkspace.states.${action}`));
    } catch (error) {
      setNotice(error instanceof Error ? error.message : t("referralWorkspace.states.error"));
    } finally { setBusy(false); }
  }

  async function retryCommunication() {
    if (!selected) return;
    setBusy(true); setNotice(null);
    try {
      await api({ action: "retry-communication", commandId: `refretry-${crypto.randomUUID()}`, referralId: selected.id });
      await refresh(selected.id);
      setNotice(t("referralWorkspace.states.retryQueued"));
    } catch (error) {
      setNotice(error instanceof Error ? error.message : t("referralWorkspace.states.error"));
    } finally { setBusy(false); }
  }

  const markerLookup = new Map(organizations.map((organization) => [organization.organizationId, organization]));
  const hasPath = Boolean(selected && ["sent", "accepted", "contacted", "closed"].includes(selected.status) && otherOrganization(selected, organizations));

  return (
    <ParticipantShell activeItem="Referrals">
      <SpatialWorkspace ariaLabel={t("referralWorkspace.ariaLabel")} className={styles.workspace}>
        <ExchangeSpatialScene
          model={model}
          mode="organization"
          marker={homeMarker}
          organizationMarkers={organizationMarkers}
          relationshipPaths={relationshipPaths}
          focusedMarkerId={spatialContext.selection.markerId}
          onOrganizationMarkerSelect={selectOrganizationMarker}
          initialCamera={spatialContext.camera}
          onCameraChange={(camera) => updateSpatialContext((current) => Object.freeze({ ...current, camera }))}
          interactive
          showSearch={false}
          workspaceOverlay="right"
        />
        <aside
          ref={panelRef}
          className={styles.panel}
          aria-label={t("referralWorkspace.list.label")}
          onScroll={(event) => {
            const listScrollTop = Math.max(0, Math.round(event.currentTarget.scrollTop));
            updateSpatialContext((current) => Object.freeze({
              ...current,
              workflowState: Object.freeze({
                ...current.workflowState,
                referrals: Object.freeze({ ...current.workflowState.referrals, listScrollTop }),
              }),
            }));
          }}
        >
          <header className={styles.header}>
            <div><p>{t("referralWorkspace.eyebrow")}</p><h1>{t("referralWorkspace.title")}</h1></div>
            <button type="button" className={styles.primary} onClick={() => setComposerOpen(true)}>{t("referralWorkspace.create")}</button>
          </header>
          {notice ? <p className={styles.notice} role="status">{notice}</p> : null}
          {referrals.length ? (
            <ul className={styles.list}>
              {referrals.map((referral, resultIndex) => <li key={referral.id}><button type="button" aria-current={selectedId === referral.id} onClick={() => selectReferral(referral, resultIndex)}><strong>{referral.role === "sender" ? referral.recipientLabel : referral.senderOrganizationName}</strong><span>{readable(referral.status)} · {readable(referral.need)}</span></button></li>)}
            </ul>
          ) : <div className={styles.empty}><h2>{t("referralWorkspace.empty.title")}</h2><p>{t("referralWorkspace.empty.body")}</p></div>}
          {selected ? (
            <article className={styles.detail} aria-live="polite">
              <p className={styles.status}>{readable(selected.status)} · {selected.role === "sender" ? t("referralWorkspace.roles.sender") : t("referralWorkspace.roles.recipient")}</p>
              <h2>{selected.role === "sender" ? selected.recipientLabel : selected.senderOrganizationName}</h2>
              <p>{selected.summary}</p>
              <dl><div><dt>{t("referralWorkspace.fields.purpose")}</dt><dd>{readable(selected.purpose)}</dd></div><div><dt>{t("referralWorkspace.fields.urgency")}</dt><dd>{readable(selected.urgency)}</dd></div><div><dt>{t("referralWorkspace.fields.contact")}</dt><dd>{readable(selected.preferredContactMethod)}</dd></div><div><dt>{t("referralWorkspace.fields.notification")}</dt><dd>{notificationLabel(selected.notificationStatus, t)}</dd></div><div><dt>{t("referralWorkspace.fields.expires")}</dt><dd>{new Date(selected.expiresAt).toLocaleDateString()}</dd></div></dl>
              <p className={styles.boundary}>{t("referralWorkspace.detail.boundary")}</p>
              {hasPath ? <p className={styles.pathText}>{t("referralWorkspace.path.visible", { status: readable(selected.status) })}</p> : <p className={styles.pathText}>{t("referralWorkspace.path.unavailable")}</p>}
              {nextActions(selected).length ? <WorkflowExplainer explainerKey="referral-response" /> : null}
              <div className={styles.actions}>{nextActions(selected).map((action) => <button key={action} type="button" disabled={busy} onClick={() => transition(action)}>{t(`referralWorkspace.actions.${action}`)}</button>)}{selected.role === "sender" && selected.status === "sent" && selected.notificationStatus === "retryable-failure" && !(selected.recipientKind === "external" && selected.recipientOrganizationId !== null) ? <button type="button" disabled={busy} onClick={retryCommunication}>{t("referralWorkspace.actions.retry")}</button> : null}</div>
            </article>
          ) : null}
        </aside>

        {composerOpen ? <div className={styles.modalBackdrop} role="presentation"><section className={styles.modal} role="dialog" aria-modal="true" aria-labelledby="referral-composer-title">
          <div className={styles.modalHeader}><div><p>{t("referralWorkspace.education.eyebrow")}</p><h2 id="referral-composer-title">{t("referralWorkspace.composer.title")}</h2></div><button type="button" onClick={closeComposer} aria-label={t("referralWorkspace.composer.close")}>×</button></div>
          {!educationOpen ? <form onSubmit={(event) => { event.preventDefault(); beginEducationReview(); }} className={styles.form}>
            <fieldset><legend>{t("referralWorkspace.composer.recipientType")}</legend><label><input type="radio" checked={recipientKind === "organization"} onChange={() => setRecipientKind("organization")} />{t("referralWorkspace.composer.existing")}</label><label><input type="radio" checked={recipientKind === "external"} onChange={() => setRecipientKind("external")} />{t("referralWorkspace.composer.external")}</label></fieldset>
            {recipientKind === "organization" ? <label>{t("referralWorkspace.composer.organization")}<select required value={recipientOrganizationId} onChange={(event) => setRecipientOrganizationId(event.target.value)}><option value="">{t("referralWorkspace.composer.choose")}</option>{organizations.map((organization) => <option key={organization.organizationId} value={organization.organizationId}>{organization.displayName}</option>)}</select></label> : <><label>{t("referralWorkspace.composer.name")}<input required value={recipientLabel} onChange={(event) => setRecipientLabel(event.target.value)} maxLength={160} /></label><label>{t("referralWorkspace.composer.email")}<input required type="email" value={recipientEmail} onChange={(event) => setRecipientEmail(event.target.value)} /></label></>}
            <label>{t("referralWorkspace.composer.summary")}<textarea required value={summary} onChange={(event) => setSummary(event.target.value)} maxLength={1200} /></label>
            <WorkflowExplainer explainerKey="referral-consent" />
            <label className={styles.checkbox}><input required type="checkbox" checked={consent} onChange={(event) => setConsent(event.target.checked)} />{t("referralWorkspace.composer.consent")}</label>
            <button className={styles.primary} type="submit">{t("referralWorkspace.composer.review")}</button>
          </form> : <div className={styles.education}>
            <h3>{t("referralWorkspace.education.title")}</h3><p>{t("referralWorkspace.education.body")}</p>
            <dl><div><dt>{t("referralWorkspace.education.recipient")}</dt><dd>{recipientKind === "organization" ? markerLookup.get(recipientOrganizationId)?.displayName : recipientLabel}</dd></div><div><dt>{t("referralWorkspace.education.shared")}</dt><dd>{t("referralWorkspace.education.sharedValue")}</dd></div></dl>
            <p>{t("referralWorkspace.education.states")}</p><p>{t("referralWorkspace.education.next")}</p>
            <div className={styles.actions}><button type="button" onClick={backFromEducationReview}>{t("referralWorkspace.composer.back")}</button><button className={styles.primary} type="button" disabled={busy} onClick={acknowledgeCreateAndSend}>{busy ? t("referralWorkspace.composer.sending") : t("referralWorkspace.composer.acknowledge")}</button></div>
          </div>}
        </section></div> : null}
      </SpatialWorkspace>
    </ParticipantShell>
  );
}
