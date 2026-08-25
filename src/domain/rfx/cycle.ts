import { createHash } from "node:crypto";

import type { OrganizationId } from "../organizations/model.ts";
import type { OrganizationMembershipId, UserId } from "../users/model.ts";
import type {
  RfxEvaluationFactor,
  RfxId,
  RfxResponseSectionDefinition,
  RfxResponseSectionFormat,
} from "./model.ts";
import type { RfxPublicationSnapshot } from "./publication.ts";

export const RFX_RESPONSE_SCHEMA_VERSION = 1 as const;
export const RFX_EVALUATION_SCHEMA_VERSION = 1 as const;
export const RFX_OUTCOME_SCHEMA_VERSION = 1 as const;

export type RfxResponseStatus = "draft" | "submitted";

export interface RfxResponseItem {
  readonly sectionId: string;
  readonly titleSnapshot: string;
  readonly instructionsSnapshot: string;
  readonly format: RfxResponseSectionFormat;
  readonly required: boolean;
  readonly characterLimit: number | null;
  readonly itemLimit: number | null;
  readonly attachmentsAllowed: boolean;
  readonly linkedRequirementIds: readonly string[];
  readonly text: string;
  readonly acknowledged: boolean;
  readonly priceMinor: number | null;
  readonly currency: string | null;
  readonly attachmentAssetIds: readonly string[];
  readonly updatedByUserId: UserId;
  readonly updatedAt: string;
}

export interface RfxResponseReadiness {
  readonly status: "ready" | "blocked";
  readonly requiredCount: number;
  readonly completedRequiredCount: number;
  readonly blocking: readonly Readonly<{
    kind: "response-section" | "addendum";
    reference: string;
    label: string;
  }>[];
}

export interface RfxResponse {
  readonly schemaVersion: typeof RFX_RESPONSE_SCHEMA_VERSION;
  readonly id: string;
  readonly opportunityReference: string;
  readonly rfxId: RfxId;
  readonly issuerOrganizationId: OrganizationId;
  readonly responderOrganizationId: OrganizationId;
  readonly publicationVersion: number;
  readonly publicationDigest: string;
  readonly status: RfxResponseStatus;
  readonly items: readonly RfxResponseItem[];
  readonly collaboratorOrganizationIds: readonly OrganizationId[];
  readonly acknowledgedAddendumIds: readonly string[];
  readonly version: number;
  readonly createdByUserId: UserId;
  readonly createdByMembershipId: OrganizationMembershipId;
  readonly updatedByUserId: UserId;
  readonly updatedByMembershipId: OrganizationMembershipId;
  readonly createdAt: string;
  readonly updatedAt: string;
  readonly submittedAt: string | null;
  readonly submissionReceiptId: string | null;
}

export interface RfxSubmissionReceipt {
  readonly schemaVersion: 1;
  readonly id: string;
  readonly responseId: string;
  readonly opportunityReference: string;
  readonly rfxId: RfxId;
  readonly issuerOrganizationId: OrganizationId;
  readonly responderOrganizationId: OrganizationId;
  readonly publicationVersion: number;
  readonly publicationDigest: string;
  readonly responseVersion: number;
  readonly responseDigest: string;
  readonly submittedByUserId: UserId;
  readonly submittedByMembershipId: OrganizationMembershipId;
  readonly submittedAt: string;
}

export interface RfxQuestion {
  readonly schemaVersion: 1;
  readonly id: string;
  readonly opportunityReference: string;
  readonly rfxId: RfxId;
  readonly issuerOrganizationId: OrganizationId;
  readonly responderOrganizationId: OrganizationId;
  readonly question: string;
  readonly answer: string | null;
  readonly status: "open" | "answered";
  readonly askedByUserId: UserId;
  readonly askedByMembershipId: OrganizationMembershipId;
  readonly answeredByUserId: UserId | null;
  readonly answeredByMembershipId: OrganizationMembershipId | null;
  readonly createdAt: string;
  readonly answeredAt: string | null;
}

