# Wave 1 Slice 1.21 — ADM-046

## Scope

This slice implements `ADM-046` — System Operations Health Dashboard.

It materializes the Technical / System Administrator requirement that one operations area show current health/status across the platform's infrastructure and integration surfaces.

## Required health surfaces

The canonical registry contains all 18 surfaces from the Administrative Portal specification:

1. feature flags;
2. environment;
3. Firebase / Cloud Functions;
4. scheduled jobs;
5. failed jobs;
6. webhook events;
7. APIs;
8. SAM.gov integration;
9. geocoding;
10. maps;
11. email delivery;
12. file storage;
13. search/index state;
14. deployment version;
15. data migrations;
16. backups;
17. error monitoring;
18. rate limits.

Every surface is represented in every snapshot. A missing probe becomes visible `unknown` status; an intentionally unavailable integration may report `not-configured`. The dashboard never hides a required surface simply because telemetry is unavailable.

## Authorization

The aggregation service requires the existing `system.health.read` capability.

Technical / System Administrator and Super Admin receive this capability through their existing preset configuration. Roles without it cannot construct the health snapshot. Presentation components receive an already-authorized snapshot; they do not establish authority themselves.

## Provider-independent probe contract

`SystemOperationsHealthProbe` is a provider-independent port keyed to one canonical health surface.

Each measurement reports:

- operational/degraded/outage/unknown/not-configured state;
- human-readable summary;
- checked timestamp;
- source;
- optional version;
- scalar operational metrics;
- optional diagnostic reference.

`collectSystemOperationsHealth` executes registered probes concurrently. A probe exception is converted into visible `unknown` health with a diagnostic reference rather than suppressing the surface or failing the entire dashboard. Duplicate probes for one surface fail closed.

## Aggregate status

Overall state is deterministic:

1. any outage -> outage;
2. otherwise any degraded -> degraded;
3. otherwise any unknown/not-configured -> unknown;
4. otherwise operational.

The snapshot also includes counts for operational, degraded, outage, unknown, and not-configured surfaces.

## Initial runtime probes

The slice includes server-side adapters for repository/runtime signals that already exist:

- environment/project alignment;
- deployment version/commit identity;
- static adapter support for existing health sources.

The environment probe reports outage when the active Firebase project differs from the expected project contract established by INF-001/INF-006. Deployment identity reports `not-configured` when version/commit metadata is absent.

Additional integration-specific probes can be attached as those adapters are materialized; the canonical dashboard contract does not need to change.

## Presentation

`SystemOperationsHealthDashboard` renders:

- overall state;
- generated time;
- aggregate counts;
- one card for every canonical health surface;
- state, source, check time, version, diagnostic reference and available metrics.

It belongs under the `Integrations & System` section established in Slice 1.20.

## Acceptance

ADM-046 is complete only when tests prove:

1. all 18 required surfaces are represented by the canonical registry;
2. Technical/System Administrator and Super Admin can read the dashboard while an unauthorized role cannot;
3. missing probes remain visible as unknown rather than disappearing;
4. aggregate state prioritizes outage, degradation, then unknown;
5. probe errors degrade to visible unknown status without collapsing the whole dashboard;
6. duplicate surface probes fail rather than producing ambiguous status;
7. Firebase environment/project mismatch is surfaced as an outage;
8. absent deployment identity is surfaced as not configured;
9. the dashboard presentation renders every measurement and its state;
10. the full production CI suite remains green.
