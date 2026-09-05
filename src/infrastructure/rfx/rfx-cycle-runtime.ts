import { createHash } from "node:crypto";

import type { DocumentSnapshot, Firestore } from "firebase-admin/firestore";

import { authorizeOrganizationOperation } from "../../application/auth/authorize-organization-operation.ts";
import type { AuthenticatedServerContext } from "../../application/auth/server-session.ts";
import type { OrganizationPermission } from "../../domain/authorization/model.ts";
import type { OrganizationId } from "../../domain/organizations/model.ts";
import {
  answerRfxQuestion,
  createRfxAddendum,
  createRfxQuestion,
  createRfxResponse,
  createSelectedOutcome,
  decideRfxEvaluation,
  responseReadiness,
  rfxAddendumId,
  rfxEvaluationId,
  rfxOutcomeId,
  rfxQuestionId,
  rfxResponseId,
  submitRfxResponse,
  updateRfxOutcome,
  updateRfxResponse,
  upsertRfxEvaluationReview,
  RfxCycleError,
  type RfxAddendum,
  type RfxEvaluation,
  type RfxExecutionOutcome,
  type RfxQuestion,
  type RfxResponse,
  type RfxSubmissionReceipt,
} from "../../domain/rfx/cycle.ts";
import { opportunityPursuitId, type OpportunityPursuit } from "../../domain/rfx/pursuit.ts";
import type { RfxPublicationSnapshot } from "../../domain/rfx/publication.ts";
import type { TeamParticipation } from "../../domain/rfx/teaming.ts";
import type { StoredAsset } from "../../domain/storage/model.ts";
import type { OrganizationMembershipId, UserId } from "../../domain/users/model.ts";
import { createServerFirebaseAccountSecurityService } from "../auth/firebase-account-security-runtime.ts";
import { createFirestoreFoundationRepositories } from "../firestore/repositories.ts";
import { getServerFirestore } from "../firestore/runtime.ts";

const RESPONSES = "rfxResponses";
const RECEIPTS = "rfxSubmissionReceipts";
const QUESTIONS = "rfxResponseQuestions";
const ADDENDA = "rfxAddenda";
const EVALUATIONS = "rfxEvaluations";
const SELECTIONS = "rfxSelections";
const OUTCOMES = "rfxExecutionOutcomes";
const PUBLICATIONS = "rfxPublicationSnapshots";
const PURSUITS = "opportunityPursuits";
const PARTICIPATIONS = "rfxTeamParticipations";
const ASSETS = "storedAssets";

export interface RfxCycleActor {
  readonly context: AuthenticatedServerContext;
  readonly organizationId: OrganizationId;
  readonly membershipId: OrganizationMembershipId;
  readonly userId: UserId;
}

export interface RfxResponderWorkspace {
  readonly snapshot: RfxPublicationSnapshot;
  readonly response: RfxResponse | null;
  readonly readiness: ReturnType<typeof responseReadiness> | null;
  readonly questions: readonly RfxQuestion[];
  readonly addenda: readonly RfxAddendum[];
  readonly team: readonly TeamParticipation[];
  readonly receipt: RfxSubmissionReceipt | null;
  readonly evaluation: Readonly<Pick<RfxEvaluation, "decision">> | null;
  readonly outcome: RfxExecutionOutcome | null;
  readonly canEdit: boolean;
  readonly canSubmit: boolean;
}

export interface RfxIssuerWorkspace {
  readonly snapshot: RfxPublicationSnapshot;
  readonly responses: readonly RfxResponse[];
  readonly receipts: readonly RfxSubmissionReceipt[];
  readonly questions: readonly RfxQuestion[];
  readonly addenda: readonly RfxAddendum[];
  readonly evaluations: readonly RfxEvaluation[];
  readonly outcomes: readonly RfxExecutionOutcome[];
  readonly canManageRfx: boolean;
  readonly canEvaluate: boolean;
}

function fingerprint(value: unknown): string {
  return createHash("sha256").update(JSON.stringify(value)).digest("hex");
}

