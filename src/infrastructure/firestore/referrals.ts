import { FieldValue, type Firestore } from "firebase-admin/firestore";

import type { TransactionalEmailDeliveryReceipt } from "../../domain/communications/transactional-email.ts";
import type { OrganizationId } from "../../domain/organizations/model.ts";
import {
  referralInvitationDeliveryPermitted,
  type BusinessReferral,
  type ReferralCommandReceipt,
  type ReferralCommunicationIntent,
  type ReferralEducationAcknowledgement,
  type ReferralPersistenceBundle,
} from "../../domain/referrals/model.ts";
import type {
  ReferralCreateAndSendBundle,
  ReferralCreateAndSendPersistenceResult,
  ReferralRepository,
} from "../../domain/referrals/repository.ts";
import { FIRESTORE_SCHEMA_VERSION } from "./schema.ts";
import { getFirestoreRecordById, listFirestoreRecords } from "./support.ts";

const REFERRALS = "businessReferrals";
const EVENTS = "businessReferralEvents";
const COMMANDS = "businessReferralCommands";
const EDUCATION = "referralEducationAcknowledgements";
const COMMUNICATIONS = "referralCommunicationIntents";
const AUDITS = "organizationAuditEvents";
const ACQUISITION_CONTEXTS = "acquisitionContexts";
const ACQUISITION_EVENTS = "acquisitionContextEvents";

function immutable(value: object) {
  return Object.freeze({ ...value, schemaVersion: FIRESTORE_SCHEMA_VERSION, persistedAt: FieldValue.serverTimestamp() });
}

function mutable(value: object) {
  return Object.freeze({ ...value, schemaVersion: FIRESTORE_SCHEMA_VERSION, persistedAt: FieldValue.serverTimestamp(), persistenceUpdatedAt: FieldValue.serverTimestamp() });
}

function acquisitionRecord(value: object) {
  return Object.freeze({ ...value, schemaVersion: FIRESTORE_SCHEMA_VERSION });
}

function assertCreateAndSendBundle(bundle: ReferralCreateAndSendBundle): void {
  const [created, sent] = bundle.events;
  const external = bundle.referral.recipient.kind === "external";
  const acquisitionValid = external
    ? Boolean(
        bundle.acquisition &&
        bundle.referral.acquisitionContextId === bundle.acquisition.context.id &&
        bundle.acquisition.context.intent.kind === "referral" &&
        bundle.acquisition.context.intent.subjectReference === bundle.referral.id &&
        bundle.acquisition.context.source.channel === "referral-link" &&
        bundle.acquisition.event.acquisitionContextId === bundle.acquisition.context.id &&
        bundle.acquisition.event.kind === "issued",
      )
    : bundle.acquisition === null && bundle.referral.acquisitionContextId === null;
  if (
    bundle.referral.version !== 2 ||
    bundle.referral.status !== "sent" ||
    bundle.command.action !== "sent" ||
    bundle.command.resultingVersion !== 2 ||
    bundle.command.referralId !== bundle.referral.id ||
    created.kind !== "created" ||
    created.fromStatus !== null ||
    created.toStatus !== "draft" ||
    created.aggregateVersion !== 1 ||
    sent.kind !== "sent" ||
    sent.fromStatus !== "draft" ||
    sent.toStatus !== "sent" ||
    sent.aggregateVersion !== 2 ||
    created.referralId !== bundle.referral.id ||
    sent.referralId !== bundle.referral.id ||
    bundle.education.organizationId !== bundle.referral.senderOrganizationId ||
    bundle.education.recipientLabel !== bundle.referral.recipient.displayName ||
    JSON.stringify(bundle.education.sharedFields) !== JSON.stringify(bundle.referral.sharedFields) ||
    (bundle.communication !== null && bundle.communication.referralId !== bundle.referral.id) ||
    !acquisitionValid
  ) {
    throw new Error("Referral create-and-send persistence bundle is inconsistent.");
  }
}