export interface RfxAddendum {
  readonly schemaVersion: 1;
  readonly id: string;
  readonly opportunityReference: string;
  readonly rfxId: RfxId;
  readonly issuerOrganizationId: OrganizationId;
  readonly title: string;
  readonly body: string;
  readonly requiresAcknowledgment: boolean;
  readonly issuedByUserId: UserId;
  readonly issuedByMembershipId: OrganizationMembershipId;
  readonly createdAt: string;
}

export type RfxEvaluationGate = "not-reviewed" | "pass" | "fail";

export interface RfxEvaluationFactorReview {
  readonly factorId: string;
  readonly titleSnapshot: string;
  readonly treatment: RfxEvaluationFactor["treatment"];
  readonly weightBasisPoints: number | null;
  readonly gate: RfxEvaluationGate;
  readonly scoreBasisPoints: number | null;
  readonly note: string;
}

export interface RfxEvaluatorReview {
  readonly evaluatorUserId: UserId;
  readonly evaluatorMembershipId: OrganizationMembershipId;
  readonly factors: readonly RfxEvaluationFactorReview[];
  readonly overallNote: string;
  readonly updatedAt: string;
}

export interface RfxEvaluationConsensusFactor {
  readonly factorId: string;
  readonly titleSnapshot: string;
  readonly treatment: RfxEvaluationFactor["treatment"];
  readonly weightBasisPoints: number | null;
  readonly gate: RfxEvaluationGate;
  readonly averageScoreBasisPoints: number | null;
  readonly reviewCount: number;
}

export interface RfxEvaluation {
  readonly schemaVersion: typeof RFX_EVALUATION_SCHEMA_VERSION;
  readonly id: string;
  readonly responseId: string;
  readonly opportunityReference: string;
  readonly rfxId: RfxId;
  readonly issuerOrganizationId: OrganizationId;
  readonly responderOrganizationId: OrganizationId;
  readonly publicationVersion: number;
  readonly publicationDigest: string;
  readonly reviews: readonly RfxEvaluatorReview[];
  readonly consensus: readonly RfxEvaluationConsensusFactor[];
  readonly decision: "under-review" | "selected" | "not-selected";
  readonly consensusNote: string;
  readonly connectionNote: string;
  readonly version: number;
  readonly updatedByUserId: UserId;
  readonly updatedByMembershipId: OrganizationMembershipId;
  readonly createdAt: string;
  readonly updatedAt: string;
  readonly decidedAt: string | null;
}

export interface RfxExecutionOutcome {
  readonly schemaVersion: typeof RFX_OUTCOME_SCHEMA_VERSION;
  readonly id: string;
  readonly responseId: string;
  readonly opportunityReference: string;
  readonly rfxId: RfxId;
  readonly issuerOrganizationId: OrganizationId;
  readonly responderOrganizationId: OrganizationId;
  readonly status: "connected" | "executing" | "completed";
  readonly executionNote: string;
  readonly outcomeSummary: string;
  readonly outcomeValue: string;
  readonly version: number;
  readonly updatedByUserId: UserId;
  readonly updatedByMembershipId: OrganizationMembershipId;
  readonly createdAt: string;
  readonly updatedAt: string;
  readonly completedAt: string | null;
}

export class RfxCycleError extends Error {
  readonly code: "invalid" | "forbidden" | "not-found" | "conflict" | "dependency-unavailable";

  constructor(code: RfxCycleError["code"], message: string, options?: ErrorOptions) {
    super(message, options);
    this.name = "RfxCycleError";
    this.code = code;
  }
}

function timestamp(value: string): string {
  const parsed = Date.parse(value);
  if (!Number.isFinite(parsed)) throw new RfxCycleError("invalid", "Timestamp is invalid.");
  return new Date(parsed).toISOString();
}