function stable(value: string, label: string): string {
  const normalized = value.trim();
  if (!/^[A-Za-z0-9][A-Za-z0-9._:-]{0,190}$/.test(normalized)) {
    throw new RfxCycleError("invalid", `${label} is invalid.`);
  }
  return normalized;
}

function transactionId(prefix: string, ...values: readonly string[]): string {
  return `${prefix}_${createHash("sha256").update(values.join(":"), "utf8").digest("hex").slice(0, 40)}`;
}

function record<T>(snapshot: DocumentSnapshot): T | null {
  return snapshot.exists ? snapshot.data() as T : null;
}

function sorted<T extends { readonly createdAt: string }>(items: readonly T[]): readonly T[] {
  return Object.freeze([...items].sort((a, b) => a.createdAt.localeCompare(b.createdAt)));
}

function deadlineOpen(snapshot: RfxPublicationSnapshot): boolean {
  const deadline = snapshot.aggregate.package?.timing.responseDeadline;
  return Boolean(deadline && Date.parse(`${deadline}T23:59:59.999Z`) > Date.now());
}

export class ServerRfxCycleService {
  private readonly db: Firestore;
  private readonly authorization: ReturnType<typeof authorizationDependencies>;

  constructor(db: Firestore = getServerFirestore()) {
    this.db = db;
    this.authorization = authorizationDependencies(db);
  }

  private async authorize(actor: RfxCycleActor, permission: OrganizationPermission) {
    const decision = await authorizeOrganizationOperation({
      context: actor.context,
      organizationId: actor.organizationId,
      membershipId: actor.membershipId,
      permission,
    }, this.authorization);
    if (!decision.allowed) {
      throw new RfxCycleError("forbidden", `RFx cycle action is unavailable (${decision.reason}).`);
    }
    if (decision.context.user.id !== actor.userId) {
      throw new RfxCycleError("forbidden", "RFx cycle actor identity changed.");
    }
    return decision;
  }

  private async can(actor: RfxCycleActor, permission: OrganizationPermission): Promise<boolean> {
    const decision = await authorizeOrganizationOperation({
      context: actor.context,
      organizationId: actor.organizationId,
      membershipId: actor.membershipId,
      permission,
    }, this.authorization);
    return decision.allowed && decision.context.user.id === actor.userId;
  }

  private async publicationByReference(referenceValue: string): Promise<RfxPublicationSnapshot> {
    const reference = stable(referenceValue, "Opportunity reference");
    const query = await this.db.collection(PUBLICATIONS).where("reference", "==", reference).limit(2).get();
    if (query.size !== 1) throw new RfxCycleError(query.empty ? "not-found" : "conflict", "Published RFx evidence is unavailable.");
    const snapshot = query.docs[0].data() as RfxPublicationSnapshot;
    if (snapshot.reference !== reference || snapshot.aggregate.lifecycleState !== "published" || !snapshot.aggregate.definition) {
      throw new RfxCycleError("conflict", "Published RFx evidence is inconsistent.");
    }
    return snapshot;
  }

  private async publicationByRfxId(rfxIdValue: string): Promise<RfxPublicationSnapshot> {
    const rfxId = stable(rfxIdValue, "RFx identity");
    const query = await this.db.collection(PUBLICATIONS).where("rfxId", "==", rfxId).limit(2).get();
    if (query.size !== 1) throw new RfxCycleError(query.empty ? "not-found" : "conflict", "Published RFx evidence is unavailable.");
    const snapshot = query.docs[0].data() as RfxPublicationSnapshot;
    if (String(snapshot.rfxId) !== rfxId || snapshot.aggregate.lifecycleState !== "published" || !snapshot.aggregate.definition) {
      throw new RfxCycleError("conflict", "Published RFx evidence is inconsistent.");
    }
    return snapshot;
  }

  private assertDeadline(snapshot: RfxPublicationSnapshot): void {
    if (!deadlineOpen(snapshot)) {
      throw new RfxCycleError("conflict", "The response deadline has passed or is unavailable.");
    }
  }

