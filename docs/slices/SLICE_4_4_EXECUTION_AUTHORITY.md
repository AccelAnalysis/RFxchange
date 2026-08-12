# Wave 4 Slice 4.4 — Readiness, Preview and Publication

**Status: EXECUTION AUTHORITY — DOCUMENTATION ONLY.**

**Merged baseline:** `81ec0c7a7fbd28a2a4827d4ba448a5ceb28b6ed7` (PR #165, Wave 4 Slice 4.3)

**Feature IDs:** `ISS-016`, `ISS-018`, `ISS-019`, `ISS-020`, `ACQ-009`

## 1. Authority and completion boundary

This document authorizes one later runtime implementation of publication readiness, exact responder preview, atomic publication, a permitted opportunity projection, controlled sharing and the basic/advanced issuance boundary. It does not itself complete a Feature ID, change tracker arithmetic, publish an RFx or create an opportunity.

Slice 4.4 is complete only when an authorized issuer can reopen a real complete Slice 4.3 private draft, receive server-derived deep-linked readiness findings, inspect the exact permitted projection a responder will receive, publish one immutable version atomically and resolve the resulting controlled share link through that same projection.

This is the first slice that may create a real production opportunity projection. Before the successful publication transaction, the draft is not an opportunity, beacon, discovery result, demand observation, match candidate or externally visible RFx. B6c becomes eligible only after this runtime is merged and accepted; this authority does not execute or complete B6c.

## 2. Dependency result

| Dependency | Result |
| --- | --- |
| Wave 3 organization, geography, acquisition and controlled discovery foundations | Satisfied and reused; Slice 4.4 creates a producer/projection, not a second discovery system. |
| Persistent participant shell and Operational Workspace | Satisfied; issuer movement and loading remain inside the Exchange. |
| Slices 4.1–4.3 aggregate, package, AMACS requirements, response structure and evaluation definition | Satisfied through PR #165 at the merged baseline. |
| Existing `rfx.publish` permission and organization-operation boundary | Satisfied and reused; no new publish-granting client state or permission is introduced. |
| AMACS 0.5.0 release and snapshot contracts | Satisfied; publication freezes current governed IDs, labels and release provenance. |
| ACQ-002/003 public projection and acquisition-context seams | Satisfied; the live RFx publication adapter replaces the bounded seeded production adapter behind the existing semantic boundary. |
| Commercial model and organization commercial-account separation | Satisfied; basic issuance cannot be paywalled and commercial state cannot alter readiness or market truth. |
| Stabilization 2C | Isolated release engineering; not a product dependency. |

No dependency edge changes. Slice 4.5 remains ineligible until the runtime authorized here is merged and post-merge acceptance is green.

## 3. Required sources

The runtime implementation must read and preserve the current versions of:

- `/AGENTS.md`;
- `docs/context/PRODUCT_PRINCIPLES.md`;
- `docs/context/EXCHANGE_INTERACTION_ARCHITECTURE.md`;
- `docs/context/RFX_TRANSACTION_CYCLE.md`;
- `docs/context/MAP_AND_GEOGRAPHY.md`;
- `docs/context/ACQUISITION_AND_RETENTION.md`;
- `docs/context/COMMERCIAL_MODEL.md`;
- `docs/rfx/RFX_CORE_AMACS_CONVERGENCE.md`;
- `docs/rfx/AMACS_0_5_RECONCILIATION.md`;
- `docs/rfx/AMACS_INTEGRATION_CONTRACT.md`;
- `docs/rfx/RFX_CORE_FEATURE_CROSSWALK.md`;
- `docs/rfx/RFX_CORE_PRODUCT_WORKSPACES.md`;
- `docs/rfx/RFX_CORE_ACCEPTANCE_MATRIX.md`;
- `docs/slices/SLICE_4_1_EXECUTION_AUTHORITY.md` through `SLICE_4_3_EXECUTION_AUTHORITY.md`;
- `docs/architecture/WAVE_4_SLICE_4_1.md` through `WAVE_4_SLICE_4_3.md`; and
- applicable brand/design, authorization, lifecycle, audit, Firestore, geography, internationalization, accessibility and recovery authorities.

Prototype mechanics are not production architecture. A preview screenshot or mock opportunity never satisfies this slice.

## 4. Lifecycle and ownership

Extend the existing canonical organization-owned `RfxAggregate`; do not create a parallel solicitation or opportunity aggregate. The only lifecycle expansion authorized here is:

```text
draft → published
```

Publication is a one-way transition in this slice. After publication, the aggregate version and immutable publication snapshot are read-only under this authority. Amendment, withdrawal, cancellation, close, extension, republication and deletion require later explicit authority; do not add speculative states or UI controls for them.

The issuing organization owns the RFx and publication. The acting user and exact membership are audit evidence only. A public or authenticated participant projection does not transfer ownership or grant responder authority.

## 5. Server-authoritative readiness

Define a deterministic result equivalent to:

```ts
type PublicationReadinessResult = Readonly<{
  rfxId: RfxId;
  aggregateVersion: number;
  evaluatedAt: string;
  status: "ready" | "blocked";
  requirementStatus: readonly RequirementReadinessStatus[];
  findings: readonly ReadinessFinding[];
}>;

type ReadinessFinding = Readonly<{
  code: string;
  severity: "blocking" | "advisory";
  sourcePath: string;
  workspaceTarget: string;
  relatedRecordId: string | null;
}>;
```

The server, not the browser, derives readiness from the current aggregate and current authority. Finding codes and paths are stable domain values; localized copy is presentation. A finding deep-links to the exact task module, row and field without putting raw AMACS IDs or storage paths in participant copy.

At minimum readiness rechecks:

- lifecycle is still `draft` and the expected aggregate version is current;
- the canonical request-family snapshot and pinned AMACS 0.5.0 provenance are complete;
- every Slice 4.2 package module is complete and its structured dates remain valid relative to the server clock;
- performance geography still resolves through current confirmed location/locality and controlled release authority;
- every Slice 4.3 definition module is complete;
- each required requirement has the governed response/evidence and evaluation links required by its treatment;
- response-section and evaluation-factor identities/links are internally complete;
- conditional comparative weights total exactly 10,000 basis points;
- the requested publication audience is supported and its projection can be minimized safely;
- the issuer organization, exact membership, restrictions, account state and `rfx.publish` authority remain current; and
- any actually configured approval condition is satisfied by current authoritative evidence.

Do not invent attachment, legal-review or approval requirements that no current domain owns. If later-configured policy is absent, readiness reports that truth rather than fabricating a gate. Advisory findings never silently become blockers.

Readiness is a current computation, not publication authority and not a durable market fact. A displayed `ready` result can become stale. The publication command recomputes it within the authoritative write path.

## 6. Requirement-by-requirement readiness

Every governed requirement receives a stable status keyed by its local requirement identity. The status reports whether its required response/evidence and evaluation relationships are complete. It does not report that any responder satisfies, qualifies for or matches the requirement.

Foundation requirements, AMACS requirements, evidence requirements, response sections and evaluation factors remain distinct. Readiness may connect their existing stable identities but cannot flatten them into free text or infer that an organization has evidence.

## 7. One responder projection for preview and publication

Implement one pure, server-owned projector equivalent to `ResponderOpportunityProjection`. It accepts either the current authorized draft for preview or the immutable publication snapshot for live projection, plus a permitted audience. Both modes use the same field selection, ordering, redaction and structured rendering code.

The projection may include only responder-relevant, issuer-approved facts such as:

- opaque publication reference and published version;
- RFx title, approved summary and issuing organization display identity;
- governed request-family label and publication/response timing;
- permitted performance-locality labels;
- disclosed value/term facts, respecting `not-disclosed` variants;
- required/preferred/informational requirements with human-readable AMACS snapshots;
- response sections, required evidence and responder-visible limits; and
- the responder-visible evaluation method and factor treatment/weights where applicable.

It excludes private actor/membership identities, exact private addresses, geocode/provider provenance, internal notes, interpretation records/candidates, command fingerprints, audit evidence, approval evidence, unreleased geography, private organization data and later responder/evaluator state.

Preview carries the aggregate version and a deterministic digest of the responder-visible substantive payload. It is labeled preview, never published. Publishing an unchanged version must create a live projection with exactly the same responder-visible substantive payload and digest; only authoritative envelope metadata such as `preview` versus `published`, publication time and published aggregate version may differ. If the aggregate changes, the prior preview becomes stale and publication requires a fresh readiness/preview result.

Do not build a decorative mock document or a second client-only formatting path.

## 8. Publication audience and permitted reads

The bounded audience set is:

- `public` — the minimized projection may resolve anonymously through the existing public opportunity route and acquisition boundary; or
- `authenticated-participants` — the projection requires an authenticated, unrestricted controlled-platform participant before substantive content is returned.

Private drafts are never an audience. Invite-only, named-recipient, evaluator-only, sealed, limited-bidder and organization-list audiences are excluded until separately authorized.

Audience is explicit issuer intent captured by the publish command and frozen in the publication snapshot. A URL, search parameter, acquisition cookie or share-link possession never widens it. Unauthorized and unavailable reads fail closed without disclosing issuer, RFx, audience or publication existence.

## 9. Atomic publication and immutable snapshot

The publish command contains a stable command ID, exact RFx ID, expected aggregate version, preview/projection digest and requested audience. Its deterministic fingerprint includes every business input. A command ID reused for different intent conflicts.

Within one Firestore transaction, successful publication must:

1. reauthorize the exact actor/membership/organization for `rfx.publish`;
2. reread the current aggregate and relevant current geography/policy authority;
3. recompute readiness and the permitted responder projection;
4. reject stale version, stale digest or any blocking finding;
5. update the one aggregate to `published` and increment its version exactly once;
6. create one immutable full publication snapshot with its AMACS and projection digests;
7. create one permitted opportunity projection carrying only approved fields, audience and index-safe locality/capability keys;
8. create one append-only `rfx-published` event as the canonical publication timeline entry;
9. create one immutable command receipt; and
10. create one organization audit event such as `rfx.published`.

No projection, share reference, index entry, timeline fact or published lifecycle may exist if any part fails. Exact replay returns the committed aggregate/snapshot/projection/receipt without duplicating evidence. Concurrent and stale publication attempts conflict with bounded recovery guidance.

The publication snapshot freezes the complete authoritative RFx version needed to reproduce the live projection, including AMACS IDs/labels/release provenance. It is not a second mutable aggregate. Event history supplies the publication timeline; do not create a competing timeline truth.

## 10. Geography and index boundary

The opportunity projection carries controlled locality/geography IDs, approved labels and index keys sufficient for future Slice 4.5 queries. Exact-address performance locations are reduced to the permitted controlled-locality context unless separate explicit disclosure authority exists; none is granted here. Do not copy exact coordinates, street addresses or geocode provenance into public/index projections.

Slice 4.4 creates the first legitimate data source from which a later B6c opportunity beacon may be rendered. It does not render or style that beacon, modify the map, enable RFx search/list discovery or complete B6c. No draft or preview is written to a spatial source.

## 11. Controlled sharing and acquisition continuity

`ACQ-009` reuses the existing `/opportunities/[reference]` and acquisition-context seams. The publication transaction creates or derives one opaque, stable share reference bound to the immutable publication/projection and its audience.

- A public link resolves only the minimized public projection.
- An authenticated-participant link may preserve acquisition intent through sign-in/activation but reveals substantive content only after current participant authority succeeds.
- Share/reference possession grants no membership, lifecycle, organization, responder, invitation, match or response authority.
- Malformed, guessed, wrong-audience, missing-projection and unpublished references fail closed; acquisition-context expiry remains governed by its existing envelope.
- Acquisition context remains navigation continuity only and records the real publication reference, never a draft ID or private snapshot ID.

The production RFx publication adapter replaces the bounded seeded launch-opportunity adapter behind the existing projection port. Seeded/demo opportunities may remain only as explicit test fixtures; they must not be a production fallback, market activity source or mixed query result once Slice 4.4 is live.

## 12. Basic/advanced commercial boundary

Basic RFx readiness, preview, publication and controlled sharing are available to every otherwise eligible organization under the approved free-participation policy. Missing subscription, free plan, non-Founding status or absent commercial account cannot block basic issuance.

Define a server-side RFx capability/entitlement policy seam for any genuinely authorized advanced capability. It must default closed for an unknown advanced key and must never alter:

- readiness facts;
- AMACS interpretation or requirement meaning;
- publication audience legitimacy;
- projection contents required for fair participation;
- geography/index truth;
- later matching, qualification or ranking; or
- organization credibility/verification.

No advanced RFx capability is invented by this authority. Do not add billing, checkout, enrollment, quotas, preferred placement, paid visibility, sponsored discovery or Founding advantages. UI copy may distinguish included basic issuance from unavailable future advanced tools without presenting a fake upsell or blocking the publish path.

## 13. Authorization, privacy and client access

Readiness and preview require the canonical exact-user, provider/account, active membership, organization ownership, restriction and issuer-workspace boundary. Publication additionally requires current server-side `rfx.publish`. Client state, aggregate data received earlier, URL state, preview digest and commercial state never grant authority.

Wrong-user, wrong-organization, inactive membership, restricted organization/membership, disabled/unverified/revoked account, missing permission, guessed RFx ID and cross-tenant cases fail closed before private content or record existence is disclosed. Authorization is rechecked at publish time after any long-lived preview.

Reuse `rfxAggregates`, `rfxEvents`, `rfxCommands` and `organizationAuditEvents`; add only bounded publication snapshot/projection persistence needed by this slice. Direct browser Firestore access remains default-denied for aggregates, snapshots, commands and private/participant-only projections. Anonymous public reads still resolve through trusted server handlers that apply the projection gate; do not grant direct public Firestore reads.

Immutable snapshot, event, command and audit records cannot be updated or deleted from the client. Projection writes are server-only and transaction-coupled to publication.

## 14. AI and AMACS boundaries

No AI call is required or authorized for readiness, preview, summary generation, audience selection or publication. Interpretation records remain private non-authoritative inputs already accepted into the draft through prior domain commands; they are not copied into the publication snapshot/projection.

AMACS 0.5.0 governs requirement/request-family semantics. Publication freezes the current confirmed IDs, labels, definitions and release/source provenance. Catalog changes cannot silently rewrite a published snapshot or projection. Model memory and human-looking IDs never substitute for the pinned runtime projection.

## 15. Operational Workspace and participant copy

Reuse the persistent participant shell and `/opportunities` Operational Workspace. Add bounded `Readiness and preview` behavior to the existing issuer task composition; do not create another shell, generic document editor or procurement portal.

- Findings summarize blocking/advisory counts and deep-link to the exact module/row/field.
- Requirement rows expose their own readiness without suggesting responder qualification.
- Preview clearly states audience, aggregate version and preview status.
- Publish remains disabled for blocking findings and gives immediate pending feedback without an artificial hold.
- A stale/changed result preserves safe issuer context and returns the user to the exact affected work.
- Successful publication reports the authoritative published version and controlled share action; button clicks or optimistic UI never show `Published`.
- Route loading and public/share errors remain scoped below the persistent shell or relevant public surface.

All changed participant/public copy exists in English, Spanish, French, Italian and German. Acceptance covers desktop, intermediate and 390 px mobile, long labels, keyboard-only use, screen-reader semantics, focus restoration, visible focus, error association, target sizing, reduced motion and no horizontal overflow.

## 16. Required acceptance

### Domain/application

- every package/definition/readiness invariant is evaluated from current authoritative state;
- each blocking/advisory finding has stable code, exact source path and valid workspace target;
- every requirement receives deterministic non-qualification readiness status;
- current dates, geography release/confirmation and configured approval authority are rechecked;
- preview and live projection use one projector and unchanged input yields the exact same digest/payload;
- projection minimization prevents actor, exact-address, interpretation, audit and private-organization leakage;
- audience gates enforce public versus authenticated-participant reads;
- publication snapshot freezes aggregate/AMACS/projection versions and is reproducible;
- atomic publish, exact replay, altered fingerprint, stale/concurrent write and interrupted-success recovery;
- every negative account/membership/restriction/tenant/permission case;
- share references cannot resolve drafts, previews, wrong audiences or absent projections;
- basic issuance succeeds without a paid/founding commercial account;
- unknown/absent advanced entitlement fails closed without changing market truth; and
- production runtime cannot fall back to a seeded opportunity.

### Firestore emulator

- one transaction commits aggregate, immutable snapshot, permitted projection, event, receipt and audit;
- stale digest/version, readiness, geography, audience, permission and collision failures leave no partial evidence;
- exact replay creates one published version and one evidence set;
- direct-client aggregate/snapshot/projection/event/command/audit writes are denied;
- direct-client private and authenticated-participant reads are denied;
- trusted public resolver returns only a current public projection;
- guessed/cross-organization identifiers disclose nothing;
- snapshot/event/receipt/audit immutability is enforced; and
- exact cleanup plus global run-ID scan returns zero residuals.

### Configured browser

- an authorized issuer reopens a complete real Slice 4.3 draft;
- a deliberately incomplete/stale fact creates a localized deep-linked blocking finding and fixing it clears that exact finding;
- requirement-by-requirement states remain neutral about responder qualification;
- preview shows labels and permitted structured content, never raw IDs/private exact location;
- a create-only issuer cannot publish and current permission removal after preview fails closed;
- the free/no-commercial-account path can publish basic issuance without an upgrade gate;
- an intentionally stale version/digest and concurrent publish receive non-destructive recovery;
- successful publication advances exactly once from `draft` to `published` and produces one snapshot/projection/event/receipt/audit set;
- the captured preview payload/digest exactly equals the live permitted projection;
- the controlled share link resolves through the public or authenticated-participant gate and existing acquisition continuity;
- no draft/preview appears on map, public route or index before commit;
- the former seeded production opportunity does not resolve as a live fallback;
- reload/re-entry shows committed publication truth without an artificial loading hold;
- five locales, keyboard/deep-link/focus behavior, reduced motion and desktop/intermediate/390 px layouts pass without overflow;
- console, page errors and unhandled rejections remain clean; and
- all disposable Auth/Firestore fixtures are removed with zero residuals.

Run focused RFx/public-projection/acquisition tests, emulator acceptance, internationalization/accessibility checks, `git diff --check`, the canonical `npm run check`, exact-head CI and post-merge CI.

## 17. Feature evidence

- `ISS-016` is accepted only with server-authoritative, requirement-aware, deep-linked readiness and action-time revalidation.
- `ISS-018` is accepted only when preview and published responder projection are the same contract/projector with exact parity.
- `ISS-019` is accepted only with one atomic/idempotent publication transition, immutable snapshot, permitted geography/index projection and append-only evidence.
- `ISS-020` is accepted only when basic issuance works under the free policy and the advanced entitlement seam remains commercially neutral and fail-closed.
- `ACQ-009` is accepted only when a controlled link resolves a real live projection through existing acquisition continuity without granting authority.

Tracker changes occur only in the runtime PR after each feature's own acceptance passes. This documentation authority leaves the tracker at **438 total · 160 Done · 278 Not Started**, Wave 4 RFx Core at **8/41**, B6b intentionally pending and B6c ineligible.

## 18. Explicit exclusions and stop boundary

This authority does not implement:

- Slice 4.5 discovery/search, saved searches, alerts, watches or deadlines;
- B6c beacon rendering, map styling, RFx lens convergence or opportunity animation;
- fit, qualification, Go/No-Go, pursuit, teaming, invitations or gap routing;
- response authoring, assignments, submissions or external handoff;
- evaluator assignment, conflicts, scoring, consensus, ranking, recommendation, selection, award or outcomes;
- amendment, addendum, Q&A, withdrawal, cancellation, close, extension or republication;
- named-recipient/invite-only/sealed/limited-bidder publication audiences;
- paid placement, sponsored visibility, quotas, billing, checkout or commercial enrollment;
- Dark Appearance, appearance preference, Presentation Mode, sound or haptics;
- Firebase App Hosting, deployment or build-identity changes; or
- Stabilization 2C.

After the runtime merges and exact post-merge acceptance is green, recalculate from merged `main`. B6c becomes eligible but is not automatically complete or next. Under the standing Wave 4 authorization, the next dependency-eligible action is a documentation-only Slice 4.5 authority for `DSC-004`, `DSC-005`, `DSC-006`, `DSC-007` and `DSC-008`, unless the canonical dependency map is explicitly changed.
