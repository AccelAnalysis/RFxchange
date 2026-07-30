# Wave 1 Slice 1.24 — Attention-First Command Center, Health Panels, Unified Work Queue, and Universal Search

Feature IDs: `ADM-058`, `ADM-059`, `ADM-060`, `ADM-091`

## Purpose

Turn the administrative portal foundation into an operations surface that answers two questions immediately:

1. What human work needs attention now?
2. What platform conditions deserve investigation?

The slice then makes that workload navigable through one cross-domain queue and keeps object discovery available globally through one permission-aware search surface.

## ADM-058 — Attention-first command center

The Overview prioritizes operational work before analytics or system health. Ten queue families are represented:

- claims awaiting review;
- verification reviews;
- resource-provider applications;
- flagged RFxs;
- trust reports;
- integrity holds;
- billing exceptions;
- data corrections;
- support cases;
- integration failures.

Each count links directly to `/admin/work-queues` with the corresponding domain/type/status filter. The command center does not show a count for a domain the current administrator cannot inspect.

This is deliberately not a vanity dashboard. Counts represent work requiring human attention.

## ADM-059 — Platform health summary panels

Below workload, the Overview exposes seven health domains:

1. Organizations
2. Marketplace
3. Connections
4. Network
5. Commerce
6. Trust
7. Systems

Each domain has an explicit stage-appropriate metric vocabulary. Missing evidence renders as unknown rather than silently becoming zero.

The Systems panel reuses the `ADM-046` System Operations Health snapshot. `systemHealthMetricsFromOperationsSnapshot` projects that existing technical-health authority into the command-center summary, preserving one source of truth for deployment, functions, webhooks, error monitoring, and related system state.

Other health domains accept projections from their owning application/read models as those domains mature; Slice 1.24 defines the stable command-center contract and permission boundary, not a second persistence model for each domain.

## ADM-060 — Unified cross-domain administrative work queue

The canonical work-queue projection supports nine human-action domains:

- claims;
- verification;
- provider;
- RFx;
- trust;
- commerce;
- data;
- support;
- system.

A work item carries the minimum cross-domain fields required for operations: stable ID, domain/type, title, severity, status, source, object reference, optional organization/user/geography references, assignment, creation timestamp, and optional due timestamp.

This is intentionally a queue projection, not the full `ADM-061` administrative case data model. Slice 1.25 can attach durable cases/SLA lifecycle state without replacing the queue contract.

### Authorization

Each work source declares its canonical domain read permission. The queue service filters sources before invoking `listOpenWork()`, so an unauthorized administrator does not cause restricted-domain data to be fetched and discarded later.

Assignment is separate from visibility. A source declares the mutation permission required to assign its work. Read access therefore never implies write authority.

### Filtering and prioritization

The service supports domain, severity, status, assignee, organization, and geography filters. Results prioritize critical/high severity and then due/creation time.

## ADM-091 — Universal administrative search

Global search is present at the top of the shared administrative shell. Supported object families are:

- organizations;
- users;
- RFxs;
- responses;
- referrals;
- transactions;
- support cases;
- geographies;
- resource providers;
- administrative audit events.

Domain-owned search adapters determine how each object family is found. That enables the required identifiers without centralizing domain persistence concerns:

- organization name/email and organization ID;
- user name/email and user ID;
- UEI/CAGE through organization metadata;
- RFx/response ID or title;
- referral ID;
- transaction ID and Stripe customer ID through commerce metadata;
- support-case ID;
- locality/geography name or ID;
- provider application/profile identifiers;
- audit ID.

The global coordinator checks the read permission for each source before querying it. Results therefore respect the same permission/scope model as the rest of the portal. Exact identifiers rank ahead of broad title matches, duplicate domain/object results collapse, and callers may narrow search to selected object families.

## Permission model

Slice 1.24 introduces no role-name authorization and no broad new universal-read permission. Existing named domain capabilities remain authoritative. For example:

- `organization.profile.read` gates organization workload/search;
- `user.profile.read` gates user search;
- `rfx.record.read` gates RFx/response workload/search;
- `referral.record.read` gates referral workload/search;
- `commerce.account.read` gates commerce workload/search;
- `support.case.read` gates support workload/search;
- `geography.definition.read` gates geography search;
- `audit.event.read` gates data-correction/audit search;
- `system.health.read` gates system workload/health.

Scope and pre-resolved conditions remain enforced by the canonical administrative authorization engine.

## Provider boundary

The command center, queue coordinator, and search coordinator are provider-neutral application contracts. They contain no Firebase SDK types. Domain-specific repositories/adapters remain responsible for querying their own data stores and projecting safe administrative views.

## Acceptance evidence

Slice acceptance requires tests proving:

- all ten attention queue families exist and link to filtered work queues;
- restricted admins see only authorized queue counts;
- all seven health domains exist and missing metrics remain unknown;
- Systems health reuses ADM-046 evidence;
- all nine work domains can be represented in one queue;
- unauthorized work sources are not queried;
- assignment requires a separate mutation permission;
- all supported global-search object families can participate;
- unauthorized search sources are not queried;
- exact identifier matches rank first;
- the global search control remains at the top of the admin shell;
- full production CI remains green.
