# Slice 3.6 — Official Resource Provider Foundation

**Status: COMPLETE VIA PR #132**

## Feature IDs

- `RES-001` — Official Resource Provider application
- `RES-002` — Provider admin review/approval
- `RES-003` — Provider service profile
- `ADM-070` — Resource-provider approval console

## Canonical boundary

Official Resource Provider is a separately applied-for, administratively approved organization status. It is not:

- a registration role;
- a self-declared organization type;
- a buyer/supplier classification;
- Organization Verified;
- a paid entitlement; or
- a Profile Complete requirement.

Every organization completes ordinary activation first. The provider application appears afterward in organization settings/profile as **Request Resource Provider Status**.

## Objective

Create the governed path by which an activated organization applies to become an Official Resource Provider, administrators review the application and evidence, an approved organization receives controlled provider status, and the provider maintains the structured service profile required for Network discovery and routing.

## Must read

- `/AGENTS.md`
- `docs/context/README.md`
- `docs/context/ORGANIZATION_MODEL.md`
- `docs/context/ADMINISTRATION.md`
- `docs/context/CREDIBILITY_SYSTEM.md`
- `docs/context/PRODUCT_PRINCIPLES.md`
- `docs/brand/README.md`
- `docs/brand/BRAND_GATE_B0_RECONCILIATION.md`
- `docs/brand/CONTENT_AND_MESSAGING_SYSTEM.md`
- `docs/brand/BRAND_EXPERIENCE_ACCEPTANCE_MATRIX.md`
- `docs/design/README.md`
- `docs/design/RFxchange_DESIGN_SYSTEM.md`
- canonical tracker/dependency map
- merged Slices 3.1–3.5
- `docs/slices/WAVE_3_ROADMAP.md`

## Product rules

### `RES-001` — Application

An authorized organization may create one current provider application after legitimate activation/Profile Complete. The application references authoritative organization identity, contact, website, location and service-geography data rather than duplicating it.

The application collects:

- one or more provider categories;
- required Other category description where applicable;
- services, programs or assistance offered;
- service geography;
- organizations/people served;
- eligibility requirements;
- intake or referral method;
- in-person, virtual or hybrid availability;
- supported languages;
- official provider contact;
- authoritative website/domain;
- relevant credentials, documents or evidence; and
- attestation that the submitter may represent the organization.

Initial provider categories include:

- Economic development organization
- Chamber or business association
- Lender or capital provider
- Education or workforce institution
- Government assistance program
- Technical-assistance provider
- Incubator, accelerator or coworking organization
- Legal, accounting or professional support organization
- Procurement or contracting assistance organization
- Other

Categories are multi-select. The vocabulary remains extensible so approval is not limited to only the initial examples.

### `RES-002` — Governed decision

Use an auditable lifecycle:

```text
Draft
→ Submitted
→ Under Review
→ Information Requested
→ Resubmitted
→ Approved or Denied
```

Only an authorized administrator with the appropriate scoped permission may request information, approve or deny.

Approval produces **Official Resource Provider** status. It does not automatically award Organization Verified, Verified Resource Provider, paid membership, credibility score/seal or placement priority.

Denial preserves the application, reasons, reviewer attribution and reapplication policy.

### `RES-003` — Provider service profile

Approved providers maintain structured services/programs, service geography, eligibility, intake, contact, modality, language and availability. Provider-specific fields remain separate from the essential organization capability used for ordinary activation.

### `ADM-070` — Approval console

Authorized reviewers can inspect current authoritative organization/profile data, provider categories, services/programs, geography/availability, eligibility/intake, contact/languages, submitted evidence, requests for information/responses and complete decision history.

Review is scoped, permissioned, minimum-necessary and auditable.

## Brand and evidence rules

- Official Resource Provider status has a distinct status treatment; it must not resemble a Verified, Trusted, Endorsed or paid seal.
- Application/review surfaces use the Operational Workspace with opaque readable forms and evidence panels, not map glass or decorative dashboards.
- Evidence remains private/restricted unless a separate field is explicitly public.
- Approved provider status alone does not render a public service field; Slice 3.7 owns public service-territory projection.
- Provider categories use labels/glyphs rather than a rainbow color taxonomy.
- Availability, eligibility and intake language must be authoritative or explicitly unknown; do not imply current capacity from an approved profile alone.
- Paid, Founding or sponsored status cannot bypass review or alter approval appearance.

## Acceptance intent

- registration contains no Resource Provider checkbox or organization-type shortcut;
- an activated organization can submit one governed application;
- provider category is multi-select and Other requires explanation;
- authoritative organization data is referenced rather than duplicated;
- authorized admins can request information, approve or deny;
- direct client mutation cannot self-approve provider status;
- approval produces Official Resource Provider only;
- paid, Founding or Verification state cannot bypass review;
- approved providers can maintain the structured service profile;
- review/status history remains durable;
- customer-facing and administrative visuals preserve provider/verification/credibility/payment separation.

## Explicit non-scope

Do not implement annual revalidation/provider lifecycle (`ADM-071`), Verified Resource Provider credibility badge/seal, public service fields, advanced staff routing, provider analytics/API, public provider ranking, paid placement, Intelligence Dark, Presentation Mode, production sound or haptics.

## Exit checkpoint

The Network has a legitimate, administratively governed inventory of Official Resource Providers with structured profiles ready for discovery/routing, while ordinary organizations remain universally capable of buying, supplying, issuing and responding without provider status.

## Completion discipline

Recalculate dependencies after merge before authorizing Slice 3.7.

## Implementation evidence

Implementation and acceptance are recorded in `docs/architecture/WAVE_3_SLICE_3_6.md`. Focused lifecycle/authority/privacy tests, Firestore emulator persistence and direct-client denial, all five locales, configured real-environment participant/admin browser journeys, desktop/intermediate/mobile reflow, clean-console verification, exact cleanup and the canonical repository gate pass. Only `RES-001`, `RES-002`, `RES-003`, and `ADM-070` are marked complete. PR #132 passed exact-head production CI run `31297388363`, merged at `26412435651a13cc7a6540bbe50bc7b646760d78`, and post-merge run `31297486059` passed. Slice 3.7 was then recalculated and separately authorized.

## Execution authority

`docs/slices/SLICE_3_6_EXECUTION_AUTHORITY.md` records the original merged baseline, binding implementation decisions, acceptance matrix and preserved non-scope. Current Slice 3.7 authority is separate in `docs/slices/SLICE_3_7_EXECUTION_AUTHORITY.md`.