  private async responderContext(actor: RfxCycleActor, reference: string, requireOpenDeadline = true) {
    const snapshot = await this.publicationByReference(reference);
    if (snapshot.issuerOrganizationId === actor.organizationId) {
      throw new RfxCycleError("forbidden", "The issuer cannot enter a responder workspace for its own RFx.");
    }
    if (requireOpenDeadline) this.assertDeadline(snapshot);
    const pursuitSnapshot = await this.db.collection(PURSUITS).doc(opportunityPursuitId(String(actor.organizationId), snapshot.reference)).get();
    const pursuit = record<OpportunityPursuit>(pursuitSnapshot);
    if (!pursuit || pursuit.organizationId !== actor.organizationId || pursuit.decision !== "pursue") {
      throw new RfxCycleError("conflict", "Choose Pursue before building a response.");
    }
    if (
      pursuit.reviewedProjectionVersion !== snapshot.aggregateVersion ||
      pursuit.reviewedProjectionDigest !== snapshot.projectionDigest
    ) {
      throw new RfxCycleError("conflict", "The published RFx changed after the pursuit decision. Review the current opportunity again.");
    }
    return Object.freeze({ snapshot, pursuit });
  }

  private async teamFor(organizationId: OrganizationId, reference: string): Promise<readonly TeamParticipation[]> {
    const query = await this.db.collection(PARTICIPATIONS).where("leadOrganizationId", "==", organizationId).get();
    return Object.freeze(query.docs
      .map((item) => item.data() as TeamParticipation)
      .filter((item) => item.opportunityReference === reference));
  }

  private async addendaFor(reference: string): Promise<readonly RfxAddendum[]> {
    const query = await this.db.collection(ADDENDA).where("opportunityReference", "==", reference).get();
    return sorted(query.docs.map((item) => item.data() as RfxAddendum));
  }

  private async questionsForResponder(reference: string, organizationId: OrganizationId): Promise<readonly RfxQuestion[]> {
    const query = await this.db.collection(QUESTIONS).where("opportunityReference", "==", reference).get();
    return sorted(query.docs.map((item) => item.data() as RfxQuestion).filter((item) => item.responderOrganizationId === organizationId));
  }

  private async verifyResponseAttachments(response: RfxResponse): Promise<void> {
    const assetIds = [...new Set(response.items.flatMap((item) => item.attachmentAssetIds))];
    if (!assetIds.length) return;
    const assets = await Promise.all(assetIds.map((id) => this.db.collection(ASSETS).doc(id).get()));
    for (const snapshot of assets) {
      const asset = record<StoredAsset>(snapshot);
      if (
        !asset ||
        asset.organizationId !== response.responderOrganizationId ||
        asset.status !== "active" ||
        asset.visibility !== "private" ||
        asset.category !== "rfx-response-attachment"
      ) {
        throw new RfxCycleError("invalid", "A response attachment is unavailable or belongs to another organization.");
      }
    }
  }