function text(value: unknown, label: string, maximum: number, required = false): string {
  if (typeof value !== "string") {
    if (!required && (value === null || value === undefined)) return "";
    throw new RfxCycleError("invalid", `${label} is invalid.`);
  }
  const normalized = value.trim();
  if ((required && !normalized) || normalized.length > maximum) {
    throw new RfxCycleError("invalid", `${label} is invalid.`);
  }
  return normalized;
}

function stable(value: string, label = "Identity"): string {
  const normalized = text(value, label, 191, true);
  if (!/^[A-Za-z0-9][A-Za-z0-9._:-]{0,190}$/.test(normalized)) {
    throw new RfxCycleError("invalid", `${label} is invalid.`);
  }
  return normalized;
}

function opaque(prefix: string, ...values: readonly string[]): string {
  return `${prefix}_${createHash("sha256").update(values.join(":"), "utf8").digest("hex").slice(0, 40)}`;
}

export function rfxResponseId(organizationId: string, opportunityReference: string): string {
  return opaque("rfxresponse", stable(organizationId, "Organization identity"), stable(opportunityReference, "Opportunity reference"));
}

export function rfxEvaluationId(responseId: string): string {
  return opaque("rfxevaluation", stable(responseId, "Response identity"));
}

export function rfxOutcomeId(responseId: string): string {
  return opaque("rfxoutcome", stable(responseId, "Response identity"));
}

export function rfxQuestionId(commandId: string): string {
  return opaque("rfxquestion", stable(commandId, "Command identity"));
}

export function rfxAddendumId(commandId: string): string {
  return opaque("rfxaddendum", stable(commandId, "Command identity"));
}

export function rfxSubmissionReceiptId(responseId: string, responseVersion: number): string {
  return opaque("rfxreceipt", stable(responseId, "Response identity"), String(responseVersion));
}

function itemFromSection(section: RfxResponseSectionDefinition, userId: UserId, now: string): RfxResponseItem {
  return Object.freeze({
    sectionId: section.id,
    titleSnapshot: section.title,
    instructionsSnapshot: section.instructions,
    format: section.format,
    required: section.required,
    characterLimit: section.characterLimit,
    itemLimit: section.itemLimit,
    attachmentsAllowed: section.attachmentsAllowed,
    linkedRequirementIds: Object.freeze([...section.linkedRequirementIds]),
    text: "",
    acknowledged: false,
    priceMinor: null,
    currency: null,
    attachmentAssetIds: Object.freeze([]),
    updatedByUserId: userId,
    updatedAt: now,
  });
}

export function createRfxResponse(input: Readonly<{
  snapshot: RfxPublicationSnapshot;
  responderOrganizationId: OrganizationId;
  collaboratorOrganizationIds?: readonly OrganizationId[];
  actorUserId: UserId;
  actorMembershipId: OrganizationMembershipId;
  now: string;
}>): RfxResponse {
  const { snapshot } = input;
  if (snapshot.aggregate.lifecycleState !== "published" || !snapshot.aggregate.definition) {
    throw new RfxCycleError("conflict", "Published RFx response structure is unavailable.");
  }
  if (snapshot.issuerOrganizationId === input.responderOrganizationId) {
    throw new RfxCycleError("forbidden", "The issuing organization cannot respond to its own RFx.");
  }
  const now = timestamp(input.now);
  return Object.freeze({
    schemaVersion: RFX_RESPONSE_SCHEMA_VERSION,
    id: rfxResponseId(String(input.responderOrganizationId), snapshot.reference),
    opportunityReference: snapshot.reference,
    rfxId: snapshot.rfxId,
    issuerOrganizationId: snapshot.issuerOrganizationId,
    responderOrganizationId: input.responderOrganizationId,
    publicationVersion: snapshot.aggregateVersion,
    publicationDigest: snapshot.projectionDigest,
    status: "draft" as const,
    items: Object.freeze(
      [...snapshot.aggregate.definition.responseStructure.sections]
        .sort((left, right) => left.order - right.order)
        .map((section) => itemFromSection(section, input.actorUserId, now)),
    ),
    collaboratorOrganizationIds: Object.freeze([...new Set(input.collaboratorOrganizationIds ?? [])]),
    acknowledgedAddendumIds: Object.freeze([]),
    version: 1,
    createdByUserId: input.actorUserId,
    createdByMembershipId: input.actorMembershipId,
    updatedByUserId: input.actorUserId,
    updatedByMembershipId: input.actorMembershipId,
    createdAt: now,
    updatedAt: now,
    submittedAt: null,
    submissionReceiptId: null,
  });
}

