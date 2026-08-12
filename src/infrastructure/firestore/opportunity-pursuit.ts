import { FieldValue, type Firestore } from "firebase-admin/firestore";

import type { OrganizationCapabilityClaim } from "../../domain/market-profile/model.ts";
import type { OrganizationId } from "../../domain/organizations/model.ts";
import type { OpportunityWatch } from "../../domain/rfx/discovery.ts";
import type { ResponderOpportunityProjection } from "../../domain/rfx/publication.ts";
import {
  opportunityCapabilityInputDigest,
  type OpportunityFitSnapshot,
  type OpportunityPursuit,
  type OpportunityPursuitCommandReceipt,
  type OpportunityPursuitRepository,
} from "../../domain/rfx/pursuit.ts";
import { FIRESTORE_SCHEMA_VERSION } from "./schema.ts";
import { getFirestoreRecordById, listFirestoreRecords } from "./support.ts";

const PROJECTIONS = "rfxOpportunityProjections";
const CLAIMS = "organizationCapabilityClaims";
const SERVICE_GEOGRAPHIES = "organizationServiceGeographies";
const FITS = "opportunityFitSnapshots";
const PURSUITS = "opportunityPursuits";
const COMMANDS = "opportunityPursuitCommands";
const EVENTS = "opportunityPursuitEvents";
const WATCHES = "opportunityWatches";
const AUDITS = "organizationAuditEvents";
const MEMBERSHIPS = "organizationMemberships";
const AUTHORIZATIONS = "organizationAuthorizations";
const RESTRICTIONS = "accessRestrictions";
const GEOGRAPHIES = "geographies";

function immutable(value: object) {
  return Object.freeze({ ...value, schemaVersion: FIRESTORE_SCHEMA_VERSION, persistedAt: FieldValue.serverTimestamp() });
}

function mutable(value: object) {
  return Object.freeze({ ...value, schemaVersion: FIRESTORE_SCHEMA_VERSION, persistedAt: FieldValue.serverTimestamp(), persistenceUpdatedAt: FieldValue.serverTimestamp() });
}

function sameCommand(left: OpportunityPursuitCommandReceipt, right: OpportunityPursuitCommandReceipt) {
  return left.organizationId === right.organizationId && left.action === right.action && left.requestFingerprint === right.requestFingerprint && left.pursuitId === right.pursuitId && left.resultingVersion === right.resultingVersion;
}

export class FirestoreOpportunityPursuitRepository implements OpportunityPursuitRepository {
  constructor(private readonly db: Firestore) {}

  getProjection(reference: string) {
    return getFirestoreRecordById<ResponderOpportunityProjection>(this.db, PROJECTIONS, reference);
  }

  listCapabilityClaims(organizationId: OrganizationId) {
    return listFirestoreRecords<OrganizationCapabilityClaim>(this.db.collection(CLAIMS).where("organizationId", "==", organizationId), CLAIMS);
  }

  async getServiceGeographyIds(organizationId: OrganizationId) {
    const record = await this.db.collection(SERVICE_GEOGRAPHIES).doc(String(organizationId)).get();
    return Object.freeze((record.data()?.serviceGeographyIds as readonly string[] | undefined) ?? []);
  }

  getPursuit(id: string) {
    return getFirestoreRecordById<OpportunityPursuit>(this.db, PURSUITS, id);
  }

  getFitSnapshot(id: string) {
    return getFirestoreRecordById<OpportunityFitSnapshot>(this.db, FITS, id);
  }

  getCommand(id: string) {
    return getFirestoreRecordById<OpportunityPursuitCommandReceipt>(this.db, COMMANDS, id);
  }

  recordFit(snapshot: OpportunityFitSnapshot): Promise<"created" | "replayed"> {
    const reference = this.db.collection(FITS).doc(snapshot.id);
    return this.db.runTransaction(async (transaction) => {
      const current = await transaction.get(reference);
      if (current.exists) {
        const prior = current.data() as OpportunityFitSnapshot;
        if (prior.organizationId === snapshot.organizationId && prior.opportunityReference === snapshot.opportunityReference && prior.explanation.opportunityProjectionDigest === snapshot.explanation.opportunityProjectionDigest && prior.explanation.organizationCapabilityInputDigest === snapshot.explanation.organizationCapabilityInputDigest) return "replayed" as const;
        throw new Error("Opportunity fit snapshot identity collision.");
      }
      transaction.create(reference, immutable(snapshot));
      return "created" as const;
    });
  }

