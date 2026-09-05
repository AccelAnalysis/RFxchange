# Dependency security follow-up — 2026-09-05

This follow-up turns the residual moderate findings in `PRODUCTION_READINESS_2026_09_05.md` into executable dependency boundaries and records which findings were actually remediated after the readiness audit.

## Current disposition

### `uuid` — GHSA-w5hq-g745-h8pq — remediated

RFxchange now applies a reviewed transitive override to the Google HTTP dependency path used under Firebase Admin. Both the root workspace lock and the standalone Functions production lock resolve the shared `uuid` package to `11.1.1`, which is on the patched line for this advisory.

The Functions manifest keeps the override scoped to the Firebase/Google request path rather than forcing unrelated package majors. The root manifest uses the same compatible override approach for the development tooling graph.

`scripts/validate-dependency-security-dispositions.mjs` remains in place as a regression guard. If the vulnerable UUID line reappears or the dependency shape changes in a way that invalidates the reviewed assumptions, the canonical architecture test gate fails.

### `@opentelemetry/core` — GHSA-8988-4f7v-96qf — remediated

The root workspace now resolves `@opentelemetry/core` to `2.11.0`, which is on the patched `>=2.8.0` line. It remains development-only through Firebase CLI tooling and is absent from the standalone Functions production lockfile.

The validator continues to enforce that OpenTelemetry does not enter the Functions production artifact.

### `stream-json` — GHSA-528h-pc64-c93x — constrained tooling-only residual

The repository still resolves `stream-json 1.9.1` through Firebase CLI tooling. The package is development-only and absent from the standalone Functions production lockfile.

The advisory is fixed in `stream-json 3.5.0`, but the current CLI dependency graph remains on the 1.x line. RFxchange therefore keeps the trusted-input/local-tooling disposition rather than forcing an unsupported cross-major parser override into deployment tooling.

The validator fails if `stream-json` enters the Functions production artifact.

## Release rule

The readiness-audit dependency state is now reduced to one known moderate tooling-only residual: `stream-json`. `uuid` and `@opentelemetry/core` are remediated in the resolved dependency graph.

Every dependency update must continue through the normal exact-head gate. If Firebase Admin, Google Cloud Storage, Firebase CLI, `gaxios`, `teeny-request`, OpenTelemetry, `uuid`, or `stream-json` changes, the executable disposition forces re-review whenever the lockfile assumptions stop matching.

Do not apply `npm audit fix --force` or a Firebase major downgrade/unsupported transitive major override solely to reduce the audit count.
