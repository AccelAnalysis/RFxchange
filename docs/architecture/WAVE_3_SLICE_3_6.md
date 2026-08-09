# Wave 3 Slice 3.6 — Official Resource Provider Foundation

## Accepted scope

Slice 3.6 implements `RES-001`, `RES-002`, `RES-003`, and `ADM-070`. It creates the post-activation organization application, governed administrative review, Official Resource Provider status, and private structured service profile. It does not implement Organization Verification, a credibility seal, public provider discovery/routing, provider referrals, resource publishing, annual revalidation, paid placement, or any later slice or Brand Gate.

## Runtime architecture

- `src/domain/resource-providers/model.ts` defines the controlled category vocabulary, structured application/profile contracts, explicit application lifecycle, Official Resource Provider status, validation, decision attribution, availability/capacity truth, and denial/reapplication behavior.
- `src/application/resource-providers/provider-foundation.ts` re-resolves current organization authority and authoritative Profile Complete/location/service-geography references, requires `resource.manage`, checks evidence ownership, binds idempotency receipts to the exact organization, enforces expected versions, and evaluates exact administrative read/review permission and grant scope.
- `src/infrastructure/firestore/resource-providers.ts` transactionally stores the current aggregate with immutable versions, events, command receipts, organization audits, platform-administrative audits, approval-only status, and the owner/admin-only service profile. Firestore rules deny direct-client access to all provider collections.
- `/provider-application` and its API provide the governed participant draft, submission, response/resubmission, history, status and approved-profile maintenance experience. Organization settings and the marketing provider page point to this controlled route; registration remains unchanged.
- `/admin/resource-providers` and its API provide scoped queue/detail inspection, authoritative organization references, minimum-necessary application/evidence metadata, complete history, information requests, approval and denial. Read and transition permissions remain distinct.

## Authority, privacy, and semantic boundaries

Application identity references the canonical organization profile, primary contact, website, confirmed location and service geography rather than creating a second organization identity. Participant-authored category Other text, services, eligibility, intake, contact and responses remain verbatim. Optional evidence asset identifiers are ownership-checked and private; the console exposes only minimum-necessary metadata, not evidence bytes.

Approval creates only `official-resource-provider` status and a private structured provider service profile. It cannot create or imply Organization Verified, Verified Resource Provider, endorsement, credibility, payment, Founding recognition, search priority, guaranteed eligibility or current capacity. Unknown availability/capacity remains explicit. No status or service profile enters public discovery in this slice.

## Acceptance evidence

Focused tests cover the complete approval and information-request lifecycle, denial and numbered reapplication, private profile maintenance, unknown capacity, exact permissions/scopes, missing Profile Complete, stale versions, cross-organization evidence rejection, organization-bound command replay, multi-select categories, required Other description and participant-text preservation. Firestore emulator acceptance proves atomic current/version/event/audit/command persistence, approval-only status/profile creation, stale-write rejection, direct-client denial and zero residuals.

Configured acceptance against the selected real Firebase project used fresh disposable participant and administrator authority records. It proved:

- a real authenticated manager completed draft → submit → review → information request → participant response → resubmit → approve, then maintained availability as Limited;
- German platform copy rendered in the browser while all five locale dictionaries passed static validation, and participant-authored content remained unchanged;
- an ordinary member without `resource.manage` received an intentional permission state and an administrator without `provider.application.read` received no protected route detail;
- authoritative organization/profile/website/contact/location/service-geography references, application fields, evidence metadata boundary, history, requests/responses and Official Resource Provider-only status remained distinct;
- desktop `1280px`, intermediate `820px`, and mobile `390px` layouts had no horizontal overflow and a fresh authenticated load produced no console errors or warnings; and
- cleanup deleted 66 exact Firestore records, all disposable Auth identities, and three orphaned acceptance identities from an interrupted seed, followed by zero Firestore/Auth residuals.

The final configured record contained approved status, nine immutable events, nine versions, nine command receipts, five organization audits, four administrative audits, and a Limited private service profile before exact cleanup. Focused validation, TypeScript, lint (13 inherited warnings and no errors), production build, Firestore emulator smoke, and the canonical `npm run check` pass on the accepted implementation branch.

## Completion and handoff

Acceptance supports marking only `RES-001`, `RES-002`, `RES-003`, and `ADM-070` Done. The checkpoint is **438 total · 143 Done · 295 Not Started**, Activation **43/43**, and Network **29/38**. PR #132 passed exact-head production CI run `31297388363` on `81dd94f7e655b1854660e33c0a703dd37bb39a06`, merged at `26412435651a13cc7a6540bbe50bc7b646760d78`, and post-merge `main` CI run `31297486059` passed. Dependency authority was then recalculated from that merged tree and Slice 3.7 was separately authorized; no later slice or gate began in Slice 3.6.