export class FirestoreReferralRepository implements ReferralRepository {
  private readonly db: Firestore;
  constructor(db: Firestore) { this.db = db; }

  getById(id: string) {
    return getFirestoreRecordById<BusinessReferral>(this.db, "businessReferrals", id);
  }

  async listInvolvingOrganization(organizationId: OrganizationId): Promise<readonly BusinessReferral[]> {
    const [sent, received] = await Promise.all([
      listFirestoreRecords<BusinessReferral>(this.db.collection(REFERRALS).where("senderOrganizationId", "==", organizationId), "businessReferrals"),
      listFirestoreRecords<BusinessReferral>(this.db.collection(REFERRALS).where("attachedRecipientOrganizationId", "==", organizationId), "businessReferrals"),
    ]);
    return Object.freeze([...new Map([...sent, ...received].map((item) => [item.id, item])).values()].sort((left, right) => right.updatedAt.localeCompare(left.updatedAt)));
  }

  getCommand(id: string) {
    return getFirestoreRecordById<ReferralCommandReceipt>(this.db, "businessReferralCommands", id);
  }

  async getEducation(organizationId: OrganizationId, actorUserId: string) {
    const records = await listFirestoreRecords<ReferralEducationAcknowledgement>(
      this.db.collection(EDUCATION).where("organizationId", "==", organizationId).where("actorUserId", "==", actorUserId),
      "referralEducationAcknowledgements",
    );
    return records.reduce<ReferralEducationAcknowledgement | null>((latest, record) => !latest || record.acknowledgedAt > latest.acknowledgedAt ? record : latest, null);
  }

  async acknowledgeEducation(input: Parameters<ReferralRepository["acknowledgeEducation"]>[0]): Promise<void> {
    const educationRef = this.db.collection(EDUCATION).doc(input.acknowledgement.id);
    const commandRef = this.db.collection(COMMANDS).doc(input.command.id);
    const auditRef = this.db.collection(AUDITS).doc(input.audit.id);
    await this.db.runTransaction(async (transaction) => {
      const [commandSnapshot, auditSnapshot] = await transaction.getAll(commandRef, auditRef);
      if (commandSnapshot.exists) return;
      if (auditSnapshot.exists) throw new Error("Referral education audit identity collision.");
      transaction.create(educationRef, immutable(input.acknowledgement));
      transaction.create(commandRef, immutable(input.command));
      transaction.create(auditRef, immutable(input.audit));
    });
  }

  async save(bundle: ReferralPersistenceBundle): Promise<void> {
    const referralRef = this.db.collection(REFERRALS).doc(bundle.referral.id);
    const eventRef = this.db.collection(EVENTS).doc(bundle.event.id);
    const commandRef = this.db.collection(COMMANDS).doc(bundle.command.id);
    const communicationRef = bundle.communication ? this.db.collection(COMMUNICATIONS).doc(bundle.communication.id) : null;
    const auditRefs = bundle.audits.map((audit) => this.db.collection(AUDITS).doc(audit.id));
    const persistenceAttemptedAt = new Date().toISOString();
    await this.db.runTransaction(async (transaction) => {
      const snapshots = await transaction.getAll(commandRef, eventRef, ...auditRefs, ...(communicationRef ? [communicationRef] : []));
      if (snapshots[0]?.exists) {
        const prior = snapshots[0].data() as ReferralCommandReceipt;
        if (prior.referralId === bundle.command.referralId && prior.action === bundle.command.action && prior.requestFingerprint === bundle.command.requestFingerprint) return;
        throw new Error("Referral command identity collision.");
      }
      if (snapshots.slice(1).some((snapshot) => snapshot.exists)) throw new Error("Referral persistence identity collision.");
      const currentSnapshot = await transaction.get(referralRef);
      if (currentSnapshot.exists) {
        const current = currentSnapshot.data() as BusinessReferral;
        if (current.version + 1 !== bundle.referral.version || current.id !== bundle.referral.id) throw new Error(`Referral changed; current version is ${current.version}.`);
        if (current.communicationMessageId) {
          const currentCommunicationSnapshot = await transaction.get(
            this.db.collection(COMMUNICATIONS).doc(current.communicationMessageId),
          );
          const claim = currentCommunicationSnapshot.exists
            ? (currentCommunicationSnapshot.data() as ReferralCommunicationIntent).deliveryClaim
            : null;
          if (claim && claim.expiresAt > persistenceAttemptedAt) {
            throw new Error("Referral invitation delivery is in progress; retry this action shortly.");
          }
        }
      } else if (bundle.referral.version !== 1 || bundle.event.kind !== "created") {
        throw new Error("Referral aggregate is unavailable for this transition.");
      }
      transaction.set(referralRef, mutable(bundle.referral));
      transaction.create(eventRef, immutable(bundle.event));
      transaction.create(commandRef, immutable(bundle.command));
      bundle.audits.forEach((audit, index) => transaction.create(auditRefs[index], immutable(audit)));
      if (communicationRef && bundle.communication) transaction.create(communicationRef, immutable(bundle.communication));
    });
  }

