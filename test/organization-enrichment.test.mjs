import assert from "node:assert/strict";
import test from "node:test";

import { authenticatedServerContext } from "../src/application/auth/server-session.ts";
import { OrganizationEnrichmentError, OrganizationEnrichmentService } from "../src/application/organization-enrichment/organization-enrichment.ts";
import { createOrganizationUserAuthorization } from "../src/domain/authorization/model.ts";
import { standardOrganizationRolePreset } from "../src/domain/authorization/organization-role-presets.ts";
import {
  createOrganizationCredential,
  projectPublicCredential,
  projectPublicProfileAsset,
} from "../src/domain/organization-enrichment/model.ts";
import { OrganizationEnrichmentPersistenceConflictError } from "../src/domain/organization-enrichment/repository.ts";
import { structuredPostalAddress } from "../src/domain/organization-location/model.ts";
import { createOrganizationAccount } from "../src/domain/organizations/model.ts";
import { createStoredAssetDraft, activateStoredAsset } from "../src/domain/storage/model.ts";
import { createOrganizationMembership, createUserIdentity } from "../src/domain/users/model.ts";
import { HAMPTON_ROADS_CONTROLLED_LOCALITY_DEFINITIONS, PORTSMOUTH_CONTROLLED_LOCALITY } from "../src/data/geography/hampton-roads-controlled-locality.ts";
import { StaticGeographyDefinitionRepository } from "../src/infrastructure/geography/static-geography-definitions.ts";
import { TigerWebBoundarySnapshotRepository } from "../src/infrastructure/geography/tigerweb-boundary-snapshot.ts";

const NOW = "2026-08-09T12:00:00.000Z";
const ADDRESS = structuredPostalAddress({ addressLine1: "801 Crawford St", locality: "Portsmouth", regionCode: "VA", postalCode: "23704" });
const COORDINATE = Object.freeze([-76.3021, 36.8354]);

function fixture(role = "primary-administrator") {
  const organization = createOrganizationAccount({ id: "org-enrichment", now: NOW });
  const user = createUserIdentity({ id: "user-enrichment", name: "Enrichment Manager", primaryEmail: "manager@example.test", loginProvider: "firebase", loginSubject: "subject-enrichment", now: NOW });
  const membership = createOrganizationMembership(user, organization, { id: "membership-enrichment", now: NOW });
  const preset = standardOrganizationRolePreset(role);
  const authorization = createOrganizationUserAuthorization(membership, organization, { roleKey: preset.key, permissions: preset.permissions, now: NOW });
  const context = authenticatedServerContext({ user, claims: { provider: "firebase", subject: user.login.subject, email: user.primaryEmail, displayName: user.name, emailVerified: true, isAnonymous: false, authenticatedAt: NOW, issuedAt: NOW, expiresAt: "2026-08-10T12:00:00.000Z" }, source: "session-cookie" });
  return { organization, user, membership, authorization, context };
}

function activeStoredAsset(fx, input = {}) {
  const draft = createStoredAssetDraft({ id: input.id ?? "stored-profile-image", organizationId: fx.organization.id,
    category: input.category ?? "organization-media", originalFilename: input.filename ?? "portfolio.png",
    contentType: input.contentType ?? "image/png", sizeBytes: input.bytes?.length ?? 4,
    createdByUserId: fx.user.id, now: NOW });
  return activateStoredAsset(draft, { objectPath: draft.objectPath, contentType: draft.contentType,
    sizeBytes: draft.sizeBytes, sha256: "a".repeat(64) }, NOW);
}

