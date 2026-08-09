import { FieldValue, type DocumentData, type Firestore } from "firebase-admin/firestore";

import type { TransactionalEmailDeliveryReceipt } from "../../domain/communications/transactional-email.ts";
import type { OrganizationId } from "../../domain/organizations/model.ts";
import type {
  ProviderAcquisitionInvitation,
  ProviderDiscoveryPublication,
  ProviderNetworkCommandReceipt,
  ProviderRequestMessage,
  ProviderResource,
} from "../../domain/resource-network/model.ts";
import type { ResourceNetworkRepository } from "../../domain/resource-network/repository.ts";
import { FIRESTORE_SCHEMA_VERSION } from "./schema.ts";

const PUBLICATIONS = "providerDiscoveryPublications";
const RESOURCES = "providerResources";
const EVENTS = "providerNetworkEvents";
const COMMANDS = "providerNetworkCommands";
const MESSAGES = "providerRequestMessages";
const INVITATIONS = "providerAcquisitionInvitations";
const AUDITS = "organizationAuditEvents";

function mutable(value: object, persistedAt?: unknown): DocumentData {
  return { ...value, schemaVersion: FIRESTORE_SCHEMA_VERSION, persistedAt: persistedAt ?? FieldValue.serverTimestamp(), persistenceUpdatedAt: FieldValue.serverTimestamp() };
}

function immutable(value: object): DocumentData {
  return { ...value, schemaVersion: FIRESTORE_SCHEMA_VERSION, persistedAt: FieldValue.serverTimestamp() };
}

function domain<T>(snapshot: FirebaseFirestore.DocumentSnapshot): T | null {
  if (!snapshot.exists) return null;
  const data = { ...snapshot.data() } as Record<string, unknown>;
  delete data.schemaVersion;
  delete data.persistedAt;
  delete data.persistenceUpdatedAt;
  return Object.freeze(data) as T;
}

async function records<T>(query: FirebaseFirestore.Query): Promise<readonly T[]> {
  const snapshot = await query.get();
  return Object.freeze(snapshot.docs.flatMap((record) => {
    const value = domain<T>(record);
    return value ? [value] : [];
  }));
}

export class FirestoreResourceNetworkRepository implements ResourceNetworkRepository {
  constructor(private readonly db: Firestore) {}

  async getPublication(organizationId: OrganizationId) { return domain<ProviderDiscoveryPublication>(await this.db.collection(PUBLICATIONS).doc(String(organizationId)).get()); }
  async listPublishedPublications() { return records<ProviderDiscoveryPublication>(this.db.collection(PUBLICATIONS).where("status", "==", "published")); }
  async getResource(id: string) { return domain<ProviderResource>(await this.db.collection(RESOURCES).doc(id).get()); }
  async listResourcesByOrganization(organizationId: OrganizationId) { return records<ProviderResource>(this.db.collection(RESOURCES).where("organizationId", "==", organizationId)); }
  async listPublishedResources() { return records<ProviderResource>(this.db.collection(RESOURCES).where("status", "==", "published")); }
  async listMessages(referralId: string) {
    const values = await records<ProviderRequestMessage>(this.db.collection(MESSAGES).where("referralId", "==", referralId));
    return Object.freeze([...values].sort((left, right) => left.createdAt.localeCompare(right.createdAt)));
  }
  async getCommand(id: string) { return domain<ProviderNetworkCommandReceipt>(await this.db.collection(COMMANDS).doc(id).get()); }
  async getInvitation(id: string) { return domain<ProviderAcquisitionInvitation>(await this.db.collection(INVITATIONS).doc(id).get()); }
  async listInvitationsByOrganization(organizationId: OrganizationId) {
    const values = await records<ProviderAcquisitionInvitation>(this.db.collection(INVITATIONS).where("organizationId", "==", organizationId));
    return Object.freeze([...values].sort((left, right) => right.createdAt.localeCompare(left.createdAt)));
  }

  async savePublication(input: Parameters<ResourceNetworkRepository["savePublication"]>[0]): Promise<void> {
    await this.saveAggregate(PUBLICATIONS, input.publication.id, input.publication, input.expectedVersion, input);
  }

  async saveResource(input: Parameters<ResourceNetworkRepository["saveResource"]>[0]): Promise<void> {
    await this.saveAggregate(RESOURCES, input.resource.id, input.resource, input.expectedVersion, input);
  }