  async responderWorkspace(actor: RfxCycleActor, referenceValue: string): Promise<RfxResponderWorkspace> {
    await this.authorize(actor, "response.create");
    const { snapshot } = await this.responderContext(actor, referenceValue, false);
    const responseId = rfxResponseId(String(actor.organizationId), snapshot.reference);
    const [responseSnapshot, addenda, questions, team, canSubmit] = await Promise.all([
      this.db.collection(RESPONSES).doc(responseId).get(),
      this.addendaFor(snapshot.reference),
      this.questionsForResponder(snapshot.reference, actor.organizationId),
      this.teamFor(actor.organizationId, snapshot.reference),
      this.can(actor, "response.submit"),
    ]);
    const response = record<RfxResponse>(responseSnapshot);
    if (response && (
      response.responderOrganizationId !== actor.organizationId ||
      response.opportunityReference !== snapshot.reference ||
      response.rfxId !== snapshot.rfxId
    )) throw new RfxCycleError("conflict", "Response identity is inconsistent.");

    let receipt: RfxSubmissionReceipt | null = null;
    let evaluation: RfxResponderWorkspace["evaluation"] = null;
    let outcome: RfxExecutionOutcome | null = null;
    if (response) {
      const [receiptSnapshot, evaluationSnapshot, outcomeSnapshot] = await Promise.all([
        response.submissionReceiptId ? this.db.collection(RECEIPTS).doc(response.submissionReceiptId).get() : Promise.resolve(null),
        this.db.collection(EVALUATIONS).doc(rfxEvaluationId(response.id)).get(),
        this.db.collection(OUTCOMES).doc(rfxOutcomeId(response.id)).get(),
      ]);
      receipt = receiptSnapshot ? record<RfxSubmissionReceipt>(receiptSnapshot) : null;
      // Issuer reviews, scores, private notes and evaluator identities must never
      // cross the responder API or server-component serialization boundary.
      const issuerEvaluation = record<RfxEvaluation>(evaluationSnapshot);
      evaluation = issuerEvaluation ? Object.freeze({ decision: issuerEvaluation.decision }) : null;
      outcome = record<RfxExecutionOutcome>(outcomeSnapshot);
    }
    const open = deadlineOpen(snapshot);
    return Object.freeze({
      snapshot,
      response,
      readiness: response ? responseReadiness(response, addenda) : null,
      questions,
      addenda,
      team,
      receipt,
      evaluation,
      outcome,
      canEdit: open && response?.status !== "submitted",
      canSubmit: open && canSubmit,
    });
  }

  async startResponse(actor: RfxCycleActor, referenceValue: string): Promise<RfxResponse> {
    await this.authorize(actor, "response.create");
    const { snapshot } = await this.responderContext(actor, referenceValue);
    const team = await this.teamFor(actor.organizationId, snapshot.reference);
    const created = createRfxResponse({
      snapshot,
      responderOrganizationId: actor.organizationId,
      collaboratorOrganizationIds: team.map((item) => item.participantOrganizationId),
      actorUserId: actor.userId,
      actorMembershipId: actor.membershipId,
      now: new Date().toISOString(),
    });
    const reference = this.db.collection(RESPONSES).doc(created.id);
    return this.db.runTransaction(async (transaction) => {
      const existing = await transaction.get(reference);
      if (existing.exists) {
        const prior = existing.data() as RfxResponse;
        if (prior.responderOrganizationId !== actor.organizationId || prior.opportunityReference !== snapshot.reference) {
          throw new RfxCycleError("conflict", "Response identity collision.");
        }
        return prior;
      }
      transaction.create(reference, created);
      return created;
    });
  }

  async saveResponseItem(actor: RfxCycleActor, input: Readonly<{
    reference: string;
    expectedVersion: number;
    item: Parameters<typeof updateRfxResponse>[0]["item"];
    acknowledgedAddendumIds?: readonly string[];
  }>): Promise<Readonly<{ response: RfxResponse; readiness: ReturnType<typeof responseReadiness> }>> {
    await this.authorize(actor, "response.create");
    const { snapshot } = await this.responderContext(actor, input.reference);
    const responseRef = this.db.collection(RESPONSES).doc(rfxResponseId(String(actor.organizationId), snapshot.reference));
    const addenda = await this.addendaFor(snapshot.reference);
    const current = record<RfxResponse>(await responseRef.get());
    if (!current) throw new RfxCycleError("not-found", "Start the response before editing it.");
    const team = await this.teamFor(actor.organizationId, snapshot.reference);
    const next = updateRfxResponse({
      current,
      expectedVersion: input.expectedVersion,
      item: input.item,
      acknowledgedAddendumIds: input.acknowledgedAddendumIds,
      collaboratorOrganizationIds: team.map((item) => item.participantOrganizationId),
      actorUserId: actor.userId,
      actorMembershipId: actor.membershipId,
      now: new Date().toISOString(),
    });
    await this.verifyResponseAttachments(next);
    await this.db.runTransaction(async (transaction) => {
      const latest = record<RfxResponse>(await transaction.get(responseRef));
      if (!latest || latest.version !== current.version || latest.status !== "draft") {
        throw new RfxCycleError("conflict", "Response changed before this autosave completed.");
      }
      transaction.set(responseRef, next);
    });
    return Object.freeze({ response: next, readiness: responseReadiness(next, addenda) });
  }