function memory(fx, options = {}) {
  const definitions = new StaticGeographyDefinitionRepository(HAMPTON_ROADS_CONTROLLED_LOCALITY_DEFINITIONS);
  const boundaries = new TigerWebBoundarySnapshotRepository(definitions);
  const state = { credentials: [], assets: [], drafts: [], locations: [], commands: new Map(), events: [], audits: [], stored: [], objects: new Map() };
  let sequence = 0;
  const repository = {
    async listCredentials(id) { return state.credentials.filter((entry) => entry.organizationId === id); },
    async getCredential(id) { return state.credentials.find((entry) => entry.id === id) ?? null; },
    async listProfileAssets(id) { return state.assets.filter((entry) => entry.organizationId === id); },
    async getProfileAsset(id) { return state.assets.find((entry) => entry.id === id) ?? null; },
    async listAdditionalLocations(id) { return state.locations.filter((entry) => entry.organizationId === id); },
    async getAdditionalLocation(id) { return state.locations.find((entry) => entry.id === id) ?? null; },
    async getAdditionalLocationDraft(id) { return state.drafts.find((entry) => entry.id === id) ?? null; },
    async getCommand(id) { return state.commands.get(id) ?? null; },
    async save(input) {
      if (options.persistenceError) throw options.persistenceError;
      if (state.commands.has(input.command.id)) return;
      state.commands.set(input.command.id, input.command); state.events.push(input.event); state.audits.push(input.auditEvent);
      const replace = (collection, value) => { const index = collection.findIndex((entry) => entry.id === value.id); if (index >= 0) collection.splice(index, 1, value); else collection.push(value); };
      if (input.record.kind === "credential") replace(state.credentials, input.record.value);
      if (input.record.kind === "profile-asset") replace(state.assets, input.record.value);
      if (input.record.kind === "location-draft") replace(state.drafts, input.record.value);
      if (input.record.kind === "location-confirmation") { replace(state.drafts, input.record.draft); replace(state.locations, input.record.value); }
      if (input.record.kind === "additional-location") replace(state.locations, input.record.value);
    },
  };
  const primaryLocation = { id: fx.organization.id, organizationId: fx.organization.id, geographyId: PORTSMOUTH_CONTROLLED_LOCALITY.id };
  const service = new OrganizationEnrichmentService({
    authorization: {
      accountSecurity: { async inspect() { return { provider: "firebase", subject: fx.user.login.subject, email: fx.user.primaryEmail, emailVerified: true, disabled: false, mfaEnrolled: false, tokensValidAfter: null, lastSignInAt: NOW }; } },
      organizations: { async getById(id) { return id === fx.organization.id ? fx.organization : null; }, async create() {} },
      memberships: { async getById(id) { return id === fx.membership.id ? fx.membership : null; }, async listByUserId() { return [fx.membership]; }, async listActiveByUserId() { return [fx.membership]; }, async listByOrganizationId() { return [fx.membership]; }, async create() {} },
      authorizations: { async getByMembershipId(id) { return id === fx.membership.id ? fx.authorization : null; }, async listByUserId() { return [fx.authorization]; }, async listByOrganizationId() { return [fx.authorization]; }, async save() {} },
      restrictions: { async getById() { return null; }, async getForOrganization() { return null; }, async getForMembership() { return null; }, async save() {} },
    },
    repository,
    storedAssets: {
      async getById(id) { return state.stored.find((entry) => entry.id === id) ?? null; },
      async listByOrganizationId(id) { return state.stored.filter((entry) => entry.organizationId === id); },
      async create(value) { state.stored.push(value); },
      async save(value) { const index = state.stored.findIndex((entry) => entry.id === value.id); state.stored.splice(index, 1, value); },
    },
    objects: {
      async put() { throw new Error("unused"); },
      async get(path) { const object = state.objects.get(path); if (!object) throw new Error("object missing"); return object; },
      async delete() {},
    },
    primaryLocations: { async getByOrganizationId(id) { return options.noPrimary || id !== fx.organization.id ? null : primaryLocation; } },
    geographies: definitions,
    boundaries,
    geocoder: { async locate() { return options.outside ? [{ providerCandidateId: "outside", coordinate: [-77.4, 38.2], matchedAddress: "OUTSIDE", quality: "address-range", provider: "U.S. Census Geocoder", providerReference: "outside", benchmark: "Public_AR_Current", retrievedAt: NOW }] : [{ providerCandidateId: "inside", coordinate: COORDINATE, matchedAddress: "801 CRAWFORD ST, PORTSMOUTH, VA", quality: "address-range", provider: "U.S. Census Geocoder", providerReference: "inside", benchmark: "Public_AR_Current", retrievedAt: NOW }]; } },
    now: () => NOW, id: () => `id-${++sequence}`,
  });
  const scope = { context: fx.context, organizationId: fx.organization.id, membershipId: fx.membership.id, commandId: "command-1" };
  return { service, state, scope, primaryLocation };
}

