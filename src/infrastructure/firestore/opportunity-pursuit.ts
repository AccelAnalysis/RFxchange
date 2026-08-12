import { FieldValue, type Firestore } from "firebase-admin/firestore";

import type { OrganizationCapabilityClaim } from "../../domain/market-profile/model.ts";
import type { OrganizationId } from "../../domain/organizations/model.ts";
import type { OpportunityWatch } from "../../domain/rfx/discovery.ts";
import { governedResponderOpportunityProjection, type ResponderOpportunityProjection, type RfxPublicationSnapshot } from "../../domain/rfx/publication.ts";
import {
  calculateOpportunityFit,
  opportunityCapabilityInputDigest,
  OpportunityPursuitRepositoryError,
  type OpportunityFitSnapshot,
  type OpportunityPursuit,
  type OpportunityPursuitCommandReceipt,
  type OpportunityPursuitRepository,
} from "../../domain/rfx/pursuit.ts";
import { FIRESTORE_SCHEMA_VERSION } from "./schema.ts";
import { getFirestoreRecordById, listFirestoreRecords } from "./support.ts";

const PROJECTIONS = "rfxOpportunityProjections";
const PUBLICATION_SNAPSHOTS = "rfxPublicationSnapshots";
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

function repositoryFailure(error: unknown, message: string): OpportunityPursuitRepositoryError {
  if (error instanceof OpportunityPursuitRepositoryError) return error;
  const code = typeof error === "object" && error !== null && "code" in error ? (error as { readonly code?: unknown }).code : null;
  return new OpportunityPursuitRepositoryError(code === 10 || code === "aborted" ? "conflict" : "dependency-unavailable", message, { cause: error });
}

export class FirestoreOpportunityPursuitRepository implements OpportunityPursuitRepository {
  constructor(private readonly db: Firestore) {}

  async getProjection(reference: string) {
    const projection = await getFirestoreRecordById<ResponderOpportunityProjection>(this.db, PROJECTIONS, reference);
    if (!projection) return null;
    const localities = await Promise.all(
      projection.payload.localities.map((item) => this.db.collection(GEOGRAPHIES).doc(item.id).get()),
    );
    return localities.length > 0 && localities.every((item) => item.exists && item.get("releaseState") === "released")
      ? projection
      : null;
  }

