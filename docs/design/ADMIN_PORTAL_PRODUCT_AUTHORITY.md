# RFxchange Administrative Product Authority

**Status: CANONICAL TARGET PRODUCT AND INCREMENTAL RUNTIME-CONVERGENCE AUTHORITY**

**Applies to:** protected platform-administration routes, shared administrative components, administrative command APIs, administrative read models, and domain-specific review consoles.

## 1. Product decision

The final RFxchange administrative interface is an **attention-first, scope-visible operating workspace** for running the Exchange. It is not a generic SaaS dashboard, a collection of unrelated back-office pages, a second source of domain truth, or a broad CRUD console.

The administrative product must help an authorized administrator answer four questions in order:

1. What requires attention now?
2. What authority and scope am I operating under?
3. What is the authoritative state of the selected organization, user, geography, RFx, provider, case, or system surface?
4. What exact action is permitted next, and what evidence will be preserved when it is taken?

The product is implemented inside the production RFxchange application and reuses its existing Firebase Authentication, server-session, Firestore, Firebase Functions, Storage, domain, audit, and authorization contracts. It must not introduce an alternate administrator database, an alternate administrator identity, or a parallel authorization model.

## 2. Relationship to the participant Exchange

Administration is a separate protected control plane inside the same product.

The participant Exchange remains map-first and lens-oriented. Administration is task-first and may use a map only where geography is the subject of the work. The two surfaces share RFxchange identity, brand, domain truth, and design tokens, but they do not share the same navigation composition.

The participant interface answers:

> What can my organization discover, create, respond to, offer, request, or connect through?

The administrative interface answers:

> What requires review, correction, resolution, protection, configuration, or operational attention?

A participant with legitimate administrative authority receives an **Administration** destination in the account/menu utility. Direct `/admin` access remains independently server-authorized. A normal participant never receives an administrative affordance merely because the route exists.

## 3. Product character

The administrative product should feel like a calm operating room for a real economic network:

- clear rather than dense;
- decisive rather than explanatory;
- trustworthy rather than bureaucratic;
- operational rather than decorative;
- context-preserving rather than page-fragmented;
- evidence-aware without exposing unnecessary private data;
- responsive without reducing complex work to unusable mobile tables.

It must not resemble:

- a generic analytics dashboard made from equally weighted metric cards;
- an engineering console filled with internal IDs and implementation terminology;
- an ERP-style wall of forms;
- a dark fintech terminal;
- a government portal with excessive instructions and nested panels;
- a participant-facing map with administrative controls pasted over it.

## 4. Visual and interaction rules

### 4.1 Canvas and structure

- Warm Ivory or a closely related light semantic surface is the primary administrative canvas.
- Exchange Black and Graphite provide navigation, typography, selected structure, and intentional high-contrast operating regions.
- The permanent navigation rail may be dark; the ordinary work surface must not become a full-screen black canvas.
- Gold is a scarce focal signal for selection, focus, connection, and brand identity. It is not the default fill for every button, badge, or navigation item.
- Signal Blue is reserved for information, links, discovery, and analytical context.
- Growth Green communicates healthy, completed, or positive operational state. It does not imply credibility, qualification, or paid advantage.
- Red is reserved for destructive, security-critical, or error states.

### 4.2 Less container chrome

Use containers only when they create a meaningful interaction boundary, such as:

- a queue;
- a selected detail inspector;
- a modal or sheet;
- an evidence viewer;
- a consequential action review;
- a high-value data or map region.

Do not place every metric, field, paragraph, and status inside a separate rounded card. Prefer whitespace, type hierarchy, alignment, subtle surface changes, and dividing rules.

### 4.3 One focal action

Each administrative state should make one next action visually primary.

Examples:

- `Begin review`
- `Assign case`
- `Request information`
- `Approve provider`
- `Resolve claim`
- `Preview changes`
- `Run dry repair`

Secondary, quiet, and destructive actions remain available but must not compete equally with the principal task.

### 4.4 Human language over implementation language

Primary administrative interfaces must not lead with:

- raw grant IDs;
- opaque administrator IDs;
- repository terminology;
- “runtime convergence”;
- “protected surface”;
- permission-key strings;
- storage paths;
- command internals;
- diagnostic metadata that does not help the current decision.

The product should say what the administrator is doing and why it matters. Technical identifiers remain available in audit, diagnostics, detail disclosures, or copied references where they are operationally necessary.

### 4.5 Explicit state without metadata overload

Every consequential state must be communicated through readable text and, where useful, a restrained icon or semantic color. Color alone is never sufficient.

Identifiers, timestamps, versions, and provenance should appear only where they support comparison, stale-state resolution, evidence, audit, or support escalation. They should not dominate every row.

### 4.6 Map only when geography is real work

A map is appropriate for:

- geography release and boundary administration;
- provider source promotion and accepted-point review;
- organization location and service-area inspection;
- locality-level network coverage;
- RFx, Resource, or provider geographic operations.

