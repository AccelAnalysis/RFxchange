import assert from "node:assert/strict";
import test from "node:test";
import { ServerRfxCycleService } from "../../src/infrastructure/rfx/rfx-cycle-runtime.ts";
import { rfxEvaluationId, rfxOutcomeId, rfxResponseId } from "../../src/domain/rfx/cycle.ts";

test("responder runtime serializes only the issuer evaluation decision", async () => {
  const reference = "opportunity-privacy-test";
  const response = {
    id: rfxResponseId("org-responder", reference),
    rfxId: "rfx-privacy-test", opportunityReference: reference,
    responderOrganizationId: "org-responder", status: "submitted", items: [],
    acknowledgedAddendumIds: [], submissionReceiptId: null,
  };
  const storedEvaluation = {
    decision: "under-review", reviews: [{ evaluatorUserId: "private-evaluator", overallNote: "private-review" }],
    consensus: [{ averageScoreBasisPoints: 5000 }], consensusNote: "private-consensus",
    connectionNote: "private-connection", updatedByUserId: "private-actor",
  };
  // Exercise the public runtime method with deterministic persistence and authority
  // dependencies; no credentials or live participant data are used.
  const service = Object.create(ServerRfxCycleService.prototype);
  service.authorize = async () => undefined;
  service.can = async () => true;
  service.responderContext = async () => ({ snapshot: {
    reference, rfxId: response.rfxId, aggregate: { package: { timing: { responseDeadline: "2099-01-01" } } },
  } });
  service.addendaFor = service.questionsForResponder = service.teamFor = async () => [];
  const documents = new Map([
    [`rfxResponses/${response.id}`, response],
    [`rfxEvaluations/${rfxEvaluationId(response.id)}`, storedEvaluation],
    [`rfxExecutionOutcomes/${rfxOutcomeId(response.id)}`, null],
  ]);
  service.db = { collection: (collection) => ({ doc: (id) => ({ get: async () => {
    assert.ok(documents.has(`${collection}/${id}`));
    const data = documents.get(`${collection}/${id}`);
    return { exists: Boolean(data), data: () => data };
  } }) }) };
  const workspace = await service.responderWorkspace({ organizationId: "org-responder" }, reference);
  assert.deepEqual(workspace.evaluation, { decision: "under-review" });
  const serialized = JSON.stringify(workspace);
  for (const privateValue of ["private-evaluator", "private-review", "private-consensus", "private-connection", "private-actor", "averageScoreBasisPoints"]) {
    assert.equal(serialized.includes(privateValue), false, privateValue);
  }
  assert.equal(storedEvaluation.reviews[0].overallNote, "private-review");
});