  getPublicationSnapshotByReference(reference: string) {
    return listFirestoreRecords<RfxPublicationSnapshot>(
      this.db.collection(PUBLICATION_SNAPSHOTS).where("reference", "==", reference).limit(1),
      PUBLICATION_SNAPSHOTS,
    ).then((records) => records[0] ?? null);
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
        throw new OpportunityPursuitRepositoryError("conflict", "Opportunity fit snapshot identity collision.");
      }
      transaction.create(reference, immutable(snapshot));
      return "created" as const;
    }).catch((error: unknown) => { throw repositoryFailure(error, "Opportunity fit persistence is temporarily unavailable."); });
  }

  savePursuit(bundle: Parameters<OpportunityPursuitRepository["savePursuit"]>[0]): Promise<"created" | "replayed"> {
    if (
      bundle.command.resultingVersion !== bundle.record.version ||
      bundle.command.resultingPursuit.id !== bundle.record.id ||
      JSON.stringify(bundle.command.resultingPursuit) !== JSON.stringify(bundle.record)
    ) throw new OpportunityPursuitRepositoryError("conflict", "Opportunity pursuit command result does not match the persisted record.");
    const pursuitRef = this.db.collection(PURSUITS).doc(bundle.record.id);
    const fitRef = this.db.collection(FITS).doc(bundle.expectedFitSnapshotId);
    const projectionRef = this.db.collection(PROJECTIONS).doc(bundle.record.opportunityReference);
    const publicationQuery = this.db.collection(PUBLICATION_SNAPSHOTS).where("reference", "==", bundle.record.opportunityReference).limit(2);
    const commandRef = this.db.collection(COMMANDS).doc(bundle.command.id);
    const eventRef = this.db.collection(EVENTS).doc(bundle.event.id);
    const auditRef = this.db.collection(AUDITS).doc(bundle.audit.id);
    const watchRef = this.db.collection(WATCHES).doc(bundle.actingUserWatchId);
    const membershipRef = this.db.collection(MEMBERSHIPS).doc(String(bundle.record.updatedByMembershipId));
    const authorizationRef = this.db.collection(AUTHORIZATIONS).doc(String(bundle.record.updatedByMembershipId));
    const serviceGeographyRef = this.db.collection(SERVICE_GEOGRAPHIES).doc(String(bundle.record.organizationId));
    return this.db.runTransaction(async (transaction) => {
      const [pursuitSnapshot, fitSnapshot, projectionSnapshot, publicationSnapshots, commandSnapshot, eventSnapshot, auditSnapshot, watchSnapshot, membershipSnapshot, authorizationSnapshot, serviceGeographySnapshot, claimsSnapshot, organizationRestrictions, membershipRestrictions] = await Promise.all([
        transaction.get(pursuitRef), transaction.get(fitRef), transaction.get(projectionRef), transaction.get(publicationQuery), transaction.get(commandRef), transaction.get(eventRef), transaction.get(auditRef), transaction.get(watchRef), transaction.get(membershipRef), transaction.get(authorizationRef), transaction.get(serviceGeographyRef),
        transaction.get(this.db.collection(CLAIMS).where("organizationId", "==", bundle.record.organizationId)),
        transaction.get(this.db.collection(RESTRICTIONS).where("target.kind", "==", "organization").where("target.organizationId", "==", bundle.record.organizationId)),
        transaction.get(this.db.collection(RESTRICTIONS).where("target.kind", "==", "membership").where("target.membershipId", "==", bundle.record.updatedByMembershipId)),
      ]);
      if (commandSnapshot.exists) {
        const prior = commandSnapshot.data() as OpportunityPursuitCommandReceipt;
        if (sameCommand(prior, bundle.command)) return "replayed" as const;
        throw new OpportunityPursuitRepositoryError("conflict", "Opportunity pursuit command identity collision.");
      }
      if (eventSnapshot.exists || auditSnapshot.exists) throw new OpportunityPursuitRepositoryError("conflict", "Opportunity pursuit evidence identity collision.");
      const current = pursuitSnapshot.data() as OpportunityPursuit | undefined;
      if (bundle.expectedVersion === null) {
        if (pursuitSnapshot.exists || bundle.record.version !== 1) throw new OpportunityPursuitRepositoryError("conflict", "Opportunity pursuit identity already exists.");
      } else if (!current || current.organizationId !== bundle.record.organizationId || current.version !== bundle.expectedVersion || bundle.record.version !== bundle.expectedVersion + 1) throw new OpportunityPursuitRepositoryError("conflict", "Opportunity pursuit changed before this command.");
      const fit = fitSnapshot.data() as OpportunityFitSnapshot | undefined;
      const persistedProjection = projectionSnapshot.data() as ResponderOpportunityProjection | undefined;
      const membership = membershipSnapshot.data() as { userId?: string; organizationId?: string; status?: string } | undefined;
      const authorization = authorizationSnapshot.data() as { userId?: string; organizationId?: string; permissions?: readonly string[] } | undefined;
      const claims = claimsSnapshot.docs.map((item) => item.data() as OrganizationCapabilityClaim);
      const serviceGeographyIds = (serviceGeographySnapshot.data()?.serviceGeographyIds as readonly string[] | undefined) ?? [];
      const activeRestriction = [...organizationRestrictions.docs, ...membershipRestrictions.docs].some((item) => item.get("state") !== "none");
      if (!fitSnapshot.exists || !fit || !projectionSnapshot.exists || !persistedProjection || publicationSnapshots.size !== 1) throw new OpportunityPursuitRepositoryError("dependency-unavailable", "Governed opportunity fit evidence is temporarily unavailable.");
      const publication = publicationSnapshots.docs[0].data() as RfxPublicationSnapshot;
      let projection: ResponderOpportunityProjection;
      try {
        projection = governedResponderOpportunityProjection(persistedProjection, publication);
      } catch {
        throw new OpportunityPursuitRepositoryError("conflict", "Opportunity publication evidence changed or is inconsistent.");
      }
      const deadline = projection.payload.timing.responseDeadline;
      if (fit.organizationId !== bundle.record.organizationId || fit.opportunityReference !== bundle.record.opportunityReference || fit.explanation.opportunityProjectionDigest !== bundle.record.reviewedProjectionDigest || fit.explanation.organizationCapabilityInputDigest !== bundle.record.reviewedCapabilityInputDigest || projection.mode !== "published" || !projection.publishedAt || (projection.audience !== "public" && projection.audience !== "authenticated-participants") || projection.reference !== bundle.record.opportunityReference || projection.aggregateVersion !== bundle.record.reviewedProjectionVersion || projection.digest !== bundle.record.reviewedProjectionDigest || projection.issuerOrganizationIndexKey === String(bundle.record.organizationId) || !deadline || Date.parse(`${deadline}T23:59:59.999Z`) <= Date.now() || !membershipSnapshot.exists || !membership || membership.userId !== bundle.record.updatedByUserId || membership.organizationId !== bundle.record.organizationId || membership.status !== "active" || !authorizationSnapshot.exists || !authorization || authorization.userId !== bundle.record.updatedByUserId || authorization.organizationId !== bundle.record.organizationId || !authorization.permissions?.includes("response.create") || activeRestriction || opportunityCapabilityInputDigest(claims, serviceGeographyIds) !== bundle.record.reviewedCapabilityInputDigest || bundle.audit.organizationId !== bundle.record.organizationId || bundle.audit.actor.userId !== bundle.record.updatedByUserId || bundle.audit.actor.membershipId !== bundle.record.updatedByMembershipId) throw new OpportunityPursuitRepositoryError("conflict", "Opportunity pursuit authority or reviewed facts changed.");
      const currentExplanation = calculateOpportunityFit({ organizationId: bundle.record.organizationId, projection, claims, serviceGeographyIds, calculatedAt: bundle.record.updatedAt });
      const currentGaps = new Map(currentExplanation.gaps.map((gap) => [gap.reference, gap]));
      const priorGaps = new Map((current?.gapAssessments ?? []).map((gap) => [gap.reference, gap]));
      const seenGaps = new Set<string>();
      for (const gap of bundle.record.gapAssessments) {
        if (seenGaps.has(gap.reference) || gap.reviewedExplanationInputDigest !== currentExplanation.inputDigest || gap.reviewedFitSnapshotId !== bundle.expectedFitSnapshotId) throw new OpportunityPursuitRepositoryError("conflict", "Opportunity gap assessment is stale or malformed.");
        seenGaps.add(gap.reference);
        const expected = currentGaps.get(gap.reference);
        if (expected) {
          if (gap.status === "resolved-by-current-profile") throw new OpportunityPursuitRepositoryError("conflict", "Opportunity gap cannot be resolved by participant assertion.");
          if ((gap.status !== "open" && gap.status !== "acknowledged" && gap.status !== "deferred") || gap.observationReference !== expected.observationReference || gap.kind !== expected.kind || gap.title !== expected.title || gap.capabilityLabel !== expected.capabilityLabel || gap.openedExplanationInputDigest !== (priorGaps.get(gap.reference)?.openedExplanationInputDigest ?? expected.explanationInputDigest)) throw new OpportunityPursuitRepositoryError("conflict", "Opportunity gap assessment does not match current authoritative facts.");
          continue;
        }
        const prior = priorGaps.get(gap.reference);
        const resolvedByProfile = Boolean(prior && gap.status === "resolved-by-current-profile" && (gap.kind === "missing-capability" || gap.kind === "unconfirmed-capability") && gap.observationReference === prior.observationReference && gap.kind === prior.kind && gap.title === prior.title && gap.capabilityLabel === prior.capabilityLabel && gap.openedExplanationInputDigest === prior.openedExplanationInputDigest && currentExplanation.requirementObservations.some((observation) => observation.reference === gap.observationReference && observation.state === "aligned"));
        if (!resolvedByProfile) throw new OpportunityPursuitRepositoryError("conflict", "Opportunity gap cannot be resolved by participant assertion.");
      }
      if ([...currentGaps.keys()].some((reference) => !seenGaps.has(reference))) throw new OpportunityPursuitRepositoryError("conflict", "Current opportunity gaps are missing from the assessment.");
      const geographySnapshots = await Promise.all(projection.payload.localities.map((item) => transaction.get(this.db.collection(GEOGRAPHIES).doc(item.id))));
      if (!geographySnapshots.length || geographySnapshots.some((item) => !item.exists || item.get("releaseState") !== "released")) throw new OpportunityPursuitRepositoryError("conflict", "Opportunity geography authority changed.");
      transaction.set(pursuitRef, mutable(bundle.record));
      if (watchSnapshot.exists) {
        const watch = watchSnapshot.data() as OpportunityWatch;
        if (watch.organizationId === bundle.record.organizationId && watch.userId === bundle.record.updatedByUserId && watch.opportunityReference === bundle.record.opportunityReference && watch.status === "watching") transaction.set(watchRef, mutable({ ...watch, status: "removed", version: watch.version + 1, updatedAt: bundle.record.updatedAt }));
      }
      transaction.create(commandRef, immutable(bundle.command));
      transaction.create(eventRef, immutable(bundle.event));
      transaction.create(auditRef, immutable(bundle.audit));
      return "created" as const;
    }).catch((error: unknown) => { throw repositoryFailure(error, "Opportunity pursuit persistence is temporarily unavailable."); });
  }
}
