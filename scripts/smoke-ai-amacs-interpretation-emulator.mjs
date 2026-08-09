import assert from "node:assert/strict";
import { deleteApp as deleteAdminApp, initializeApp as initializeAdminApp } from "firebase-admin/app";
import { getFirestore as getAdminFirestore } from "firebase-admin/firestore";
import { deleteApp as deleteClientApp, initializeApp as initializeClientApp } from "firebase/app";
import { connectFirestoreEmulator, doc, getDoc, getFirestore, setDoc } from "firebase/firestore";

import { DEFAULT_INTERPRETATION_QUOTA_POLICY } from "../src/domain/ai-interpretation/model.ts";
import { FirestoreAiInterpretationRepository } from "../src/infrastructure/firestore/ai-interpretation-repository.ts";

assert.equal(process.env.FIRESTORE_EMULATOR_HOST, "127.0.0.1:8080");
const projectId = "demo-rfxchange";
const suffix = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
const adminApp = initializeAdminApp({ projectId }, `ai-amacs-admin-${suffix}`);
const clientApp = initializeClientApp({ apiKey: "demo-api-key", authDomain: `${projectId}.firebaseapp.com`, projectId, appId: `1:123:web:ai-amacs-${suffix}` }, `ai-amacs-client-${suffix}`);
const adminDb = getAdminFirestore(adminApp);
const clientDb = getFirestore(clientApp);
connectFirestoreEmulator(clientDb, "127.0.0.1", 8080);
const repository = new FirestoreAiInterpretationRepository(adminDb);
const now = "2026-08-08T12:00:00.000Z";
const scope = { organizationId: `org-ai-${suffix}`, membershipId: `membership-ai-${suffix}`, userId: `user-ai-${suffix}`, tenantId: `org-ai-${suffix}` };
const recordId = `interpretation-${suffix}`;
const candidateId = `candidate-${suffix}`;
const createdPaths = [];

try {
  for (const collection of ["aiInterpretationRecords", "aiInterpretationCandidates", "aiInterpretationProvenance", "aiInterpretationUsageEvents", "aiInterpretationEvents", "aiInterpretationQuotaBuckets"]) {
    await assert.rejects(getDoc(doc(clientDb, collection, `forged-${suffix}`)), (error) => /permission-denied/.test(error?.code));
    await assert.rejects(setDoc(doc(clientDb, collection, `forged-${suffix}`), { forged: true }), (error) => /permission-denied/.test(error?.code));
  }
  const record = { id: recordId, organizationId: scope.organizationId, record: { interpretation_record_id: recordId, organization_id: scope.organizationId, actor_user_id: scope.userId, purpose: "seller_capability_declaration", amacs_release: "0.5.0", mapping_method: "assisted", source_refs: ["participant:1"], candidate_ids: [candidateId], record_status: "awaiting_confirmation", human_confirmation_required: true, authoritative_effect: "none", implementation_provenance_ref: `prov-${suffix}`, created_at: now, updated_at: now }, createdAt: now, updatedAt: now };
  const candidate = { id: candidateId, organizationId: scope.organizationId, interpretationRecordId: recordId, candidate: { candidate_id: candidateId, interpretation_record_id: recordId, amacs_release: "0.5.0", target_kind: "organization_capability_assertion", source_evidence: [{ source_ref: "participant:1", source_type: "participant_text", locator: "", excerpt: "HVAC installation" }], candidate_value: { amacs_id: "AMACS-CAP-000016", label_snapshot: "HVAC installation" }, rationale: "Explicit participant statement.", confidence: 0.9, ambiguity_status: "none", mapping_method: "assisted", disposition: "suggested", authoritative_effect: "none", created_at: now }, createdAt: now, updatedAt: now };
  const provenance = { id: `prov-${suffix}`, organizationId: scope.organizationId, userId: scope.userId, purpose: "seller_capability_declaration", provider: "deterministic-fake", model: "eval-v1", providerRequestId: "fake", promptVersion: "v1", retrievalVersion: "v1", amacsRelease: "0.5.0", inputTokens: 10, outputTokens: 5, cachedInputTokens: 0, estimatedCostMicrousd: 1, costBasis: "configured-estimate", latencyMs: 2, outcome: "succeeded", failureClass: null, sourceRefs: ["participant:1"], sourceContentSha256: ["0".repeat(64)], sourceOriginalCharacters: 17, sourceMinimizedCharacters: 17, redactionCount: 0, providerStore: false, sourceRetention: "references-and-redacted-excerpts-only", recordedAt: now };
  const usage = { id: `usage-${suffix}`, organizationId: scope.organizationId, userId: scope.userId, tenantId: scope.tenantId, purpose: "seller_capability_declaration", provider: "deterministic-fake", model: "eval-v1", inputTokens: 10, outputTokens: 5, estimatedCostMicrousd: 1, latencyMs: 2, outcome: "succeeded", failureClass: null, retrievalCacheHit: false, occurredAt: now };
  await repository.saveCompleted({ record, candidates: [candidate], provenance, usage });
  createdPaths.push(["aiInterpretationRecords", recordId], ["aiInterpretationCandidates", candidateId], ["aiInterpretationProvenance", provenance.id], ["aiInterpretationUsageEvents", usage.id]);
  const persistedCandidate = await repository.getCandidate(candidateId);
  assert.equal(persistedCandidate?.candidate.authoritative_effect, "none");
  const accepted = await repository.applyCandidateDisposition({ scope, candidate: persistedCandidate, expectedUpdatedAt: persistedCandidate.updatedAt, disposition: "accepted", editedTextValue: null, now: "2026-08-08T12:01:00.000Z", event: { id: `event-accepted-${suffix}`, organizationId: scope.organizationId, interpretationRecordId: recordId, candidateId, actorUserId: scope.userId, kind: "disposition-recorded", priorDisposition: "suggested", newDisposition: "accepted", authoritativeEffect: "none", occurredAt: "2026-08-08T12:01:00.000Z" } });
  createdPaths.push(["aiInterpretationEvents", `event-accepted-${suffix}`]);
  assert.equal(accepted.record.record_status, "confirmed");
  assert.equal(accepted.record.authoritative_effect, "none");
  const smallPolicy = { ...DEFAULT_INTERPRETATION_QUOTA_POLICY, maxRequestsPerUserPerDay: 1 };
  await repository.reserve({ scope, policy: smallPolicy, estimatedInputTokens: 10, now });
  await assert.rejects(repository.reserve({ scope, policy: smallPolicy, estimatedInputTokens: 10, now }), /user.*quota is exhausted/i);
  for (const kind of ["user", "organization", "tenant"]) createdPaths.push(["aiInterpretationQuotaBuckets", `2026-08-08:${kind}:${kind === "user" ? scope.userId : scope.organizationId}`]);
  console.log("AI/AMACS interpretation Firestore isolation, persistence, disposition, and quota emulator smoke passed.");
} finally {
  await Promise.allSettled(createdPaths.map(([collection, id]) => adminDb.collection(collection).doc(id).delete()));
  await Promise.all([deleteClientApp(clientApp), deleteAdminApp(adminApp)]);
}
