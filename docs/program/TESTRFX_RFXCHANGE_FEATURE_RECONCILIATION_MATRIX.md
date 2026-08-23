# TestRFx → RFxchange Feature Reconciliation Matrix

**RFxchange baseline:** `399072c05aa78e536ad57d0998a643f1c6d49b08`  
**TestRFx baseline:** `db19a0cc2171d0ddde4f34a20acc881ba7279248`  
**Rows:** 53

Detailed row fields are canonical in `governance/testrfx-rfxchange-reconciliation.json`.

## Disposition summary

| Disposition | Count |
| --- | ---: |
| `ALREADY PRESENT` | 8 |
| `PORT PRESENTATION` | 8 |
| `PORT DOMAIN EXPERIENCE` | 20 |
| `MIGRATE DATA` | 2 |
| `REIMPLEMENT AGAINST FIREBASE` | 8 |
| `DEFER` | 4 |
| `SUPERSEDED` | 1 |
| `RETIRE` | 2 |

## Matrix

| ID | TestRFx feature | Source PRs | RFxchange equivalent/current owner | Disposition | Contracts | Status |
| --- | --- | --- | --- | --- | --- | --- |
| `TRX-001` | Persistent map-first Exchange chassis | #1 | Merged Stage 2/3 mobile Exchange composition and participant shell contracts. | `ALREADY PRESENT` | `CM-001`, `CM-003`, `CM-004` | `reconciled` |
| `TRX-002` | Permanent four-lens order | #1, #68 | src/application/participant/participant-lens-registry.ts and successor migration. | `ALREADY PRESENT` | `CM-001` | `reconciled` |
| `TRX-003` | Persistent bottom navigation | #1, #68 | Mobile lens navigation contract and ExistingWorkspaceFoundation. | `ALREADY PRESENT` | `CM-001`, `CM-003` | `reconciled` |
| `TRX-004` | Three-state result drawer | #23 | ExchangeSheetState / snap points in mobile-exchange-contracts.ts. | `ALREADY PRESENT` | `CM-003` | `reconciled` |
| `TRX-005` | Four-position lens action rail | #22, #64 | Immutable successor 16-position registry in exchange-room-actions.ts. | `ALREADY PRESENT` | `CM-002` | `reconciled` |
| `TRX-006` | Marker/card/detail selection continuity | #1, #19, #23 | ExchangeSelectionState, LensDiscoveryProjection, ExchangeDetailContext. | `ALREADY PRESENT` | `CM-004` | `reconciled` |
| `TRX-007` | Universal Exchange search experience | #16 | ExchangeLensQuery plus domain-owned query adapters. | `ALREADY PRESENT` | `CM-024`, `CM-003` | `reconciled` |
| `TRX-008` | Floating-control visual refinement | #17, #55, #61 | Current Mapbox participant shell controls. | `PORT PRESENTATION` | `CM-003`, `CM-025` | `contract-mapped` |
| `TRX-009` | Persistent map behavior | #18, #34 | MapboxLocalityCanvas / ExchangeSpatialScene / LensMapProjection. | `ALREADY PRESENT` | `CM-008`, `CM-025` | `reconciled` |
| `TRX-010` | Basemap-selection experience | #56 | Existing Mapbox appearance/configuration boundary. | `PORT PRESENTATION` | `CM-025` | `contract-mapped` |
| `TRX-011` | 2.5D focus pins | #58, #59 | Existing Mapbox marker/layer implementation. | `PORT PRESENTATION` | `CM-025`, `CM-004` | `contract-mapped` |
| `TRX-012` | Media-first Exchange cards | #67 | LensResultCardModel and shared participant card primitives. | `PORT PRESENTATION` | `CM-004`, `CM-018` | `contract-mapped` |
| `TRX-013` | Professional semantic SVG lens icons | #68 | Participant lens registry plus shared icon adapter. | `PORT PRESENTATION` | `CM-001` | `contract-mapped` |
| `TRX-014` | Own-organization visual treatment | #64 | Server-authorized organization association on shared card projections. | `PORT PRESENTATION` | `CM-004`, `CM-005`, `CM-006` | `contract-mapped` |
| `TRX-015` | Lens controls versus record actions | #64, #67 | LensActionDefinition plus RecordActionDefinition. | `PORT PRESENTATION` | `CM-002`, `CM-004` | `contract-mapped` |
| `TRX-016` | Hierarchical Menu information architecture | #25, #30 | Account/Menu utility and existing authorized routes. | `PORT DOMAIN EXPERIENCE` | `CM-016`, `CM-020`, `CM-022` | `contract-mapped` |
| `TRX-017` | Menu decluttering | #70 | Future Account/Menu presentation over existing routes. | `PORT PRESENTATION` | `CM-016` | `contract-mapped` |
| `TRX-018` | Organization logo and intro media | #70 | INF-008 storedAssets private source objects plus future public media projection. | `REIMPLEMENT AGAINST FIREBASE` | `CM-005`, `CM-018`, `CM-019` | `contract-mapped` |
| `TRX-019` | Shared cross-lens workflow dispatcher | #27 | Domain-specific commands, relations, referral aggregate and shared return context. | `REIMPLEMENT AGAINST FIREBASE` | `CM-011`, `CM-016`, `CM-019` | `contract-mapped` |
| `TRX-020` | RFx transaction hierarchy | #36 | RFx aggregate/package/definition/publication and staged Slice 4.7–4.10 packet chain. | `PORT DOMAIN EXPERIENCE` | `CM-009`, `CM-010` | `blocked-by-current-rfx-packets` |
| `TRX-021` | Mobile RFx Task Canvas | #69 | Future RFx experience adapter over canonical RFx commands/events/workspaces. | `PORT DOMAIN EXPERIENCE` | `CM-009`, `CM-010`, `CM-026` | `contract-mapped-dependency-blocked` |
| `TRX-022` | Plain-language RFx creation with voice/camera/file assistance | #69 | RFx draft command plus Firebase Storage attachment boundary. | `PORT DOMAIN EXPERIENCE` | `CM-009`, `CM-018`, `CM-026` | `contract-mapped` |
| `TRX-023` | Quick/Guided/Formal RFx experience depth | #69 | RFx definition/package model plus presentation state. | `PORT DOMAIN EXPERIENCE` | `CM-009`, `CM-010` | `contract-mapped` |
| `TRX-024` | Reuse previous RFx | #69 | Authorized read of issuer RFx aggregates followed by a new draft command. | `PORT DOMAIN EXPERIENCE` | `CM-009`, `CM-010`, `CM-019` | `contract-mapped` |
| `TRX-025` | Structured requirement capture | #69 | Current RFx definition requirements and qualifier model. | `PORT DOMAIN EXPERIENCE` | `CM-009` | `contract-mapped` |
| `TRX-026` | RFx market preview | #69 | Capabilities/Network authorized projections and future RFx matching explanation. | `DEFER` | `CM-015`, `CM-017`, `CM-024` | `dependency-deferred` |
| `TRX-027` | Publication readiness and committed receipt | #69 | Current RFx publish command, Firestore transaction, snapshot/projection/event/audit. | `PORT DOMAIN EXPERIENCE` | `CM-009`, `CM-019` | `contract-mapped` |
| `TRX-028` | Pursue / Watch / Decline entry | #69 | Opportunity relations, watches and pursuits. | `PORT DOMAIN EXPERIENCE` | `CM-011`, `CM-010` | `blocked-by-current-rfx-packets` |
| `TRX-029` | Rapid Go/No-Go assessment | #69 | Opportunity fit snapshot and pursuit command/event model. | `PORT DOMAIN EXPERIENCE` | `CM-011`, `CM-010` | `contract-mapped` |
| `TRX-030` | Response workspace and readiness | #69 | New Firebase-backed response workspace to be authorized by RFx Slice 4.8. | `REIMPLEMENT AGAINST FIREBASE` | `CM-010`, `CM-026` | `mapped-extension-required` |
| `TRX-031` | Response collaboration and assignment | #69 | Future organization-scoped response collaboration aggregate/commands. | `REIMPLEMENT AGAINST FIREBASE` | `CM-010`, `CM-019` | `mapped-extension-required` |
| `TRX-032` | Hosted response review and submission | #69 | Future RFx response/submission command/event/repository packet. | `REIMPLEMENT AGAINST FIREBASE` | `CM-010`, `CM-018`, `CM-019` | `mapped-extension-required` |
| `TRX-033` | External submission reconciliation | #69 | Future external-submission command/event state in RFxchange. | `PORT DOMAIN EXPERIENCE` | `CM-010`, `CM-019` | `contract-mapped` |
| `TRX-034` | Offline/local-device continuity | #69 | Client-side continuity layer subordinate to Firebase canonical state. | `REIMPLEMENT AGAINST FIREBASE` | `CM-010`, `CM-026` | `mapped-extension-required` |
| `TRX-035` | Resource-provider classification model | #65 | Provider application/status/service-profile/resource publication model. | `REIMPLEMENT AGAINST FIREBASE` | `CM-012`, `CM-013` | `contract-mapped` |
| `TRX-036` | Provider ingestion, deduplication and controlled promotion | #65 | New Firestore import staging collections and protected migration commands feeding existing canonical collections. | `REIMPLEMENT AGAINST FIREBASE` | `CM-013`, `CM-005`, `CM-007`, `CM-019` | `mapped-extension-required` |
| `TRX-037` | Hampton Roads provider seed pack | #66 | Versioned migration manifest consumed by Firebase Admin import tool. | `MIGRATE DATA` | `CM-013`, `CM-012` | `contract-mapped` |
| `TRX-038` | Census geocoding manifest and policy | #71 | Versioned geocode decisions plus controlled organization-location commands and Mapbox projection. | `MIGRATE DATA` | `CM-014`, `CM-008`, `CM-019` | `contract-mapped` |
| `TRX-039` | Unclaimed provider listing and claim handoff | #65 | Existing organization authority claims and Resource provider projections. | `PORT DOMAIN EXPERIENCE` | `CM-007`, `CM-012`, `CM-004` | `contract-mapped` |
| `TRX-040` | Organization selection/creation/claim UX | #52 | Existing Firestore organization resolution, claims, memberships and invitations. | `PORT DOMAIN EXPERIENCE` | `CM-005`, `CM-006`, `CM-007`, `CM-022` | `contract-mapped` |
| `TRX-041` | Registration hierarchy | #48 | Firebase Authentication/provider validation/user-resolution/access journey. | `PORT DOMAIN EXPERIENCE` | `CM-006`, `CM-021`, `CM-022` | `contract-mapped` |
| `TRX-042` | Login/auth-entry hierarchy | #53 | Firebase Authentication, server session, user resolution and access lifecycle. | `SUPERSEDED` | `CM-006`, `CM-021`, `CM-022` | `closed-no-runtime-port` |
| `TRX-043` | Geography onboarding UX | #39 | Current Geography authority, organizationLocation drafts/events and Mapbox confirmation. | `PORT DOMAIN EXPERIENCE` | `CM-008`, `CM-022` | `contract-mapped` |
| `TRX-044` | Organization profile hierarchy | #44 | organizations, organizationProfiles, profile events and enrichment domains. | `PORT DOMAIN EXPERIENCE` | `CM-005`, `CM-006`, `CM-018`, `CM-022` | `contract-mapped` |
| `TRX-045` | Capability enrichment UX | #42 | Organization market profile claims/commands/events, AMACS 0.5.0 and interpretation foundation. | `PORT DOMAIN EXPERIENCE` | `CM-015`, `CM-018`, `CM-022` | `blocked-by-pr-234` |
| `TRX-046` | Exchange-ready completion experience | #50 | Current activation journey, organization marker activation and access lifecycle. | `PORT DOMAIN EXPERIENCE` | `CM-022`, `CM-019`, `CM-008` | `contract-mapped` |
| `TRX-047` | Public marketing and campaign experience | #3, #49 | Existing RFxchange public/acquisition routes and acquisitionContexts. | `DEFER` | `CM-021`, `CM-023` | `explicitly-deferred` |
| `TRX-048` | Public resources/content experience | #45 | Existing public Resources/content routes, subject to content authority. | `DEFER` | `CM-021`, `CM-023` | `explicitly-deferred` |
| `TRX-049` | Pricing and membership UX | #51 | RFxchange commercial account/payment boundary and Stripe reconciliation. | `DEFER` | `CM-020`, `CM-022` | `explicitly-deferred` |
| `TRX-050` | Intelligence hierarchy and service experience | #37 | Current authorized organization Network-based Intelligence adapter in PR #235. | `PORT DOMAIN EXPERIENCE` | `CM-017`, `CM-019` | `blocked-by-pr-235` |
| `TRX-051` | Capabilities hierarchy and service experience | #33 | Current Capabilities adapter candidate PR #234 and market-profile services. | `PORT DOMAIN EXPERIENCE` | `CM-015`, `CM-016` | `blocked-by-pr-234` |
| `TRX-052` | PostgreSQL/Neon production runtime | #1, #32, #33, #36, #37, #44, #48, #51, #52, #69 | Firestore repositories, Firebase Functions and existing domain commands/events. | `RETIRE` | `CM-005`, `CM-006`, `CM-009`, `CM-012` | `closed-no-port` |
| `TRX-053` | MapLibre/OpenFreeMap and static Pages production paths | #29, #34, #56, #58, #59, #60 | Mapbox production canvas and RFxchange deployment/CI. | `RETIRE` | `CM-023`, `CM-025` | `closed-no-port` |

## Required machine fields

Each JSON row records purpose, exact source paths, current RFxchange packet, canonical domain owner, data implications, authorization implications, UI implications, acceptance criteria, final PR, contract-map IDs and status.

A port/data row cannot enter runtime until its Phase 2 contracts pass the admission gate.
