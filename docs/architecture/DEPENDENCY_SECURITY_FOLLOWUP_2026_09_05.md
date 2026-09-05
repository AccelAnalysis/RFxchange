# Dependency security follow-up — 2026-09-05

This follow-up turns the residual moderate findings in `PRODUCTION_READINESS_2026_09_05.md` into an executable boundary instead of treating the audit prose as a permanent exemption.

## Current disposition

### `uuid` — GHSA-w5hq-g745-h8pq

The standalone Functions install still resolves `uuid@9.0.1` through the Google Cloud Storage dependency chain used by Firebase Admin. The reviewed parents are `gaxios` and `teeny-request`; the RFxchange audit found those consumers using UUID v4 for multipart/request boundaries rather than the caller-supplied output-buffer paths involved in the advisory.

The upstream fix is `uuid >=11.1.1`, but current Firebase Admin `14.3.0` still declares the current Storage 7 line. A newer Storage 8 major exists; RFxchange does not force that unsupported major underneath Firebase Admin merely to make the audit count disappear.

`scripts/validate-dependency-security-dispositions.mjs` now fails if:

- the vulnerable resolved `uuid` changes without review;
- an unexpected package begins depending on that vulnerable root `uuid`; or
- the Functions production artifact's vulnerable UUID dependency is no longer confined to the reviewed `gaxios`/`teeny-request` chain.

When Firebase Admin adopts a compatible dependency chain that resolves `uuid >=11.1.1`, the validator automatically stops requiring the temporary vulnerable-version confinement and this disposition should be removed.

### `@opentelemetry/core` — GHSA-8988-4f7v-96qf

The resolved vulnerable package remains development-only through Firebase CLI tooling. It is not present in the standalone Functions production lockfile.

The validator now enforces both properties. If the package enters the Functions artifact, the canonical architecture test gate fails.

The upstream patched line is `@opentelemetry/core >=2.8.0`. The current Firebase CLI dependency graph still carries an older major; RFxchange does not cross-major override the CLI's telemetry stack without upstream compatibility.

### `stream-json` — GHSA-528h-pc64-c93x

The resolved package remains development-only through Firebase CLI tooling and is absent from the standalone Functions production lockfile.

The advisory is fixed in `stream-json 3.5.0`; the repository currently receives the 1.x line through the CLI. RFxchange therefore keeps the trusted-input/local-tooling disposition rather than forcing a cross-major parser override into deployment tooling.

The validator now fails if `stream-json` enters the Functions production artifact.

## Release rule

These findings remain **known moderate findings with constrained reachability**, not "no vulnerabilities" and not a permanent waiver.

Every dependency update must continue through the normal exact-head gate. If Firebase Admin, Google Cloud Storage, Firebase CLI, `gaxios`, `teeny-request`, OpenTelemetry or `stream-json` changes, the executable disposition forces re-review whenever the assumptions above stop matching the lockfiles.

Do not apply `npm audit fix --force` or a Firebase major downgrade/unsupported transitive major override solely to reduce the audit count.