test("ORG-015 preserves provenance and never converts self-report or evidence into verification", async () => {
  const fx = fixture();
  const record = createOrganizationCredential({ id: "credential-uei", organizationId: fx.organization.id, kind: "uei", label: "Unique Entity ID", issuer: "SAM.gov", identifierValue: "ABC123", sourceLabel: "Organization record", visibility: "public", userId: fx.user.id, membershipId: fx.membership.id, now: NOW });
  assert.equal(record.status, "self_reported");
  assert.equal("verified" in record, false);
  assert.deepEqual(projectPublicCredential(record), { id: "credential-uei", kind: "uei", label: "Unique Entity ID", issuer: "SAM.gov", identifierValue: "ABC123", issuedOn: null, effectiveOn: null, expiresOn: null, status: "self_reported", provenanceLabel: "Organization reported" });
  assert.throws(() => createOrganizationCredential({ id: "credential-url", organizationId: fx.organization.id, kind: "uei", label: "Unique Entity ID", issuer: "SAM.gov", sourceLabel: "Organization record", sourceUrl: "http://example.test/source", visibility: "private", userId: fx.user.id, membershipId: fx.membership.id, now: NOW }), /valid HTTPS URL/);
});

test("credential commands are tenant-authorized, evidence-bound, auditable, and idempotent", async () => {
  const fx = fixture();
  const m = memory(fx);
  const evidence = activeStoredAsset(fx, { id: "stored-evidence", category: "authority-evidence", filename: "evidence.pdf", contentType: "application/pdf", bytes: new Uint8Array([1, 2, 3]) });
  m.state.stored.push(evidence);
  const input = { id: "credential-license", kind: "license", label: "Contractor license", issuer: "Virginia DPOR", sourceLabel: "Organization upload", evidenceAssetIds: [evidence.id], visibility: "network" };
  const first = await m.service.upsertCredential(m.scope, input);
  const replay = await m.service.upsertCredential(m.scope, input);
  assert.equal(first.record.status, "evidence_submitted");
  assert.equal(replay.replayed, true);
  assert.equal(m.state.events.length, 1);
  assert.equal(m.state.audits[0].action, "organization.enrichment.credential-upserted");
  const viewer = memory(fixture("viewer"));
  await assert.rejects(viewer.service.upsertCredential(viewer.scope, { ...input, evidenceAssetIds: [] }), (error) => error instanceof OrganizationEnrichmentError && error.code === "forbidden");
});

test("malformed credential evidence identity remains a typed participant input error", async () => {
  const fx = fixture();
  const m = memory(fx);
  await assert.rejects(
    m.service.upsertCredential(m.scope, {
      id: "credential-license",
      kind: "license",
      label: "Contractor license",
      issuer: "Virginia DPOR",
      sourceLabel: "Organization upload",
      evidenceAssetIds: ["invalid evidence/id"],
      visibility: "network",
    }),
    (error) => error instanceof OrganizationEnrichmentError && error.code === "invalid",
  );
  assert.equal(m.state.commands.size, 0);
  assert.equal(m.state.credentials.length, 0);
});

test("enrichment persistence races are conflicts while operational failures propagate", async () => {
  const fx = fixture();
  const input = {
    id: "credential-race",
    kind: "license",
    label: "Contractor license",
    issuer: "Virginia DPOR",
    sourceLabel: "Organization record",
    evidenceAssetIds: [],
    visibility: "network",
  };
  const conflict = memory(fx, {
    persistenceError: new OrganizationEnrichmentPersistenceConflictError("Injected command collision."),
  });
  await assert.rejects(
    conflict.service.upsertCredential(conflict.scope, input),
    (error) => error instanceof OrganizationEnrichmentError && error.code === "conflict",
  );

  const outage = new Error("Injected organization-enrichment storage outage.");
  const unavailable = memory(fx, { persistenceError: outage });
  await assert.rejects(
    unavailable.service.upsertCredential(unavailable.scope, input),
    (error) => error === outage,
  );
});

test("ORG-018 publishes only explicit non-sensitive metadata through controlled delivery", async () => {
  const fx = fixture();
  const m = memory(fx);
  const stored = activeStoredAsset(fx);
  m.state.stored.push(stored);
  m.state.objects.set(stored.objectPath, { contentType: stored.contentType, bytes: new Uint8Array([1, 2, 3, 4]) });
  const registered = await m.service.registerProfileAsset(m.scope, { id: "profile-portfolio", storedAssetId: stored.id, kind: "portfolio", title: "Completed waterfront retrofit", description: "Organization-provided project image.", altText: "Renovated waterfront facility exterior" });
  assert.equal(projectPublicProfileAsset(registered.record), null);
  const published = await m.service.setAssetPublication({ ...m.scope, commandId: "command-publish" }, { id: registered.record.id, publish: true });
  const projection = projectPublicProfileAsset(published.record);
  assert.equal(projection.deliveryPath, "/api/organization-enrichment/assets/profile-portfolio");
  assert.doesNotMatch(JSON.stringify(projection), /objectPath|sha256|createdBy|stored-profile-image/);
  const delivered = await m.service.readPublishedAsset("profile-portfolio");
  assert.deepEqual([...delivered.bytes], [1, 2, 3, 4]);
});

