# RFxchange Exchange Interaction Architecture

**Status: CROSS-CUTTING GOVERNING AUTHORITY. THE ORIGINAL PR #150 RECONCILIATION WAS DOCUMENTATION ONLY. RUNTIME MAY IMPLEMENT THIS AUTHORITY ONLY THROUGH A SEPARATELY AUTHORIZED SLICE OR BOUNDED CROSS-CUTTING GATE. THIS DOCUMENT DOES NOT CHANGE FEATURE-ID STATUS, TRACKER TOTALS, OR PUBLIC MARKETING POSITIONING.**

## 1. Purpose

This document reconciles the RFxchange participant experience around one persistent, organization-centered spatial environment. It defines:

- the hierarchy and meaning of the Opportunities/RFx, Resources, Intelligence, and Capabilities lenses;
- structural, capability, state, and continuity truthfulness for participant-facing navigation;
- the retained role of location and site functionality inside Intelligence;
- the persistent map/context contract across lenses;
- own-organization and other-organization marker behavior;
- the distinction between lens, appearance, layer, and workspace;
- resource-provider eligibility and application boundaries;
- cross-lens workflow continuity;
- persistent-shell and scoped-loading behavior; and
- the boundary between authenticated product architecture and public RFx-centered positioning.

Use this document with:

- `PRODUCT_PRINCIPLES.md`;
- `MAP_AND_GEOGRAPHY.md`;
- `ORGANIZATION_MODEL.md`;
- `RFX_TRANSACTION_CYCLE.md`;
- `COMMERCIAL_MODEL.md`;
- `BRAND_AND_UX.md`;
- `../slices/EXCHANGE_SHELL_TRUTHFULNESS_EXECUTION_AUTHORITY.md` while that bounded gate is active; and
- the applicable RFx Core, brand, design, security, privacy, geography, lifecycle, tracker, dependency, and slice authorities.

Security, privacy, organization authority, lifecycle, geography, domain, tracker, and authorized-slice requirements remain controlling. This document supersedes prototype or narrative assumptions that treat the four lenses as separate applications, treat them as equal public product propositions, make Locations a peer product identity, or make a temporary availability taxonomy the permanent information architecture.

The governing architecture alone does not authorize runtime implementation.

## 2. Governing product decision

> **The RFxchange is an RFx-centered, organization-centered spatial market environment. Opportunities/RFx is the primary transaction lens. Resources, Intelligence, and Capabilities are supporting lenses over the same organizations, geography, relationships, and market activity. Changing lenses changes the question being asked and the actions available; it does not reset the market the participant is viewing. Referrals is a cross-lens function, not a permanent lens.**

The permanent authenticated lens hierarchy and order is exactly:

1. **Opportunities/RFx** — turn market need into structured action and transaction.
2. **Resources** — help organizations obtain approved business support relevant to what they are trying to accomplish.
3. **Intelligence** — help participants understand organizations, capabilities, demand, geography, locations, sites, and market context.
4. **Capabilities** — discover, compare, evidence, and match what organizations can do.

These lenses are connected, but they are not four equal products. The RFxchange remains named and positioned around RFx activity. Supporting lenses make RFx activity more discoverable, understandable, completable, and useful.

The permanent order remains visible even before every lens is enabled. Before Slice 4.5, Opportunities/RFx therefore remained present in first position while unavailable, with no href, placeholder route, synthetic data, simulated workflow, or current-page state. The separately authorized and accepted Slice 4.5 runtime now supplies the legitimate `/opportunities` destination over real permitted Slice 4.4 publications. Availability remains bounded to implemented server-authorized behavior; the interface must never fabricate RFxs, opportunity beacons, matches, bids, awards, outcomes, or market activity merely to simulate later maturity.

### 2.1 Structural truthfulness

The interface represents the stable, governed product architecture rather than a temporary taxonomy that will later be discarded.

The permanent participant lens sequence is `Opportunities/RFx | Resources | Intelligence | Capabilities`. Network may be the current organization-network view or layer inside Intelligence. Quick Start and Account/Menu are utilities, not peer market lenses. Referrals is available through applicable records, profiles, actions, and Menu/Account management.

> **The stable lens architecture remains visible even when a lens is unavailable. Availability governs action, not whether a governed permanent lens exists in the information architecture.**

### 2.2 Capability truthfulness

Visibility does not mean availability.

