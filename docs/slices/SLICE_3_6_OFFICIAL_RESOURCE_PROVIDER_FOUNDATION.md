# Slice 3.6 — Official Resource Provider Foundation

**Status: PLANNING BRIEF ONLY — DO NOT IMPLEMENT UNTIL EXPLICITLY AUTHORIZED**

## Feature IDs
- `RES-001` — Official Resource Provider application
- `RES-002` — Provider admin review/approval
- `RES-003` — Provider service profile
- `ADM-070` — Resource-provider approval console

## Objective

Create the governed path by which an eligible organization applies to become an Official Resource Provider, administrators review the application, an approved provider receives a controlled provider status, and the provider maintains the structured service profile required by Network discovery/routing.

## Must read

- `/AGENTS.md`
- `docs/context/ORGANIZATION_MODEL.md`
- `docs/context/ADMINISTRATION.md`
- `docs/context/CREDIBILITY_SYSTEM.md`
- `docs/context/ACQUISITION_AND_RETENTION.md`
- canonical tracker/dependency map
- merged profile enrichment and existing scoped-admin/case/audit foundations
- `docs/slices/WAVE_3_ROADMAP.md`

## Product rules

### `RES-001`

An authorized organization can apply for Official Resource Provider status after legitimate organization activation/profile completion. Additional locations are optional enrichment, not a prerequisite to apply.

Application captures the information required for review and references authoritative organization/profile data instead of duplicating it unnecessarily.

### `RES-002`

Use a controlled provider-role decision flow such as:

```text
Apply → Admin Review → request information where needed → approve/deny → Official Resource Provider status
```

Provider approval must review identity/authority, category, credentials and service information appropriate to the provider type.

**Important boundary:** Official Resource Provider approval is not the later Credibility `Organization Verified` or `Verified Resource Provider` badge. Paid status cannot purchase provider approval. If the application workflow records an identity/credential review, preserve that evidence for later credibility workflows without silently awarding them.

### `RES-003`

Approved providers maintain structured services/programs, service geography, eligibility, business types/industries served, intake method, contact, languages and in-person/virtual availability.

### `ADM-070`

Authorized reviewers can inspect the complete provider application, profile/service geography, eligibility, intake, contact, modality, language and supporting credential/evidence context before decision. Review is scoped, permissioned and auditable.

## Acceptance intent

- an eligible organization can submit one controlled provider application;
- authorized admins can inspect all required fields/evidence and approve/deny/request information as supported by the Wave 3 lifecycle;
- approval produces Official Resource Provider status, not paid membership or substantive credibility;
- approved provider can maintain the complete structured service profile;
- direct client mutation cannot self-approve provider status;
- review decisions preserve history and admin attribution.

## Expected implementation qualities

Typed application/status contracts, reuse of organization/profile/geography/storage/admin audit, private evidence protection, no duplicate provider identity, and tests for unauthorized review, cross-scope access, denial/reapplication and paid-status separation.

## Explicit non-scope

Do not implement annual revalidation/provider lifecycle (`ADM-071`), Verified Resource Provider credibility badge, advanced staff routing, provider analytics/API, public provider ranking or paid placement.

## Exit checkpoint

The Network has a legitimate, administratively governed inventory of Official Resource Providers with structured profiles ready for discovery and routing.

## Completion discipline

Recalculate dependencies after merge before authorizing Slice 3.7.