  async submit(actor: RfxCycleActor, input: Readonly<{ reference: string; expectedVersion: number }>) {
    await this.authorize(actor, "response.submit");
    const { snapshot } = await this.responderContext(actor, input.reference);
    const responseRef = this.db.collection(RESPONSES).doc(rfxResponseId(String(actor.organizationId), snapshot.reference));
    const addenda = await this.addendaFor(snapshot.reference);
    const current = record<RfxResponse>(await responseRef.get());
    if (!current) throw new RfxCycleError("not-found", "Response workspace was not found.");
    if (current.status === "submitted" && current.submissionReceiptId) {
      const receipt = record<RfxSubmissionReceipt>(await this.db.collection(RECEIPTS).doc(current.submissionReceiptId).get());
      if (!receipt) throw new RfxCycleError("dependency-unavailable", "Submission receipt is temporarily unavailable.");
      return Object.freeze({ response: current, receipt, replayed: true as const });
    }
    if (
      current.publicationVersion !== snapshot.aggregateVersion ||
      current.publicationDigest !== snapshot.projectionDigest
    ) throw new RfxCycleError("conflict", "The RFx changed after this response workspace was created.");
    await this.verifyResponseAttachments(current);
    const readiness = responseReadiness(current, addenda);
    const submitted = submitRfxResponse({
      current,
      expectedVersion: input.expectedVersion,
      readiness,
      actorUserId: actor.userId,
      actorMembershipId: actor.membershipId,
      now: new Date().toISOString(),
    });
    const receiptRef = this.db.collection(RECEIPTS).doc(submitted.receipt.id);
    await this.db.runTransaction(async (transaction) => {
      const [latestSnapshot, existingReceipt] = await Promise.all([
        transaction.get(responseRef),
        transaction.get(receiptRef),
      ]);
      const latest = record<RfxResponse>(latestSnapshot);
      if (existingReceipt.exists) {
        const prior = existingReceipt.data() as RfxSubmissionReceipt;
        if (prior.responseId === current.id && prior.responseVersion === submitted.response.version) return;
        throw new RfxCycleError("conflict", "Submission receipt identity collision.");
      }
      if (!latest || latest.version !== current.version || latest.status !== "draft") {
        throw new RfxCycleError("conflict", "Response changed before submission was committed.");
      }
      transaction.set(responseRef, submitted.response);
      transaction.create(receiptRef, submitted.receipt);
    });
    return Object.freeze({ ...submitted, replayed: false as const });
  }

  async askQuestion(actor: RfxCycleActor, input: Readonly<{ commandId: string; reference: string; question: string }>) {
    await this.authorize(actor, "response.create");
    const { snapshot } = await this.responderContext(actor, input.reference);
    const id = rfxQuestionId(input.commandId);
    const question = createRfxQuestion({
      id,
      snapshot,
      responderOrganizationId: actor.organizationId,
      question: input.question,
      actorUserId: actor.userId,
      actorMembershipId: actor.membershipId,
      now: new Date().toISOString(),
    });
    const ref = this.db.collection(QUESTIONS).doc(id);
    const existing = record<RfxQuestion>(await ref.get());
    if (existing) {
      if (fingerprint(existing) !== fingerprint(question)) throw new RfxCycleError("conflict", "Question command identity was reused.");
      return Object.freeze({ question: existing, replayed: true as const });
    }
    await ref.create(question);
    return Object.freeze({ question, replayed: false as const });
  }