  async saveCreateAndSend(bundle: ReferralCreateAndSendBundle): Promise<ReferralCreateAndSendPersistenceResult> {
    assertCreateAndSendBundle(bundle);
    const referralRef = this.db.collection(REFERRALS).doc(bundle.referral.id);
    const commandRef = this.db.collection(COMMANDS).doc(bundle.command.id);
    const educationRef = this.db.collection(EDUCATION).doc(bundle.education.id);
    const eventRefs = bundle.events.map((item) => this.db.collection(EVENTS).doc(item.id));
    const auditRefs = bundle.audits.map((audit) => this.db.collection(AUDITS).doc(audit.id));
    const communicationRef = bundle.communication ? this.db.collection(COMMUNICATIONS).doc(bundle.communication.id) : null;
    const acquisitionContextRef = bundle.acquisition
      ? this.db.collection(ACQUISITION_CONTEXTS).doc(bundle.acquisition.context.id)
      : null;
    const acquisitionEventRef = bundle.acquisition
      ? this.db.collection(ACQUISITION_EVENTS).doc(bundle.acquisition.event.id)
      : null;
    return this.db.runTransaction(async (transaction) => {
      const snapshots = await transaction.getAll(
        commandRef,
        referralRef,
        educationRef,
        ...eventRefs,
        ...auditRefs,
        ...(communicationRef ? [communicationRef] : []),
        ...(acquisitionContextRef ? [acquisitionContextRef] : []),
        ...(acquisitionEventRef ? [acquisitionEventRef] : []),
      );
      const commandSnapshot = snapshots[0];
      if (commandSnapshot?.exists) {
        const prior = commandSnapshot.data() as ReferralCommandReceipt;
        if (
          prior.referralId === bundle.command.referralId &&
          prior.action === bundle.command.action &&
          prior.requestFingerprint === bundle.command.requestFingerprint &&
          prior.resultingVersion === bundle.command.resultingVersion
        ) {
          return "replayed" as const;
        }
        throw new Error("Referral command identity collision.");
      }
      if (snapshots.slice(1).some((snapshot) => snapshot.exists)) {
        throw new Error("Referral create-and-send identity collision.");
      }
      transaction.create(referralRef, mutable(bundle.referral));
      transaction.create(commandRef, immutable(bundle.command));
      transaction.create(educationRef, immutable(bundle.education));
      bundle.events.forEach((item, index) => transaction.create(eventRefs[index], immutable(item)));
      bundle.audits.forEach((audit, index) => transaction.create(auditRefs[index], immutable(audit)));
      if (communicationRef && bundle.communication) transaction.create(communicationRef, immutable(bundle.communication));
      if (acquisitionContextRef && acquisitionEventRef && bundle.acquisition) {
        transaction.create(acquisitionContextRef, acquisitionRecord(bundle.acquisition.context));
        transaction.create(acquisitionEventRef, acquisitionRecord(bundle.acquisition.event));
      }
      return "created" as const;
    });
  }