A governed lens may be visible before it is enabled only when all of the following are true:

- it is part of the approved permanent product architecture;
- its unavailable state is visually explicit;
- its unavailable state is conveyed without relying on color alone;
- assistive technology receives an equivalent unavailable description;
- it has no dead link, synthetic route, fabricated data, or simulated workflow;
- it cannot receive active/current-page treatment;
- it does not imply Feature-ID completion; and
- enabling it later requires an accepted real runtime, not merely changing copy.

This rule permits unavailable Opportunities/RFx to remain visible. It does not authorize an RFx route, aggregate, draft, opportunity, beacon, response, or other RFx record.

### 2.3 State truthfulness

Enabled, unavailable, loading, empty, error, restricted, and recovery states describe the actual state of the relevant surface.

Do not hide a permanent lens merely because it is unavailable. Do not make an unavailable lens appear clickable. Do not present a route-specific wait as though RFxchange is launching, activation is repeating, or the participant is entering a different application.

### 2.4 Continuity truthfulness

Ordinary movement among authenticated lenses preserves the fact that the participant remains inside one Exchange.

A lens transition must not masquerade as:

- reloading RFxchange;
- repeating activation or onboarding;
- opening a separate application;
- discarding the participant shell;
- losing the authenticated organization context; or
- restarting the workspace merely because route-specific information is pending.

> **Loading truthfulness requires the current Exchange shell to remain visible during ordinary lens changes. A route-level wait must not be presented as though RFxchange is being launched again.**

### 2.5 Administrative boundary

The participant unavailable-lens rule does not change administrative navigation truthfulness. Administrative navigation exposes only destinations that are both implemented and server-authorized. Do not add unavailable future administrative sections merely because permanent participant lenses remain visible.

## 3. Vocabulary and collision prevention

Use the following terms precisely:

| Term | Meaning |
| --- | --- |
| **Lens** | A functional market context that changes visible projections, search semantics, filters, information, and authorized actions. The primary lenses are Opportunities/RFx, Resources, Intelligence, and Capabilities. |
| **Layer** | A map or analytical projection inside a lens, such as organizations, opportunity beacons, service fields, locality boundaries, capability density, sites, or workforce data. |
| **Appearance** | Visual treatment only. The governed names are **Light Appearance** and **Dark Appearance**. Appearance never changes authority or data access. |
| **Workspace** | The interaction composition used to complete a task. Spatial Workspace preserves the map as the principal canvas; Operational Workspace supports authoring, forms, tables, policy, settings, review, and other dense workflows. |
| **Selected object** | The organization, opportunity, resource, location/site, referral, or other permitted object currently in focus. Selection is not authority. |

**Intelligence** is reserved for the functional analytical lens.

**Light Appearance** and **Dark Appearance** replace appearance terminology that used the word `Intelligence`. Until a separate terminology sweep updates every legacy brand/reference occurrence, prior references to `Exchange Light` and `Intelligence Dark` are to be interpreted as Light Appearance and Dark Appearance only. They do not define the Intelligence lens and do not authorize a dark appearance runtime.

Avoid using the generic word `mode` when the intended meaning is specifically lens, layer, appearance, or workspace.

## 4. Persistent Exchange shell

### 4.1 Entry sequence

For an authorized participant with an established organization and location:

```text
Enter Exchange
→ resolve current organization and authoritative geography
→ load the participant's permitted spatial projection
→ orient/zoom to the organization's declared primary location
→ render the organization's standing marker at the authoritative or applicable privacy-safe coordinate
→ settle the map without discarding available search, filter, or return context
```

The participant's own organization is the spatial home state. An explicit user action, an authorized workflow return, or a legitimate authority/lifecycle change may alter that state. Ordinary lens switching must not behave like opening a new application.

### 4.2 Spatial context contract

A future shared spatial-context contract should preserve, where applicable and safe:

- authoritative current organization and membership context;
- current locality/release context;
- map center or bounds;
- zoom;
- pitch;
- bearing;
- 2D/3D preference for the current session;
- active lens;
- active layers;
- selected object type and stable identifier;
- home organization identifier;
- search query;
- filters and sort;
- current result-set identity/cursor;
- list/drawer scroll position;
- originating workflow context;
- return destination; and
- reduced-motion/accessibility state needed to render the transition safely.

