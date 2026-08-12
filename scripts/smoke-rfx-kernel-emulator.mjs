import assert from "node:assert/strict";
import {
  deleteApp as deleteAdminApp,
  initializeApp as initializeAdminApp,
} from "firebase-admin/app";
import { getFirestore as getAdminFirestore } from "firebase-admin/firestore";
import {
  deleteApp as deleteClientApp,
  initializeApp as initializeClientApp,
} from "firebase/app";
import {
  connectFirestoreEmulator,
  doc,
  getDoc,
  getFirestore,
  setDoc,
} from "firebase/firestore";

import {
  createRfxDraft,
  changeRfxRequestFamily,
  normalizeRfxPackage,
  normalizeRfxDefinition,
  performanceLocationFromLocality,
  requestFamilySnapshotFromAmacs,
  saveRfxPackage,
  saveRfxDefinition,
} from "../src/domain/rfx/model.ts";
import { FirestoreRfxRepository } from "../src/infrastructure/firestore/rfx.ts";

assert.equal(process.env.FIRESTORE_EMULATOR_HOST, "127.0.0.1:8080");
const projectId = "demo-rfxchange";
const suffix = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
const adminApp = initializeAdminApp({ projectId }, `rfx-admin-${suffix}`);
const clientApp = initializeClientApp(
  {
    apiKey: "demo",
    authDomain: `${projectId}.firebaseapp.com`,
    projectId,
    appId: `1:123:web:rfx-${suffix}`,
  },
  `rfx-client-${suffix}`,
);
const adminDb = getAdminFirestore(adminApp);
const clientDb = getFirestore(clientApp);
connectFirestoreEmulator(clientDb, "127.0.0.1", 8080);
const repository = new FirestoreRfxRepository(adminDb);
const now = "2026-08-12T12:00:00.000Z";
const organizationId = `org-rfx-${suffix}`;
const aggregateId = `rfx-${suffix}`;
const release = {
  version: "0.5.0",
  sourceCommit: "da7879f2609271b067ae6d02875e9388a02c4fe5",
  releasedAt: now,
  projectionVersion: "1",
};
const record = (id, label) => ({
  request_family_id: id,
  preferred_label: label,
  purpose: "Gather governed market information.",
  default_endpoint: "information_reviewed",
  supports_award: false,
  default_response_template_id: "AMACS-RSPT-000001",
  default_decision_template_id: "AMACS-DECT-000001",
  lifecycle: ["draft", "published", "responses_received", "closed"],
  status: "active",
  default_governance_profile_id: "AMACS-GOV-000002",
  allowed_governance_profile_ids: ["AMACS-GOV-000001", "AMACS-GOV-000002"],
  recommended_requirement_bundle_ids: ["AMACS-RBND-000001"],
});
const firstFamily = requestFamilySnapshotFromAmacs({
  release,
  record: record("AMACS-REQ-000001", "Request for Information"),
  selectedAt: now,
});
const secondFamily = requestFamilySnapshotFromAmacs({
  release,
  record: record("AMACS-REQ-000002", "Request for Quotation"),
  selectedAt: now,
});
const created = createRfxDraft({
  id: aggregateId,
  issuerOrganizationId: organizationId,
  requestFamily: firstFamily,
  actorUserId: `user-${suffix}`,
  actorMembershipId: `membership-${suffix}`,
  now,
});
const ids = {
  rfxAggregates: [aggregateId],
  rfxEvents: [`event-create-${suffix}`, `event-change-${suffix}`, `event-package-${suffix}`, `event-definition-${suffix}`],
  rfxCommands: [`command-create-${suffix}`, `command-change-${suffix}`, `command-package-${suffix}`, `command-definition-${suffix}`],
  organizationAuditEvents: [`audit-create-${suffix}`, `audit-change-${suffix}`, `audit-package-${suffix}`, `audit-definition-${suffix}`],
};
const event = (id, aggregate, kind, commandId, priorRequestFamily = null, priorPackage = null, priorDefinition = null) => ({
  id,
  rfxId: aggregate.id,
  issuerOrganizationId: aggregate.issuerOrganizationId,
  kind,
  aggregateVersion: aggregate.version,
  actorUserId: `user-${suffix}`,
  actorMembershipId: `membership-${suffix}`,
  commandId,
  requestFamily: aggregate.requestFamily,
  priorRequestFamily,
  package: aggregate.package,
  priorPackage,
  definition: aggregate.definition,
  priorDefinition,
  occurredAt: now,
});
const command = (id, aggregate, action, fingerprint) => ({
  id,
  issuerOrganizationId: aggregate.issuerOrganizationId,
  rfxId: aggregate.id,
  action,
  requestFingerprint: fingerprint,
  resultingVersion: aggregate.version,
  recordedAt: now,
});
const audit = (id, action) => ({
  id,
  organizationId,
  actor: { userId: `user-${suffix}`, membershipId: `membership-${suffix}` },
  action,
  target: null,
  occurredAt: now,
});

