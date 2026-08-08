import { createHash } from "node:crypto";
import { readdir, readFile, mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

import Ajv2020 from "ajv/dist/2020.js";
import addFormats from "ajv-formats";

export const AMACS_RELEASE_PIN = Object.freeze({
  version: "0.5.0",
  releasedAt: "2026-08-08",
  sourceCommit: "da7879f2609271b067ae6d02875e9388a02c4fe5",
});

export const AMACS_HISTORICAL_RELEASE_PIN = Object.freeze({
  version: "0.1.0",
  releasedAt: "2026-08-03",
  sourceCommit: "7e4b6c88e91c2df6f1d596af1dec7701df0290d2",
});

export const AMACS_PROJECTION_VERSION = "1";

const datasetSchemas = Object.freeze({
  concepts: "concept.schema.json",
  relationships: "relationship.schema.json",
  aliases: "alias.schema.json",
  properties: "property.schema.json",
  "property-values": "property-value.schema.json",
  "concept-properties": "concept-property.schema.json",
  credentials: "credential.schema.json",
  units: "unit.schema.json",
  "requirement-types": "requirement-type.schema.json",
  "requirement-bundles": "requirement-bundle.schema.json",
  "governance-profiles": "governance-profile.schema.json",
  "readiness-rules": "readiness-rule.schema.json",
  "request-families": "request-family.schema.json",
  "response-sections": "response-section.schema.json",
  "response-templates": "response-template.schema.json",
  "decision-factors": "decision-factor.schema.json",
  "decision-templates": "decision-template.schema.json",
  "market-roles": "market-role.schema.json",
  "outcome-types": "outcome-type.schema.json",
});

export const requiredSemanticSchemas = Object.freeze([
  "market-need.schema.json",
  "interpretation-record.schema.json",
  "interpretation-candidate.schema.json",
  "concept-interpretation-guidance.schema.json",
]);

const requiredDownstreamSchemas = Object.freeze([
  "organization-capability.schema.json",
  "rfx-requirement.schema.json",
]);

function invariant(condition, message) {
  if (!condition) throw new Error(message);
}

export function stableJson(value) {
  return `${JSON.stringify(value, null, 2)}\n`;
}

export function sha256(content) {
  return createHash("sha256").update(content).digest("hex");
}

async function listFiles(root, directory = root) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const target = path.join(directory, entry.name);
    if (entry.isDirectory()) files.push(...await listFiles(root, target));
    else files.push(path.relative(root, target).split(path.sep).join("/"));
  }
  return files.sort();
}

async function loadJson(filePath) {
  return JSON.parse(await readFile(filePath, "utf8"));
}

async function loadJsonLines(filePath) {
  const source = await readFile(filePath, "utf8");
  return source
    .split(/\r?\n/)
    .filter((line) => line.trim())
    .map((line, index) => {
      try {
        return JSON.parse(line);
      } catch (error) {
        throw new Error(`${filePath}:${index + 1} is not valid JSON: ${error.message}`);
      }
    });
}

async function verifyChecksums(releaseDirectory) {
  const checksumText = await readFile(path.join(releaseDirectory, "SHA256SUMS"), "utf8");
  const expected = new Map();
  for (const line of checksumText.split(/\r?\n/).filter(Boolean)) {
    const match = /^([0-9a-f]{64})  (.+)$/.exec(line);
    invariant(match, `Invalid AMACS checksum line: ${line}`);
    expected.set(match[2], match[1]);
  }

  const actualFiles = (await listFiles(releaseDirectory))
    .filter((file) => file !== "SHA256SUMS");
  invariant(
    JSON.stringify(actualFiles) === JSON.stringify([...expected.keys()].sort()),
    "AMACS release files do not exactly match SHA256SUMS.",
  );

  for (const [relativePath, expectedHash] of expected) {
    const content = await readFile(path.join(releaseDirectory, relativePath));
    invariant(
      sha256(content) === expectedHash,
      `AMACS checksum mismatch for ${relativePath}.`,
    );
  }

  return Object.freeze({
    checksumFileSha256: sha256(checksumText),
    checkedFileCount: expected.size,
  });
}

