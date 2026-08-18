# Exchange Room Phase 2 — Canonical 16-Action Registry

**Status:** HISTORICAL GOVERNING REGISTRY FOR STAGE 2 / `WP-EXCHANGE-ROOM-PHASE2-01`

**Owner:** 00 — RFxchange Control Room

**Implementation owner:** 01 — Shared Exchange Platform

This document freezes the stable identity, order, participant-visible label, owning lane and governing source family for the sixteen permanent Exchange Room action positions.

For successor Stages 3–6, `MOBILE_EXCHANGE_STAGES36_ACTION_REGISTRY.md` is the governing amended registry. This file remains authoritative for the implemented Stage 2 composition and its evidence; it is not the current runtime-migration target and must not be rewritten to describe Capabilities after the fact.

Lane 01 implements this registry. It does **not** choose, rename, reorder, substitute, split, merge or invent these action identities. Any future change to an action identity or visible label requires a Control Room product-authority amendment rather than a builder-local decision.

The registry is a **value architecture**, not a claim that all sixteen functions are operational. A function with no current truthful authorized handler remains in its fixed position with its normal label and a gray/disabled, non-actionable control.

## Universal action-state contract

Every action definition has a stable identity independent of its current availability.

At runtime the shared projection resolves, separately:

- `operational`: the governed function/handler actually exists in the current runtime;
- `applicable`: the action applies to the viewer / selected-object relationship and current context;
- `authorized`: current server-authoritative state permits the operation or permits entering a separately authorized workflow;
- `handler`: a real modal, drawer, route/deep-link or command adapter exists for the projected active state.

An action is active only when the projection can truthfully supply its real handler and the applicable authority conditions are satisfied.

Otherwise:

- the normal visible label remains;
- only the individual action control is gray/disabled;
- there is no usable href, command, modal trigger, drawer trigger, route transition or mutation;
- the participant action grid does not add visible `Unavailable`, `Coming soon`, `Not yet available`, `In development`, or equivalent status prose merely to explain the disabled state;
- internal evidence still distinguishes `not-operational`, `not-applicable` and `not-authorized` (or stricter governed equivalents);
- disabled presentation uses native/assistive semantics and is not communicated by color alone;
- selecting the parent lens remains permitted because the lens itself is a real context of the shared Exchange Room.

A registry entry is never the security boundary. Protected domain operations remain server-authoritative.

---

## 1. Opportunities/RFx

Owning lane: **02 — Opportunities / RFx**

Primary authorities:

- `docs/context/EXCHANGE_INTERACTION_ARCHITECTURE.md#71-opportunitiesrfx--primary-transaction-lens`
- `docs/rfx/RFX_CORE_PRODUCT_WORKSPACES.md`
- `docs/rfx/RFX_CORE_FEATURE_CROSSWALK.md`

The four positions communicate the core transaction progression: discover market demand, issue a structured need, decide/respond to an opportunity, and close capability gaps through RFx-scoped teaming.

| Order | Immutable action ID | Visible label | Governing meaning | Principal source authority | Initial implementation expectation |
| ---: | --- | --- | --- | --- | --- |
| 1 | `opportunities.find` | **Find Opportunities** | Discover and inspect real permitted published opportunities; discovery never implies qualification or endorsement. | `RFX-FEATURE-DSC-004`–`008`; RFx Product Workspaces §5.1 | Attach only to the current real opportunity discovery runtime. |
| 2 | `opportunities.create-rfx` | **Create RFx** | Enter the organization-owned structured RFx issuer workflow; the workflow itself may expose existing drafts/published RFxs as governed. | `RFX-FEATURE-ISS-001`–`019`; RFx Product Workspaces §4 | Attach only to the current authorized issuer entry/runtime. |
| 3 | `opportunities.pursue-respond` | **Pursue / Respond** | Assess fit/gaps, record Pursue/Watch/Decline where implemented, and enter response work only when the current RFx/pursuit authority permits it. | `RFX-FEATURE-RSP-001`–`010`, `RSP-017`–`021`; RFx Product Workspaces §5 | Gray until a truthful applicable pursuit/response handler exists for the current context. Do not infer readiness from a published RFx alone. |
| 4 | `opportunities.team` | **Team** | Resolve RFx capability gaps through governed teammate discovery/invitation/participation; no UI action creates a legal teaming agreement. | `RFX-FEATURE-DSC-010`, `RSP-007`, `TEM-001`–`004`; RFx Product Workspaces §5.3 and §6 | Expected gray until the separately governed Teaming runtime is actually operational for the selected RFx/gap. |

