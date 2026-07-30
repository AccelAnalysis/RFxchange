# Wave 1 Slice 1.24 — Attention-First Command Center, Platform Health, Unified Work Queue and Universal Search

Feature IDs: `ADM-058`, `ADM-059`, `ADM-060`, `ADM-091`

## Purpose

Give administrators one operating surface that answers the Administrative Portal's first question — **What needs attention?** — before they navigate into individual subsystems.

## ADM-058 — Attention-first command center

The command center requires provider coverage for all ten specified queues:

- claims awaiting review;
- verification reviews;
- resource-provider applications;
- flagged RFxs;
- trust reports;
- integrity holds;
- billing exceptions;
- data corrections;
- support cases;
- failed integrations.

Providers return counts only. Each queue declares a catalogued admin permission and is omitted from an administrator's view when that permission is unavailable. Missing provider coverage is an error instead of silently producing an incomplete dashboard.

## ADM-059 — Platform-health summary panels

The home dashboard requires all seven health domains:

- Organizations;
- Marketplace;
- Connections;
- Network;
- Commerce;
- Trust;
- Systems.

Panels carry a health state plus typed metrics. Visibility is permission-aware, so an administrator sees the complete subset authorized for their operating role rather than global data by default.

ADM-046 remains the deeper technical System Operations Health model. ADM-059 is the executive/operational home-dashboard summary across business and platform domains.

## ADM-060 — Unified cross-domain work queue

The queue projection normalizes work from multiple providers into one envelope containing:

- case number;
- object type/id;
- organization;
- user;
- type;
- severity;
- source;
- geography;
- assigned administrator;
- created date;
- SLA due time;
- current status;
- evidence references;
- related cases;
- required viewing permission.

Suggested lifecycle statuses are represented exactly as specified: New, Triaged, Assigned, In Review, Waiting for Participant, Action Required, Monitoring, Resolved, Closed.

The queue hides items whose required permission the administrator lacks. It prioritizes critical/high and overdue work. Provider identities and work-item IDs must be unique.

This is deliberately a projection contract. Slice 1.25 / ADM-061 and ADM-062 will define the canonical administrative case record, persistence and lifecycle/SLA state machine that can feed this queue.

## ADM-091 — Universal administrative search

Search can return all specified categories:

- organization/name;
- user/name;
- email;
- organization ID;
- RFx;
- response;
- referral;
- transaction;
- support case;
- geography;
- UEI;
- CAGE;
- provider;
- Stripe customer;
- audit event.

Search providers are subsystem adapters. Results declare the admin permission required to reveal them, so broad search does not bypass ADM-090 or domain-specific access boundaries. Queries and result counts are bounded; duplicate category/id results are collapsed.

## Presentation foundation

Reusable React components render:

- command-center attention and health summaries;
- unified work-queue rows;
- universal-search results.

The presentation layer receives already-authorized projections. It does not infer authority from role names or browser state.

## Non-goals

This slice does not create canonical case persistence, ownership transitions, SLA escalation jobs, saved admin searches, full-text indexing, or subsystem-specific provider implementations that depend on future feature families. Those attach to the provider-neutral contracts as their domain slices arrive.