This context is non-authorizing. A URL, browser state, cached selection, stored camera, or client projection must never grant access to an organization, locality, RFx, resource, referral, site, or analytical record.

The server may invalidate or narrow context when authority, lifecycle, privacy, release state, publication status, or data availability changes. When that occurs, the interface should explain the state change and preserve the remaining safe context rather than silently sending the participant to an unrelated starting screen.

### 4.3 Lens-switch behavior

Changing lens should preserve the same map session, including the focal organization/object, camera, search context, and result position where that context remains meaningful and permitted.

Examples:

- Resources → Opportunities retains the selected organization and map position while replacing provider/resource actions with RFx actions after Opportunities has a real accepted runtime.
- Opportunities → Intelligence retains the selected RFx or organization while exposing analytical context after an authoritative RFx exists.
- Intelligence → Capabilities retains the selected organization while replacing analytical actions with capability discovery/comparison actions.
- An applicable record → Referral workflow carries only the revalidated minimum-necessary origin and recipient context, then returns to the originating lens.

If the selected object has no applicable projection in the new lens, the product should retain spatial focus and state truthfully that no applicable records/actions are available. It should not imply that the object disappeared from the Exchange.

### 4.4 Persistent runtime shell and loading seam

A shared participant shell owns product identity, the four primary lenses, the separate Account utility, current organization identity where safely available, and the minimum accessibility/reduced-motion context needed by the shell. Page-specific private data remains below that seam.

The canonical current Intelligence seam is `/geography/canvas`. Existing deep links and URL-derived map/query state remain compatible; changing the visible top-level label does not justify a throwaway route.

Ordinary enabled-lens and Account-utility navigation uses client-side routing. The shell remains mounted and visible while route-specific content is pending. Loading behavior is scoped below the shell with region-specific `aria-busy` and live-region semantics. Optional identity or Administration projection cannot block the shell; Administration fails closed and direct administrative routes remain independently authorized.

No artificial minimum loading duration or timeout-based presentation hold is allowed. A large root-level `Loading RFxchange` or `Preparing this page` card must not replace the participant shell during ordinary navigation.

## 5. Marker and selection grammar

### 5.1 Own organization

The participant's own organization uses a standing, ground-anchored marker after entry. The marker contains the organization's permitted circular logo bug.

If no authorized logo asset exists, use a governed neutral organization glyph or initials. Do not substitute product branding for organization identity.

The coordinate anchor remains fixed. Any rise, settle, pulse, or protruding visual behavior occurs within an internal visual child and must not move the authoritative anchor.

### 5.2 Other organizations

Other discoverable organizations initially use compact organization nodes/dots or clusters appropriate to zoom and density.

Selection through either a node or its matching result card produces the same state:

```text
compact organization node
→ selected
→ visual child rises into the standing marker treatment
→ selected organization's permitted circular logo bug becomes visible
→ popup/drawer and matching result card synchronize to that organization
```

At most one external organization is in the standing selected state at a time. The participant's own standing marker remains present and semantically identifiable, although it may recede in emphasis while another organization is selected.

Deselecting or selecting another organization returns the previous external marker to the compact state without changing its geographic anchor.

At wider zoom levels, aggregate clusters remain required. A cluster is not an organization and must not receive an organization logo.

### 5.3 Selection parity

Marker selection, list-card selection, keyboard selection, and accessible result navigation must converge on one selected-object state. The participant should not be able to select one organization on the map while the drawer presents another.

Lens accents may change the surrounding controls and available actions, but they must not replace the selected organization's identity or alter the canonical meaning of organization nodes, opportunity beacons, paths, fields, seals, or outcomes.

## 6. Map, popup, drawer, and list behavior

### Desktop

- A marker may open a compact anchored popup for immediate identity and primary actions.
- Expanded details, results, or workflow options use an edge drawer where needed.
- The drawer must avoid covering the protected focal target.
- The map remains visible and interactive unless a deliberate Operational Workspace transition begins.

### Mobile

- Marker or card selection opens a responsive bottom sheet.
- Bottom navigation/lens controls remain coherent with the sheet.
- Enough map remains visible to preserve spatial understanding of the selected object.

### List view

List view is not another destination. It is a synchronized representation of the same permitted result set.

- desktop: infinite/cursor-scrolling result cards in an edge drawer;
- mobile: infinite/cursor-scrolling result cards in a bottom sheet;
- map remains visible;
- card selection raises/selects the matching marker;
- marker selection activates/scrolls to the matching card;
- filters, search, result cursor, and list position survive ordinary lens switches when still applicable.