  async issuerWorkspace(actor: RfxCycleActor, rfxIdValue: string): Promise<RfxIssuerWorkspace> {
    const [canManageRfx, canEvaluate] = await Promise.all([
      this.can(actor, "rfx.publish"),
      this.can(actor, "evaluation.review"),
    ]);
    if (!canManageRfx && !canEvaluate) {
      throw new RfxCycleError("forbidden", "Issuer RFx management or evaluation permission is required.");
    }
    const snapshot = await this.publicationByRfxId(rfxIdValue);
    if (snapshot.issuerOrganizationId !== actor.organizationId) throw new RfxCycleError("forbidden", "Issuer workspace is limited to the issuing organization.");
    const [responseQuery, questionQuery, addendaQuery] = await Promise.all([
      this.db.collection(RESPONSES).where("opportunityReference", "==", snapshot.reference).get(),
      this.db.collection(QUESTIONS).where("opportunityReference", "==", snapshot.reference).get(),
      this.db.collection(ADDENDA).where("opportunityReference", "==", snapshot.reference).get(),
    ]);
    const responses = Object.freeze(responseQuery.docs.map((item) => item.data() as RfxResponse).filter((item) => item.status === "submitted"));
    const [receipts, evaluations, outcomes] = await Promise.all([
      Promise.all(responses.flatMap((response) => response.submissionReceiptId ? [this.db.collection(RECEIPTS).doc(response.submissionReceiptId).get()] : [])),
      Promise.all(responses.map((response) => this.db.collection(EVALUATIONS).doc(rfxEvaluationId(response.id)).get())),
      Promise.all(responses.map((response) => this.db.collection(OUTCOMES).doc(rfxOutcomeId(response.id)).get())),
    ]);
    return Object.freeze({
      snapshot,
      responses,
      receipts: Object.freeze(receipts.flatMap((item) => item.exists ? [item.data() as RfxSubmissionReceipt] : [])),
      questions: sorted(questionQuery.docs.map((item) => item.data() as RfxQuestion)),
      addenda: sorted(addendaQuery.docs.map((item) => item.data() as RfxAddendum)),
      evaluations: Object.freeze(evaluations.flatMap((item) => item.exists ? [item.data() as RfxEvaluation] : [])),
      outcomes: Object.freeze(outcomes.flatMap((item) => item.exists ? [item.data() as RfxExecutionOutcome] : [])),
      canManageRfx,
      canEvaluate,
    });
  }

  async answerQuestion(actor: RfxCycleActor, input: Readonly<{ questionId: string; answer: string }>) {
    await this.authorize(actor, "rfx.publish");
    const ref = this.db.collection(QUESTIONS).doc(stable(input.questionId, "Question identity"));
    const current = record<RfxQuestion>(await ref.get());
    if (!current) throw new RfxCycleError("not-found", "Question was not found.");
    if (current.issuerOrganizationId !== actor.organizationId) throw new RfxCycleError("forbidden", "Question belongs to another issuer.");
    const next = answerRfxQuestion({ current, answer: input.answer, actorUserId: actor.userId, actorMembershipId: actor.membershipId, now: new Date().toISOString() });
    await ref.set(next);
    return next;
  }

  async issueAddendum(actor: RfxCycleActor, input: Readonly<{
    commandId: string;
    rfxId: string;
    title: string;
    body: string;
    requiresAcknowledgment: boolean;
  }>) {
    await this.authorize(actor, "rfx.publish");
    const snapshot = await this.publicationByRfxId(input.rfxId);
    if (snapshot.issuerOrganizationId !== actor.organizationId) throw new RfxCycleError("forbidden", "Addenda are limited to the issuing organization.");
    this.assertDeadline(snapshot);
    const id = rfxAddendumId(input.commandId);
    const addendum = createRfxAddendum({
      id,
      snapshot,
      title: input.title,
      body: input.body,
      requiresAcknowledgment: input.requiresAcknowledgment,
      actorUserId: actor.userId,
      actorMembershipId: actor.membershipId,
      now: new Date().toISOString(),
    });
    const ref = this.db.collection(ADDENDA).doc(id);
    const existing = record<RfxAddendum>(await ref.get());
    if (existing) {
      if (fingerprint(existing) !== fingerprint(addendum)) throw new RfxCycleError("conflict", "Addendum command identity was reused.");
      return Object.freeze({ addendum: existing, replayed: true as const });
    }
    await ref.create(addendum);
    return Object.freeze({ addendum, replayed: false as const });
  }