function normalizedCurrency(value: unknown): string | null {
  if (value === null || value === undefined || value === "") return null;
  const normalized = text(value, "Currency", 3, true).toUpperCase();
  if (!/^[A-Z]{3}$/.test(normalized)) throw new RfxCycleError("invalid", "Currency is invalid.");
  return normalized;
}

function normalizedAttachmentIds(value: unknown, maximum: number | null): readonly string[] {
  if (value === null || value === undefined) return Object.freeze([]);
  if (!Array.isArray(value)) throw new RfxCycleError("invalid", "Response attachments are invalid.");
  const limit = maximum ?? 20;
  if (value.length > Math.min(limit, 20)) throw new RfxCycleError("invalid", "Too many response attachments were supplied.");
  return Object.freeze([...new Set(value.map((item) => stable(String(item), "Attachment identity")))]);
}

function completeItem(item: RfxResponseItem): boolean {
  if (!item.required) return true;
  if (item.format === "acknowledgment") return item.acknowledged;
  if (item.format === "pricing") return item.priceMinor !== null && item.priceMinor >= 0 && item.currency !== null;
  if (item.format === "attachment") return item.attachmentAssetIds.length > 0;
  return item.text.trim().length > 0;
}

export function responseReadiness(response: RfxResponse, requiredAddenda: readonly RfxAddendum[]): RfxResponseReadiness {
  const requiredItems = response.items.filter((item) => item.required);
  const blocking = [
    ...requiredItems.filter((item) => !completeItem(item)).map((item) => Object.freeze({
      kind: "response-section" as const,
      reference: item.sectionId,
      label: item.titleSnapshot,
    })),
    ...requiredAddenda
      .filter((item) => item.requiresAcknowledgment && !response.acknowledgedAddendumIds.includes(item.id))
      .map((item) => Object.freeze({ kind: "addendum" as const, reference: item.id, label: item.title })),
  ];
  return Object.freeze({
    status: blocking.length ? "blocked" as const : "ready" as const,
    requiredCount: requiredItems.length + requiredAddenda.filter((item) => item.requiresAcknowledgment).length,
    completedRequiredCount:
      requiredItems.filter(completeItem).length +
      requiredAddenda.filter((item) => item.requiresAcknowledgment && response.acknowledgedAddendumIds.includes(item.id)).length,
    blocking: Object.freeze(blocking),
  });
}