A map must not be used as decorative dashboard background. Every marker, boundary, territory, and selected point must correspond to authoritative state and preserve the existing privacy rules.

## 5. Final shell

### 5.1 Desktop

The desktop shell consists of:

1. a persistent permission-aware navigation rail;
2. a compact command/context bar;
3. a main operating workspace;
4. an optional context inspector for list-to-detail continuity.

Conceptually:

```text
┌──────────────────────┬─────────────────────────────────────────────────────┐
│ RFxchange            │ Current access           Search / Work / Account   │
│ Administration       ├─────────────────────────────────────────────────────┤
│                      │ Page title · material state · one focal action      │
│ OPERATE              ├──────────────────────────────┬──────────────────────┤
│  Overview            │                              │                      │
│  Work Queues         │ Main workspace               │ Context inspector    │
│                      │                              │                      │
│ NETWORK & IDENTITY   │ queue / list / map / form / │ selected record      │
│  Organizations       │ timeline / configuration    │ related cases        │
│  Users & Access      │                              │ evidence metadata    │
│  Claims & Verification│                             │ permitted actions    │
│  Geographies         │                              │ audit context        │
│  Institutions        │                              │                      │
│                      │                              │                      │
│ EXCHANGE OPERATIONS  │                              │                      │
│  RFx & Opportunities │                              │                      │
│  Referrals & Teaming │                              │                      │
│  Resource Providers  │                              │                      │
│  Credibility         │                              │                      │
│  Trust & Safety      │                              │                      │
│                      │                              │                      │
│ BUSINESS OPERATIONS  │                              │                      │
│  Commerce            │                              │                      │
│  Support & Feedback  │                              │                      │
│  Communications      │                              │                      │
│  Analytics           │                              │                      │
│                      │                              │                      │
│ PLATFORM             │                              │                      │
│  Policies & Config   │                              │                      │
│  Integrations/System │                              │                      │
│  Audit & Security    │                              │                      │
└──────────────────────┴──────────────────────────────┴──────────────────────┘
```

The navigation rail shows only destinations with a truthful implemented runtime and current authorized scope. Specification-only sections remain absent until their loaders, actions, empty states, and authorization are real.

### 5.2 Mobile and compact screens

On compact screens:

- the navigation rail becomes a controlled slide-down or slide-over menu;
- the current scope remains visible;
- lists become structured rows rather than horizontally compressed desktop tables;
- filters open in a sheet;
- list and detail may become separate states while preserving return context;
- a consequential action opens as a focused full-screen step;
- primary actions remain above the device safe area;
- no critical workflow requires horizontal scrolling.

Mobile administration is not a reduced-information imitation of desktop. It prioritizes triage, assignment, review, communication, and bounded decisions while preserving a path to complete detail.

## 6. Canonical information architecture

The existing nineteen administrative sections remain the canonical domain architecture. The following groupings are presentational only and never grant authority.

### Operate

1. Overview
2. Work Queues

### Network and identity

3. Organizations
4. Users & Access
5. Claims & Verification
6. Geographies
7. Institutions & Partners

### Exchange operations

8. RFx & Opportunities
9. Referrals & Teaming
10. Resource Providers
11. Credibility
12. Trust & Safety

### Business operations

13. Commerce
14. Support & Feedback
15. Communications
16. Analytics

### Platform

17. Policies & Configuration
18. Integrations & System
19. Audit & Security

Universal administrative search is a shell service rather than a twentieth domain section.

## 7. Shared operating patterns

### 7.1 Current access and scope

Every page must make the administrator's active access context legible.

Supported authority scopes remain:

- `GLOBAL`
- `GEOGRAPHY:<id>`
- `ORGANIZATION:<id>`
- `CASE:<id>`

The visible label should be human-readable. Raw serialized scope values remain secondary detail. Changing scope must use server-produced authorized destinations; the browser may not invent or widen a scope.

### 7.2 Attention-first command center

The home surface begins with work requiring action, not a broad collection of decorative metrics.

It should prioritize:

- critical and overdue work;
- work assigned to the current administrator;
- unassigned work within the current authority;
- pending approvals;
- material platform incidents;
- data freshness and unknown state.

Health metrics support the operating decision; they do not replace it.

### 7.3 Queue, selection, and detail continuity

A queue or index should preserve:

- filters;
- sort;
- current scope;
- selected row;
- scroll position;
- assignment context.

Desktop may use a right inspector for rapid review. Complex records retain permanent deep links for refresh, sharing, browser history, audit references, and complete workflows.

### 7.4 Canonical cases

Cross-domain administrative work uses the existing canonical case model and ordered lifecycle. A case coordinates work but does not become a shadow source of organization, RFx, payment, provider, credibility, or trust truth.

Domain decisions must still execute through their own authorized application services.

### 7.5 Sensitive-action review

