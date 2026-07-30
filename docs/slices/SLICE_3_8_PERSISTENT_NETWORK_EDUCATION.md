# Slice 3.8 — Persistent Network Education

**Status: PLANNING BRIEF ONLY — DO NOT IMPLEMENT UNTIL EXPLICITLY AUTHORIZED**

## Feature IDs
- `EDU-016` — Reusable Quick Start and role paths
- `EDU-017` — Workflow explainers

## Objective

Turn Wave 2 orientation into a persistent education system that remains useful after onboarding and explains live Wave 3 behaviors in context.

## Must read

- `/AGENTS.md`
- `docs/context/USER_JOURNEY.md`
- `docs/context/PRODUCT_PRINCIPLES.md`
- `docs/context/ORGANIZATION_MODEL.md`
- `docs/context/ACQUISITION_AND_RETENTION.md`
- `docs/design/README.md`
- `docs/design/RFxchange_DESIGN_SYSTEM.md`
- canonical tracker/dependency map
- merged Wave 2 orientation and Slices 3.2–3.7
- `docs/slices/WAVE_3_ROADMAP.md`

## Product rules

### `EDU-016`

Provide reusable post-onboarding learning paths including Quick Start plus Business, Issuer and Resource Provider paths. Role paths are educational and may be shown according to organization roles/objectives, but they do not grant permissions or status.

Content should link to live workflows where available and clearly identify functionality reserved for later waves rather than pretending it is active.

### `EDU-017`

Major workflows should answer three practical questions at the point of action:

1. What is this?
2. What happens if I do this?
3. What happens next?

Explain consequential actions before commitment, including referrals, provider connections, organization/profile changes and other live Network actions established in Wave 3.

## Acceptance intent

- users can reopen Quick Start and the appropriate role paths after onboarding;
- workflow explainers appear at high-value/consequential Network actions without becoming mandatory repetitive modal friction;
- education reflects actual live behavior and legal/privacy boundaries;
- education state is separate from authorization and cannot unlock features;
- mobile/desktop experiences remain accessible and uncluttered.

## Expected implementation qualities

Versionable content/config where practical, deep links to the relevant workflow, role/objective-aware presentation without authorization coupling, analytics hooks only where already authorized, and tests proving education cannot grant access or mutate domain state.

## Explicit non-scope

Do not implement Wave 4 first-RFx education (`EDU-011`–`EDU-013`), endorsement education (`EDU-015`), paid training products, certification or automatic user qualification.

## Exit checkpoint

Participants can learn/relearn the Network in context after onboarding, and the live workflows explain consequences before users commit actions.

## Completion discipline

After merge, reconcile evidence for all 38 Network features and verify the Wave 3 exit condition before beginning Wave 4.