export function updateRfxResponse(input: Readonly<{
  current: RfxResponse;
  expectedVersion: number;
  item: Readonly<{
    sectionId: string;
    text?: unknown;
    acknowledged?: unknown;
    priceMinor?: unknown;
    currency?: unknown;
    attachmentAssetIds?: unknown;
  }>;
  acknowledgedAddendumIds?: readonly string[];
  collaboratorOrganizationIds?: readonly OrganizationId[];
  actorUserId: UserId;
  actorMembershipId: OrganizationMembershipId;
  now: string;
}>): RfxResponse {
  if (input.current.status !== "draft" || input.current.version !== input.expectedVersion) {
    throw new RfxCycleError("conflict", "Response changed before this save.");
  }
  const sectionId = stable(input.item.sectionId, "Response section identity");
  const currentItem = input.current.items.find((item) => item.sectionId === sectionId);
  if (!currentItem) throw new RfxCycleError("invalid", "Response section is unavailable.");
  const now = timestamp(input.now);
  let next = currentItem;
  if (currentItem.format === "acknowledgment") {
    next = Object.freeze({ ...currentItem, acknowledged: input.item.acknowledged === true, updatedByUserId: input.actorUserId, updatedAt: now });
  } else if (currentItem.format === "pricing") {
    const priceMinor = input.item.priceMinor === null || input.item.priceMinor === undefined || input.item.priceMinor === ""
      ? null
      : Number(input.item.priceMinor);
    if (priceMinor !== null && (!Number.isSafeInteger(priceMinor) || priceMinor < 0 || priceMinor > 9_000_000_000_000)) {
      throw new RfxCycleError("invalid", "Response price is invalid.");
    }
    next = Object.freeze({ ...currentItem, priceMinor, currency: normalizedCurrency(input.item.currency), updatedByUserId: input.actorUserId, updatedAt: now });
  } else if (currentItem.format === "attachment") {
    next = Object.freeze({ ...currentItem, attachmentAssetIds: normalizedAttachmentIds(input.item.attachmentAssetIds, currentItem.itemLimit), updatedByUserId: input.actorUserId, updatedAt: now });
  } else {
    const maximum = currentItem.characterLimit ?? 20_000;
    next = Object.freeze({
      ...currentItem,
      text: text(input.item.text ?? "", "Response text", Math.min(maximum, 20_000)),
      attachmentAssetIds: currentItem.attachmentsAllowed
        ? normalizedAttachmentIds(input.item.attachmentAssetIds, currentItem.itemLimit)
        : Object.freeze([]),
      updatedByUserId: input.actorUserId,
      updatedAt: now,
    });
  }
  const addenda = input.acknowledgedAddendumIds
    ? Object.freeze([...new Set(input.acknowledgedAddendumIds.map((item) => stable(item, "Addendum identity")))])
    : input.current.acknowledgedAddendumIds;
  return Object.freeze({
    ...input.current,
    items: Object.freeze(input.current.items.map((item) => item.sectionId === sectionId ? next : item)),
    collaboratorOrganizationIds: input.collaboratorOrganizationIds
      ? Object.freeze([...new Set(input.collaboratorOrganizationIds)])
      : input.current.collaboratorOrganizationIds,
    acknowledgedAddendumIds: addenda,
    version: input.current.version + 1,
    updatedByUserId: input.actorUserId,
    updatedByMembershipId: input.actorMembershipId,
    updatedAt: now,
  });
}

export function submitRfxResponse(input: Readonly<{
  current: RfxResponse;
  expectedVersion: number;
  readiness: RfxResponseReadiness;
  actorUserId: UserId;
  actorMembershipId: OrganizationMembershipId;
  now: string;
}>): Readonly<{ response: RfxResponse; receipt: RfxSubmissionReceipt }> {
  if (input.current.status !== "draft" || input.current.version !== input.expectedVersion) {
    throw new RfxCycleError("conflict", "Response changed before submission.");
  }
  if (input.readiness.status !== "ready") throw new RfxCycleError("invalid", "Response is not ready to submit.");
  const now = timestamp(input.now);
  const resultingVersion = input.current.version + 1;
  const receiptId = rfxSubmissionReceiptId(input.current.id, resultingVersion);
  const response = Object.freeze({
    ...input.current,
    status: "submitted" as const,
    version: resultingVersion,
    updatedByUserId: input.actorUserId,
    updatedByMembershipId: input.actorMembershipId,
    updatedAt: now,
    submittedAt: now,
    submissionReceiptId: receiptId,
  });
  const digest = createHash("sha256").update(JSON.stringify({
    responseId: response.id,
    opportunityReference: response.opportunityReference,
    publicationVersion: response.publicationVersion,
    publicationDigest: response.publicationDigest,
    items: response.items,
    collaboratorOrganizationIds: response.collaboratorOrganizationIds,
    acknowledgedAddendumIds: response.acknowledgedAddendumIds,
  })).digest("hex");
  const receipt: RfxSubmissionReceipt = Object.freeze({
    schemaVersion: 1,
    id: receiptId,
    responseId: response.id,
    opportunityReference: response.opportunityReference,
    rfxId: response.rfxId,
    issuerOrganizationId: response.issuerOrganizationId,
    responderOrganizationId: response.responderOrganizationId,
    publicationVersion: response.publicationVersion,
    publicationDigest: response.publicationDigest,
    responseVersion: response.version,
    responseDigest: digest,
    submittedByUserId: input.actorUserId,
    submittedByMembershipId: input.actorMembershipId,
    submittedAt: now,
  });
  return Object.freeze({ response, receipt });
}