try {
  for (const collection of Object.keys(ids)) {
    await assert.rejects(
      getDoc(doc(clientDb, collection, `forged-${suffix}`)),
      (error) => /permission-denied/.test(error?.code),
    );
    await assert.rejects(
      setDoc(doc(clientDb, collection, `forged-${suffix}`), { forged: true }),
      (error) => /permission-denied/.test(error?.code),
    );
  }

  const createBundle = {
    aggregate: created,
    expectedVersion: null,
    event: event(
      ids.rfxEvents[0],
      created,
      "rfx-draft-created",
      ids.rfxCommands[0],
    ),
    command: command(
      ids.rfxCommands[0],
      created,
      "create-draft",
      "a".repeat(64),
    ),
    audit: audit(ids.organizationAuditEvents[0], "rfx.draft-created"),
  };
  assert.equal(await repository.save(createBundle), "created");
  assert.equal(await repository.save(createBundle), "replayed");
  await assert.rejects(
    repository.save({
      ...createBundle,
      command: { ...createBundle.command, requestFingerprint: "b".repeat(64) },
    }),
    /command identity collision/,
  );

  const changed = changeRfxRequestFamily({
    aggregate: created,
    expectedVersion: 1,
    requestFamily: secondFamily,
    actorUserId: `user-${suffix}`,
    actorMembershipId: `membership-${suffix}`,
    now,
  });
  const changeBundle = {
    aggregate: changed,
    expectedVersion: 1,
    event: event(
      ids.rfxEvents[1],
      changed,
      "rfx-request-family-changed",
      ids.rfxCommands[1],
      firstFamily,
    ),
    command: command(
      ids.rfxCommands[1],
      changed,
      "change-request-family",
      "c".repeat(64),
    ),
    audit: audit(ids.organizationAuditEvents[1], "rfx.request-family-changed"),
  };
  assert.equal(await repository.save(changeBundle), "created");
  assert.equal((await repository.getById(changed.id)).version, 2);
  assert.equal(
    (await repository.listByIssuerOrganizationId(organizationId)).length,
    1,
  );
  assert.equal(
    (await repository.listByIssuerOrganizationId(`org-other-${suffix}`)).length,
    0,
  );
  await assert.rejects(
    repository.save({
      ...changeBundle,
      expectedVersion: 1,
      command: {
        ...changeBundle.command,
        id: `command-stale-${suffix}`,
        requestFingerprint: "d".repeat(64),
      },
      event: {
        ...changeBundle.event,
        id: `event-stale-${suffix}`,
        commandId: `command-stale-${suffix}`,
      },
      audit: { ...changeBundle.audit, id: `audit-stale-${suffix}` },
    }),
    /current version is 2/,
  );

  const packageRecord = normalizeRfxPackage({
    title: "Regional facilities resilience",
    marketNeed: { sourceStatement: "Improve continuity.", observedCondition: "Recovery is inconsistent.", desiredOutcome: "Restore service within four hours.", affectedContext: "Three public facilities.", successMeasures: ["Four-hour recovery"], knownFacts: ["Three sites"], assumptions: [], constraints: [], solutionPosture: "solution-open", proposedApproaches: [], prohibitedApproaches: [], unresolvedQuestions: [], interpretationRecordIds: [] },
    scope: "Assess, plan, and implement continuity improvements.",
    requestedOutputs: [{ id: "output-1", title: "Continuity plan", description: "Reviewed plan.", quantity: { amount: 1, unit: "plan" }, dueDate: "2026-10-01" }],
    timing: { anticipatedStartDate: "2026-09-01", anticipatedCompletionDate: "2026-12-01", responseDeadline: "2026-08-28" },
    performanceLocation: performanceLocationFromLocality({ localityId: "county-51013", localityLabel: "Arlington County", bounds: { west: -77.18, south: 38.82, east: -77.03, north: 38.93 } }),
    estimatedValue: { mode: "range", currency: "USD", minimumMinor: 1000000, maximumMinor: 2500000 },
    engagementTerm: { mode: "fixed", duration: { value: 3, unit: "months" }, note: null },
    requirements: [{ id: "requirement-1", kind: "evidence", title: "Continuity evidence", description: "Provide an example.", mandatory: true, quantity: null, dueDate: null, evidenceDescription: "Redacted example." }],
  });
  const packaged = saveRfxPackage({ aggregate: changed, expectedVersion: 2, package: packageRecord, actorUserId: `user-${suffix}`, actorMembershipId: `membership-${suffix}`, now });
  const packageBundle = {
    aggregate: packaged,
    expectedVersion: 2,
    event: event(ids.rfxEvents[2], packaged, "rfx-package-saved", ids.rfxCommands[2], null, changed.package),
    command: command(ids.rfxCommands[2], packaged, "save-package", "e".repeat(64)),
    audit: audit(ids.organizationAuditEvents[2], "rfx.package-saved"),
  };
  assert.equal(await repository.save(packageBundle), "created");
  assert.equal(await repository.save(packageBundle), "replayed");
  assert.equal((await repository.getById(packaged.id)).version, 3);
  assert.equal((await repository.getById(packaged.id)).package.moduleStatus["performance-location"], "complete");
  await assert.rejects(repository.save({ ...packageBundle, command: { ...packageBundle.command, id: `command-package-stale-${suffix}`, requestFingerprint: "f".repeat(64) }, event: { ...packageBundle.event, id: `event-package-stale-${suffix}`, commandId: `command-package-stale-${suffix}` }, audit: { ...packageBundle.audit, id: `audit-package-stale-${suffix}` } }), /current version is 3/);

  const snapshot = (kind, id, label, definition) => ({ kind, id, labelSnapshot: label, definitionSnapshot: definition, amacsReleaseVersion: "0.5.0", amacsSourceCommit: release.sourceCommit });
  const definitionRecord = normalizeRfxDefinition({
    requirements: [{ id: "defined-requirement-1", requirementType: snapshot("requirement-type", "AMACS-RTYP-000001", "Capability requirement", "A governed capability requirement."), requirementTypeCode: "CAPABILITY", allowedDecisionTreatments: ["gate_only", "scored_only"], teamCoverageAllowed: true, capability: snapshot("capability", "AMACS-CAP-000001", "Continuity planning", "Ability to plan operational continuity."), capabilityBreadcrumb: "Operations / Resilience / Continuity planning", title: "Continuity planning", description: "Demonstrate capability.", level: "required", decisionTreatment: "gate_only", satisfyingParty: "any-accepted-team-member", qualifiers: [], evidenceRequirementIds: [], linkedFoundationRequirementIds: ["requirement-1"] }],
    responseStructure: { sourceTemplate: snapshot("response-template", "AMACS-RSPT-000001", "Market Capability Response", "A governed response architecture."), sections: [{ id: "section-1", sourceSection: snapshot("response-section", "AMACS-RSP-000001", "Technical response", "Explain the proposed response."), title: "Technical response", instructions: "Explain the response.", format: "narrative", required: true, characterLimit: 5000, itemLimit: null, attachmentsAllowed: true, linkedRequirementIds: ["defined-requirement-1"] }] },
    evaluationDefinition: { sourceTemplate: snapshot("decision-template", "AMACS-DECT-000001", "Capability and Market Assessment", "A governed decision structure."), weightingRequired: false, factors: [{ id: "factor-1", sourceFactor: snapshot("decision-factor", "AMACS-DEC-000001", "Mandatory capability coverage", "Whether mandatory capabilities are covered."), sourceMethod: "gate", title: "Mandatory capability coverage", description: "Confirm coverage.", treatment: "required-condition", weightBasisPoints: null, linkedRequirementIds: ["defined-requirement-1"], linkedResponseSectionIds: ["section-1"], linkedEvidenceRequirementIds: [] }] },
    interpretationRecordIds: [],
  }, ["requirement-1"]);
  const defined = saveRfxDefinition({ aggregate: packaged, expectedVersion: 3, definition: definitionRecord, actorUserId: `user-${suffix}`, actorMembershipId: `membership-${suffix}`, now });
  const definitionBundle = {
    aggregate: defined,
    expectedVersion: 3,
    event: event(ids.rfxEvents[3], defined, "rfx-definition-saved", ids.rfxCommands[3], null, packaged.package, packaged.definition),
    command: command(ids.rfxCommands[3], defined, "save-definition", "1".repeat(64)),
    audit: audit(ids.organizationAuditEvents[3], "rfx.definition-saved"),
  };
  assert.equal(await repository.save(definitionBundle), "created");
  assert.equal(await repository.save(definitionBundle), "replayed");
  assert.equal((await repository.getById(defined.id)).version, 4);
  assert.deepEqual((await repository.getById(defined.id)).definition.moduleStatus, { requirements: "complete", responseStructure: "complete", evaluationDefinition: "complete" });
  await assert.rejects(repository.save({ ...definitionBundle, command: { ...definitionBundle.command, id: `command-definition-stale-${suffix}`, requestFingerprint: "2".repeat(64) }, event: { ...definitionBundle.event, id: `event-definition-stale-${suffix}`, commandId: `command-definition-stale-${suffix}` }, audit: { ...definitionBundle.audit, id: `audit-definition-stale-${suffix}` } }), /current version is 4/);

  for (const collection of [
    "rfxEvents",
    "rfxCommands",
    "organizationAuditEvents",
  ]) {
    await assert.rejects(
      setDoc(doc(clientDb, collection, ids[collection][0]), {
        overwritten: true,
      }),
      (error) => /permission-denied/.test(error?.code),
    );
  }
} finally {
  for (const [collection, documentIds] of Object.entries(ids)) {
    await Promise.all(
      documentIds.map((id) => adminDb.collection(collection).doc(id).delete()),
    );
  }
  for (const [collection, documentIds] of Object.entries(ids)) {
    const residuals = await Promise.all(
      documentIds.map((id) => adminDb.collection(collection).doc(id).get()),
    );
    assert.equal(
      residuals.some((snapshot) => snapshot.exists),
      false,
      `${collection} fixture residue remains.`,
    );
  }
  await Promise.all([deleteClientApp(clientApp), deleteAdminApp(adminApp)]);
}

console.log(
  "Slice 4.3 RFx definition atomicity, replay, conflict, tenant isolation, direct-client deny, immutability, and zero-residual acceptance passed.",
);
