import { FieldValue, type Firestore } from "firebase-admin/firestore";

import type { TransactionalEmailDeliveryReceipt } from "../../domain/communications/transactional-email.ts";
import type { OrganizationId } from "../../domain/organizations/model.ts";
import type {
  BusinessReferral, ReferralCommandReceipt, ReferralCommunicationIntent,
  ReferralEducationAcknowledgement, ReferralPersistenceBundle,
} from "../../domain/referrals/model.ts";
import type { ReferralRepository } from "../../domain/referrals/repository.ts";
import { FIRESTORE_SCHEMA_VERSION } from "./schema.ts";
import { getFirestoreRecordById, listFirestoreRecords } from "./support.ts";

const REFERRALS = "businessReferrals";
const EVENTS = "businessReferralEvents";
const COMMANDS = "businessReferralCommands";
const EDUCATION = "referralEducationAcknowledgements";
const COMMUNICATIONS = "referralCommunicationIntents";
const AUDITS = "organizationAuditEvents";

function immutable(value: object) {
  return Object.freeze({ ...value, schemaVersion: FIRESTORE_SCHEMA_VERSION, persistedAt: FieldValue.serverTimestamp() });
}

function mutable(value: object) {
  return Object.freeze({ ...value, schemaVersion: FIRESTORE_SCHEMA_VERSION, persistedAt: FieldValue.serverTimestamp(), persistenceUpdatedAt: FieldValue.serverTimestamp() });
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

  async attachInvitation(input: Parameters<ReferralRepository["attachInvitation"]>[0]): Promise<void> {
    await this.save({ referral: input.referral, event: input.event, command: input.command, audits: [input.audit], communication: null });
  }

  getCommunication(id: string) {
    return getFirestoreRecordById<ReferralCommunicationIntent>(this.db, "referralCommunicationIntents", id);
  }

  async recordCommunicationResult(input: Readonly<{ intent: ReferralCommunicationIntent; receipt?: TransactionalEmailDeliveryReceipt | null; errorCode?: string | null; retryable?: boolean }>): Promise<ReferralCommunicationIntent> {
    const ref = this.db.collection(COMMUNICATIONS).doc(input.intent.id);
    return this.db.runTransaction(async (transaction) => {
      const snapshot = await transaction.get(ref);
      if (!snapshot.exists) throw new Error("Referral communication intent is unavailable.");
      const current = snapshot.data() as ReferralCommunicationIntent;
      if (current.referralId !== input.intent.referralId || current.request.metadata.idempotencyKey !== input.intent.request.metadata.idempotencyKey) throw new Error("Referral communication intent identity mismatch.");
      if (current.status === "accepted") return current;
      const status = input.receipt?.status === "accepted" ? "accepted" as const : input.retryable ? "retryable-failure" as const : "terminal-failure" as const;
      const updated = Object.freeze({ ...current, status, attemptCount: current.attemptCount + 1, lastErrorCode: input.errorCode ?? input.receipt?.diagnosticCode ?? null, updatedAt: new Date().toISOString() });
      transaction.set(ref, mutable(updated));
      return updated;
    });
  }
}