export function createRfxQuestion(input: Readonly<{
  id: string;
  snapshot: RfxPublicationSnapshot;
  responderOrganizationId: OrganizationId;
  question: string;
  actorUserId: UserId;
  actorMembershipId: OrganizationMembershipId;
  now: string;
}>): RfxQuestion {
  return Object.freeze({
    schemaVersion: 1,
    id: stable(input.id, "Question identity"),
    opportunityReference: input.snapshot.reference,
    rfxId: input.snapshot.rfxId,
    issuerOrganizationId: input.snapshot.issuerOrganizationId,
    responderOrganizationId: input.responderOrganizationId,
    question: text(input.question, "Question", 2_000, true),
    answer: null,
    status: "open" as const,
    askedByUserId: input.actorUserId,
    askedByMembershipId: input.actorMembershipId,
    answeredByUserId: null,
    answeredByMembershipId: null,
    createdAt: timestamp(input.now),
    answeredAt: null,
  });
}

export function answerRfxQuestion(input: Readonly<{
  current: RfxQuestion;
  answer: string;
  actorUserId: UserId;
  actorMembershipId: OrganizationMembershipId;
  now: string;
}>): RfxQuestion {
  if (input.current.status === "answered") throw new RfxCycleError("conflict", "Question was already answered.");
  const now = timestamp(input.now);
  return Object.freeze({
    ...input.current,
    answer: text(input.answer, "Answer", 4_000, true),
    status: "answered" as const,
    answeredByUserId: input.actorUserId,
    answeredByMembershipId: input.actorMembershipId,
    answeredAt: now,
  });
}

export function createRfxAddendum(input: Readonly<{
  id: string;
  snapshot: RfxPublicationSnapshot;
  title: string;
  body: string;
  requiresAcknowledgment: boolean;
  actorUserId: UserId;
  actorMembershipId: OrganizationMembershipId;
  now: string;
}>): RfxAddendum {
  return Object.freeze({
    schemaVersion: 1,
    id: stable(input.id, "Addendum identity"),
    opportunityReference: input.snapshot.reference,
    rfxId: input.snapshot.rfxId,
    issuerOrganizationId: input.snapshot.issuerOrganizationId,
    title: text(input.title, "Addendum title", 240, true),
    body: text(input.body, "Addendum", 8_000, true),
    requiresAcknowledgment: input.requiresAcknowledgment,
    issuedByUserId: input.actorUserId,
    issuedByMembershipId: input.actorMembershipId,
    createdAt: timestamp(input.now),
  });
}

function reviewFactor(definition: RfxEvaluationFactor, input?: Partial<RfxEvaluationFactorReview>): RfxEvaluationFactorReview {
  const gateValues = new Set<RfxEvaluationGate>(["not-reviewed", "pass", "fail"]);
  const gate = gateValues.has(input?.gate as RfxEvaluationGate) ? input!.gate as RfxEvaluationGate : "not-reviewed";
  const score = input?.scoreBasisPoints === null || input?.scoreBasisPoints === undefined
    ? null
    : Number(input.scoreBasisPoints);
  if (score !== null && (!Number.isInteger(score) || score < 0 || score > 10_000)) {
    throw new RfxCycleError("invalid", "Evaluation score must be between 0 and 10000 basis points.");
  }
  return Object.freeze({
    factorId: definition.id,
    titleSnapshot: definition.title,
    treatment: definition.treatment,
    weightBasisPoints: definition.weightBasisPoints,
    gate,
    scoreBasisPoints: score,
    note: text(input?.note ?? "", "Evaluation note", 2_000),
  });
}