  savePursuit(bundle: Parameters<OpportunityPursuitRepository["savePursuit"]>[0]): Promise<"created" | "replayed"> {
    const pursuitRef = this.db.collection(PURSUITS).doc(bundle.record.id);
    const fitRef = this.db.collection(FITS).doc(bundle.expectedFitSnapshotId);
    const projectionRef = this.db.collection(PROJECTIONS).doc(bundle.record.opportunityReference);
    const commandRef = this.db.collection(COMMANDS).doc(bundle.command.id);
    const eventRef = this.db.collection(EVENTS).doc(bundle.event.id);
    const auditRef = this.db.collection(AUDITS).doc(bundle.audit.id);
    const watchRef = this.db.collection(WATCHES).doc(bundle.actingUserWatchId);
    const membershipRef = this.db.collection(MEMBERSHIPS).doc(String(bundle.record.updatedByMembershipId));
    const authorizationRef = this.db.collection(AUTHORIZATIONS).doc(String(bundle.record.updatedByMembershipId));
    const serviceGeographyRef = this.db.collection(SERVICE_GEOGRAPHIES).doc(String(bundle.record.organizationId));
    return this.db.runTransaction(async (transaction) => {
      const [pursuitSnapshot, fitSnapshot, projectionSnapshot, commandSnapshot, eventSnapshot, auditSnapshot, watchSnapshot, membershipSnapshot, authorizationSnapshot, serviceGeographySnapshot, claimsSnapshot, organizationRestrictions, membershipRestrictions] = await Promise.all([
        transaction.get(pursuitRef), transaction.get(fitRef), transaction.get(projectionRef), transaction.get(commandRef), transaction.get(eventRef), transaction.get(auditRef), transaction.get(watchRef), transaction.get(membershipRef), transaction.get(authorizationRef), transaction.get(serviceGeographyRef),
        transaction.get(this.db.collection(CLAIMS).where("organizationId", "==", bundle.record.organizationId)),
        transaction.get(this.db.collection(RESTRICTIONS).where("target.kind", "==", "organization").where("target.organizationId", "==", bundle.record.organizationId)),
        transaction.get(this.db.collection(RESTRICTIONS).where("target.kind", "==", "membership").where("target.membershipId", "==", bundle.record.updatedByMembershipId)),
      ]);
      if (commandSnapshot.exists) {
        const prior = commandSnapshot.data() as OpportunityPursuitCommandReceipt;
        if (sameCommand(prior, bundle.command)) return "replayed" as const;
        throw new Error("Opportunity pursuit command identity collision.");
      }
      if (eventSnapshot.exists || auditSnapshot.exists) throw new Error("Opportunity pursuit evidence identity collision.");
      const current = pursuitSnapshot.data() as OpportunityPursuit | undefined;
      if (bundle.expectedVersion === null) {
        if (pursuitSnapshot.exists || bundle.record.version !== 1) throw new Error("Opportunity pursuit identity already exists.");
      } else if (!current || current.organizationId !== bundle.record.organizationId || current.version !== bundle.expectedVersion || bundle.record.version !== bundle.expectedVersion + 1) throw new Error("Opportunity pursuit changed before this command.");
      const fit = fitSnapshot.data() as OpportunityFitSnapshot | undefined;
      const projection = projectionSnapshot.data() as ResponderOpportunityProjection | undefined;
      const membership = membershipSnapshot.data() as { userId?: string; organizationId?: string; status?: string } | undefined;
      const authorization = authorizationSnapshot.data() as { userId?: string; organizationId?: string; permissions?: readonly string[] } | undefined;
      const claims = claimsSnapshot.docs.map((item) => item.data() as OrganizationCapabilityClaim);
      const serviceGeographyIds = (serviceGeographySnapshot.data()?.serviceGeographyIds as readonly string[] | undefined) ?? [];
      const activeRestriction = [...organizationRestrictions.docs, ...membershipRestrictions.docs].some((item) => item.get("state") !== "none");
      const deadline = projection?.payload.timing.responseDeadline;
      if (!fitSnapshot.exists || !fit || fit.organizationId !== bundle.record.organizationId || fit.opportunityReference !== bundle.record.opportunityReference || fit.explanation.opportunityProjectionDigest !== bundle.record.reviewedProjectionDigest || fit.explanation.organizationCapabilityInputDigest !== bundle.record.reviewedCapabilityInputDigest || !projectionSnapshot.exists || !projection || projection.mode !== "published" || !projection.publishedAt || projection.reference !== bundle.record.opportunityReference || projection.aggregateVersion !== bundle.record.reviewedProjectionVersion || projection.digest !== bundle.record.reviewedProjectionDigest || projection.issuerOrganizationIndexKey === String(bundle.record.organizationId) || !deadline || Date.parse(`${deadline}T23:59:59.999Z`) <= Date.now() || !membershipSnapshot.exists || !membership || membership.userId !== bundle.record.updatedByUserId || membership.organizationId !== bundle.record.organizationId || membership.status !== "active" || !authorizationSnapshot.exists || !authorization || authorization.userId !== bundle.record.updatedByUserId || authorization.organizationId !== bundle.record.organizationId || !authorization.permissions?.includes("response.create") || activeRestriction || opportunityCapabilityInputDigest(claims, serviceGeographyIds) !== bundle.record.reviewedCapabilityInputDigest || bundle.audit.organizationId !== bundle.record.organizationId || bundle.audit.actor.userId !== bundle.record.updatedByUserId || bundle.audit.actor.membershipId !== bundle.record.updatedByMembershipId) throw new Error("Opportunity pursuit authority or reviewed facts changed.");
      const geographySnapshots = await Promise.all(projection.payload.localities.map((item) => transaction.get(this.db.collection(GEOGRAPHIES).doc(item.id))));
      if (!geographySnapshots.length || geographySnapshots.some((item) => !item.exists || item.get("releaseState") !== "released")) throw new Error("Opportunity geography authority changed.");
      transaction.set(pursuitRef, mutable(bundle.record));
      if (watchSnapshot.exists) {
        const watch = watchSnapshot.data() as OpportunityWatch;
        if (watch.organizationId === bundle.record.organizationId && watch.userId === bundle.record.updatedByUserId && watch.opportunityReference === bundle.record.opportunityReference && watch.status === "watching") transaction.set(watchRef, mutable({ ...watch, status: "removed", version: watch.version + 1, updatedAt: bundle.record.updatedAt }));
      }
      transaction.create(commandRef, immutable(bundle.command));
      transaction.create(eventRef, immutable(bundle.event));
      transaction.create(auditRef, immutable(bundle.audit));
      return "created" as const;
    });
  }
}