## 7. Lens architecture

### 7.1 Opportunities/RFx — primary transaction lens

The Opportunities/RFx lens is the principal authenticated market-action lens and the main product/marketing draw.

The lens remained present but unavailable until a separately authorized and accepted real participant RFx runtime existed. Slices 4.1–4.5 now provide real issuer draft/definition/publication and participant discovery/watch/deadline behavior. Its further mature scope includes, only as separately implemented and authorized:

- issuer creation and management of structured RFxs;
- published opportunity discovery;
- fit and gap assessment;
- Pursue, Watch, or Decline decisions;
- teammate discovery and RFx-scoped collaboration;
- response construction;
- submission or truthful external handoff;
- later evaluation, selection, award/close, and outcome stages under their own authorities.

Own-organization actions may include, only after the applicable runtime exists:

- Create RFx;
- manage drafts and published RFxs;
- review questions/addenda and responses;
- manage pursuits/bids;
- resume response work;
- evaluate and close when the applicable domain exists.

Other-organization/opportunity actions may include, only after the applicable runtime exists:

- view published RFx details;
- assess fit;
- Respond/Pursue;
- Collaborate/Team;
- Watch/Save;
- Decline/Pass;
- view issuer/public organization context.

No opportunity beacon or Opportunity action may imply qualification, endorsement, award likelihood, receipt, or outcome without authoritative domain evidence.

### 7.2 Resources — approved support lens

Resources is available to organizations seeking support. **Not every organization is an Official Resource Provider.**

Provider status is not:

- a registration role;
- an organization type;
- a paid entitlement;
- an automatic consequence of profile completion; or
- implied by appearing on the organization map.

A non-provider organization may use Resources to:

- find approved providers and published resources;
- inspect eligibility, service geography, intake, availability, and provenance;
- save/star resources;
- initiate permitted provider connections/requests;
- track its own resource-related requests; and
- request Official Resource Provider status through the authorized Account/profile path or an approved marketing acquisition path.

The own-organization drawer must not show provider publishing or management actions before approval. It must project the current provider aggregate exactly rather than collapse its stages into a generic pending state or introduce states and remedies that the provider domain does not authorize.

The current application lifecycle is:

```text
draft → submitted → under-review → information-requested → resubmitted
                            ├───────────────────────────────────────→ approved
                            └───────────────────────────────────────→ denied
```

The truthful own-organization entry or next action is:

| Current provider state | Permitted drawer treatment |
| --- | --- |
| No application | **Request Resource Provider Status**. |
| `draft` | Continue or edit the current application. |
| `submitted` | View the submitted application and current status. |
| `under-review` | View review status and history; do not imply a participant mutation. |
| `information-requested` | Review the information request, provide the authorized response, and resubmit through the existing workflow. |
| `resubmitted` | View the resubmitted application and current status. |
| `approved` | Manage only the currently authorized provider profile, services/resources, service geography, eligibility/intake, availability, and provider requests. |
| `denied` | View the decision and history. The existing explicit policy permits a later numbered reapplication draft; do not imply an appeal, automatic reapplication, or erased decision history. |

`rejected`, `withdrawn`, `suspended`, and `appealed` are not current provider-application states. A future authority may add a state or remedy, but this interaction architecture does not invent one.

An approved Official Resource Provider may manage only the provider capabilities already authorized by the provider domain. Approval does not authorize any additional provider action merely because it would fit the future lens composition.

When another selected organization is an eligible approved provider, the participant may receive provider/resource actions such as View resources, View provider profile, Contact/Request support, Save, or Share. When the selected organization is not an approved provider or has no published provider projection, Resources must state that truthfully and offer only appropriate cross-lens actions.

### 7.3 Intelligence — analytical lens

Intelligence answers:

> **What do the organizations, capabilities, demand, relationships, geography, and places around this market activity tell the participant?**

The current organization/geography/map experience may identify its default view as `Intelligence · Network`. Network domain models, Feature IDs, internal concepts, and historical evidence remain intact.

Intelligence may grow through authorized sub-lenses/layers such as:

- Market Intelligence;
- Organization and Capability Intelligence;
- Opportunity/Demand Intelligence;
- Location Intelligence;
- Site and Facility Intelligence;
- Workforce Intelligence;
- Industry/Cluster Intelligence;
- Demographic or other contextual intelligence where appropriate.

Intelligence is not a separate privileged market, a secret-data tier, or a substitute for source provenance and caveats. It may use only permitted records, governed aggregates, approved external data, privacy suppression, and truthful coverage statements.

For the participant's own organization, Intelligence may eventually support:

- home-market context;
- capability supply/demand context;
- nearby organization/network context;
- opportunity and resource context;
- location comparison and market reach;
- selected analytical layers and saved analyses where authorized.

For another selected organization, Intelligence may eventually support only permitted/public context such as:

- surrounding market and locality context;
- public capability context;
- public demand/opportunity context;
- nearby organization/provider context;
- service-area versus office-location distinctions;
- provenance and coverage limitations.

For a selected RFx, Intelligence may eventually explain performance geography, surrounding capability supply, public/aggregate responder context, provider coverage, market gaps, and other governed analytical context without disclosing private deliberations or implying qualification.

### 7.4 Location and site functionality inside Intelligence

Locations is not abandoned. It is retained as a first-class capability family inside Intelligence rather than a peer product identity.

**Location Intelligence** may explain what a locality or place means for business activity, including authoritative geography, organization/capability concentrations, workforce, industry, infrastructure, market access, demand, resources, and surrounding network context.

**Site and Facility Intelligence** may support buildings, sites, industrial parks, development areas, facilities, or other business-location assets when authoritative data, permissions, provenance, and workflow support exist.

A selected site/location may eventually support actions such as:

- Analyze area;
- View site/facility details;
- View nearby organizations and capabilities;
- View opportunities and resources relevant to the place;
- Contact the responsible source;
- Request information or a tour where supported;
- Share the governed record; and
- Create an RFx for this location.

The RFxchange should not position itself as a general commercial-real-estate listing marketplace. Site/facility information is one input into business and market understanding, and its differentiated value comes from connection to organizations, capabilities, needs, resources, and RFx action.

The governing relationship is:

> **Intelligence provides context for action. Opportunities/RFx turns the participant's need or observation into structured market action.**

### 7.5 Capabilities — organization capability lens

Capabilities answers:

> **What can this organization credibly say it can do, where can it do it, what supports the assertion, and how does that relate to current market need?**

Capabilities consumes the existing organization profile and AMACS-backed organization capability assertions. It does not create a second supplier, responder, market-profile, or organization identity.

Own-organization actions may include, only where the current runtime and permission exist:

- Manage Capabilities;
- AI to AMACS, with manual browse/search always available and assistance remaining non-authoritative;
- Add/Edit Evidence; and
- Capability Gaps.

Other-organization actions may include:

- View Capabilities;
- Match to RFx;
- Refer; and
- Save/Follow.

Capability selection, self-report, evidence submission, independent verification, and RFx matching are separate facts. Paid, Founding, sponsored, provider, or membership state cannot create a capability assertion, evidence conclusion, verification, qualification, ranking, or match.

### 7.6 Referrals — cross-lens function

Referrals supports consented, minimum-necessary introductions and truthful lifecycle tracking from applicable Opportunities, Resources, Intelligence, Capabilities, organization-profile, card, and detail contexts. It is not a permanent map lens.

Menu/Account provides the role-appropriate referral-management surface. A specific referral deep link may reopen the exact authorized record. The current referral aggregate retains one sending organization and one recipient organization or external intended recipient; unsupported third-party subject semantics remain deferred.

A Refer action appears only when the origin, target, recipient, policy, consent, permission, and real referral runtime are valid. Cross-lens entry revalidates current server authority and carries only minimum-necessary origin/recipient context. A referral does not imply acceptance, service completion, sale, award, endorsement, capability match, or verified economic outcome.

### 7.7 Lens accent treatment

Each lens should receive a distinct, restrained visual signal so participants can recognize context without losing the overall RFxchange identity.

Future implementation should use centralized semantic tokens such as:

- `lens.opportunities`;
- `lens.resources`;
- `lens.intelligence`;
- `lens.capabilities`.

This document does not assign raw colors. Lens treatment must:

- remain compatible with the approved brand palette or an explicitly approved semantic extension;
- preserve canonical object color meanings;
- never make color the only indication of lens or availability;
- retain labels, icons, focus, and accessible contrast;
- avoid using Growth Green for ordinary navigation when it would imply an outcome; and
- avoid using RF Gold to imply paid, verified, ranked, or qualified status.