Relationship projection:

- own organization may legitimately receive issuer-oriented entry for `Create RFx` and current owned transaction context;
- a selected external organization does not become an issuer action target merely because it is selected;
- opportunity-specific `Pursue / Respond` and `Team` require a real authorized RFx/opportunity context, not merely an organization marker;
- ordinary organization selection may leave those actions gray until a relevant opportunity is selected.

---

## 2. Resources

Owning lane: **04 — Resources**

Primary authorities:

- `docs/context/EXCHANGE_INTERACTION_ARCHITECTURE.md#72-resources--approved-support-lens`
- `governance/four-lens-requirements.json` — `RES-LENS-001`–`010`
- `docs/program/RESOURCES_REFERRALS_COMPLETION_INVENTORY.md`

The four positions communicate the resource journey: find approved support organizations, inspect the support they publish, manage the participant's own requests, and understand/manage the participant organization's provider status.

| Order | Immutable action ID | Visible label | Governing meaning | Principal source authority | Initial implementation expectation |
| ---: | --- | --- | --- | --- | --- |
| 1 | `resources.find-providers` | **Find Providers** | Discover current approved Official Resource Providers within governed geography/privacy projection and inspect truthful provider eligibility/intake/availability context. | `RES-LENS-001`, `RES-LENS-004`, `RES-LENS-005` | Attach to current approved-provider discovery where present. |
| 2 | `resources.browse-resources` | **Browse Resources** | Inspect current published provider resources/services using only the authorized resource lifecycle/projection. | `RES-LENS-003`, `RES-LENS-006` | Attach to current published resource/provider detail runtime where present. |
| 3 | `resources.my-requests` | **My Requests** | Review the participant organization's own consented resource/provider connections and truthful request lifecycle/status. | `RES-LENS-007`, `RES-LENS-010` | Activate only after current runtime inspection proves a complete participant request-tracking handler; otherwise gray. |
| 4 | `resources.provider-status` | **Provider Status** | Project the participant organization's exact Official Resource Provider application/status/next-action lifecycle and, when approved, its authorized provider-management entry. | `RES-LENS-002`, `RES-LENS-003`; Exchange Interaction Architecture §7.2 provider-state table | Own-organization oriented. Gray for an external selected organization; external provider inspection remains available through Find Providers/Browse Resources rather than exposing another organization's private status workflow. |

Save/star remains a governed resource-detail capability (`RES-LENS-009`) and may be attached within resource detail when implemented; it is not one of the four permanent lens-level positions. This registry does not defer or delete that requirement.

---

## 3. Intelligence

Owning lane: **03 — Intelligence**

Primary authorities:

- `docs/context/EXCHANGE_INTERACTION_ARCHITECTURE.md#73-intelligence--analytical-lens`
- `docs/context/EXCHANGE_INTERACTION_ARCHITECTURE.md#74-location-and-site-functionality-inside-intelligence`
- `docs/program/INTELLIGENCE_PROGRAM_ROADMAP.md`
- `governance/four-lens-requirements.json` — `INTEL-*`

The four positions expose the four enduring ways a participant interrogates the market without turning Intelligence into a separate application: organizations, capabilities, place, and governed analytical layers.

| Order | Immutable action ID | Visible label | Governing meaning | Principal source authority | Initial implementation expectation |
| ---: | --- | --- | --- | --- | --- |
| 1 | `intelligence.organizations` | **Organizations** | Explore permitted organizations/network context using authoritative organization profiles, geography and privacy-safe selected-object projection. | `INTEL-ORG-001`, `INTEL-MARKET-001` | Attach to the current real Intelligence · Network organization map/list/detail runtime. |
| 2 | `intelligence.capabilities` | **Capabilities** | Explore confirmed AMACS-backed organization capability context and capability concentrations without converting inference into organization truth. | `INTEL-ORG-001`; Exchange Interaction Architecture §7.3 | Activate only to the extent the current permitted capability search/filter/projection exists; unsupported analytical depth remains gray rather than fabricated. |
| 3 | `intelligence.locations` | **Locations** | Enter Location Intelligence for authoritative geography/place context; sites/facilities remain a capability family inside this action when separately supported. | `INTEL-LOCATION-001`, `INTEL-SITE-001`; Exchange Interaction Architecture §7.4 | Expected gray until a bounded authorized Location Intelligence handler exists beyond the ordinary shared map geography already used by the Room. |
| 4 | `intelligence.layers` | **Intelligence Layers** | Select/configure governed analytical map/data layers with provenance, coverage, caveats and privacy suppression; layer is distinct from lens/appearance/workspace. | `INTEL-LAYER-001`, `INTEL-CONTROLS-001`, `INTEL-PROVENANCE-001` | Expected gray until the layer/provenance/control authorities have an operational accepted handler. |