async function createSchemaRegistry(releaseDirectory) {
  const schemaDirectory = path.join(releaseDirectory, "schemas");
  const schemaNames = (await readdir(schemaDirectory))
    .filter((name) => name.endsWith(".schema.json"))
    .sort();
  const schemas = new Map();
  for (const name of schemaNames) {
    schemas.set(name, await loadJson(path.join(schemaDirectory, name)));
  }

  const ajv = new Ajv2020({ allErrors: true, strict: true, strictRequired: false });
  addFormats(ajv);
  for (const schema of schemas.values()) ajv.addSchema(schema);
  for (const schema of schemas.values()) ajv.getSchema(schema.$id);
  return { ajv, schemas, schemaNames };
}

function validateRecord(validator, record, label) {
  if (validator(record)) return;
  throw new Error(`${label} failed AMACS schema validation: ${JSON.stringify(validator.errors)}`);
}

function validateReferences(datasets) {
  const ids = (records, key) => new Set(records.map((record) => record[key]));
  const conceptIds = ids(datasets.concepts, "concept_id");
  const propertyIds = ids(datasets.properties, "property_id");
  const unitIds = ids(datasets.units, "unit_id");
  const credentialIds = ids(datasets.credentials, "credential_id");
  const requirementTypeIds = ids(datasets["requirement-types"], "requirement_type_id");
  const requirementBundleIds = ids(datasets["requirement-bundles"], "requirement_bundle_id");
  const governanceProfileIds = ids(datasets["governance-profiles"], "governance_profile_id");
  const requestFamilyIds = ids(datasets["request-families"], "request_family_id");
  const responseSectionIds = ids(datasets["response-sections"], "response_section_id");
  const responseTemplateIds = ids(datasets["response-templates"], "response_template_id");
  const decisionFactorIds = ids(datasets["decision-factors"], "decision_factor_id");
  const decisionTemplateIds = ids(datasets["decision-templates"], "decision_template_id");

  const contains = (set, value, label) => {
    if (value != null) invariant(set.has(value), `Unknown ${label}: ${value}`);
  };
  const containsEvery = (set, values, label) => {
    for (const value of values ?? []) contains(set, value, label);
  };

  for (const concept of datasets.concepts) {
    contains(conceptIds, concept.primary_parent_id, "concept parent");
    contains(conceptIds, concept.replacement_concept_id, "replacement concept");
  }
  for (const alias of datasets.aliases) contains(conceptIds, alias.concept_id, "alias concept");
  for (const relationship of datasets.relationships) {
    contains(conceptIds, relationship.source_concept_id, "relationship source");
    contains(conceptIds, relationship.target_concept_id, "relationship target");
  }
  for (const link of datasets["concept-properties"]) {
    contains(conceptIds, link.concept_id, "concept-property concept");
    contains(propertyIds, link.property_id, "concept-property property");
  }
  for (const value of datasets["property-values"]) contains(propertyIds, value.property_id, "property value property");
  for (const property of datasets.properties) containsEvery(unitIds, property.allowed_unit_ids, "property unit");
  for (const unit of datasets.units) contains(unitIds, unit.base_unit_id, "base unit");
  for (const template of datasets["response-templates"]) containsEvery(responseSectionIds, template.section_ids, "response section");
  for (const template of datasets["decision-templates"]) containsEvery(decisionFactorIds, template.factor_ids, "decision factor");
  for (const family of datasets["request-families"]) {
    contains(responseTemplateIds, family.default_response_template_id, "default response template");
    contains(decisionTemplateIds, family.default_decision_template_id, "default decision template");
    contains(governanceProfileIds, family.default_governance_profile_id, "default governance profile");
    containsEvery(governanceProfileIds, family.allowed_governance_profile_ids, "allowed governance profile");
    containsEvery(requirementBundleIds, family.recommended_requirement_bundle_ids, "recommended requirement bundle");
  }
  for (const rule of datasets["readiness-rules"]) {
    containsEvery(requestFamilyIds, rule.applies_to_request_family_ids, "readiness request family");
    containsEvery(governanceProfileIds, rule.applies_to_governance_profile_ids, "readiness governance profile");
  }
  for (const bundle of datasets["requirement-bundles"]) {
    containsEvery(requestFamilyIds, bundle.applicable_request_family_ids, "bundle request family");
    for (const item of bundle.items) {
      contains(requirementTypeIds, item.requirement_type_id, "bundle requirement type");
      contains(propertyIds, item.property_id, "bundle property");
      contains(credentialIds, item.credential_id, "bundle credential");
      containsEvery(responseSectionIds, item.linked_response_section_ids, "bundle response section");
      containsEvery(decisionFactorIds, item.linked_decision_factor_ids, "bundle decision factor");
    }
  }
}