Consequential actions use one shared review sequence:

```text
action selected
→ exact target and scope confirmed
→ current state loaded
→ proposed state previewed
→ reason entered
→ evidence referenced where required
→ recent reauthentication completed where required
→ secondary approval resolved where required
→ named domain command submitted
→ state and audit committed atomically
→ receipt displayed
```

The receipt should identify the affected object, resulting state/version, related case, audit event, actor, and time without overwhelming the primary success message.

### 7.6 Evidence access

Administrative evidence is metadata-first. A queue or ordinary detail view may show evidence type, status, submitted time, and relationship to the case. Evidence bytes require the separate minimum-necessary permission and controlled-delivery path.

### 7.7 Audit and correction

Every meaningful administrative mutation remains attributable. Corrections append later evidence and preserve the original event. The interface must never offer “edit audit record” or destructive history deletion.

## 8. Security and truthfulness invariants

The interface must preserve the existing authorization order:

```text
authenticated RFxchange session
+ persisted platform-administrator account
+ privileged-security eligibility
+ effective named permission
+ active matching scoped grant
+ satisfied action conditions
```

The following remain prohibited:

- binary `isAdmin` authorization;
- role-name authorization branches;
- client-trusted permission arrays;
- direct browser writes to server-managed administrative collections;
- route parameters treated as authority;
- GLOBAL access added merely for convenience;
- ordinary profile access revealing private documents, exact private location, verification evidence, payment metadata, private RFx evidence, or trust evidence;
- marketplace administrators selecting RFx winners or altering issuer/evaluator decisions;
- technical administrators inheriting marketplace, credibility, commerce, or permanent-enforcement authority;
- payment or Founding status affecting credibility, ranking, verification, or qualification.

Navigation visibility is an affordance, not authorization. Every page and every command remains independently server-authorized.

## 9. Runtime registration rule

A section may enter the live administrative navigation only when it has all of the following:

1. protected route;
2. truthful server loader;
3. exact named permission and supported scopes;
4. real domain data or a truthful empty state;
5. operational actions where the page claims actions exist;
6. stale-state, error, and restricted-state treatment;
7. responsive and accessible presentation;
8. acceptance coverage.

Unavailable future sections must not appear as disabled navigation promises.

## 10. Implementation sequence

### Package 1 — Product and shell convergence

- establish this authority;
- replace duplicate administrative chrome with one shared shell;
- introduce a restrained, responsive permission-aware navigation pattern;
- make current access visible without leading with raw grant metadata;
- migrate Organization Claims, Resource Provider review, and Organization 360 into the shared language;
- remove developer-facing copy from live administrative pages.

### Package 2 — Operating core

- implement the real Overview command center;
- implement the unified Work Queue and case detail;
- expose permission-filtered universal search;
- connect truthful queue, health, case, and search providers.

### Package 3 — Organizations, users, and authority

- organization index and complete Organization 360 composition;
- user index and User Access 360;
- controlled user-access actions;
- unified Claims & Verification section;
- compatibility redirects from legacy routes.

### Package 4 — Provider and geography operations

- complete Resource Provider lifecycle administration;
- implement the source-backed Hampton Roads promotion review, comparison, preview, approval, and commit experience;
- implement geography operating views and institutional scope.

### Package 5 — Exchange and trust operations

- RFx lifecycle and moderation;
- response/submission inspection as production workflows exist;
- referral and teaming cases;
- credibility records and appeals;
- trust reports, restrictions, investigations, and integrity holds.

### Package 6 — Business and platform operations

- commerce and billing exceptions;
- support and participant feedback;
- governed communications;
- privacy-safe analytics and exports;
- policies, feature flags, system health, controlled maintenance, audit, and administrator lifecycle.

## 11. First convergence package acceptance

The first package is acceptable when:

- all currently live administrative pages share one shell;
- Organization Claims no longer renders a private duplicate sidebar;
- Organization 360 no longer renders a separate administrative top bar;
- the mobile navigation can open and close without horizontal destination overflow;
- only implemented and authorized destinations appear;
- current scope remains visible;
- raw administrator and grant identifiers no longer dominate ordinary pages;
- developer-facing phrases are removed from the claims experience;
- provider review uses the canonical typography, palette, spacing, and action hierarchy;
- authority, verification, provider status, commerce, and credibility remain visibly separate;
- no permission, scope, repository, or domain contract is weakened;
- repository tests, typecheck, lint, and production build pass.

## 12. Completion definition

The final administrative product is complete when an authorized administrator can enter one coherent RFxchange control plane, understand current authority and urgent work, locate any permitted organization/user/geography/RFx/provider/referral/case/transaction/audit object, preserve context while reviewing it, perform only the exact named actions allowed by current scope and conditions, and receive durable attributable evidence for every consequential operation—without encountering generic CRUD, fabricated future sections, excessive metadata, duplicate shells, or a visual language that departs from the RFxchange product.