## 8. Cross-lens workflow contract

Cross-lens actions are first-class continuations of one market workflow, not shortcuts into unrelated modules.

| Origin | Cross-lens continuation | Context carried forward |
| --- | --- | --- |
| Opportunity/RFx capability gap | Find a teammate through organization discovery | RFx, missing capability, geography, role, return target |
| Opportunity/RFx support gap | Find support in Resources | RFx, need category/capability, geography, eligibility context, return target |
| Resource does not resolve the business need | Create an RFx | selected resource/provider, described need, organization, location, return target |
| Intelligence reveals a need or market gap | Create an RFx | selected geography/analysis, relevant capabilities/organizations, participant-confirmed need |
| Selected site/location | Create an RFx for this location | site/location reference, authoritative geography, participant-confirmed performance context |
| Selected organization or applicable domain record | Open referral workflow | revalidated selected organization/record, minimum-necessary referral direction intent, origin lens and return target |
| Referral context | View relevant organization, resource, or opportunity | referral identifier, permitted minimum-necessary context, return target |
| Approved provider | View relevant Opportunities | provider organization, public capabilities/service geography, current search context |
| Capability or capability gap | View or match relevant Opportunities/RFx | confirmed capability assertion or participant-confirmed gap, organization, geography and return target |

The table describes mature authorized continuations. An unavailable destination remains non-actionable until the applicable runtime exists.

A carried-forward suggestion or analytical observation is not an authoritative RFx field. The participant must review and confirm any data that becomes part of an authoritative domain record.

Cross-lens transitions should preserve an explicit return path. Completion, cancellation, permission failure, or recoverable error should return the participant to the originating safe context rather than a generic dashboard.

## 9. Spatial-to-operational workflow continuity

Complex workflows may enter an Operational Workspace for:

- RFx authoring;
- response construction;
- evaluation/review;
- provider application/profile management;
- referral composition/review;
- settings, policy, or account administration;
- dense intelligence tables or analysis where the map is contextual rather than primary.

The Operational Workspace should retain a compact, truthful context strip or equivalent state describing the originating organization/object/lens where useful.

On successful completion or intentional cancellation:

```text
Operational Workspace
→ restore authorized spatial context
→ same lens or explicit destination lens
→ same selected object where still valid
→ same camera/search/filter/list position where still meaningful
→ show bounded confirmation or updated authoritative state
```

Browser history alone is not a sufficient architecture contract for preserving this state.

## 10. Marketing and positioning boundary

The authenticated lens architecture does not redefine public positioning.

Marketing remains RFx-centered and should continue to emphasize the core promise:

> **Be found. Find opportunity. Build the connection.**

Public messaging may explain how AMACS, Resources, Intelligence, Capabilities, and cross-lens Referrals make RFx activity easier and more effective. It must not present Opportunities, Resources, Intelligence, and Capabilities as four equal standalone products or shift the platform's identity toward commercial real estate, generic analytics, a resource directory, capability directory, or referral marketplace.

A useful hierarchy is:

- Opportunities/RFx turns need into action;
- AMACS makes needs and capabilities legible;
- Resources helps close support gaps;
- Capabilities makes what organizations can do understandable, discoverable, comparable, and matchable;
- cross-lens Referrals helps trusted relationships move activity forward;
- Intelligence explains the market context surrounding the activity.

This document makes no marketing-page runtime or copy change.

## 11. Current implementation and convergence boundary

The existing participant routes, resources, referrals, organization discovery, geography canvas, and Wave 3 projections remain valid implementation evidence and compatibility context.

### Dated reconciliation — August 11, 2026

PR #150 validly established this architecture as documentation-only authority. The earlier post-Wave-3 stabilization removal of Opportunities from the runtime was also valid as a temporary correction: at that checkpoint the interface removed a misleading working destination that lacked complete runtime.

That historical result is not rewritten. For the ongoing participant shell, the narrower rule is superseded by the four-part truthfulness definition in Section 2:

- permanent participant lenses remain structurally visible;
- unavailable lenses remain non-actionable and fully described;
- unavailable state does not imply Feature-ID completion; and
- ordinary lens changes preserve one persistent Exchange shell.