export async function verifyAmacsRelease(releaseDirectory, expectedPin) {
  const releaseRoot = path.resolve(releaseDirectory);
  const checksumEvidence = await verifyChecksums(releaseRoot);
  const manifest = await loadJson(path.join(releaseRoot, "manifest.json"));
  invariant(manifest.version === expectedPin.version, `Expected AMACS ${expectedPin.version}.`);
  invariant(manifest.released_at === expectedPin.releasedAt, "AMACS release date drifted.");
  invariant(manifest.source_commit === expectedPin.sourceCommit, "AMACS source commit drifted.");

  const { ajv, schemas, schemaNames } = await createSchemaRegistry(releaseRoot);
  const manifestSchema = schemas.get("release-manifest.schema.json");
  invariant(manifestSchema, "AMACS release manifest schema is missing.");
  validateRecord(ajv.getSchema(manifestSchema.$id), manifest, "manifest.json");

  if (expectedPin.version === AMACS_RELEASE_PIN.version) {
    for (const schemaName of [...requiredSemanticSchemas, ...requiredDownstreamSchemas]) {
      invariant(schemas.has(schemaName), `Required AMACS schema is missing: ${schemaName}`);
    }
  }

  const datasets = {};
  for (const [datasetName, schemaName] of Object.entries(datasetSchemas)) {
    if (!(datasetName in manifest.record_counts)) continue;
    const records = await loadJsonLines(path.join(releaseRoot, "source", `${datasetName}.jsonl`));
    const expectedCount = manifest.record_counts[datasetName];
    invariant(Number.isInteger(expectedCount), `Manifest count missing for ${datasetName}.`);
    invariant(records.length === expectedCount, `AMACS ${datasetName} count drifted.`);
    const schema = schemas.get(schemaName);
    invariant(schema, `Dataset schema is missing: ${schemaName}`);
    const validator = ajv.getSchema(schema.$id);
    for (const [index, record] of records.entries()) {
      validateRecord(validator, record, `${datasetName}.jsonl:${index + 1}`);
    }
    datasets[datasetName] = Object.freeze(records);
  }
  validateReferences(datasets);

  return Object.freeze({
    root: releaseRoot,
    manifest: Object.freeze(manifest),
    datasets: Object.freeze(datasets),
    schemaNames: Object.freeze(schemaNames),
    ...checksumEvidence,
  });
}

function normalizedSearchText(value) {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("en-US")
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .replace(/\s+/g, " ");
}