function consensusFor(definitions: readonly RfxEvaluationFactor[], reviews: readonly RfxEvaluatorReview[]): readonly RfxEvaluationConsensusFactor[] {
  return Object.freeze(definitions.map((definition) => {
    const values = reviews.map((review) => review.factors.find((factor) => factor.factorId === definition.id)).filter(Boolean) as RfxEvaluationFactorReview[];
    const scores = values.flatMap((factor) => factor.scoreBasisPoints === null ? [] : [factor.scoreBasisPoints]);
    const gates = values.map((factor) => factor.gate);
    const gate: RfxEvaluationGate = gates.includes("fail") ? "fail" : gates.length > 0 && gates.every((value) => value === "pass") ? "pass" : "not-reviewed";
    return Object.freeze({
      factorId: definition.id,
      titleSnapshot: definition.title,
      treatment: definition.treatment,
      weightBasisPoints: definition.weightBasisPoints,
      gate,
      averageScoreBasisPoints: scores.length ? Math.round(scores.reduce((total, value) => total + value, 0) / scores.length) : null,
      reviewCount: values.length,
    });
  }));
}

export function upsertRfxEvaluationReview(input: Readonly<{
  current: RfxEvaluation | null;
  response: RfxResponse;
  snapshot: RfxPublicationSnapshot;
  factorInputs: readonly Readonly<{ factorId: string; gate?: string; scoreBasisPoints?: number | null; note?: string }>[];
  overallNote: string;
  actorUserId: UserId;
  actorMembershipId: OrganizationMembershipId;
  now: string;
}>): RfxEvaluation {
  if (input.response.status !== "submitted" || !input.snapshot.aggregate.definition) {
    throw new RfxCycleError("conflict", "Only a submitted response can be evaluated.");
  }
  const now = timestamp(input.now);
  const definitions = [...input.snapshot.aggregate.definition.evaluationDefinition.factors].sort((a, b) => a.order - b.order);
  const byId = new Map(input.factorInputs.map((factor) => [stable(factor.factorId, "Evaluation factor identity"), factor]));
  const review: RfxEvaluatorReview = Object.freeze({
    evaluatorUserId: input.actorUserId,
    evaluatorMembershipId: input.actorMembershipId,
    factors: Object.freeze(definitions.map((definition) => reviewFactor(definition, byId.get(definition.id)))),
    overallNote: text(input.overallNote, "Evaluator note", 4_000),
    updatedAt: now,
  });
  const priorReviews = input.current?.reviews ?? [];
  const reviews = Object.freeze([
    ...priorReviews.filter((item) => item.evaluatorMembershipId !== input.actorMembershipId),
    review,
  ]);
  return Object.freeze({
    schemaVersion: RFX_EVALUATION_SCHEMA_VERSION,
    id: input.current?.id ?? rfxEvaluationId(input.response.id),
    responseId: input.response.id,
    opportunityReference: input.response.opportunityReference,
    rfxId: input.response.rfxId,
    issuerOrganizationId: input.response.issuerOrganizationId,
    responderOrganizationId: input.response.responderOrganizationId,
    publicationVersion: input.response.publicationVersion,
    publicationDigest: input.response.publicationDigest,
    reviews,
    consensus: consensusFor(definitions, reviews),
    decision: input.current?.decision ?? "under-review",
    consensusNote: input.current?.consensusNote ?? "",
    connectionNote: input.current?.connectionNote ?? "",
    version: (input.current?.version ?? 0) + 1,
    updatedByUserId: input.actorUserId,
    updatedByMembershipId: input.actorMembershipId,
    createdAt: input.current?.createdAt ?? now,
    updatedAt: now,
    decidedAt: input.current?.decidedAt ?? null,
  });
}

