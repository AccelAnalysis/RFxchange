# INF-006 — Firebase Cloud Functions runtime foundation

## Scope

INF-006 establishes Firebase Cloud Functions as the RFxchange adapter for workloads that are inherently:

- asynchronous;
- scheduled;
- event driven; or
- integration oriented.

Cloud Functions is not the RFxchange domain model and is not the default home for synchronous feature logic. Domain and application decisions remain provider independent and are invoked by Firebase-specific entrypoints only where a managed background runtime is appropriate.

## Runtime selection

Firebase currently supports Node.js 22, 20, and deprecated Node.js 18 for Cloud Functions. RFxchange pins the deployed Functions runtime to `nodejs22` in `firebase.json`.

The repository and Next.js application use Node.js 24.18.0. The Functions package accepts Node.js 22 through 24 for local compilation and CI, while Firebase deployment remains explicitly pinned to Node.js 22. This separates the developer toolchain from the managed production runtime without leaving deployment behavior implicit.

## Package boundary

Cloud Functions lives in the independent npm workspace:

```text
functions/
  package.json
  tsconfig.json
  src/
    application/
    runtime/
    index.ts
  test/
```

The package uses:

- ESM;
- strict TypeScript;
- compiled output under `functions/lib`;
- `firebase-functions` 7.3.0;
- `firebase-admin` 14.2.0;
- an explicit Firebase predeploy TypeScript build.

The root Next.js TypeScript project excludes `functions/`; the Functions package owns its own compilation contract.

## Provider-independent application contract

`functions/src/application/runtime-foundation.ts` contains the provider-independent runtime descriptor and approved workload categories.

It does not import:

- `firebase-functions`;
- `firebase-admin`; or
- Firebase event types.

Feature-domain services added later must follow the same direction of dependency:

```text
Firebase trigger/adapter
  → provider-neutral application service
  → domain/repository/provider ports
```

Firebase event envelopes, scheduler metadata, Pub/Sub messages, callable request types, and provider exception types must not become canonical RFxchange domain objects.

## Environment conventions

The Functions runtime resolves:

- `RFXCHANGE_ENV`: `development`, `staging`, or `production`;
- `RFXCHANGE_EXPECTED_PROJECT_ID`: optional but recommended project binding;
- `GCLOUD_PROJECT` or `FIREBASE_CONFIG`: actual Firebase project identity;
- `FUNCTIONS_EMULATOR`: local runtime indicator.

Safety behavior:

- the emulator defaults to the `development` role when `RFXCHANGE_ENV` is absent;
- a non-emulator runtime requires an explicit `RFXCHANGE_ENV`;
- an expected project mismatch fails closed;
- a production role cannot run with the emulator flag enabled;
- runtime responses and logs never contain service-account material or application secrets.

Nonsecret environment values may be supplied through approved Firebase environment configuration. Provider credentials, signing secrets, API keys with privilege, and other sensitive values must use managed secret parameters/Secret Manager and must not be committed.

## Runtime options

`setGlobalOptions` is the source of truth for baseline execution settings:

- region: `us-east1`;
- memory: `256MiB`;
- timeout: 60 seconds;
- minimum instances: 0;
- maximum instances: 10;
- concurrency: 40;
- CPU: 1.

Individual future functions may override a baseline only when the workload requires it and the override is documented and tested.

## Observability conventions

Every function operation should emit structured log events containing only bounded operational metadata:

- stable event name;
- correlation ID;
- service;
- environment;
- project ID;
- emulator indicator;
- operation;
- outcome;
- duration;
- bounded error code where applicable.

Logs must not contain passwords, tokens, session cookies, service-account material, full webhook secrets, or unnecessary business payloads.

The operational health probe returns its correlation ID in `x-correlation-id`, emits start/success/rejection/failure observations, and applies `cache-control: no-store`.

## Deployment convention

`firebase.json` owns the Functions source, codebase, Node runtime, ignore list, and predeploy build.

Canonical deployment form:

```bash
firebase use <approved-alias>
firebase deploy --only functions
```

Before production deployment:

1. confirm the selected Firebase alias;
2. confirm `RFXCHANGE_ENV`;
3. bind `RFXCHANGE_EXPECTED_PROJECT_ID` to the intended project;
4. build and test the Functions workspace;
5. run emulator acceptance;
6. review the function list and runtime options;
7. deploy using a least-privilege CI/runtime identity.

No service-account key file is accepted as a source-controlled deployment mechanism.

## Operational health function

`runtimeFoundationHealth` is a private HTTP operational probe. It exists to prove:

- the compiled Functions package loads;
- Firebase can discover the exported function;
- environment and project binding resolve correctly;
- structured observations execute;
- runtime metadata is returned without credentials;
- unsupported methods fail predictably.

It does not perform organization, RFx, referral, billing, or other feature-domain work.

## CI acceptance

CI:

1. installs the root npm workspace, including Functions dependencies;
2. executes the INF-006 static architecture guardrail;
3. compiles the Functions TypeScript package;
4. executes Functions unit tests;
5. starts Auth, Firestore, and Functions emulators for `demo-rfxchange`;
6. invokes the operational probe with a correlation ID;
7. verifies environment, project, region, runtime, approved workload classes, cache behavior, and method rejection;
8. continues through the existing architecture, TypeScript, lint, and Next.js production-build gates.

## Acceptance mapping

Tracker requirement:

> Establish Cloud Functions only for asynchronous, scheduled, event-driven and integration workloads; keep core domain/application logic provider-independent.

Evidence:

- approved workload categories are explicit;
- application runtime contract contains no Firebase dependency;
- Firebase-specific composition is confined to `functions/src/runtime` and `functions/src/index.ts`;
- deployment runtime is source controlled;
- environment/project checks fail closed;
- structured observability is standardized;
- emulator acceptance proves the compiled deployment entrypoint.

Tracker acceptance check:

> Functions runtime, environment configuration, deployment and observability conventions exist without turning feature-domain operations into Firebase-specific domain logic.

INF-006 is complete when the PR CI demonstrates all of the above.

## Explicitly deferred

INF-006 does not yet implement:

- scheduled business jobs;
- event ledger persistence;
- idempotency keys;
- retries and terminal failure state;
- dead-letter handling;
- notification processing;
- webhook processing;
- retention execution;
- credibility recalculation;
- search/index projections.

Those are introduced by INF-007 and later feature slices on top of this runtime foundation.