export function createCatalogProjection(verifiedRelease) {
  const concepts = verifiedRelease.datasets.concepts;
  const conceptById = new Map(concepts.map((concept) => [concept.concept_id, concept]));
  const aliasesByConcept = new Map();
  for (const alias of verifiedRelease.datasets.aliases) {
    const current = aliasesByConcept.get(alias.concept_id) ?? [];
    current.push(alias.alias);
    aliasesByConcept.set(alias.concept_id, current);
  }
  const replacementIds = new Map();
  for (const relationship of verifiedRelease.datasets.relationships) {
    if (!["replaced_by", "split_into", "merged_into"].includes(relationship.relationship_type)) continue;
    const current = replacementIds.get(relationship.source_concept_id) ?? [];
    current.push(relationship.target_concept_id);
    replacementIds.set(relationship.source_concept_id, current);
  }

  const domains = concepts
    .filter((concept) => concept.concept_type === "domain")
    .map((concept) => ({
      domainId: concept.concept_id,
      preferredLabel: concept.preferred_label,
      definition: concept.definition,
      status: concept.status,
    }));
  const families = concepts
    .filter((concept) => concept.concept_type === "family")
    .map((concept) => ({
      familyId: concept.concept_id,
      domainId: concept.primary_parent_id,
      preferredLabel: concept.preferred_label,
      definition: concept.definition,
      status: concept.status,
    }));
  const capabilities = concepts
    .filter((concept) => concept.concept_type === "capability" && concept.matchable)
    .map((concept) => {
      const family = conceptById.get(concept.primary_parent_id);
      const domain = family ? conceptById.get(family.primary_parent_id) : null;
      invariant(family?.concept_type === "family", `Capability ${concept.concept_id} has no family.`);
      invariant(domain?.concept_type === "domain", `Capability ${concept.concept_id} has no domain.`);
      return {
        conceptId: concept.concept_id,
        preferredLabel: concept.preferred_label,
        definition: concept.definition,
        domainId: domain.concept_id,
        domainLabel: domain.preferred_label,
        familyId: family.concept_id,
        familyLabel: family.preferred_label,
        aliases: [...new Set(aliasesByConcept.get(concept.concept_id) ?? [])].sort(),
        ...(concept.inclusion_notes ? { inclusionNotes: concept.inclusion_notes } : {}),
        ...(concept.exclusion_notes ? { exclusionNotes: concept.exclusion_notes } : {}),
        status: concept.status,
        replacementConceptIds: [...new Set(replacementIds.get(concept.concept_id) ?? [])].sort(),
        releaseVersion: verifiedRelease.manifest.version,
      };
    });

  return Object.freeze({
    release: Object.freeze({
      version: verifiedRelease.manifest.version,
      releasedAt: verifiedRelease.manifest.released_at,
      sourceCommit: verifiedRelease.manifest.source_commit,
      projectionVersion: AMACS_PROJECTION_VERSION,
    }),
    domains: Object.freeze(domains),
    families: Object.freeze(families),
    capabilities: Object.freeze(capabilities),
  });
}

export function createSearchIndex(catalog) {
  return Object.freeze({
    releaseVersion: catalog.release.version,
    projectionVersion: catalog.release.projectionVersion,
    entries: Object.freeze(catalog.capabilities.map((capability) => ({
      conceptId: capability.conceptId,
      preferredLabel: capability.preferredLabel,
      normalizedLabel: normalizedSearchText(capability.preferredLabel),
      normalizedAliases: capability.aliases.map(normalizedSearchText),
      normalizedCorpus: normalizedSearchText([
        capability.preferredLabel,
        ...capability.aliases,
        capability.definition,
        capability.familyLabel,
        capability.domainLabel,
        capability.inclusionNotes ?? "",
        capability.exclusionNotes ?? "",
      ].join(" ")),
    }))),
  });
}

export function createRegistryProjection(verifiedRelease) {
  const excluded = new Set(["concepts", "aliases"]);
  return Object.freeze({
    releaseVersion: verifiedRelease.manifest.version,
    registries: Object.freeze(Object.fromEntries(
      Object.entries(verifiedRelease.datasets)
        .filter(([name]) => !excluded.has(name))
        .map(([name, records]) => [name, records]),
    )),
  });
}