`Organizations` and `Capabilities` may share the same current Network substrate while presenting different search/filter/projection intent. They must not create duplicate maps or private copies of organization truth.

`Locations` preserves the product decision that location/site functionality remains inside Intelligence rather than returning as a fifth peer lens.

---

## 4. Referrals

Owning lane: **05 — Referrals**

Primary authorities:

- `docs/context/EXCHANGE_INTERACTION_ARCHITECTURE.md#75-referrals--trusted-connection-lens`
- `governance/four-lens-requirements.json` — `REF-LENS-001`–`010`
- `docs/program/RESOURCES_REFERRALS_COMPLETION_INVENTORY.md`

The four positions map directly to the approved referral experience: create an introduction, review sent activity, review received activity, and return to participant-starred referral items when that governed relation exists.

| Order | Immutable action ID | Visible label | Governing meaning | Principal source authority | Initial implementation expectation |
| ---: | --- | --- | --- | --- | --- |
| 1 | `referrals.new` | **New Referral** | Create/send one consented referral from the participant organization to an exact authorized selected existing organization or external intended recipient. | `REF-LENS-001`, `REF-LENS-002`, `REF-LENS-004`, `REF-LENS-008` | Attach to the real referral composer; selected organization may prefill recipient only after current server revalidation. |
| 2 | `referrals.sent` | **Sent** | Review the participant organization's sent referral history and truthful current lifecycle/status, optionally scoped to an authorized selected recipient. | `REF-LENS-003`, `REF-LENS-009` | Attach to current sent-history projection where present. |
| 3 | `referrals.received` | **Received** | Review referrals received by the participant organization and use only authorized lifecycle actions for those records. | `REF-LENS-003`, `REF-LENS-009` | Attach to current received-history/detail projection where present. |
| 4 | `referrals.starred` | **Starred** | Review a private governed starred-referral relation without implying acceptance, sale, award, endorsement or verified outcome. | `REF-LENS-010` | Expected gray until the governed private star relation and real runtime exist. |

Relationship context and map path remain supporting context, not separate permanent action positions. `REF-LENS-006`–`008` continue to govern relationship path, selection parity and selected-recipient continuity.

---

## Registry invariants

The production registry must contain **exactly these sixteen IDs in exactly this lens/order**:

```text
Opportunities/RFx
  1 opportunities.find             — Find Opportunities
  2 opportunities.create-rfx       — Create RFx
  3 opportunities.pursue-respond   — Pursue / Respond
  4 opportunities.team             — Team

Resources
  1 resources.find-providers       — Find Providers
  2 resources.browse-resources     — Browse Resources
  3 resources.my-requests          — My Requests
  4 resources.provider-status      — Provider Status

Intelligence
  1 intelligence.organizations     — Organizations
  2 intelligence.capabilities      — Capabilities
  3 intelligence.locations         — Locations
  4 intelligence.layers            — Intelligence Layers

Referrals
  1 referrals.new                  — New Referral
  2 referrals.sent                 — Sent
  3 referrals.received             — Received
  4 referrals.starred              — Starred
```

Lane 01 acceptance must fail if:

- an ID is missing, added, renamed or reordered;
- an action label is silently substituted;
- one lens renders fewer or more than four positions;
- a gray action gains a usable handler;
- an active action points at a fake/placeholder handler;
- an unavailable child function disables the entire parent lens;
- a selected organization/client state grants authority;
- a domain-specific action is implemented inside Lane 01 merely to make a registry slot active.

Later domain delivery lights up the fixed positions by attaching real governed handlers. It does not redefine the sixteen-position architecture.
