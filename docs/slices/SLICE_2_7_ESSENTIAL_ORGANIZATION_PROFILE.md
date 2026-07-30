# Slice 2.7 — Essential Organization Profile

**Status: PLANNING BRIEF ONLY — DO NOT IMPLEMENT UNTIL EXPLICITLY AUTHORIZED**

## Feature IDs

- `ORG-007` — Minimum organization identity
- `ORG-008` — Meaningful capability requirement
- `ORG-010` — Multi-role organization classification
- `ORG-011` — Business objective preferences
- `ORG-012` — Profile Complete trigger

## Objective

Create the minimum organization profile that is genuinely useful to the RFxchange network and only then establish the automatic `Profile Complete` state.

At slice exit, an authorized organization has enough identity, contact, location, capability, role and objective information to be a meaningful participant, while `Profile Complete` remains a deterministic organization-level state derived from required fields rather than a manually asserted badge or a commercial entitlement.

## Must read

- `/AGENTS.md`
- `docs/context/PRODUCT_PRINCIPLES.md`
- `docs/context/USER_JOURNEY.md`
- `docs/context/ORGANIZATION_MODEL.md`
- `docs/context/MAP_AND_GEOGRAPHY.md`
- `docs/context/CREDIBILITY_SYSTEM.md`
- `docs/context/COMMERCIAL_MODEL.md`
- `docs/context/ACQUISITION_AND_RETENTION.md`
- `docs/context/BRAND_AND_UX.md`
- `docs/design/README.md`
- `docs/design/RFxchange_DESIGN_SYSTEM.md`
- canonical tracker/dependency map
- `docs/slices/WAVE_2_ROADMAP.md`
- merged Slice 2.3 organization-resolution contracts
- merged Slice 2.5 authority/membership contracts
- merged Slice 2.6 organization-location/privacy/service-geography contracts

## Prerequisite state

Before beginning, recalculate from merged `main`.

Expected prerequisite contracts:

- the organization has been resolved to a durable organization record;
- legitimate organization authority exists for profile mutation;
- a confirmed primary organization location exists where required;
- location visibility exists;
- service geography exists independently from home location;
- the canonical dependency correction for `ORG-012` remains authoritative: `ORG-007`, `ORG-008`, `ORG-009`, `ORG-010`, and `GEO-010` must all be satisfied before Profile Complete can be legitimate.

Do not weaken the Profile Complete gate to match whichever fields happen to exist in the UI.

## Product rules

### `ORG-007` — Minimum organization identity

Collect and persist the minimum organization identity needed for participation:

- organization name;
- organization type;
- website where applicable;
- main organization contact;
- primary location from the canonical confirmed-location contract.

Reuse the durable organization resolved earlier. Do not create a second profile identity or duplicate organization because a profile field changes.

Profile data is organization-owned. Individual user identity must remain separate from the organization profile.

Where a main contact references a user or contact channel, preserve organization scope and privacy. Do not make a user's personal profile synonymous with the organization's public contact identity.

### `ORG-008` — Meaningful capability requirement

Require at least one specific, meaningful capability before the profile can be complete.

A capability may represent, as applicable to the organization's role:

- a service the organization provides;
- a product it supplies;
- a capability/function it performs;
- something it buys/procures;
- a resource/provider function.

Do not satisfy this requirement with only broad industry labels, generic claims such as "business services," marketing slogans or an empty category shell.

The model should be structured enough to support later capability-based discovery and RFx/team/referral matching without requiring the full future enrichment taxonomy in this slice.

Capability-based discovery remains primary. NAICS/industry enrichment belongs to later work and must not become the only way the organization is discoverable.

### `ORG-010` — Multi-role organization classification

Allow organizations to hold multiple legitimate participation roles rather than forcing one exclusive type.

Support the approved role vocabulary at minimum:

- Business
- Supplier
- Buyer
- Issuer
- Government
- EDO
- Resource Provider
- Chamber
- Lender
- University
- Nonprofit
- Other

Role classification is descriptive/product-routing state. It does not by itself grant privileged permissions, Verified status, Official Resource Provider status, or buyer/issuer authority.

Where an operational role requires later approval or authority, preserve the distinction between "organization says this role applies" and "platform has approved the entitlement/credential needed to exercise privileged actions."

### `ORG-011` — Business objective preferences

Capture the organization's selected business objectives, including at minimum:

- find opportunities;
- issue opportunities;
- find customers;
- find suppliers;
- find teammates;
- send/receive referrals;
- find resources/support;
- explore the local network.

Allow more than one objective.

Objectives are personalization/routing input. They must not silently modify credibility, Verification, permissions or neutral eligibility.

`EDU-009` later consumes these objectives to choose the first-value pathway; keep the objective contract stable and explicit enough for that use.