  async saveEvaluationReview(actor: RfxCycleActor, input: Readonly<{
    responseId: string;
    factorInputs: readonly Readonly<{ factorId: string; gate?: string; scoreBasisPoints?: number | null; note?: string }>[];
    overallNote: string;
  }>) {
    await this.authorize(actor, "evaluation.review");
    const response = record<RfxResponse>(await this.db.collection(RESPONSES).doc(stable(input.responseId, "Response identity")).get());
    if (!response || response.status !== "submitted") throw new RfxCycleError("not-found", "Submitted response was not found.");
    if (response.issuerOrganizationId !== actor.organizationId) throw new RfxCycleError("forbidden", "Evaluation is limited to the issuing organization.");
    const snapshot = await this.publicationByReference(response.opportunityReference);
    if (response.publicationVersion !== snapshot.aggregateVersion || response.publicationDigest !== snapshot.projectionDigest) {
      throw new RfxCycleError("conflict", "Response publication evidence is inconsistent.");
    }
    const ref = this.db.collection(EVALUATIONS).doc(rfxEvaluationId(response.id));
    const current = record<RfxEvaluation>(await ref.get());
    if (current?.decision !== undefined && current.decision !== "under-review") throw new RfxCycleError("conflict", "Selection decision is already final.");
    const next = upsertRfxEvaluationReview({
      current,
      response,
      snapshot,
      factorInputs: input.factorInputs,
      overallNote: input.overallNote,
      actorUserId: actor.userId,
      actorMembershipId: actor.membershipId,
      now: new Date().toISOString(),
    });
    await this.db.runTransaction(async (transaction) => {
      const latest = record<RfxEvaluation>(await transaction.get(ref));
      if ((latest?.version ?? 0) !== (current?.version ?? 0)) throw new RfxCycleError("conflict", "Evaluation changed before this review was saved.");
      transaction.set(ref, next);
    });
    return next;
  }

  async decide(actor: RfxCycleActor, input: Readonly<{
    responseId: string;
    expectedVersion: number;
    decision: "selected" | "not-selected";
    consensusNote: string;
    connectionNote: string;
  }>) {
    await this.authorize(actor, "evaluation.review");
    const response = record<RfxResponse>(await this.db.collection(RESPONSES).doc(stable(input.responseId, "Response identity")).get());
    if (!response || response.status !== "submitted") throw new RfxCycleError("not-found", "Submitted response was not found.");
    if (response.issuerOrganizationId !== actor.organizationId) throw new RfxCycleError("forbidden", "Selection is limited to the issuing organization.");
    const evaluationRef = this.db.collection(EVALUATIONS).doc(rfxEvaluationId(response.id));
    const current = record<RfxEvaluation>(await evaluationRef.get());
    if (!current) throw new RfxCycleError("invalid", "Save at least one evaluator review before deciding.");
    const next = decideRfxEvaluation({
      current,
      expectedVersion: input.expectedVersion,
      decision: input.decision,
      consensusNote: input.consensusNote,
      connectionNote: input.connectionNote,
      actorUserId: actor.userId,
      actorMembershipId: actor.membershipId,
      now: new Date().toISOString(),
    });
    const outcome = input.decision === "selected" ? createSelectedOutcome({ evaluation: next, actorUserId: actor.userId, actorMembershipId: actor.membershipId, now: next.updatedAt }) : null;
    const outcomeRef = outcome ? this.db.collection(OUTCOMES).doc(outcome.id) : null;
    const selectionRef = input.decision === "selected"
      ? this.db.collection(SELECTIONS).doc(transactionId("rfxselection", response.opportunityReference))
      : null;
    await this.db.runTransaction(async (transaction) => {
      const [latestEvaluation, existingSelection, existingOutcome] = await Promise.all([
        transaction.get(evaluationRef),
        selectionRef ? transaction.get(selectionRef) : Promise.resolve(null),
        outcomeRef ? transaction.get(outcomeRef) : Promise.resolve(null),
      ]);
      const latest = record<RfxEvaluation>(latestEvaluation);
      if (!latest || latest.version !== current.version || latest.decision !== "under-review") throw new RfxCycleError("conflict", "Evaluation changed before selection was committed.");
      if (existingSelection?.exists) throw new RfxCycleError("conflict", "Another response has already been selected for this RFx.");
      if (existingOutcome?.exists) throw new RfxCycleError("conflict", "Execution outcome already exists.");
      transaction.set(evaluationRef, next);
      if (selectionRef) {
        transaction.create(selectionRef, Object.freeze({
          schemaVersion: 1,
          opportunityReference: response.opportunityReference,
          rfxId: response.rfxId,
          responseId: response.id,
          evaluationId: next.id,
          issuerOrganizationId: response.issuerOrganizationId,
          responderOrganizationId: response.responderOrganizationId,
          selectedByUserId: actor.userId,
          selectedByMembershipId: actor.membershipId,
          selectedAt: next.updatedAt,
        }));
      }
      if (outcomeRef && outcome) transaction.create(outcomeRef, outcome);
    });
    return Object.freeze({ evaluation: next, outcome });
  }

