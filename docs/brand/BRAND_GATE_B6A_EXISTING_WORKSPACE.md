# Brand Gate B6a — Existing Workspace Foundation

**Status: IMPLEMENTED ON THE AUTHORIZED B6a BRANCH — FINAL CI AND MERGE REQUIRED BEFORE SLICE 3.2**

## Objective

Brand Gate B6a converges the authenticated daily environment using only domains already authoritative before live Network expansion.

## Baseline

B6a branches from merged Brand Gate B5 `main` at:

`c9b1469cf258a6a9af9b456585af7f3524a5c7b6`

The tracker remains **438 total · 121 Done · 317 Not Started**, Activation remains **43/43**, and Network remains **7/38**. Brand gates do not change Feature-ID completion.

## Existing organization workspace

The authenticated geography route now renders one `ExistingWorkspaceFoundation` rather than rebuilding the map and participant shell directly.

The workspace includes:

- the authoritative organization node and controlled locality;
- the existing interactive Mapbox spatial scene;
- one shared search surface;
- one persistent organization-home control;
- one responsive contextual edge sheet;
- the current organization label and visible location description;
- locality and marker status;
- a link to manage the existing organization profile;
- boundary authority, vintage, and retrieval provenance;
- truthful empty state for Network discovery that has not yet been implemented.

No opportunity, referral, provider, RFx, credibility, or outcome object is created or represented as live.

## Deterministic workspace state

B6a introduces a versioned UI-only workspace-state contract. It persists only:

- the authorized organization ID used to namespace the browser key;
- the selected authorized organization object ID;
- whether the organization-home sheet is open;
- the fixed `organization-home` viewport intent.

It does not persist:

- authorization or permissions;
- memberships or restrictions;
- session data;
- private coordinates;
- domain records;
- feature availability.

The server re-resolves authentication, organization membership, restrictions, geography, location, profile, marker activation, and public marker projection on every entry. Local browser state cannot grant access or expand location precision.

If local storage is unavailable, malformed, stale, or belongs to another organization, the workspace safely returns to the default organization-home state.

## Organization home and provenance

The contextual sheet uses the B2 object, status, alert, and state primitives. It distinguishes:

- the organization’s current established Exchange position;
- the authoritative home locality;
- the visible location label allowed by the marker projection;
- source and vintage of the locality boundary;
- the deterministic viewport behavior;
- the present product scope.

The sheet can always be closed and reopened. The participant can return to the profile surface without a modal dead end.

## Loading, empty, error, permission, expired, and recovery boundaries

B6a defines reusable workspace-state presentations for:

- loading an authorized projection;
- missing authorized organization projection;
- runtime error without state mutation;
- wrong-organization or missing permission;
- expired session and reauthentication;
- activation recovery without duplicate organization creation.

The current route continues to fail closed through the existing server redirects. These presentations are reusable contracts for later route-level error boundaries and do not weaken those redirects.

## Accessibility and responsive behavior

B6a provides:

- one top navigation and one search pattern;
- accessible sheet labeling and open/close controls;
- visible keyboard focus;
- responsive organization-home controls and mobile sheet behavior;
- reduced-motion and reduced-transparency alternatives;
- structured organization facts and data provenance;
- truthful text equivalents for unavailable future domains.

## Preserved authority

B6a preserves:

- account-only workspace access;
- current organization membership and restriction routing;
- authoritative geography and privacy-safe marker projection;
- PR #99 focal marker visibility;
- B3 camera and cartography contracts;
- current profile and activation routing;
- acquisition-context and OPEN authority;
- no invented organizations or market activity.

## Explicit non-scope

B6a does not implement:

- `GEO-012`, `DSC-001`, `DSC-002`, or `DSC-003`;
- permitted organization-directory discovery;
- capability search across organizations;
- provider service fields;
- referrals or relationship paths;
- RFx opportunities or beacons;
- credibility seals or outcomes;
- Intelligence Dark, Presentation Mode, sound, or haptics;
- Feature-ID, tracker-total, or dependency-edge changes.

## Exit

B6a completes only after repository, Firebase, architecture, TypeScript, lint, production build, and applicable workspace acceptance pass on the final implementation head and the PR merges into `main`.

After B6a merges and the consolidated Brand Gate reconciliation is complete, the prerequisites for **Wave 3 Slice 3.2 — Controlled Network Entry & Discovery** are satisfied. Slice 3.2 remains unstarted until explicitly authorized.