test("retired enrichment publication races retain typed conflict semantics", async () => {
  const fx = fixture();
  const m = memory(fx);
  const stored = activeStoredAsset(fx);
  m.state.stored.push(stored);
  const registered = await m.service.registerProfileAsset(m.scope, {
    id: "profile-retired",
    storedAssetId: stored.id,
    kind: "portfolio",
    title: "Retired portfolio asset",
    altText: "Waterfront project before retirement",
  });
  await m.service.retireAsset(
    { ...m.scope, commandId: "command-retire-asset" },
    { id: registered.record.id },
  );
  await assert.rejects(
    m.service.setAssetPublication(
      { ...m.scope, commandId: "command-publish-retired-asset" },
      { id: registered.record.id, publish: true },
    ),
    (error) => error instanceof OrganizationEnrichmentError && error.code === "conflict",
  );

  const begun = await m.service.beginAdditionalLocation(
    { ...m.scope, commandId: "command-begin-retired-location" },
    { id: "location-retired", label: "Retired office", physicalAddress: ADDRESS, isHomeOrPrivate: false },
  );
  const confirmed = await m.service.confirmAdditionalLocation(
    { ...m.scope, commandId: "command-confirm-retired-location" },
    { draftId: begun.draft.id, candidateId: begun.draft.candidates[0].id },
  );
  await m.service.retireLocation(
    { ...m.scope, commandId: "command-retire-location" },
    { id: confirmed.record.id },
  );
  const commandCount = m.state.commands.size;
  await assert.rejects(
    m.service.setLocationPublication(
      { ...m.scope, commandId: "command-publish-retired-location" },
      { id: confirmed.record.id, publish: true },
    ),
    (error) => error instanceof OrganizationEnrichmentError && error.code === "conflict",
  );
  assert.equal(m.state.commands.size, commandCount);
});

test("ORG-019 requires confirmed in-boundary geocoding and preserves the primary location", async () => {
  const fx = fixture();
  const m = memory(fx);
  const begun = await m.service.beginAdditionalLocation(m.scope, { id: "location-downtown", label: "Downtown office", physicalAddress: ADDRESS, isHomeOrPrivate: false, visibility: "approximate" });
  assert.equal(m.state.locations.length, 0);
  const confirmed = await m.service.confirmAdditionalLocation({ ...m.scope, commandId: "command-confirm" }, { draftId: begun.draft.id, candidateId: begun.draft.candidates[0].id });
  assert.equal(confirmed.record.publicationStatus, "private");
  assert.equal(m.primaryLocation.id, fx.organization.id, "Additional location cannot replace the primary location.");
  await m.service.setLocationPublication({ ...m.scope, commandId: "command-location-publish" }, { id: confirmed.record.id, publish: true });
  const snapshot = await m.service.snapshot(fx.organization.id);
  assert.equal(snapshot.publicAdditionalLocations[0].relationship, "subordinate-location");
  assert.notDeepEqual(snapshot.publicAdditionalLocations[0].coordinate, COORDINATE, "Approximate projection cannot expose the internal exact coordinate.");
  assert.equal(snapshot.mapAdditionalLocations[0].coordinate.length, 2);
});

test("additional locations fail closed outside the primary locality and without primary authority", async () => {
  const fx = fixture();
  await assert.rejects(memory(fx, { outside: true }).service.beginAdditionalLocation(memory(fx, { outside: true }).scope, { id: "location-outside", label: "Outside office", physicalAddress: ADDRESS, isHomeOrPrivate: false }), /authorized primary locality/);
  const noPrimary = memory(fx, { noPrimary: true });
  await assert.rejects(noPrimary.service.beginAdditionalLocation(noPrimary.scope, { id: "location-none", label: "No primary", physicalAddress: ADDRESS, isHomeOrPrivate: false }), (error) => error instanceof OrganizationEnrichmentError && error.code === "geography-unavailable");
});