export function createMigrationPreview(historicalCatalog, currentCatalog, currentRelationships) {
  const currentById = new Map(currentCatalog.capabilities.map((capability) => [capability.conceptId, capability]));
  const historicalById = new Map(historicalCatalog.capabilities.map((capability) => [capability.conceptId, capability]));
  const changed = historicalCatalog.capabilities.flatMap((legacy) => {
    const current = currentById.get(legacy.conceptId);
    if (!current) return [{ conceptId: legacy.conceptId, change: "missing", historicalLabel: legacy.preferredLabel }];
    const differences = [];
    if (current.preferredLabel !== legacy.preferredLabel) differences.push("label_changed");
    if (current.status !== legacy.status) differences.push("status_changed");
    if (current.familyId !== legacy.familyId) differences.push("family_changed");
    return differences.length ? [{
      conceptId: legacy.conceptId,
      change: differences.join("+"),
      historicalLabel: legacy.preferredLabel,
      currentLabel: current.preferredLabel,
    }] : [];
  });
  const semanticRelationships = currentRelationships
    .filter((relationship) => ["replaced_by", "split_into", "merged_into"].includes(relationship.relationship_type))
    .map((relationship) => ({
      sourceConceptId: relationship.source_concept_id,
      relationshipType: relationship.relationship_type,
      targetConceptId: relationship.target_concept_id,
    }));

  return Object.freeze({
    generatedFrom: Object.freeze({
      historicalRelease: historicalCatalog.release.version,
      currentRelease: currentCatalog.release.version,
    }),
    summary: Object.freeze({
      historicalCapabilities: historicalCatalog.capabilities.length,
      retainedHistoricalIds: historicalCatalog.capabilities.filter((capability) => currentById.has(capability.conceptId)).length,
      newCurrentCapabilities: currentCatalog.capabilities.filter((capability) => !historicalById.has(capability.conceptId)).length,
      changedHistoricalCapabilities: changed.length,
      replacementSplitMergeRelationships: semanticRelationships.length,
    }),
    historicalChanges: Object.freeze(changed),
    replacementSplitMergeRelationships: Object.freeze(semanticRelationships),
    rfxchangePersistenceInventory: Object.freeze({
      canonicalAmacsReferencesFoundInCurrentRuntime: 0,
      legacyCapabilityField: "organizationProfiles.capabilities",
      legacyCapabilitySemantics: "activation-era participant-authored categorized free text",
      transitionalDiscoveryBehavior: "preserve existing Slice 3.2 free-text search until Slice 3.3 confirms structured assertions",
      migrationRule: "never convert legacy text, websites, documents, NAICS, or model output into authoritative capability assertions",
      deployedDataRequirement: "run an environment-scoped read-only preview before any later persisted-record migration",
    }),
  });
}

export function createGeneratedArtifacts(currentRelease, historicalRelease) {
  const currentCatalog = createCatalogProjection(currentRelease);
  const historicalCatalog = createCatalogProjection(historicalRelease);
  const artifacts = {
    "catalog.json": stableJson(currentCatalog),
    "search-index.json": stableJson(createSearchIndex(currentCatalog)),
    "registries.json": stableJson(createRegistryProjection(currentRelease)),
    "historical/0.1.0/catalog.json": stableJson(historicalCatalog),
    "migration-preview.json": stableJson(createMigrationPreview(
      historicalCatalog,
      currentCatalog,
      currentRelease.datasets.relationships,
    )),
  };
  const generatedChecksums = Object.freeze(Object.fromEntries(
    Object.entries(artifacts).map(([name, content]) => [name, sha256(content)]),
  ));
  const lock = Object.freeze({
    standard: "AMACS",
    release: Object.freeze({
      version: currentRelease.manifest.version,
      releasedAt: currentRelease.manifest.released_at,
      sourceCommit: currentRelease.manifest.source_commit,
      manifestSha256: sha256(stableJson(currentRelease.manifest)),
      checksumFileSha256: currentRelease.checksumFileSha256,
      checkedFileCount: currentRelease.checkedFileCount,
    }),
    historicalReleases: Object.freeze([Object.freeze({
      version: historicalRelease.manifest.version,
      releasedAt: historicalRelease.manifest.released_at,
      sourceCommit: historicalRelease.manifest.source_commit,
      manifestSha256: sha256(stableJson(historicalRelease.manifest)),
      checksumFileSha256: historicalRelease.checksumFileSha256,
      checkedFileCount: historicalRelease.checkedFileCount,
    })]),
    projectionVersion: AMACS_PROJECTION_VERSION,
    schemaSet: currentRelease.schemaNames,
    requiredSemanticSchemas,
    generatedChecksums,
  });
  return Object.freeze({ ...artifacts, "ingestion-lock.json": stableJson(lock) });
}

export async function writeGeneratedArtifacts(outputDirectory, artifacts) {
  for (const [relativePath, content] of Object.entries(artifacts)) {
    const target = path.join(outputDirectory, relativePath);
    await mkdir(path.dirname(target), { recursive: true });
    await writeFile(target, content, "utf8");
  }
}