### `ORG-012` — Profile Complete trigger

`Profile Complete` is an automatic organization-level Active credential/state.

It becomes active only when the required minimum fields are valid and present across the canonical dependency set:

- identity/contact (`ORG-007`);
- meaningful capability (`ORG-008`);
- service geography (`ORG-009`);
- role classification (`ORG-010`);
- location visibility (`GEO-010`);
- confirmed primary location where required by the organization/location model.

The state must be derived/recalculated from authoritative profile data. It is not a checkbox an organization or admin can casually assert.

If a required field later becomes invalid or is removed, Profile Complete must no longer be represented as currently satisfied. Preserve history/audit if credential history exists; do not falsely leave a stale active completion state.

Profile Complete does **not** mean:

- Organization Verified;
- Address Verified;
- Official Resource Provider;
- Authorized Buyer;
- paid member;
- Founding organization;
- opportunity ready;
- OPEN access by itself.

## Credibility and commercial rules

`Profile Complete` belongs to the Active credibility family and is automatic based on required organization data.

Commercial status must never satisfy or bypass Profile Complete requirements.

Founding/member/provider presentation may coexist with Profile Complete, but those statuses are separate facts and cannot inflate the substantive credential.

Do not create a public numeric credibility score in this slice.

## Design and UX requirements

Follow the canonical design system.

- Keep the profile workflow focused and progressive rather than presenting a giant settings dashboard.
- Use a clear completion model that explains what is missing without implying that optional enrichment is mandatory.
- Prefer typography, spacing, progressive disclosure and map context over excessive cards/dividers.
- Preserve the map-first product feel where primary location/service geography are shown.
- Use semantic role/objective/capability controls with accessible labels and keyboard behavior.
- Do not use commercial upgrade styling around required free/core profile fields.
- Profile Complete should feel like a legitimate activation milestone, not a gamified purchase reward.
- Mobile layouts must retain field clarity, completion state and action priority.

## Security and integrity requirements

- Profile mutation requires authorized organization scope.
- Cross-organization writes fail closed.
- Client state cannot grant Profile Complete.
- Required-field validity is evaluated server-side or through an authoritative application service, not only by browser form completion.
- Public profile projections expose only approved fields and honor location privacy established in Slice 2.6.
- Role selections do not grant permissions without the existing authority/permission system.
- Capability/objective fields must be bounded/validated and not become arbitrary executable/filter expressions.

## Acceptance intent

- `ORG-007`: organization name/type, website where applicable, main contact and primary location are collected in the canonical organization profile.
- `ORG-008`: at least one specific capability/service/product/buying/provider function is required.
- `ORG-010`: the organization can hold the approved multi-role classifications.
- `ORG-011`: the approved business objectives can be selected and persisted for later personalization/first-value routing.
- `ORG-012`: Profile Complete is awarded automatically only when required identity/contact/capability/geography/visibility/role conditions are actually satisfied.

## Expected implementation qualities

- typed essential-profile aggregate/contracts;
- explicit role and objective vocabularies;
- meaningful capability validation with room for later taxonomy enrichment;
- deterministic Profile Complete evaluator/recalculation path;
- server-authoritative organization-scope mutation;
- public/private projection discipline;
- tests proving paid/founder/provider/verification state cannot bypass completion;
- tests proving missing capability, geography, visibility, role, contact or location prevents completion;
- tests proving completion responds correctly when required state changes;
- accessible desktop/mobile profile workflow following `docs/design/`;
- persistence/rules/emulator coverage as appropriate.

## Explicit non-scope

Do **not** implement in Slice 2.7:

- detailed products/services taxonomy (`ORG-013`);
- NAICS/industry enrichment (`ORG-014`);
- certifications/licenses/UEI/CAGE/SAM enrichment (`ORG-015`);
- past performance (`ORG-016`);
- teaming/referral/resource preferences (`ORG-017`);
- media/portfolio enrichment (`ORG-018`);
- Organization Verification;
- Opportunity Ready or higher credibility badges;
- final organization marker activation (`GEO-011`);
- Organization 360 (`ADM-063`, `ADM-064`);
- OPEN release (`EDU-010`);
- membership/plan upsell as a condition of profile completion.

## Exit checkpoint

The organization has a legitimate minimum identity, confirmed location context, meaningful capability, service geography, participation role(s) and business objective(s). The platform can deterministically state whether the organization is Profile Complete without conflating that state with Verification, commercial status or OPEN access.

## Completion discipline

Mark only `ORG-007`, `ORG-008`, `ORG-010`, `ORG-011`, and `ORG-012` Done when their individual acceptance conditions and validation evidence pass.

After merge, recalculate dependencies from merged `main`. Do not begin Slice 2.8 unless `GEO-011`, `ADM-063`, and `ADM-064` are dependency-eligible.