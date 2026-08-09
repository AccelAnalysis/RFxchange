# Wave 3 Slice 3.7 — Resource Discovery, Routing & Provider Distribution

## Accepted scope

Slice 3.7 implements `RES-004`, `RES-005`, `DSC-011`, `REF-006`, `RES-007`, `RES-008`, and `ACQ-008`. It exposes explicitly published Official Resource Providers and their maintained services in authorized Network geography, provides deterministic and explainable contextual routing, reuses the governed referral aggregate for consented provider connections, adds request-scoped communications, lets providers govern their own resources, and preserves bounded provider acquisition continuity. It does not implement advanced capacity-aware routing (`RES-006`), provider annual revalidation (`ADM-071`), service acceptance or outcome state, paid placement, Organization Verification, credibility, opportunity publication, Slice 3.8 education, or a later Brand Gate.

## Runtime architecture

- `src/domain/resource-network/model.ts` defines versioned provider-publication, resource, request-message and acquisition-invitation contracts. Provider discovery is an explicit draft/published/withdrawn projection over an approved private service-profile version; provider resources use draft/published/withdrawn/expired lifecycle with bounded moderation, dates and safe URLs.
- `src/application/resource-network/resource-network.ts` re-resolves current provider authority, status, private profile and source geography. Discovery requires the selected controlled locality, current OPEN viewer authorization, published status, matching maintained service territory and explicit maintained availability. Match reasons are deterministic; the implementation contains no model call, inferred capacity score or commercial ordering signal.
- Existing referral authority now supports the `provider-connection` purpose with an exact organization, service and publication-version binding. Send, accept, decline and redirect revalidate current provider eligibility; redirect changes the exact provider under a new auditable lifecycle transition instead of silently broadening recipients.
- `src/infrastructure/firestore/resource-network.ts` transactionally persists current aggregates, immutable versions/events, command receipts, organization audits, append-only messages and invitations. Direct-client access is denied for all six provider-network collections, and mixed-scope messages remain limited to the two exact participating organizations through server projections.
- `/resources`, `/api/resources`, `/api/acquisition/provider` and the extended referral API compose the participant experience. The existing map renders real service-territory fields separately from office markers, and map/list/detail state exposes only minimized publication/resource projections and explicit match reasons.

## Authority, privacy, and semantic boundaries

Only an approved Official Resource Provider with an active private service profile may publish. Publication selects existing maintained services and binds the exact profile version; withdrawing it removes the provider from public discovery without erasing history. A viewer organization never discovers itself as a provider. Geography is resolved server-side from current controlled-locality authority, and service territory is presented as distinct from the provider office marker.

Provider connection consent identifies the exact recipient and shares only the requester organization name, bounded request summary and selected provider/service context. Request history and messages are visible only to the exact requester and provider organizations. A provider may accept, decline or explicitly redirect, but none of those states represents intake approval, service acceptance, qualification, verified outcome or capacity. Provider-maintained availability is a published fact; no capacity inference or `RES-006` ranking exists.

Resources are participant-authored provider publications and retain their governed lifecycle and source attribution. Platform copy is localized while provider/requester authored text remains verbatim. Provider acquisition invitations are signed, purpose-bound continuity into the existing activation path; they cannot create provider status, organization authority, a public opportunity or an attached request without the later legitimate domain command.

## Acceptance evidence

Focused tests cover explicit publication/withdrawal, source-profile binding, minimized expiry-aware resources, bounded two-organization messages, exact provider/service/publication request context, current-eligibility revalidation, redirect, idempotency/version conflicts, direct-client denial and the absence of capacity or credibility invention. Firestore emulator acceptance proved atomic publication/resource/message persistence, append-only evidence, stale-version rejection, direct-client read/write denial across all six collections and exact cleanup.

Configured acceptance against the selected real Firebase project used disposable manager, requester and administrative identities plus authoritative Portsmouth geography, Census boundary and Mapbox rendering. It proved:

- the requester discovered one real acceptance provider through its separately rendered service territory with explicit “Serves this locality”, “Service territory” and maintained availability reasons;
- exact-recipient consent preceded a provider request, the requester sent a message, and the provider saw the exact request, accepted it and replied;
- the provider created a resource, preserved it as a draft, explicitly published it, and the requester saw it only after publication on a fresh load;
- the provider issued one profile-completion acquisition invitation without creating authority or provider status for the invitee;
- German platform copy rendered while participant-authored provider/resource/request text remained unchanged;
- fresh provider and requester loads produced empty browser console logs, and `390px`, `820px` and `1280px` layouts had no horizontal overflow; and
- inspection returned one referral, two messages, one invitation, one published provider publication and one published resource, followed by cleanup of 74 exact Firestore records and all disposable Auth identities with zero residual records and zero residual Auth users.

The Firestore emulator smoke, focused validation, TypeScript, lint with 13 inherited warnings and no errors, 432 architecture tests, 19 Functions tests, production build and canonical `npm run check` all pass on the accepted implementation branch.

## Completion and handoff

Acceptance supports marking only `RES-004`, `RES-005`, `DSC-011`, `REF-006`, `RES-007`, `RES-008`, and `ACQ-008` Done. The checkpoint is **438 total · 150 Done · 288 Not Started**, Activation **43/43**, and Network **36/38**. PR #137 passed exact-head production CI run `31300282317` on `0776aaf59856dd5ab2ef5f8fe3b8e9eec5713cbe`, merged at `25baba600d6e1913a8941570f7348454d2e6941d`, and post-merge `main` CI run `31300395073` passed. `RES-006`, `ADM-071`, B6b, Slice 3.8, Wave 4 and later work were not begun in Slice 3.7. Dependency authority was then recalculated from the merged tree in the separate Slice 3.8 authority update.