The separately authorized no-Feature-ID gate in `../slices/EXCHANGE_SHELL_TRUTHFULNESS_EXECUTION_AUTHORITY.md` implements only this bounded convergence. It does not begin Slice 4.1 runtime.

The implementation reuses existing production abstractions and domain projections rather than rebuilding:

- organization authority and current membership;
- controlled geography and location privacy;
- Mapbox Spatial Workspace;
- synchronized map/list/detail projections;
- referrals and provider-request aggregate behavior;
- Official Resource Provider approval and provider projections;
- resource publishing/discovery;
- RFx Core authorities and future real-data opportunity projections.

No lens may fabricate unavailable domain state. Opportunities/RFx is now routable only because the separately accepted Slice 4.5 real participant discovery runtime provides a legitimate destination; later actions remain unavailable until their own accepted runtimes exist.

## 12. Implementation acceptance requirements

Any authorized convergence must prove at least:

- exact primary-lens order `Opportunities/RFx | Resources | Intelligence | Capabilities`;
- Referrals absent from permanent lens navigation and available only as a governed cross-lens/Menu function;
- Opportunities/RFx visibly first and available only through its real permitted runtime; unavailable later actions remain non-actionable and described without color-only communication;
- Network absent as a peer lens and retained only as an Intelligence view/domain concept;
- Account and Quick Start absent from the lens list and available through a separate keyboard-operable utility control;
- Administration optional, server-authoritative, limited to implemented destinations, and fail-closed without blocking the shell;
- persistent product identity/header/lens/account shell across ordinary client-side route transitions;
- no second `PerformanceNavigationTiming` document entry during the transition sequence;
- scoped content-region loading with `aria-busy`/live-region behavior;
- no root `Preparing this page` takeover during ordinary participant navigation;
- no artificial minimum loading duration;
- before/after transition and Server-Timing evidence;
- own organization entry/orientation and standing logo marker behavior;
- selected external node-to-standing-marker transition without anchor drift;
- synchronized marker/card/popup/drawer selection;
- one external standing selection at a time;
- map visibility through desktop edge drawers and mobile bottom sheets;
- list/map parity and accessible list alternative;
- preservation of camera, selected object, query, filters, and result/list position across lens switches where valid;
- truthful inapplicable/empty states without false disappearance;
- Official Resource Provider gating and application-status behavior;
- no provider publishing action for non-approved organizations;
- real-data-only RFx, provider, referral, location/site, and intelligence projections;
- server-authorized access after every transition and return;
- spatial-to-operational return-state restoration;
- keyboard, screen-reader, reduced-motion, reflow, high-contrast, and touch acceptance;
- 390px behavior without horizontal document overflow;
- all five supported locales without silent fallback;
- lens identity through more than color alone;
- Light Appearance/Dark Appearance terminology kept separate from the Intelligence lens;
- no public marketing repositioning by accident; and
- no Feature-ID or tracker completion claim without the applicable independent acceptance evidence.

## 13. Explicit non-decisions

This authority does not decide or authorize:

- route/URL structure beyond the stable current participant seams and canonical `/geography/canvas` Intelligence route;
- the persistence mechanism for the complete future cross-lens spatial context contract;
- raw lens colors or a new palette;
- Dark Appearance implementation or preference persistence;
- Presentation Mode implementation;
- specific external intelligence or site/facility data sources;
- new commercial-real-estate inventory acquisition;
- a new provider approval policy;
- a new referral lifecycle;
- RFx Core implementation or sequencing changes;
- Wave 5 evaluation/award scope;
- new Feature IDs, completion evidence, or tracker totals;
- marketing-page revisions; or
- any runtime change outside a separately authorized gate or slice.

## 14. Scope confirmation

The original PR #150 reconciliation was documentation only. Runtime convergence is bounded by its separate execution authority.

- No Feature ID is added, removed, renamed, reordered, or marked complete by this architecture reconciliation or shell gate.
- Tracker totals remain unchanged.
- Opportunities/RFx remains unavailable and no RFx aggregate, draft, publication, opportunity projection, beacon, response, Intelligence dataset, location/site inventory, appearance setting, or marketing page is created by the shell gate.
- Current provider and referral authority remains unchanged.
- Stabilization 2C remains isolated release engineering.
- Slice 4.1 runtime remains unstarted unless separately authorized after the shell gate merges and passes post-merge validation.