  async updateOutcome(actor: RfxCycleActor, input: Readonly<{
    outcomeId: string;
    expectedVersion: number;
    status: "connected" | "executing" | "completed";
    executionNote: string;
    outcomeSummary: string;
    outcomeValue: string;
  }>) {
    await this.authorize(actor, "evaluation.review");
    const ref = this.db.collection(OUTCOMES).doc(stable(input.outcomeId, "Outcome identity"));
    const current = record<RfxExecutionOutcome>(await ref.get());
    if (!current) throw new RfxCycleError("not-found", "Execution outcome was not found.");
    if (current.issuerOrganizationId !== actor.organizationId) throw new RfxCycleError("forbidden", "Outcome management is limited to the issuing organization.");
    const next = updateRfxOutcome({
      current,
      expectedVersion: input.expectedVersion,
      status: input.status,
      executionNote: input.executionNote,
      outcomeSummary: input.outcomeSummary,
      outcomeValue: input.outcomeValue,
      actorUserId: actor.userId,
      actorMembershipId: actor.membershipId,
      now: new Date().toISOString(),
    });
    await this.db.runTransaction(async (transaction) => {
      const latest = record<RfxExecutionOutcome>(await transaction.get(ref));
      if (!latest || latest.version !== current.version) throw new RfxCycleError("conflict", "Outcome changed before this update was saved.");
      transaction.set(ref, next);
      if (next.status === "completed") {
        const intelligenceRef = this.db.collection("rfxCycleIntelligenceEvents").doc(transactionId("rfxintel", next.id, String(next.version)));
        transaction.create(intelligenceRef, Object.freeze({
          schemaVersion: 1,
          kind: "rfx-outcome-completed",
          opportunityReference: next.opportunityReference,
          rfxId: next.rfxId,
          issuerOrganizationId: next.issuerOrganizationId,
          responderOrganizationId: next.responderOrganizationId,
          outcomeId: next.id,
          outcomeValue: next.outcomeValue,
          occurredAt: next.updatedAt,
        }));
      }
    });
    return next;
  }
}

function authorizationDependencies(db: Firestore) {
  const foundation = createFirestoreFoundationRepositories(db);
  return Object.freeze({
    accountSecurity: createServerFirebaseAccountSecurityService(),
    organizations: foundation.organizations.accounts,
    memberships: foundation.users.memberships,
    authorizations: foundation.organizationAuthorization,
    restrictions: foundation.lifecycle.restrictions,
  });
}

export function createServerRfxCycleService(db: Firestore = getServerFirestore()) {
  return new ServerRfxCycleService(db);
}