function consensusReady(evaluation: RfxEvaluation): boolean {
  if (!evaluation.reviews.length) return false;
  return evaluation.consensus.every((factor) => {
    if (factor.treatment === "required-condition" || factor.treatment === "required-and-scored") {
      if (factor.gate !== "pass") return false;
    }
    if (factor.treatment === "scored-factor" || factor.treatment === "required-and-scored") {
      if (factor.averageScoreBasisPoints === null) return false;
    }
    return true;
  });
}

export function decideRfxEvaluation(input: Readonly<{
  current: RfxEvaluation;
  expectedVersion: number;
  decision: "selected" | "not-selected";
  consensusNote: string;
  connectionNote: string;
  actorUserId: UserId;
  actorMembershipId: OrganizationMembershipId;
  now: string;
}>): RfxEvaluation {
  if (input.current.version !== input.expectedVersion || input.current.decision !== "under-review") {
    throw new RfxCycleError("conflict", "Evaluation changed before the decision was saved.");
  }
  if (!consensusReady(input.current)) throw new RfxCycleError("invalid", "Evaluation consensus is incomplete.");
  const now = timestamp(input.now);
  return Object.freeze({
    ...input.current,
    decision: input.decision,
    consensusNote: text(input.consensusNote, "Consensus note", 6_000, true),
    connectionNote: input.decision === "selected" ? text(input.connectionNote, "Connection note", 4_000, true) : "",
    version: input.current.version + 1,
    updatedByUserId: input.actorUserId,
    updatedByMembershipId: input.actorMembershipId,
    updatedAt: now,
    decidedAt: now,
  });
}

export function createSelectedOutcome(input: Readonly<{
  evaluation: RfxEvaluation;
  actorUserId: UserId;
  actorMembershipId: OrganizationMembershipId;
  now: string;
}>): RfxExecutionOutcome {
  if (input.evaluation.decision !== "selected") throw new RfxCycleError("invalid", "Only a selected response can enter execution.");
  const now = timestamp(input.now);
  return Object.freeze({
    schemaVersion: RFX_OUTCOME_SCHEMA_VERSION,
    id: rfxOutcomeId(input.evaluation.responseId),
    responseId: input.evaluation.responseId,
    opportunityReference: input.evaluation.opportunityReference,
    rfxId: input.evaluation.rfxId,
    issuerOrganizationId: input.evaluation.issuerOrganizationId,
    responderOrganizationId: input.evaluation.responderOrganizationId,
    status: "connected" as const,
    executionNote: input.evaluation.connectionNote,
    outcomeSummary: "",
    outcomeValue: "",
    version: 1,
    updatedByUserId: input.actorUserId,
    updatedByMembershipId: input.actorMembershipId,
    createdAt: now,
    updatedAt: now,
    completedAt: null,
  });
}

export function updateRfxOutcome(input: Readonly<{
  current: RfxExecutionOutcome;
  expectedVersion: number;
  status: "connected" | "executing" | "completed";
  executionNote: string;
  outcomeSummary: string;
  outcomeValue: string;
  actorUserId: UserId;
  actorMembershipId: OrganizationMembershipId;
  now: string;
}>): RfxExecutionOutcome {
  if (input.current.version !== input.expectedVersion) throw new RfxCycleError("conflict", "Execution outcome changed before this update.");
  const order = { connected: 0, executing: 1, completed: 2 } as const;
  if (order[input.status] < order[input.current.status]) throw new RfxCycleError("invalid", "Execution status cannot move backward.");
  const now = timestamp(input.now);
  return Object.freeze({
    ...input.current,
    status: input.status,
    executionNote: text(input.executionNote, "Execution note", 6_000),
    outcomeSummary: input.status === "completed" ? text(input.outcomeSummary, "Outcome summary", 8_000, true) : text(input.outcomeSummary, "Outcome summary", 8_000),
    outcomeValue: text(input.outcomeValue, "Outcome value", 2_000),
    version: input.current.version + 1,
    updatedByUserId: input.actorUserId,
    updatedByMembershipId: input.actorMembershipId,
    updatedAt: now,
    completedAt: input.status === "completed" ? now : input.current.completedAt,
  });
}
