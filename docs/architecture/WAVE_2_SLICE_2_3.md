# Wave 2 Slice 2.3 — Organization Resolution

## Scope

This slice implements:

- `ACQ-004` seeded/unclaimed organization acquisition profiles;
- `ORG-001` explainable organization match search;
- `ORG-002` select-existing or duplicate-aware create-new resolution;
- `ORG-003` multi-signal entity comparison and conflict preservation.

Authority establishment, claims administration, Verification, address/geocode
confirmation, profile completion and marker activation remain later work.

## Canonical separation

Organization resolution answers **which durable organization record the
participant is attempting to manage**. It does not answer whether that person
may manage the organization.

The slice therefore keeps these records separate:

1. `OrganizationAccount` — stable tenant/market identity;
2. `OrganizationProfile` — network-facing name;
3. `OrganizationDiscoveryRecord` — explainable discovery and comparison data,
   with provenance and public-versus-resolution-only visibility per field;
4. `OrganizationResolutionRecord` — immutable participant decision evidence
   tied to the authenticated user and access journey;
5. later membership, authority claim and Verification records.

Every Slice 2.3 discovery/resolution record explicitly carries
`authorityState: unestablished` / `relationshipState: authority-pending` and
`verificationState: not-evaluated`.

## Seeded/unclaimed acquisition surface

A seeded record is a legitimate organization account/profile with a discovery
record whose field provenance is `seeded-public`. The public projection emits
only explicitly public values:

- display name;
- categories;
- canonical locality;
- approved locality/region context;
- clear `Unclaimed` status;
- **Claim this organization** action;
- a human-readable source label.

Phone, government identifiers, private address data and any other
`resolution-only` signal are excluded by the projection even when those values
participate in server-side comparison. Seeded data establishes neither
participant authority nor Organization Verification.

## Server-authoritative resolution path

`OrganizationResolutionService` requires:

- a trusted `AuthenticatedServerContext`;
- an access journey owned by that RFxchange user in `geography-selected`;
- the current persisted `PrimaryOperatingGeographySelection` for that exact
  journey;
- candidate records loaded through the server repository for that canonical
  geography.

A browser-provided geography that differs from the canonical selection fails
closed. Selecting an existing record is allowed only when it is one of the
current explainable candidates and its account/profile relationship is intact.

Both select-existing and create-new write an immutable resolution record and
advance the lifecycle to `organization-resolved` atomically. Neither path
creates an organization membership or authorization.

## Explainable entity comparison

Inputs are normalized without changing the canonical display values. Comparison
considers:

- legal/common name and aliases;
- address;
- domain;
- phone;
- government identifiers;
- canonical geography.

Each candidate includes safe, value-free explanations and deterministic scoring.
Results are classified as `possible-match`, `likely-match`, or
`identity-conflict`. The engine never emits an automatic merge instruction.

Fuzzy/similar name evidence alone remains review evidence, not a merge decision.
New creation is blocked until every likely match has been explicitly reviewed.
A matching authoritative identifier with incompatible naming is preserved as an
identity conflict and cannot be bypassed through participant acknowledgement.

## Duplicate-safe creation

The create path carries the provisional identity forward into the new profile,
discovery record and immutable resolution evidence. Stable IDs are generated
independently of display name.

Strong keys are intentionally narrow:

- normalized jurisdiction/scheme/government identifier;
- exact domain-and-phone combination.

Opaque SHA-256 document IDs reserve those keys in
`organizationEntityKeys`. The Firestore transaction reads all reservations
before creating the account, profile, discovery record, resolution evidence and
lifecycle update. A concurrent reservation fails the entire transaction and is
returned as a controlled identity conflict.

Name/geography similarity is not a strong reservation because legitimate
organizations may share names. It remains in the explainable review path.

## Persistence and security

The new server-managed collections are:

- mutable `organizationDiscoveryRecords`;
- append-only `organizationResolutions`;
- append-only `organizationEntityKeys`.

Security Rules deny direct browser access to all three. Public profile and match
candidate shapes are application projections, not raw Firestore documents.
Equality-only repository query contracts remain within the current automatic
index policy.

## Validation

- `test/organization-resolution.test.mjs` covers public-data filtering,
  normalization, all documented match signals, deterministic evidence,
  select-existing/create-new behavior, candidate review, identity conflicts,
  geography manipulation and authority/Verification separation.
- Firestore schema, repository, index and rules tests include the new records and
  atomic unit of work.
- `scripts/validate-organization-resolution.mjs` gates the domain, service,
  persistence, security, UI and architecture contracts.
- the Firestore emulator smoke test validates real adapter persistence,
  lifecycle atomicity, duplicate-key race protection and direct-client denial.
- browser QA exercises the seeded profile, search, claim/select/create actions
  and controlled locality context at desktop/mobile sizes.

## Explicit non-scope

- organization membership or management authority (`ORG-004`);
- claims console or adjudication (`ADM-065`, `ADM-066`);
- Organization Verification;
- address/geocode confirmation and location privacy policy;
- profile completion or marker activation;
- destructive entity merge/delete;
- automatic enrichment or public exposure of resolution-only identity evidence.