  async attachInvitation(input: Parameters<ReferralRepository["attachInvitation"]>[0]): Promise<void> {
    await this.save({ referral: input.referral, event: input.event, command: input.command, audits: [input.audit], communication: null });
  }

  getCommunication(id: string) {
    return getFirestoreRecordById<ReferralCommunicationIntent>(this.db, "referralCommunicationIntents", id);
  }

  async claimCommunicationDelivery(
    input: Parameters<ReferralRepository["claimCommunicationDelivery"]>[0],
  ) {
    if (!input.claimId.trim() || input.claimedAt >= input.expiresAt) {
      throw new Error("Referral communication delivery claim is invalid.");
    }
    const communicationRef = this.db.collection(COMMUNICATIONS).doc(input.communicationId);
    return this.db.runTransaction(async (transaction) => {
      const communicationSnapshot = await transaction.get(communicationRef);
      if (!communicationSnapshot.exists) throw new Error("Referral communication intent is unavailable.");
      const communication = communicationSnapshot.data() as ReferralCommunicationIntent;
      const referralSnapshot = await transaction.get(
        this.db.collection(REFERRALS).doc(communication.referralId),
      );
      if (!referralSnapshot.exists) throw new Error("Referral communication authority is unavailable.");
      const referral = referralSnapshot.data() as BusinessReferral;
      if (!referralInvitationDeliveryPermitted(referral, communication)) {
        return Object.freeze({ communication, referral, claimed: false as const });
      }
      const existingClaim = communication.deliveryClaim;
      // A claim is the durable record that a provider side effect may already have occurred. Its
      // deadline bounds how long referral lifecycle writes wait, but it never makes delivery
      // automatically reclaimable: a crash or accepted-receipt persistence failure has an unknown
      // external outcome and must not permit a duplicate send.
      if (existingClaim) {
        return Object.freeze({ communication, referral, claimed: false as const });
      }
      const claimed = Object.freeze({
        ...communication,
        deliveryClaim: Object.freeze({
          id: input.claimId,
          claimedAt: input.claimedAt,
          expiresAt: input.expiresAt,
          outcome: "unknown" as const,
        }),
        updatedAt: input.claimedAt,
      });
      transaction.set(communicationRef, mutable(claimed));
      return Object.freeze({ communication: claimed, referral, claimed: true as const });
    });
  }

  async recordCommunicationResult(input: Readonly<{ intent: ReferralCommunicationIntent; claimId?: string | null; receipt?: TransactionalEmailDeliveryReceipt | null; errorCode?: string | null; retryable?: boolean }>): Promise<ReferralCommunicationIntent> {
    const ref = this.db.collection(COMMUNICATIONS).doc(input.intent.id);
    return this.db.runTransaction(async (transaction) => {
      const snapshot = await transaction.get(ref);
      if (!snapshot.exists) throw new Error("Referral communication intent is unavailable.");
      const current = snapshot.data() as ReferralCommunicationIntent;
      if (current.referralId !== input.intent.referralId || current.request.metadata.idempotencyKey !== input.intent.request.metadata.idempotencyKey) throw new Error("Referral communication intent identity mismatch.");
      if (current.status === "accepted") return current;
      if (
        (current.deliveryClaim && current.deliveryClaim.id !== input.claimId) ||
        (input.claimId && !current.deliveryClaim)
      ) {
        throw new Error("Referral communication delivery claim is no longer current.");
      }
      const status = input.receipt?.status === "accepted" ? "accepted" as const : input.retryable ? "retryable-failure" as const : "terminal-failure" as const;
      const updated = Object.freeze({ ...current, status, attemptCount: current.attemptCount + 1, lastErrorCode: input.errorCode ?? input.receipt?.diagnosticCode ?? null, deliveryClaim: null, updatedAt: new Date().toISOString() });
      transaction.set(ref, mutable(updated));
      return updated;
    });
  }
}