  private async saveAggregate(collection: string, id: string, value: ProviderDiscoveryPublication | ProviderResource, expectedVersion: number | null, evidence: Pick<Parameters<ResourceNetworkRepository["savePublication"]>[0], "event" | "command" | "audit">): Promise<void> {
    const aggregate = this.db.collection(collection).doc(id);
    const event = this.db.collection(EVENTS).doc(evidence.event.id);
    const command = this.db.collection(COMMANDS).doc(evidence.command.id);
    const audit = this.db.collection(AUDITS).doc(evidence.audit.id);
    await this.db.runTransaction(async (transaction) => {
      const [current, eventSnapshot, commandSnapshot, auditSnapshot] = await transaction.getAll(aggregate, event, command, audit);
      const currentVersion = current.exists ? Number(current.data()?.version) : null;
      if (currentVersion !== expectedVersion) throw new Error(`Resource Network aggregate changed; current version is ${String(currentVersion)}.`);
      if (eventSnapshot.exists || commandSnapshot.exists || auditSnapshot.exists) throw new Error("Resource Network evidence identity collision.");
      transaction.set(aggregate, mutable(value, current.data()?.persistedAt));
      transaction.create(event, immutable(evidence.event));
      transaction.create(command, immutable(evidence.command));
      transaction.create(audit, immutable(evidence.audit));
    });
  }

  async appendMessage(input: Parameters<ResourceNetworkRepository["appendMessage"]>[0]): Promise<void> {
    const message = this.db.collection(MESSAGES).doc(input.message.id);
    const event = this.db.collection(EVENTS).doc(input.event.id);
    const command = this.db.collection(COMMANDS).doc(input.command.id);
    const audit = this.db.collection(AUDITS).doc(input.audit.id);
    await this.db.runTransaction(async (transaction) => {
      const snapshots = await transaction.getAll(message, event, command, audit);
      if (snapshots.some((snapshot) => snapshot.exists)) throw new Error("Provider request message evidence identity collision.");
      transaction.create(message, immutable(input.message));
      transaction.create(event, immutable(input.event));
      transaction.create(command, immutable(input.command));
      transaction.create(audit, immutable(input.audit));
    });
  }

  async saveInvitation(input: Parameters<ResourceNetworkRepository["saveInvitation"]>[0]): Promise<void> {
    const invitation = this.db.collection(INVITATIONS).doc(input.invitation.id);
    const event = this.db.collection(EVENTS).doc(input.event.id);
    const command = this.db.collection(COMMANDS).doc(input.command.id);
    const audit = this.db.collection(AUDITS).doc(input.audit.id);
    await this.db.runTransaction(async (transaction) => {
      const snapshots = await transaction.getAll(invitation, event, command, audit);
      if (snapshots.some((snapshot) => snapshot.exists)) throw new Error("Provider invitation evidence identity collision.");
      transaction.create(invitation, mutable(input.invitation));
      transaction.create(event, immutable(input.event));
      transaction.create(command, immutable(input.command));
      transaction.create(audit, immutable(input.audit));
    });
  }

  async recordInvitationDelivery(input: Readonly<{ invitation: ProviderAcquisitionInvitation; receipt?: TransactionalEmailDeliveryReceipt | null; errorCode?: string | null; retryable?: boolean }>): Promise<ProviderAcquisitionInvitation> {
    const ref = this.db.collection(INVITATIONS).doc(input.invitation.id);
    return this.db.runTransaction(async (transaction) => {
      const snapshot = await transaction.get(ref);
      const current = domain<ProviderAcquisitionInvitation>(snapshot);
      if (!current || current.communication.metadata.idempotencyKey !== input.invitation.communication.metadata.idempotencyKey) throw new Error("Provider invitation is unavailable.");
      if (current.deliveryStatus === "accepted") return current;
      const updated = Object.freeze({ ...current, deliveryStatus: input.receipt?.status === "accepted" ? "accepted" as const : input.retryable ? "retryable-failure" as const : "terminal-failure" as const, attemptCount: current.attemptCount + 1, lastErrorCode: input.errorCode ?? input.receipt?.diagnosticCode ?? null, updatedAt: new Date().toISOString() });
      transaction.set(ref, mutable(updated, snapshot.data()?.persistedAt));
      return updated;
    });
  }
}
